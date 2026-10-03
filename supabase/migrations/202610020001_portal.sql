-- Apply once to the ONE hosted PBI Supabase project. No sample clients are inserted.
BEGIN;
CREATE SCHEMA pbi_portal;
REVOKE ALL ON SCHEMA pbi_portal FROM PUBLIC, anon, authenticated;
SET LOCAL search_path TO pbi_portal, pg_catalog;
CREATE TABLE organizations (id text PRIMARY KEY, name text NOT NULL, demo smallint NOT NULL DEFAULT 0 CHECK(demo IN (0,1)), created_at text NOT NULL);
CREATE TABLE memberships (id text PRIMARY KEY, organization_id text NOT NULL REFERENCES organizations(id), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role text NOT NULL CHECK(role IN ('admin','client')), created_at text NOT NULL, UNIQUE(organization_id,user_id));
CREATE TABLE projects (id text PRIMARY KEY, organization_id text NOT NULL REFERENCES organizations(id), name text NOT NULL, details_json text NOT NULL CHECK(details_json::jsonb IS NOT NULL), draft_version integer NOT NULL DEFAULT 1, created_at text NOT NULL, updated_at text NOT NULL, stage_version integer NOT NULL DEFAULT 1);
CREATE TABLE project_stages (id text PRIMARY KEY, project_id text NOT NULL REFERENCES projects(id), position integer NOT NULL CHECK(position >= 0), title text NOT NULL, description text NOT NULL, deliverables_json text NOT NULL CHECK(jsonb_typeof(deliverables_json::jsonb)='array'), status text NOT NULL CHECK(status IN ('planned','in_progress','waiting_on_client','complete')), updated_at text NOT NULL, completed_at text);
CREATE UNIQUE INDEX idx_stages_current ON project_stages(project_id) WHERE status IN ('in_progress','waiting_on_client');
CREATE INDEX idx_stages_project ON project_stages(project_id,position);
CREATE TABLE private_files (id text PRIMARY KEY, organization_id text NOT NULL REFERENCES organizations(id), project_id text NOT NULL REFERENCES projects(id), mime_type text NOT NULL, filename text NOT NULL, sha256 text NOT NULL, content bytea, created_at text NOT NULL, storage_path text UNIQUE, CHECK ((content IS NULL) <> (storage_path IS NULL)));
CREATE TABLE documents (id text PRIMARY KEY, organization_id text NOT NULL REFERENCES organizations(id), project_id text NOT NULL REFERENCES projects(id), kind text NOT NULL CHECK(kind IN ('proposal','agreement','invoice')), revision integer NOT NULL CHECK(revision>0), template_version text NOT NULL, source_json text NOT NULL CHECK(source_json::jsonb IS NOT NULL), file_id text NOT NULL REFERENCES private_files(id), status text NOT NULL CHECK(status IN ('draft','approved','signing','completed','superseded','voided')), created_at text NOT NULL, UNIQUE(project_id,kind,revision));
CREATE TABLE sign_requests (id text PRIMARY KEY, organization_id text NOT NULL REFERENCES organizations(id), project_id text NOT NULL REFERENCES projects(id), document_id text NOT NULL UNIQUE REFERENCES documents(id), provider text NOT NULL, provider_id text UNIQUE, status text NOT NULL, recipients_json text NOT NULL, fields_json text NOT NULL, completed_file_id text REFERENCES private_files(id), audit_file_id text REFERENCES private_files(id), created_at text NOT NULL, updated_at text NOT NULL);
CREATE TABLE invoices (id text PRIMARY KEY, organization_id text NOT NULL REFERENCES organizations(id), project_id text NOT NULL REFERENCES projects(id), document_id text NOT NULL UNIQUE REFERENCES documents(id), revision integer NOT NULL, amount_cents integer NOT NULL CHECK(amount_cents>0), currency text NOT NULL, status text NOT NULL CHECK(status IN ('open','processing','paid','failed','partially_refunded','refunded','voided')), stripe_session_id text UNIQUE, stripe_payment_intent_id text, created_at text NOT NULL, updated_at text NOT NULL, simulation_status text, stage_id text REFERENCES project_stages(id), checkout_attempt text);
CREATE UNIQUE INDEX idx_invoices_stage_active ON invoices(stage_id) WHERE stage_id IS NOT NULL AND status!='voided';
CREATE TABLE provider_events (id text PRIMARY KEY, provider text NOT NULL, event_id text NOT NULL, payload_json text NOT NULL, received_at text NOT NULL, processed_at text, last_error text, UNIQUE(provider,event_id));
CREATE TABLE audit_events (id text PRIMARY KEY, organization_id text, project_id text, actor_id text NOT NULL, action text NOT NULL, details_json text NOT NULL, created_at text NOT NULL);
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_memberships_user ON memberships(user_id);
CREATE INDEX idx_events_pending ON provider_events(provider,received_at) WHERE processed_at IS NULL;
-- Application access always goes through Next's server-side membership checks.
-- Do NOT expose this schema via Supabase's Data API. RLS denies browser roles too.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sign_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA pbi_portal FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA pbi_portal REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('portal-documents','portal-documents',false,52428800,ARRAY['application/pdf'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
CREATE POLICY portal_documents_server_only ON storage.objects AS RESTRICTIVE
FOR ALL TO anon, authenticated USING(bucket_id <> 'portal-documents') WITH CHECK(bucket_id <> 'portal-documents');
COMMIT;
