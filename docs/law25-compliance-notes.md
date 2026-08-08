# Quebec Law 25 — Compliance Notes

**This is not legal advice.** It's a working punch list mapping Quebec's
*Act respecting the protection of personal information in the private
sector* (as amended by Law 25 / Bill 64) to HockeySpare's current state, so
whoever reviews this with a lawyer has a concrete starting point instead of
a blank page. Treat every "Done" below as "implemented, not legally
verified" until a lawyer signs off.

A draft public-facing privacy policy lives at `/privacy` in the web app
(`apps/web/src/app/legal/privacy-policy/`) and carries its own
pending-review banner.

## Status by requirement

| Requirement | Status | Notes |
| --- | --- | --- |
| Published privacy policy in clear language | 🟡 Drafted | `/privacy` route exists; needs lawyer review before treating it as final. |
| Designated privacy officer | 🔴 Not decided | By default this is whoever holds the highest authority in the organization, unless delegated in writing. Needs a name + contact email published in the policy. |
| Consent for collection/use of personal information | 🟡 Partial | Registration/account creation implies consent to core Service functionality; no explicit granular consent flow (e.g. separate opt-in for AI features) exists today. Worth deciding if one is needed. |
| Right of access & rectification | 🔴 Not built | No self-service "download my data" or "correct my data" flow exists. Today this would be a manual request handled by whoever owns the privacy-officer role. |
| Right to request de-indexing / cessation of dissemination | 🔴 Not built | No process defined. |
| Data minimization | 🟢 Reasonable | Registration/roster forms only collect fields the feature actually uses; no speculative data collection observed in the schema. |
| Cross-border transfer disclosure + privacy impact assessment | 🔴 Not done | Stripe and OpenAI process data outside Quebec/Canada. Law 25 requires a documented PIA for this before transferring, and disclosure in the privacy policy (currently just flagged, not completed). |
| Breach notification process | 🔴 Not built | No incident register, no defined internal escalation path, no CAI-notification procedure. |
| Privacy Impact Assessments for new projects handling personal information | 🔴 Not a process yet | Law 25 expects a PIA before launching a project involving personal information (e.g. before *this* AI scoresheet OCR feature went live, technically). Worth adopting as a standing practice for future features that touch personal information — especially anything AI-related. |
| Automated decision-making disclosure | 🟢 Likely N/A | Nothing in the app makes a decision *about* a person in a way that produces legal/similarly significant effects (AI features assist drafting/extraction, always human-reviewed before anything is saved). Revisit if that changes. |
| Confidentiality by default on new products/features | 🟢 Mostly followed | Owner-only data (registration contact info, payments, audit log) is gated server-side; public tournament pages are deliberately public ("anyone with the link") by design, not by accident. |

## Data flows worth specifically documenting in a PIA

- **Stripe** (team fees, tournament registration fees) — payment data, US-based processing.
- **OpenAI** (spare-message drafting, help assistant, scoresheet OCR) — user-submitted text and photographs of scoresheets (which may contain player names), US-based processing.
- **Brevo** (email + SMS) — contact email/phone for transactional messages, EU-based processing.
- **Self-hosted MinIO** — file uploads (logos, rulebooks, media, scoresheet photos); infrastructure location depends on where it's hosted.

## Suggested next steps

1. Decide who the privacy officer is and publish their contact info.
2. Get a lawyer to review and finalize `/privacy`.
3. Complete a PIA for the Stripe/OpenAI/Brevo cross-border transfers.
4. Define a breach-notification runbook (who does what, in what order, within what timeframe).
5. Decide whether a self-service data-access/export/deletion flow is worth building, or whether a manual process is acceptable at current scale.
