-- Run once if the dashboard cannot save sentiment/topic re-analysis results.
-- Keep RLS enabled and only create authenticated accounts for approved staff.
GRANT INSERT, UPDATE ON public.feedback TO authenticated;

DROP POLICY IF EXISTS "Staff can add feedback" ON public.feedback;
CREATE POLICY "Staff can add feedback"
ON public.feedback FOR INSERT TO authenticated
WITH CHECK (char_length(trim(text)) > 0);

DROP POLICY IF EXISTS "Staff can update feedback" ON public.feedback;
CREATE POLICY "Staff can update feedback"
ON public.feedback FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);
