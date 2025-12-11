import React, { useState } from 'react';
import { CallWithContext, ExtractedField } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button, Badge } from './index';
import { Edit2, Lock, Unlock, CheckCircle } from 'lucide-react';
import { confidenceColor, formatConfidence } from '../lib/utils';
import { supabase } from '../lib/supabase';

interface ExtractedFieldsPanelProps {
  call: CallWithContext;
}

export default function ExtractedFieldsPanel({ call }: ExtractedFieldsPanelProps) {
  const fields = call.extracted_fields || [];

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      incident_type: 'Incident Type',
      location: 'Location',
      severity: 'Severity',
      weapons: 'Weapons Present',
      victims: 'Number of Victims',
      medical_info: 'Medical Information',
      threats: 'Immediate Threats',
    };
    return labels[fieldName] || fieldName.replace(/_/g, ' ').toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle level="h3">Extracted Fields</CardTitle>
      </CardHeader>
      <CardContent>
        {fields.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No extracted fields yet</p>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600 uppercase">
                    {getFieldLabel(field.field_name)}
                  </span>
                  {field.locked_for_override ? (
                    <Lock size={14} className="text-green-600" />
                  ) : (
                    <Unlock size={14} className="text-gray-400" />
                  )}
                </div>

                <p className="text-sm font-semibold text-gray-900 mb-2">
                  {field.field_value || 'N/A'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confidence:</span>
                    <span className={`text-xs font-semibold ${confidenceColor(field.confidence || 0)}`}>
                      {formatConfidence(field.confidence)}
                    </span>
                  </div>

                  {field.verified_by && (
                    <Badge variant="success" size="sm">
                      <CheckCircle size={12} className="mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>

                {field.confidence !== undefined && field.confidence < 0.6 && !field.verified_by && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    Needs Verification
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
