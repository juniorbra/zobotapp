-- Create folwup_stages table
CREATE TABLE IF NOT EXISTS public.folwup_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    instancia TEXT,
    key TEXT,
    numero TEXT,
    estagio BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.folwup_stages ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Users can view folwup_stages for their own agents
CREATE POLICY "Users can view folwup_stages for their own agents"
ON public.folwup_stages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.agents
        WHERE agents.id = folwup_stages.agent_id
        AND agents.user_id = auth.uid()
    )
);

-- Users can insert folwup_stages for their own agents
CREATE POLICY "Users can insert folwup_stages for their own agents"
ON public.folwup_stages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.agents
        WHERE agents.id = folwup_stages.agent_id
        AND agents.user_id = auth.uid()
    )
);

-- Users can update folwup_stages for their own agents
CREATE POLICY "Users can update folwup_stages for their own agents"
ON public.folwup_stages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.agents
        WHERE agents.id = folwup_stages.agent_id
        AND agents.user_id = auth.uid()
    )
);

-- Users can delete folwup_stages for their own agents
CREATE POLICY "Users can delete folwup_stages for their own agents"
ON public.folwup_stages
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.agents
        WHERE agents.id = folwup_stages.agent_id
        AND agents.user_id = auth.uid()
    )
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_folwup_stages_updated_at
BEFORE UPDATE ON public.folwup_stages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add comment to table
COMMENT ON TABLE public.folwup_stages IS 'Table for storing follow-up stages for agents';
