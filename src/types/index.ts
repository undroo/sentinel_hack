export type ResponderRole = 'dispatcher' | 'supervisor' | 'admin';
export type CallStatus = 'ai_handling' | 'human_active' | 'closed';
export type CallPriority = 'low' | 'medium' | 'high' | 'critical';
export type TranscriptSpeaker = 'caller' | 'ai' | 'responder';
export type ActionType = 'dispatch' | 'note' | 'field_edit' | 'transfer' | 'mark_safe' | 'escalate' | 'redact' | 'attachment';
export type LocationAccuracy = 'exact' | 'approximate' | 'gps_only';
export type WeaponsPresent = 'yes' | 'no' | 'unknown';

export interface Responder {
  id: string;
  email: string;
  name: string;
  role: ResponderRole;
  phone?: string;
  jurisdiction_id?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  call_id: string;
  status: CallStatus;
  priority: CallPriority;
  caller_phone?: string;
  caller_name?: string;
  source_type: string;
  incident_type?: string;
  location_text?: string;
  location_lat?: number;
  location_lon?: number;
  location_accuracy: LocationAccuracy;
  severity_score: number;
  ai_confidence_avg: number;
  assigned_responder_id?: string;
  number_of_victims: number;
  weapons_present: WeaponsPresent;
  medical_emergency: boolean;
  created_at: string;
  updated_at: string;
  started_at: string;
  closed_at?: string;
  recording_url?: string;
  notes?: string;
}

export interface TranscriptBlock {
  id: string;
  call_id: string;
  speaker: TranscriptSpeaker;
  text: string;
  timestamp_iso: string;
  audio_offset_ms?: number;
  is_highlighted: boolean;
  tags?: string[];
  created_at: string;
}

export interface ExtractedField {
  id: string;
  call_id: string;
  field_name: string;
  field_value?: string;
  confidence?: number;
  source_block_id?: string;
  verified_by?: string;
  verified_at?: string;
  locked_for_override: boolean;
  previous_value?: string;
  updated_at: string;
}

export interface CallAction {
  id: string;
  call_id: string;
  responder_id: string;
  action_type: ActionType;
  action_data?: Record<string, unknown>;
  reason?: string;
  created_at: string;
}

export interface CallWithContext extends Call {
  responder?: Responder;
  transcripts?: TranscriptBlock[];
  extracted_fields?: ExtractedField[];
  actions?: CallAction[];
}
