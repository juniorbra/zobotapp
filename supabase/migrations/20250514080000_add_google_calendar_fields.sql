-- Add Google Calendar fields to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS google_calendar_access_mode VARCHAR(50) DEFAULT 'view_only',
ADD COLUMN IF NOT EXISTS google_calendar_start_time TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS google_calendar_end_time TIME DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS google_calendar_allowed_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]',
ADD COLUMN IF NOT EXISTS google_calendar_default_duration INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS google_calendar_add_client_as_guest BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS google_calendar_auto_reschedule BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_auto_delete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_calendar_custom_instructions TEXT DEFAULT E'Sempre confirme com o cliente antes de agendar.\nEvite agendar compromissos fora do horário comercial.\nUse "Consulta" como título padrão dos eventos.';

-- Create enum for Google Calendar access modes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'google_calendar_access_mode_enum') THEN
        CREATE TYPE google_calendar_access_mode_enum AS ENUM (
            'view_only',
            'create_events',
            'create_edit_events',
            'full_control'
        );
    END IF;
END$$;

-- Add comment to explain the fields
COMMENT ON COLUMN agents.google_calendar_access_mode IS 'Defines what the agent can do with the calendar: view_only, create_events, create_edit_events, full_control';
COMMENT ON COLUMN agents.google_calendar_start_time IS 'Start time for available scheduling hours';
COMMENT ON COLUMN agents.google_calendar_end_time IS 'End time for available scheduling hours';
COMMENT ON COLUMN agents.google_calendar_allowed_days IS 'JSON array of days when scheduling is allowed';
COMMENT ON COLUMN agents.google_calendar_default_duration IS 'Default duration for events in minutes';
COMMENT ON COLUMN agents.google_calendar_add_client_as_guest IS 'Whether to add the client as a guest to the event';
COMMENT ON COLUMN agents.google_calendar_auto_reschedule IS 'Whether the AI can automatically reschedule events';
COMMENT ON COLUMN agents.google_calendar_auto_delete IS 'Whether the AI can automatically delete events';
COMMENT ON COLUMN agents.google_calendar_custom_instructions IS 'Custom instructions for the agent regarding scheduling';
