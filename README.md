# First Responder Emergency Dashboard

A real-time web dashboard for emergency dispatchers and first responders that receives calls initially handled by an AI agent. The dashboard provides live transcript monitoring, AI-extracted incident data, location information, risk assessment, and dispatch controls.

## Features

### Core Functionality
- **Real-time Call Management**: Monitor multiple active emergency calls with priority sorting
- **Live Transcript Streaming**: View AI and caller conversations in real-time with auto-scroll
- **AI-Extracted Fields**: Incident type, location, severity, victim count, and threat assessment
- **Critical Information Panel**: Quick snapshot of incident details, severity score, and recommended actions
- **Action Controls**: Dispatch, add notes, mark safe, escalate, and transfer calls
- **Search & Filter**: Search within transcripts and filter calls by status/priority
- **Confidence Indicators**: View AI confidence scores for extracted data fields
- **Audit Trail**: All actions logged with timestamps for compliance

### Technical Highlights
- **WebSocket Real-time Updates**: Supabase Realtime for instant transcript and field updates
- **Row Level Security**: Secure data access based on responder roles and assignments
- **Responsive Design**: Optimized for desktop and tablet use
- **Keyboard Shortcuts**: Quick actions for efficient workflow
- **Accessibility**: Screen reader support, high contrast modes, keyboard navigation

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Authentication**: Supabase Auth (ready for SSO integration)

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

3. Database is already set up with:
   - Tables: calls, transcript_blocks, extracted_fields, responders, call_actions, audit_logs
   - Row Level Security policies
   - Sample seed data with 3 demo calls

### Development

Start the development server:
```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Badge.tsx       # Status badges and labels
│   ├── Button.tsx      # Action buttons
│   ├── Card.tsx        # Container cards
│   ├── Modal.tsx       # Dialog modals
│   ├── Input.tsx       # Form inputs
│   ├── CallList.tsx    # Sidebar call queue
│   ├── CallDetail.tsx  # Main call view
│   ├── LiveTranscript.tsx      # Real-time transcript
│   ├── ExtractedFieldsPanel.tsx # AI-extracted data
│   └── ActionBar.tsx   # Bottom action controls
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   └── CallContext.tsx # Call management state
├── lib/                # Utilities and helpers
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Helper functions
├── pages/              # Page components
│   └── DashboardLayout.tsx # Main dashboard
├── types/              # TypeScript definitions
│   └── index.ts        # Type definitions
└── App.tsx             # Root component
```

## Database Schema

### Core Tables

**calls** - Main call records
- id, call_id, status, priority, incident_type
- location data (text, lat, lon, accuracy)
- severity_score, ai_confidence_avg
- caller info, victim count, weapons_present
- timestamps, assigned_responder_id

**transcript_blocks** - Live call transcripts
- id, call_id, speaker (caller/ai/responder)
- text, timestamp, audio_offset
- highlighting, tags

**extracted_fields** - AI-extracted incident data
- id, call_id, field_name, field_value
- confidence score, verification status
- source reference, edit history

**responders** - Emergency personnel
- id, email, name, role
- jurisdiction, contact info

**call_actions** - Action audit trail
- id, call_id, responder_id
- action_type, action_data, timestamp

**audit_logs** - Immutable compliance logs
- All changes with before/after states
- Actor tracking, tamper-evident checksums

## Key Components

### DashboardLayout
Main container with:
- Header with call info and quick actions
- Sidebar with active call list
- Main content area for call details
- Real-time WebSocket subscriptions

### CallList
- Displays all active calls sorted by priority
- Shows severity indicators and elapsed time
- Click to select and view call details
- Auto-updates when new calls arrive

### LiveTranscript
- Real-time transcript with speaker labels
- Auto-scroll with lock toggle
- Critical keyword highlighting
- Search functionality
- Speaker color coding (caller/AI/responder)

### ExtractedFieldsPanel
- AI-extracted incident fields
- Confidence scores with color indicators
- Verification badges
- Low-confidence warnings
- Field locking for verified data

### ActionBar
- Primary actions: Dispatch, Add Note
- Secondary actions: Mark Safe, Escalate
- Modal confirmations for critical actions
- Real-time action logging

## Real-time Features

The dashboard uses Supabase Realtime for WebSocket subscriptions:

1. **Call Updates**: New calls, status changes, priority updates
2. **Transcript Streaming**: New transcript blocks appear instantly
3. **Field Updates**: AI extractions update as they're processed
4. **Action Notifications**: Team actions visible to all responders

## Sample Data

The database includes 3 demo emergency calls:

1. **CALL-2025-001** (Critical - Medical Emergency)
   - Not breathing, unconscious victim
   - Human responder active
   - 6 transcript lines with critical keywords

2. **CALL-2025-002** (High - Fire)
   - Apartment fire with 3 people trapped
   - AI handling
   - 5 transcript lines

3. **CALL-2025-003** (Medium - Traffic Accident)
   - Two-car collision, 2 injured
   - AI handling
   - 5 transcript lines

## Usage Workflow

1. **Monitor Call Queue**: View active calls in left sidebar, sorted by priority
2. **Select Call**: Click a call to view full details
3. **Review Snapshot**: Check critical info panel for incident summary
4. **Read Transcript**: Monitor live conversation and keyword highlights
5. **Verify Fields**: Check AI-extracted data and confidence scores
6. **Take Action**: Use action bar to dispatch, add notes, or escalate
7. **Track Updates**: Real-time updates show new information as it arrives

## Security & Compliance

- **Row Level Security**: Database policies enforce access control
- **Audit Logging**: All actions logged with actor, timestamp, before/after states
- **Data Encryption**: TLS in transit, encryption at rest via Supabase
- **Role-Based Access**: Dispatcher, Supervisor, Admin roles
- **PII Protection**: Secure handling of sensitive caller information

## Future Enhancements

### Phase 2 (Planned)
- Telephony integration for voice takeover
- Interactive mapping with CAD integration
- Advanced audio detection (gunshots, alarms)
- Multi-call workflows and routing
- Mobile responder app

### Phase 3 (Planned)
- Analytics dashboard with KPIs
- Supervisor oversight tools
- Historical search and playback
- Compliance export tools
- ML model performance tracking

## Performance

- Target: <200ms UI latency for updates
- Transcript streaming: <1 second delay
- Virtual scrolling for long transcripts
- Optimistic UI updates with rollback
- Efficient WebSocket subscription management

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader semantic markup
- High contrast mode
- Focus management
- Skip links for efficiency

## Contributing

This is a demonstration project. For production deployment:
1. Configure SSO authentication
2. Set up production Supabase instance
3. Integrate with CAD/telephony systems
4. Conduct security audit
5. Load test for concurrent users
6. Set up monitoring and alerting

## License

Copyright 2025 - Emergency Response Systems

## Support

For questions or issues, contact your system administrator.
