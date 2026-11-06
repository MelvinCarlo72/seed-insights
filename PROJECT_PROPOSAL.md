# SeedInsights: An AI-Powered Parent Feedback and Service Quality Analytics System for Purple Seedlings Development Center

**Project status:** Proposed adaptation / prototype; client requirements and operational problem still require validation.

## 1. Background and problem hypothesis
The project proposes a centralized way for parents and guardians to submit feedback about their experience with the center. The team hypothesizes that feedback may be received through multiple channels and may be difficult to organize into recurring themes. This is not yet a confirmed problem at Purple Seedlings. The team must interview an authorized representative to understand current feedback channels, existing tools, privacy requirements, and whether an analytics dashboard would be useful.

## 2. Proposed solution
SeedInsights is a responsive web application with a QR-based parent/guardian feedback form and a staff-only dashboard. It analyzes general service-experience comments to help authorized staff review sentiment patterns and recurring topics. It is not a clinical system and does not evaluate children, diagnoses, treatment outcomes, or individual therapist performance.

## 3. Core modules
1. **Parent/guardian feedback portal** — optional branch, 1–5 experience rating, topic selection, and free-text comment. No parent account is required in the prototype.
2. **Feedback management** — authenticated staff review, search, topic/sentiment filters, and CSV export.
3. **AI sentiment analysis** — Transformers.js in-browser English sentiment model; results are indicative and require human review.
4. **Topic classification** — transparent keyword-based grouping into staff/therapist experience, parent communication, scheduling, service experience, facility/environment, parent support, and other.
5. **AI insights dashboard** — sentiment distribution, average rating, recurring themes, potential concerns, and review prompts generated from aggregated feedback.
6. **QR feedback access** — downloadable QR code pointing to the deployed feedback page.
7. **Branch tagging (prototype field)** — optional free-text branch field, pending confirmation of approved branch names and reporting needs.

## 4. Intended users
- Authorized center management: review aggregated parent/guardian feedback and service-quality themes.
- Approved staff: access and manage feedback only within permissions granted by the center.
- Parents/guardians: submit voluntary feedback through the QR form.

## 5. AI and technical approach
- Front end: HTML, CSS, JavaScript.
- AI: Transformers.js sentiment-analysis pipeline running in the browser.
- Topic grouping: keyword/rule-based classification; not represented as a trained AI classifier.
- Database/authentication: Supabase with Row Level Security and staff authentication.
- Hosting: free static hosting where feasible; public feedback page must use HTTPS.

## 6. Scope boundaries and privacy
The prototype must not collect children's names, diagnoses, therapy notes, assessment results, treatment details, or child-progress data. Avoid parent names, phone numbers, email addresses, and other identifying information unless the center approves a separate lawful and secure workflow. Feedback is limited to general service experience. Before real deployment, the center must approve the purpose, privacy notice, lawful basis, data retention/deletion schedule, authorized users, branch taxonomy, and incident/contact process. Supabase RLS must remain enabled, with public users allowed to submit only and no public access to read feedback.

## 7. Validation and testing plan
1. Interview an authorized Purple Seedlings representative and validate the problem hypothesis.
2. Confirm which branches may participate and whether branch-level reporting is appropriate.
3. Review the proposed feedback questions and privacy notice with the center's privacy lead.
4. Test with 3–5 consenting users using synthetic or approved non-sensitive examples.
5. Compare sentiment/topic predictions with human labels, especially Filipino and Taglish comments.
6. Record usability feedback and make improvements.

## 8. Expected deliverables
A working prototype, source-code repository, deployment link if approved, client-validation notes, user-testing evidence, AI evaluation results, cost computation, and a short presentation/demo.

## 9. Questions for client discovery
- How does the center currently receive and review parent/guardian feedback?
- Which parts of the service experience are appropriate to ask about?
- Would anonymous or non-identifying feedback be useful?
- Should feedback be tagged by branch, and what are the approved branch names?
- Who may access individual comments and aggregated reports?
- What privacy notice, retention, and deletion requirements must the prototype follow?
- What would make this tool useful, and what existing process should it complement rather than duplicate?
