ALTER TABLE worker_profiles
ADD COLUMN IF NOT EXISTS public_slug VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_worker_profiles_public_slug
ON worker_profiles(public_slug)
WHERE public_slug IS NOT NULL;
