-- CodeNexus: Shared Snippets
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.shared_snippets (
  id           VARCHAR(10)  PRIMARY KEY,
  user_id      UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  code         TEXT         NOT NULL,
  language     VARCHAR(20)  NOT NULL DEFAULT 'python',
  level_id     INTEGER,
  title        VARCHAR(200),
  output_text  TEXT,
  output_image TEXT,        -- base64 PNG (from matplotlib)
  has_graphic  BOOLEAN      NOT NULL DEFAULT false,
  view_count   INTEGER      NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shared_snippets ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read shared snippets
CREATE POLICY "Snippets are public" ON public.shared_snippets
  FOR SELECT USING (true);

-- Authenticated users can create snippets
CREATE POLICY "Auth users can insert snippets" ON public.shared_snippets
  FOR INSERT WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Increment view counter (callable by anon via RPC)
CREATE OR REPLACE FUNCTION public.increment_snippet_views(p_id VARCHAR)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.shared_snippets SET view_count = view_count + 1 WHERE id = p_id;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_snippets_user ON public.shared_snippets(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON public.shared_snippets(created_at DESC);
