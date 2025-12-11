import React, { useState, useEffect } from 'react';
import { Phone, AlertCircle, Menu, X } from 'lucide-react';
import { useCall } from '../contexts/CallContext';
import { supabase } from '../lib/supabase';
import { Call, CallWithContext } from '../types';
import { Button, Badge } from '../components';
import { formatISODate, getStatusBadge } from '../lib/utils';
import CallList from '../components/CallList';
import CallDetail from '../components/CallDetail';

export default function DashboardLayout() {
  const { activeCall, setActiveCall, calls, setCalls, isLoading, setIsLoading } = useCall();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalls();
    const cleanup = subscribeToCallUpdates();
    return cleanup;
  }, []);

  const loadCalls = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .in('status', ['ai_handling', 'human_active'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setIsLoading(false);
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
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setCalls((prevCalls) =>
              prevCalls.map((call) =>
                call.id === (payload.new as Call).id ? (payload.new as Call) : call
              )
            );

            if (activeCall?.id === (payload.new as Call).id) {
              setActiveCall({ ...activeCall, ...(payload.new as Call) });
            }
          } else if (payload.eventType === 'INSERT') {
            setCalls((prevCalls) => [payload.new as Call, ...prevCalls]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSelectCall = async (call: Call) => {
    setIsLoading(true);
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

      setActiveCall({
        ...call,
        transcripts: transcripts || [],
        extracted_fields: fields || [],
        actions: actions || [],
      } as CallWithContext);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load call details');
    } finally {
      setIsLoading(false);
    }
  };

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

          {activeCall && (
            <div className="hidden md:flex items-center gap-6">
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
      </header>

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
              {error}
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
