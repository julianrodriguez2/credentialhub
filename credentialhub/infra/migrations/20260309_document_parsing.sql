CREATE TABLE IF NOT EXISTS parsed_credential_audits (
    id UUID PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    raw_extracted_text TEXT NULL,
    parsed_result_json JSON NOT NULL,
    confidence_score DOUBLE PRECISION NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_parsed_credential_audits_worker_id
ON parsed_credential_audits(worker_id);

CREATE INDEX IF NOT EXISTS ix_parsed_credential_audits_created_at
ON parsed_credential_audits(created_at DESC);
