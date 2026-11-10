# SeedInsights: Staff-Only Child Profile System for Purple Seedlings

**Project status:** Updated prototype based on the company’s changed requirements. The exact approved profile fields, privacy process, and operational use still need company confirmation before real child information is entered.

## 1. Updated purpose

SeedInsights is a staff-only workspace for maintaining one profile per child. The company requested that the system organize basic child information, parent or guardian contacts, and service or developmental details. The former anonymous parent feedback and rating workflow has been retired.

## 2. Profile groups

1. **Basic child details:** first name, last name, date of birth, and branch.
2. **Parent or guardian contact:** name, relationship to child, phone, and email.
3. **Service or developmental information:** enrolled service, goals or focus areas, session history, and staff notes.

The center should confirm which exact fields are necessary and whether any clinical or highly sensitive information is permitted. Do not enter real records or use AI summaries on them until the center approves the purpose, notice/consent, access list, retention schedule, and handling process.

## 3. Core modules

- Staff sign-in with Supabase Auth.
- Approved-staff allowlist enforced in Supabase Row Level Security.
- Child profile creation and editing.
- Search and branch filtering.
- Staff-only profile overview.
- Optional in-browser summarization of session-history notes. The summary is a review draft, is not saved, and leaves the source notes unchanged.
- Public feedback form, star ratings, sentiment analysis, and QR feedback workflow removed.

## 4. Technical approach

- Front end: HTML, CSS, and JavaScript.
- Database and authentication: Supabase.
- Hosting: Vercel static deployment.
- Browser config contains the Supabase publishable key only. No secret or service-role key belongs in client code.
- Database access is limited to Auth users whose IDs are active in `public.staff_access`.
- AI: Transformers.js summarization pipeline using `Xenova/distilbart-cnn-6-6` in the browser. It is English-focused; staff must verify summaries against the original notes.

## 5. Safeguards and boundaries

- Child names, birth dates, guardian contact details, goals, session history, and staff notes are sensitive personal information.
- Use synthetic records in demonstrations and development.
- Do not include diagnoses, treatment plans, assessment results, or clinical notes unless the company explicitly approves the purpose and the system is authorized and designed for that use.
- Keep RLS enabled. The public QR page no longer collects or writes child information.
- The migration permanently deletes the legacy feedback rows and drops the `feedback` table. It does not remove other tables.
- This prototype has not been security-certified or approved for production child records.

## 6. Next steps

1. Confirm the exact profile fields and whether one or multiple guardians must be recorded.
2. Have the company’s privacy lead approve the collection purpose, notice/consent, access roles, retention/deletion rules, and operational handling.
3. Apply `SUPABASE_CHILD_PROFILES_MIGRATION.sql` in Supabase as an administrator after reviewing its permanent deletion of legacy feedback.
4. Add only approved staff accounts to `public.staff_access`.
5. Test with synthetic child profiles and verify that unapproved accounts cannot view or modify them.
6. Publish the updated app only after the company approves the workflow.
