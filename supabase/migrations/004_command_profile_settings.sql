-- CodeNexus: user identity and command-center preferences

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS nickname TEXT,
  ADD COLUMN IF NOT EXISTS mentor_taunt_frequency INTEGER NOT NULL DEFAULT 55,
  ADD COLUMN IF NOT EXISTS mentor_font_mode TEXT NOT NULL DEFAULT 'hacker',
  ADD COLUMN IF NOT EXISTS noise_brightness INTEGER NOT NULL DEFAULT 45;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_taunt_frequency_range,
  DROP CONSTRAINT IF EXISTS user_profiles_font_mode_check,
  DROP CONSTRAINT IF EXISTS user_profiles_noise_brightness_range;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_taunt_frequency_range
    CHECK (mentor_taunt_frequency BETWEEN 0 AND 100),
  ADD CONSTRAINT user_profiles_font_mode_check
    CHECK (mentor_font_mode IN ('hacker', 'cyberpunk')),
  ADD CONSTRAINT user_profiles_noise_brightness_range
    CHECK (noise_brightness BETWEEN 0 AND 100);
