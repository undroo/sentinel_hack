import React, { useMemo } from 'react';
import { Call, CallWithContext } from '../types';
import { Badge } from './Badge';
import { getElapsedTime } from '../lib/utils';
import { AlertCircle, Loader2 } from 'lucide-react';

interface CallListProps {
  calls: Call[];
  activeCall: CallWithContext | null;
  onSelectCall: (call: Call) => void;
  isLoading?: boolean;
}

export default function CallList({ calls, activeCall, onSelectCall, isLoading }: CallListProps) {
  const sortedCalls = useMemo(() => {
    return [...calls].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff =
        (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);

      if (priorityDiff !== 0) return priorityDiff;

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [calls]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          Active Calls
          <span className="ml-2 text-sm font-normal text-gray-500">({calls.length})</span>
        </h2>
      </div>

      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={24} />
        </div>
      )}

      {!isLoading && calls.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <AlertCircle className="text-gray-300 mb-2" size={40} />
          <p className="text-gray-500 text-sm">No active calls</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {sortedCalls.map((call) => (
          <button
            key={call.id}
            onClick={() => onSelectCall(call)}
            className={`w-full text-left p-4 border-b border-gray-100 transition-colors hover:bg-blue-50 ${
              activeCall?.id === call.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">
                  {call.incident_type || 'Unknown'}
                </Badge>
                <Badge variant={call.priority === 'critical' ? 'danger' : 'warning'} size="sm">
                  {call.priority.toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-gray-500">{getElapsedTime(call.created_at)}</div>
            </div>

            {call.caller_name && (
              <p className="text-sm font-medium text-gray-900">{call.caller_name}</p>
            )}

            {call.location_text && (
              <p className="text-xs text-gray-600 mt-1 truncate">{call.location_text}</p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {call.severity_score > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          call.severity_score >= 80
                            ? 'bg-red-500'
                            : call.severity_score >= 60
                              ? 'bg-orange-500'
                              : 'bg-yellow-500'
                        }`}
                        style={{ width: `${call.severity_score}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{call.severity_score}</span>
                  </div>
                )}
              </div>

              {call.status === 'human_active' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Active
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
