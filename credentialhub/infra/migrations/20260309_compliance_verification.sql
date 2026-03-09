ALTER TABLE worker_profiles
ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(32) NOT NULL DEFAULT 'incomplete';

ALTER TABLE worker_profiles
ADD COLUMN IF NOT EXISTS last_compliance_check TIMESTAMPTZ NULL;

ALTER TABLE worker_references
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL;

ALTER TABLE worker_references
ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMPTZ NULL;

ALTER TABLE worker_references
ADD COLUMN IF NOT EXISTS verification_confirmed_at TIMESTAMPTZ NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_worker_references_verification_token
ON worker_references(verification_token)
WHERE verification_token IS NOT NULL;
