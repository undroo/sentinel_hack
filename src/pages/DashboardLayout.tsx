import { useState, useEffect, useRef } from 'react';
import { Phone, AlertCircle, Menu, X } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Call, CallWithContext, CallAction } from '../types';
import { Button, Badge } from '../components';
import { VoiceAgentButton } from '../components/VoiceAgentButton';
import { formatISODate, getStatusBadge } from '../lib/utils';
import CallList from '../components/CallList';
import CallDetail from '../components/CallDetail';

export default function DashboardLayout() {
  const { activeCall, setActiveCall, calls, setCalls, isLoading, setIsLoading } = useCall();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSelectedCall, setUserSelectedCall] = useState(false);
  const activeCallRef = useRef(activeCall);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
      return;
    }
    loadCalls(false);
    const cleanup1 = subscribeToCallUpdates();
    const cleanup2 = subscribeToCallActionsUpdates();
    const pollId = window.setInterval(() => loadCalls(false), 1000);
    return () => {
      cleanup1();
      cleanup2();
      window.clearInterval(pollId);
    };
  }, []);

  // Keep ref in sync with activeCall
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Subscribe to call_actions updates for the active call
  useEffect(() => {
    if (!activeCall) return;

    const callId = activeCall.id;
    const subscription = supabase
      .channel(`call-actions-${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_actions',
          filter: `call_id=eq.${callId}`,
        },
        (payload) => {
          const newAction = payload.new as CallAction;
          // Use ref to get current activeCall value
          const currentCall = activeCallRef.current;
          if (!currentCall || currentCall.id !== callId) return;
          // Check if action already exists to avoid duplicates
          const actionExists = currentCall.actions?.some((a: CallAction) => a.id === newAction.id);
          if (actionExists) return;
          // Update the call with the new action
          setActiveCall({
            ...currentCall,
            actions: [...(currentCall.actions || []), newAction],
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeCall?.id, setActiveCall]);

  const loadCalls = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .in('status', ['ai_handling', 'human_active', 'closed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch mark_safe actions for all calls
      const callIds = (data || []).map(call => call.id);
      if (callIds.length > 0) {
        const { data: actionsData } = await supabase
          .from('call_actions')
          .select('call_id, action_type')
          .in('call_id', callIds)
          .eq('action_type', 'mark_safe');
        
        // Create a map of call_id -> has mark_safe action
        const markSafeMap = new Map<string, boolean>();
        (actionsData || []).forEach(action => {
          markSafeMap.set(action.call_id, true);
        });
        
        // Add mark_safe flag to calls
        const callsWithMarkSafe = (data || []).map(call => ({
          ...call,
          hasMarkSafeAction: markSafeMap.has(call.id),
        }));
        
        setCalls(callsWithMarkSafe);
        if (!userSelectedCall && callsWithMarkSafe.length > 0) {
          const newestCall = callsWithMarkSafe[0];
          if (activeCall?.id !== newestCall.id) {
            handleSelectCall(newestCall, false);
          }
        }
      } else {
        setCalls([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const subscribeToCallUpdates = () => {
    const subscription = supabase
      .channel('calls-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedCall = payload.new as Call;
            // Preserve hasMarkSafeAction flag if it exists
            setCalls((prevCalls: Call[]) =>
              prevCalls.map((call: Call) => {
                if (call.id === updatedCall.id) {
                  return { ...updatedCall, hasMarkSafeAction: call.hasMarkSafeAction };
                }
                return call;
              })
            );

            if (activeCall?.id === updatedCall.id) {
              setActiveCall({ ...activeCall, ...updatedCall });
            }
          } else if (payload.eventType === 'INSERT') {
            const newCall = payload.new as Call;
            // Check if this new call has a mark_safe action
            const { data: actionsData } = await supabase
              .from('call_actions')
              .select('call_id')
              .eq('call_id', newCall.id)
              .eq('action_type', 'mark_safe')
              .limit(1);
            
            const callWithMarkSafe = {
              ...newCall,
              hasMarkSafeAction: (actionsData || []).length > 0,
            };
            setCalls((prevCalls: Call[]) => [callWithMarkSafe, ...prevCalls]);
            if (!userSelectedCall && activeCall?.id !== callWithMarkSafe.id) {
              handleSelectCall(callWithMarkSafe, false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const subscribeToCallActionsUpdates = () => {
    const subscription = supabase
      .channel('call-actions-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_actions',
          filter: 'action_type=eq.mark_safe',
        },
        async (payload) => {
          const newAction = payload.new as CallAction;
          // Update the calls list to mark this call as safe
          setCalls((prevCalls: Call[]) =>
            prevCalls.map((call: Call) =>
              call.id === newAction.call_id
                ? { ...call, hasMarkSafeAction: true }
                : call
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSelectCall = async (call: Call, showLoading = true, isUserAction = false) => {
    if (isUserAction) {
      setUserSelectedCall(true);
    }
    if (showLoading) {
      setIsLoading(true);
    }
    try {
      const { data: transcripts } = await supabase
        .from('transcript_blocks')
        .select('*')
        .eq('call_id', call.id)
        .order('created_at', { ascending: true });

      const { data: fields } = await supabase
        .from('extracted_fields')
        .select('*')
        .eq('call_id', call.id);

      const { data: actions } = await supabase
        .from('call_actions')
        .select('*')
        .eq('call_id', call.id);

      const hasMarkSafe = actions?.some(action => action.action_type === 'mark_safe') || false;

      setActiveCall({
        ...call,
        transcripts: transcripts || [],
        extracted_fields: fields || [],
        actions: actions || [],
        hasMarkSafeAction: hasMarkSafe,
      } as CallWithContext);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load call details');
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // Find calls that need attention: Medium/High impact with AI active
  const highImpactAICalls = calls.filter(
    (call) =>
      call.status === 'ai_handling' &&
      (call.impact_category === 'Medium' || call.impact_category === 'High')
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="flex items-center gap-3">
              <Phone className="text-blue-600" size={28} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Emergency Response</h1>
                <p className="text-sm text-gray-500">Real-time Call Dashboard</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <VoiceAgentButton />
            
            {activeCall && (
              <div className="hidden md:flex items-center gap-6 border-l border-gray-200 pl-6">
                <div className="text-right">
                  <div className="text-sm text-gray-600">Call ID: {activeCall.call_id}</div>
                  <div className="text-xs text-gray-500">{formatISODate(activeCall.created_at)}</div>
                </div>

                <Badge variant={getStatusBadge(activeCall.status).color.includes('blue') ? 'info' : 'default'}>
                  {getStatusBadge(activeCall.status).label}
                </Badge>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    Take Over
                  </Button>
                  <Button variant="danger" size="sm">
                    <AlertCircle size={16} /> Dispatch
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {highImpactAICalls.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-orange-600 mt-0.5 flex-shrink-0" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-1">
                Attention Required: {highImpactAICalls.length} call{highImpactAICalls.length !== 1 ? 's' : ''} with {highImpactAICalls.some(c => c.impact_category === 'High') ? 'High' : 'Medium'} impact being handled by AI
              </h3>
              <p className="text-sm text-orange-800">
                You may need to take over these calls. Review the call list and consider transitioning to human handling.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {highImpactAICalls.map((call) => (
                  <button
                    key={call.id}
          onClick={() => handleSelectCall(call, true, true)}
                    className="text-xs px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded border border-orange-300 transition-colors"
                  >
                    {call.call_id} - {call.impact_category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${
            sidebarOpen ? 'w-80' : 'w-0'
          } bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 lg:w-80`}
        >
          <CallList calls={calls} activeCall={activeCall} onSelectCall={handleSelectCall} isLoading={isLoading} />
        </aside>

        <main className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold mb-1">Configuration Error</h3>
                  <p>{error}</p>
                  <p className="mt-2 text-sm">
                    Create a <code className="bg-red-100 px-1 rounded">.env</code> file in the project root with:
                  </p>
                  <pre className="mt-2 bg-red-100 p-2 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeCall ? (
            <CallDetail call={activeCall} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Phone size={48} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Call Selected</h2>
                <p className="text-gray-600">
                  {calls.length === 0 ? 'No active calls' : 'Select a call from the list to begin'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
