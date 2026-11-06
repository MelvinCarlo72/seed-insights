-- SeedInsights migration: add optional branch label to existing feedback table.
-- Safe for existing rows: old records receive NULL.
ALTER TABLE public.feedback
ADD COLUMN IF NOT EXISTS branch text;

COMMENT ON COLUMN public.feedback.branch IS
'Optional branch label for parent/guardian service-experience feedback. Do not store personal or child-identifying information here.';
