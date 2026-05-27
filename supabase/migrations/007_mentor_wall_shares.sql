-- CodeNexus: mentor roast share cards and public wall

ALTER TABLE public.shared_snippets
  ADD COLUMN IF NOT EXISTS mentor_quote TEXT,
  ADD COLUMN IF NOT EXISTS codename VARCHAR(40),
  ADD COLUMN IF NOT EXISTS is_wall_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wall_reaction VARCHAR(80),
  ADD COLUMN IF NOT EXISTS share_kind VARCHAR(24) NOT NULL DEFAULT 'snippet';

ALTER TABLE public.shared_snippets
  DROP CONSTRAINT IF EXISTS shared_snippets_mentor_quote_length,
  DROP CONSTRAINT IF EXISTS shared_snippets_codename_length,
  DROP CONSTRAINT IF EXISTS shared_snippets_share_kind_check;

ALTER TABLE public.shared_snippets
  ADD CONSTRAINT shared_snippets_mentor_quote_length
    CHECK (mentor_quote IS NULL OR char_length(mentor_quote) <= 280),
  ADD CONSTRAINT shared_snippets_codename_length
    CHECK (codename IS NULL OR char_length(codename) <= 40),
  ADD CONSTRAINT shared_snippets_share_kind_check
    CHECK (share_kind IN ('snippet', 'mentor_roast', 'project'));

CREATE INDEX IF NOT EXISTS idx_snippets_wall_public_recent
  ON public.shared_snippets(created_at DESC)
  WHERE is_wall_public = true;
