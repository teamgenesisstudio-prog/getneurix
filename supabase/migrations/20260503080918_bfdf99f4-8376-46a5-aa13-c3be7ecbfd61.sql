CREATE TABLE public.forensic_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_label TEXT,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  model TEXT,
  prompt_excerpt TEXT,
  response_excerpt TEXT,
  violation_clause TEXT,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  tokens INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_forensic_logs_session ON public.forensic_logs(session_id);
CREATE INDEX idx_forensic_logs_created ON public.forensic_logs(created_at DESC);

ALTER TABLE public.forensic_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read forensic logs"
ON public.forensic_logs FOR SELECT
USING (true);

CREATE POLICY "Public can insert forensic logs"
ON public.forensic_logs FOR INSERT
WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.forensic_logs;
ALTER TABLE public.forensic_logs REPLICA IDENTITY FULL;