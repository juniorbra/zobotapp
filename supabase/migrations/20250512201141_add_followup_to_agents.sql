-- Add followup column to agents table
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS followup BOOLEAN NOT NULL DEFAULT false;

-- Add comment to column
COMMENT ON COLUMN public.agents.followup IS 'Flag to enable follow-up messages for this agent';
