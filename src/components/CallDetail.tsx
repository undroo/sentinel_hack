import React from 'react';
import { CallWithContext } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Badge } from './index';
import { MapPin, Activity, Zap, Clock } from 'lucide-react';
import { getElapsedTime, getSeverityColor, confidenceColor, formatConfidence } from '../lib/utils';
import LiveTranscript from './LiveTranscript';
import ExtractedFieldsPanel from './ExtractedFieldsPanel';
import ActionBar from './ActionBar';

interface CallDetailProps {
  call: CallWithContext;
}

export default function CallDetail({ call }: CallDetailProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
      <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle level="h2">Critical Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Incident Type</p>
                  <p className="text-lg font-bold text-gray-900">{call.incident_type || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Severity</p>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getSeverityColor(call.severity_score)}`}
                        style={{ width: `${call.severity_score}%` }}
                      />
                    </div>
                    <span className="text-lg font-bold">{call.severity_score}</span>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Location</p>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{call.location_text || 'Not provided'}</p>
                      {call.location_lat && call.location_lon && (
                        <p className="text-xs text-gray-500">
                          {call.location_lat.toFixed(4)}, {call.location_lon.toFixed(4)}
                        </p>
                      )}
                      {call.location_accuracy && (
                        <p className="text-xs text-gray-500 capitalize">{call.location_accuracy}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Victims</p>
                  <p className="text-lg font-bold text-gray-900">{call.number_of_victims || 0}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Weapons</p>
                  <Badge variant={call.weapons_present === 'yes' ? 'danger' : call.weapons_present === 'unknown' ? 'warning' : 'success'} size="sm">
                    {call.weapons_present?.toUpperCase() || 'UNKNOWN'}
                  </Badge>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Call Duration</p>
                  <p className="text-base font-semibold text-gray-900">{getElapsedTime(call.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card padding="md">
              <div className="text-center">
                <Activity className="text-blue-600 mx-auto mb-2" size={24} />
                <p className="text-xs text-gray-600 mb-1">Status</p>
                <p className="text-sm font-bold text-gray-900 capitalize">{call.status.replace('_', ' ')}</p>
              </div>
            </Card>

            <Card padding="md">
              <div className="text-center">
                <Zap className="text-yellow-600 mx-auto mb-2" size={24} />
                <p className="text-xs text-gray-600 mb-1">AI Confidence</p>
                <p className={`text-sm font-bold ${confidenceColor(call.ai_confidence_avg)}`}>
                  {formatConfidence(call.ai_confidence_avg)}
                </p>
              </div>
            </Card>

            <Card padding="md">
              <div className="text-center">
                <Clock className="text-green-600 mx-auto mb-2" size={24} />
                <p className="text-xs text-gray-600 mb-1">Started</p>
                <p className="text-xs font-bold text-gray-900">{getElapsedTime(call.started_at)}</p>
              </div>
            </Card>
          </div>
        </div>

        <LiveTranscript call={call} />
      </div>

      <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
        <ExtractedFieldsPanel call={call} />
      </div>

      <div className="lg:col-span-3">
        <ActionBar call={call} />
      </div>
    </div>
  );
}
