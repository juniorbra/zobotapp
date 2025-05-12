-- Create folwup_msgs table
CREATE TABLE IF NOT EXISTS public.folwup_msgs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    msgestagio_1 TEXT,
    msgestagio_2 TEXT,
    msgestagio_3 TEXT,
    msgestagio_4 TEXT,
    msgestagio_5 TEXT,
    intervalo_1 INTEGER,
    intervalo_2 INTEGER,
    intervalo_3 INTEGER,
    intervalo_4 INTEGER,
    intervalo_5 INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.folwup_msgs ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
-- Users can view folwup_msgs for their own agents
CREATE POLICY "Users can view folwup_msgs for their own agents"
ON public.folwup_msgs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.agents
        WHERE agents.id = folwup_msgs.agent_id
        AND agents.user_id = auth.uid()
    )
);

-- Users can insert folwup_msgs for their own agents
CREATE POLICY "Users can insert folwup_msgs for their own agents"
ON public.folwup_msgs
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.agents
        WHERE agents.id = folwup_msgs.agent_id
        AND agents.user_id = auth.uid()
    )
);

-- Users can update folwup_msgs for their own agents
CREATE POLICY "Users can update folwup_msgs for their own agents"
ON public.folwup_msgs
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.agents
        WHERE agents.id = folwup_msgs.agent_id
        AND agents.user_id = auth.uid()
    )
);

-- Users can delete folwup_msgs for their own agents
CREATE POLICY "Users can delete folwup_msgs for their own agents"
ON public.folwup_msgs
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.agents
        WHERE agents.id = folwup_msgs.agent_id
        AND agents.user_id = auth.uid()
    )
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_folwup_msgs_updated_at
BEFORE UPDATE ON public.folwup_msgs
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add comment to table
COMMENT ON TABLE public.folwup_msgs IS 'Table for storing follow-up messages for agents';
