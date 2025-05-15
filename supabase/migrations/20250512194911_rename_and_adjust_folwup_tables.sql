-- Rename columns in folwup_msgs table to match code expectations
ALTER TABLE public.folwup_msgs 
RENAME COLUMN msgestagio_1 TO estagio_1;

ALTER TABLE public.folwup_msgs 
RENAME COLUMN msgestagio_2 TO estagio_2;

ALTER TABLE public.folwup_msgs 
RENAME COLUMN msgestagio_3 TO estagio_3;

ALTER TABLE public.folwup_msgs 
RENAME COLUMN msgestagio_4 TO estagio_4;

ALTER TABLE public.folwup_msgs 
RENAME COLUMN msgestagio_5 TO estagio_5;

-- Create index on agent_id
CREATE INDEX IF NOT EXISTS folwup_msgs_agent_id_idx ON public.folwup_msgs (agent_id);

-- Drop the folwup_stages table as it's not used in the code
DROP TABLE IF EXISTS public.folwup_stages;

-- Add comment to table
COMMENT ON TABLE public.folwup_msgs IS 'Table for storing follow-up messages for agents';
 