-- CodeNexus: remove legacy XP/rank columns

ALTER TABLE IF EXISTS public.user_profiles
  DROP COLUMN IF EXISTS total_xp,
  DROP COLUMN IF EXISTS forge_level;

ALTER TABLE IF EXISTS public.user_progress
  DROP COLUMN IF EXISTS xp_earned;
