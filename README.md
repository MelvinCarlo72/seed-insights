# SeedInsights — Purple Seedlings Child Profiles

SeedInsights is a staff-only prototype for maintaining one profile per child. It includes basic child details, parent/guardian contact information, and service or developmental fields selected for the updated company requirements.

## Features

- Staff sign-in through Supabase Auth.
- Approved-staff access list enforced by Supabase Row Level Security.
- Child profile creation, editing, search, and branch filtering.
- Basic details: first and last name, date of birth, and branch.
- Parent/guardian contact: name, relationship, phone, and email.
- Service/development information: enrolled service, goals or focus areas, session history, and staff notes.
- On-demand Transformers.js summaries of session-history notes, generated in the browser as drafts for staff review.
- Purple Seedlings branded staff dashboard.
- Public feedback form, rating system, sentiment analysis, and QR feedback workflow removed.

## Run locally

Serve this folder over HTTP (for example, `python -m http.server 8000`) and open `http://localhost:8000/`.

## Database setup

Run `SUPABASE_CHILD_PROFILES_MIGRATION.sql` in the Supabase SQL Editor as a project administrator. It permanently deletes every row in the legacy `feedback` table and drops that table, then creates the staff allowlist and child profile table with RLS enabled. This is a destructive migration. It is intentionally limited to the old feedback table and does not delete other tables.

After approved staff Auth accounts exist, add them to `public.staff_access` using the example SQL at the end of the migration. Until an account is approved there, it can sign in but cannot read or change child profiles.

The migration must be run before the new app can load or save child profiles. The browser uses only the Supabase publishable key in `supabase-config.js`; never place a service-role or secret key in browser code.

## Privacy and deployment

- The public `customer.html` page now directs visitors to staff sign-in and does not accept child information.
- Child details, guardian contacts, goals, session history, and notes may be sensitive. Use synthetic records for class demos.
- The center must approve the purpose, exact fields, access list, consent process, privacy notice, retention/deletion schedule, AI processing, and incident process before real records are entered.
- Avoid diagnoses, treatment plans, assessments, or other clinical details unless the center has explicitly approved that collection and the system is designed and authorized for it.
- Keep RLS enabled and only activate explicitly approved staff accounts in `staff_access`.
- The app is a prototype and has not been security-certified or approved for production child records.

## AI feature

Staff can select **Draft AI summary** on a profile’s session history. Transformers.js runs the `Xenova/distilbart-cnn-6-6` summarization model in the browser. The model is downloaded from Hugging Face on first use and may be cached by the browser. The note text is not sent to a hosted inference API, and the generated summary is not saved; staff must check it against the original. The model is English-focused and can omit or distort details, especially in Filipino or Taglish notes. Do not use the summary as a clinical assessment or decision.

Model information: https://huggingface.co/Xenova/distilbart-cnn-6-6

## Brand assets

The dashboard uses the Purple Seedlings mascot at `assets/purple-seedlings-mascot.png` and the existing purple/lavender theme. Keep the `assets` folder when deploying.
