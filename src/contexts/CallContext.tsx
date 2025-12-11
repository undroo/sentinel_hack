import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Call, TranscriptBlock, ExtractedField, CallWithContext } from '../types';

interface CallContextType {
  activeCall: CallWithContext | null;
  calls: Call[];
  setActiveCall: (call: CallWithContext | null) => void;
  setCalls: (calls: Call[]) => void;
  addTranscriptBlock: (block: TranscriptBlock) => void;
  updateExtractedField: (field: ExtractedField) => void;
  updateCall: (call: Partial<Call>) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: ReactNode }) {
  const [activeCall, setActiveCall] = useState<CallWithContext | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTranscriptBlock = useCallback(
    (block: TranscriptBlock) => {
      if (activeCall && block.call_id === activeCall.id) {
        setActiveCall({
          ...activeCall,
          transcripts: [...(activeCall.transcripts || []), block],
        });
      }
    },
    [activeCall]
  );

  const updateExtractedField = useCallback(
    (field: ExtractedField) => {
      if (activeCall && field.call_id === activeCall.id) {
        const existingIndex =
          activeCall.extracted_fields?.findIndex((f) => f.field_name === field.field_name) ?? -1;

        if (existingIndex >= 0) {
          const updated = [...(activeCall.extracted_fields || [])];
          updated[existingIndex] = field;
          setActiveCall({
            ...activeCall,
            extracted_fields: updated,
          });
        } else {
          setActiveCall({
            ...activeCall,
            extracted_fields: [...(activeCall.extracted_fields || []), field],
          });
        }
      }
    },
    [activeCall]
  );

  const updateCall = useCallback(
    (updates: Partial<Call>) => {
      if (activeCall) {
        setActiveCall({
          ...activeCall,
          ...updates,
        });
      }

      setCalls((prevCalls) =>
        prevCalls.map((call) =>
          call.id === activeCall?.id ? { ...call, ...updates } : call
        )
      );
    },
    [activeCall]
  );

  const value: CallContextType = {
    activeCall,
    calls,
    setActiveCall,
    setCalls,
    addTranscriptBlock,
    updateExtractedField,
    updateCall,
    isLoading,
    setIsLoading,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
