# SeedInsights — Parent Experience Feedback Analytics Prototype

Student-project prototype adapted for Purple Seedlings Development Center. The proposed primary use is collecting parent/guardian feedback about the center experience and identifying recurring service-quality themes. This problem and workflow must be validated with authorized center staff before real deployment.

## Files
- `customer.html`: public QR parent/guardian feedback form (no account required).
- `index.html`: staff dashboard with authentication.
- `customer.js` and `app.js`: Supabase data access, browser-based Transformers.js sentiment analysis in the staff dashboard, and transparent keyword-based topic grouping.
- `supabase-config.js`: existing Supabase project URL and publishable key. Keep the secret/service-role key out of browser code.
- `SEEDINSIGHTS_BRANCH_MIGRATION.sql`: adds an optional branch field to existing feedback records.

## Run locally
From this folder, run `python -m http.server 8000`, then open `http://localhost:8000/` for staff and `http://localhost:8000/customer.html` for the public form.

## Database update
Run `SEEDINSIGHTS_BRANCH_MIGRATION.sql` in the existing Supabase SQL Editor before using the updated form/dashboard. It adds `branch` as an optional text field; it does not delete existing feedback. Existing feedback rows remain in the database and may still contain coffee-shop test data. Clear or archive test records only after making a backup and confirming with the project team.

## Important safeguards
- Do not collect child names, diagnoses, treatment/session details, contact details, or other identifying/sensitive information in this feedback tool.
- This is service-experience feedback, not a clinical record, assessment, or child-progress system.
- Before collecting real responses, obtain Purple Seedlings' approval, confirm the privacy notice, lawful basis, retention period, authorized staff, and incident/contact process with the center's privacy lead.
- Keep Supabase Row Level Security enabled. Restrict dashboard access to approved staff; do not enable public reads.
- The sentiment model is English-focused and may misclassify Filipino/Taglish, sarcasm, and mixed comments. Topic grouping is keyword matching, not a trained topic model. Human review is required.
- Branch values are free text for prototype flexibility; standardize approved branch names with the center before using branch comparisons.

## AI approach
Transformers.js runs sentiment analysis in the staff dashboard when authorized staff re-analyze feedback. The public form does not need to load the model to submit a response. Rule-based keyword matching assigns one of the parent-experience topics. The insights panel aggregates feedback and presents review prompts; it does not make clinical or personnel judgments.


## Purple Seedlings brand assets
The dashboard and public feedback form use the Purple Seedlings mascot at `assets/purple-seedlings-mascot.png` and a purple/lavender visual theme. Keep the `assets` folder when deploying to Vercel.
