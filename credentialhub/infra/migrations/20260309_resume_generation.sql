CREATE TABLE IF NOT EXISTS generated_resumes (
    id UUID PRIMARY KEY,
    worker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_generated_resumes_worker_id
ON generated_resumes(worker_id);

CREATE INDEX IF NOT EXISTS ix_generated_resumes_created_at
ON generated_resumes(created_at DESC);
