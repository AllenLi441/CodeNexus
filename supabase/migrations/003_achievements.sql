-- CodeNexus: User Achievements
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id VARCHAR(50)  NOT NULL,
  earned_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their achievements" ON public.user_achievements
  FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.user_achievements(user_id);
