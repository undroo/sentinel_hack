import React, { useState } from 'react';
import { CallWithContext } from '../types';
import { Button, Modal } from './index';
import { Send, UserCheck, AlertTriangle, Flag, FileText } from 'lucide-react';
import { TextArea } from './Input';
import { supabase } from '../lib/supabase';

interface ActionBarProps {
  call: CallWithContext;
}

export default function ActionBar({ call }: ActionBarProps) {
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDispatch = async () => {
    setIsSubmitting(true);
    try {
      await supabase.from('call_actions').insert({
        call_id: call.id,
        responder_id: call.assigned_responder_id,
        action_type: 'dispatch',
        action_data: { timestamp: new Date().toISOString() },
      });

      await supabase
        .from('calls')
        .update({ status: 'closed' })
        .eq('id', call.id);

      setShowDispatchModal(false);
    } catch (error) {
      console.error('Dispatch error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      await supabase.from('call_actions').insert({
        call_id: call.id,
        responder_id: call.assigned_responder_id,
        action_type: 'note',
        action_data: { note },
      });

      setNote('');
      setShowNoteModal(false);
    } catch (error) {
      console.error('Note error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg p-4">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => setShowDispatchModal(true)}>
              <Send size={18} />
              Dispatch
            </Button>
            <Button variant="secondary" onClick={() => setShowNoteModal(true)}>
              <FileText size={18} />
              Add Note
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary">
              <UserCheck size={18} />
              Mark Safe
            </Button>
            <Button variant="danger">
              <AlertTriangle size={18} />
              Escalate
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        title="Confirm Dispatch"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDispatchModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDispatch} isLoading={isSubmitting}>
              Confirm Dispatch
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          Are you sure you want to dispatch emergency services for this call?
        </p>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-semibold">Call: {call.call_id}</p>
          <p>Location: {call.location_text || 'Unknown'}</p>
          <p>Type: {call.incident_type || 'Unknown'}</p>
        </div>
      </Modal>

      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Note"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddNote} isLoading={isSubmitting}>
              Save Note
            </Button>
          </>
        }
      >
        <TextArea
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Enter your note here..."
        />
      </Modal>
    </>
  );
}
