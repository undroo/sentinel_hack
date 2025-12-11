-- Seed data for First Responder Dashboard demo

-- Insert sample responders
INSERT INTO responders (id, email, name, role, phone, jurisdiction_id, active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'dispatcher1@example.com', 'Sarah Johnson', 'dispatcher', '+1-555-0101', 'NORTH', true),
('550e8400-e29b-41d4-a716-446655440002', 'supervisor@example.com', 'Michael Chen', 'supervisor', '+1-555-0102', 'CENTRAL', true),
('550e8400-e29b-41d4-a716-446655440003', 'dispatcher2@example.com', 'Emma Davis', 'dispatcher', '+1-555-0103', 'SOUTH', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample calls
INSERT INTO calls (id, call_id, status, priority, caller_phone, caller_name, source_type, incident_type, location_text, location_lat, location_lon, location_accuracy, severity_score, ai_confidence_avg, assigned_responder_id, number_of_victims, weapons_present, medical_emergency, started_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'CALL-2025-001', 'human_active', 'critical', '+1-555-1001', 'John Smith', 'phone', 'Medical Emergency', '123 Main Street, Downtown', 40.7128, -74.0060, 'exact', 92, 0.87, '550e8400-e29b-41d4-a716-446655440001', 1, 'no', true, NOW() - INTERVAL '3 minutes'),
('660e8400-e29b-41d4-a716-446655440002', 'CALL-2025-002', 'ai_handling', 'high', '+1-555-1002', 'Jane Doe', 'phone', 'Fire', '456 Oak Avenue, Westside', 40.7282, -74.0776, 'approximate', 78, 0.92, '550e8400-e29b-41d4-a716-446655440001', 3, 'unknown', false, NOW() - INTERVAL '7 minutes'),
('660e8400-e29b-41d4-a716-446655440003', 'CALL-2025-003', 'ai_handling', 'medium', '+1-555-1003', 'Robert Wilson', 'phone', 'Traffic Accident', '789 Elm Street, Eastside', 40.7489, -73.9680, 'gps_only', 55, 0.75, '550e8400-e29b-41d4-a716-446655440003', 2, 'no', false, NOW() - INTERVAL '12 minutes')
ON CONFLICT (id) DO NOTHING;

-- Insert transcript blocks for CALL-2025-001
INSERT INTO transcript_blocks (call_id, speaker, text, timestamp_iso, audio_offset_ms, is_highlighted, tags) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'caller', 'Hello, I need help! My father collapsed!', NOW() - INTERVAL '3 minutes', 0, true, ARRAY['emergency', 'medical']),
('660e8400-e29b-41d4-a716-446655440001', 'ai', 'I understand this is an emergency. Can you tell me his current condition?', NOW() - INTERVAL '2 minutes 50 seconds', 10000, false, NULL),
('660e8400-e29b-41d4-a716-446655440001', 'caller', 'He is not breathing! We are at 123 Main Street!', NOW() - INTERVAL '2 minutes 40 seconds', 20000, true, ARRAY['critical', 'breathing']),
('660e8400-e29b-41d4-a716-446655440001', 'ai', 'Help is on the way. Is he conscious?', NOW() - INTERVAL '2 minutes 30 seconds', 30000, false, NULL),
('660e8400-e29b-41d4-a716-446655440001', 'caller', 'No, he is unconscious and not responding!', NOW() - INTERVAL '2 minutes 20 seconds', 40000, true, ARRAY['unconscious']),
('660e8400-e29b-41d4-a716-446655440001', 'ai', 'I am connecting you with a human responder now for immediate assistance.', NOW() - INTERVAL '2 minutes 10 seconds', 50000, false, NULL)
ON CONFLICT DO NOTHING;

-- Insert transcript blocks for CALL-2025-002
INSERT INTO transcript_blocks (call_id, speaker, text, timestamp_iso, audio_offset_ms, is_highlighted) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'caller', 'There is a fire at my apartment building!', NOW() - INTERVAL '7 minutes', 0, true),
('660e8400-e29b-41d4-a716-446655440002', 'ai', 'Where is the fire located?', NOW() - INTERVAL '6 minutes 50 seconds', 10000, false),
('660e8400-e29b-41d4-a716-446655440002', 'caller', '456 Oak Avenue. Smoke is coming from the second floor!', NOW() - INTERVAL '6 minutes 40 seconds', 20000, true),
('660e8400-e29b-41d4-a716-446655440002', 'ai', 'Are there people inside the building?', NOW() - INTERVAL '6 minutes 30 seconds', 30000, false),
('660e8400-e29b-41d4-a716-446655440002', 'caller', 'Yes, I think there are about 3 people still inside!', NOW() - INTERVAL '6 minutes 20 seconds', 40000, true)
ON CONFLICT DO NOTHING;

-- Insert transcript blocks for CALL-2025-003
INSERT INTO transcript_blocks (call_id, speaker, text, timestamp_iso, audio_offset_ms) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'caller', 'I witnessed a car accident on Elm Street.', NOW() - INTERVAL '12 minutes', 0),
('660e8400-e29b-41d4-a716-446655440003', 'ai', 'Can you describe what happened?', NOW() - INTERVAL '11 minutes 50 seconds', 10000),
('660e8400-e29b-41d4-a716-446655440003', 'caller', 'Two cars collided at the intersection. People look injured.', NOW() - INTERVAL '11 minutes 40 seconds', 20000),
('660e8400-e29b-41d4-a716-446655440003', 'ai', 'How many people are injured?', NOW() - INTERVAL '11 minutes 30 seconds', 30000),
('660e8400-e29b-41d4-a716-446655440003', 'caller', 'I see two people, one in each car. They are moving but appear hurt.', NOW() - INTERVAL '11 minutes 20 seconds', 40000)
ON CONFLICT DO NOTHING;

-- Insert extracted fields for CALL-2025-001
INSERT INTO extracted_fields (call_id, field_name, field_value, confidence, locked_for_override) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'incident_type', 'Medical Emergency', 0.95, false),
('660e8400-e29b-41d4-a716-446655440001', 'location', '123 Main Street, Downtown', 0.92, false),
('660e8400-e29b-41d4-a716-446655440001', 'severity', '92', 0.87, false),
('660e8400-e29b-41d4-a716-446655440001', 'victims', '1', 0.90, false),
('660e8400-e29b-41d4-a716-446655440001', 'medical_info', 'Not breathing, unconscious', 0.88, false)
ON CONFLICT (call_id, field_name) DO NOTHING;

-- Insert extracted fields for CALL-2025-002
INSERT INTO extracted_fields (call_id, field_name, field_value, confidence, locked_for_override) VALUES
('660e8400-e29b-41d4-a716-446655440002', 'incident_type', 'Fire', 0.98, false),
('660e8400-e29b-41d4-a716-446655440002', 'location', '456 Oak Avenue, Westside', 0.85, false),
('660e8400-e29b-41d4-a716-446655440002', 'severity', '78', 0.80, false),
('660e8400-e29b-41d4-a716-446655440002', 'victims', '3', 0.75, false),
('660e8400-e29b-41d4-a716-446655440002', 'threats', 'Smoke, potential structural damage', 0.82, false)
ON CONFLICT (call_id, field_name) DO NOTHING;

-- Insert extracted fields for CALL-2025-003
INSERT INTO extracted_fields (call_id, field_name, field_value, confidence, locked_for_override) VALUES
('660e8400-e29b-41d4-a716-446655440003', 'incident_type', 'Traffic Accident', 0.93, false),
('660e8400-e29b-41d4-a716-446655440003', 'location', '789 Elm Street, Eastside', 0.70, false),
('660e8400-e29b-41d4-a716-446655440003', 'severity', '55', 0.75, false),
('660e8400-e29b-41d4-a716-446655440003', 'victims', '2', 0.85, false)
ON CONFLICT (call_id, field_name) DO NOTHING;
