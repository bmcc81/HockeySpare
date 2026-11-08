# Launch readiness: making HockeySpare ready for new users

Audience: **both** organizers (tournaments, leagues) and players/teams looking for spares.

Legend: [x] done · [ ] to do · (needs X) = blocked on a decision or input

## 1. Ready for strangers
- [x] Cloudflare Web Analytics is installed (already in `index.html`).
- [x] Umami event tracking is wired in (calendar buttons, reminder sign-up, volunteer sign-up, team registration). Website id is set in `apps/web/src/environments/environment.ts` (Umami Cloud).
- [x] Site-wide share preview: title, description and image for links pasted in chats/social.
- [x] Terms of Service page (`/terms`) linked from the footer.
- [x] Call-to-action on every public tournament page for visitors: post a spare request, find a game, run your own tournament/league.
- [x] QR code on the printable program and on the arena TV scoreboard that opens the tournament page on a phone.
- [ ] Per-tournament share preview (name + dates in the link card). Link crawlers don't run JavaScript, so this needs a small server-side route for crawlers (nginx → API).
- [ ] Terms/privacy: add a contact email (needs the address to publish) and have both reviewed by a lawyer.
- [ ] Home page: replace the sample spare requests with real screenshots from the Pierrefonds tournament.
- [x] Test a brand-new account end to end on a phone (sign up → create team → post a spare request). Found and fixed:
  - **"Create player offer" and "Create team request" crashed for everyone** (two copies of Angular installed; fixed by pinning one version).
  - After registering, people landed on the login page and had to sign in again; now they are signed in straight away.
  - Sign-in dropped the page you were trying to reach; it now returns you to it.
  - Home page gave spare-seekers only a small text link; added "Need a spare?" / "Offer to play" buttons.
- [ ] Welcome email after sign-up (what to do first).

## 2. Retention: tournament visitors become regular users
- [x] "Short a player next week?" call-to-action on tournament pages (see above).
- [x] Add a team's tournament schedule to Google Calendar / Apple / Outlook (live feed, per-team and per-game links).
- [x] "Follow this team": email reminders ~3 hours before each of a team's games (confirmed by a link, unsubscribe in every email, EN/FR). **Needs the mail server settings below on the Pi before it can send.**
- [ ] After the final: thank-you email to everyone who signed up (results, link, "set up your regular team").
- [ ] One-tap "Use this roster for my team" from a tournament team.
- [ ] "Available to spare" toggle on a player profile, especially goalies.
- [ ] Text (SMS) reminders (needs Twilio sender approval).

## 3. Revenue (decide after the tournament, with organizer feedback)
- [ ] Option A: small platform fee on online registration/team-fee payments (Stripe Connect `application_fee`).
- [ ] Option B: paid tier for organizers (brackets, TV scoreboard, printable program, auctions, volunteer sheets) with a free tier.
- [ ] Option C: sponsor placements.
- [ ] Ask Chris and the committee whether they would pay, and how much.

## 4. Organizer tools still worth building
- [ ] Volunteer day-by-arena grid and printable sheet.
- [ ] Scorekeeper-only role (scores only, not full co-organizer access).
- [ ] Fix the one-click deploy (GitHub's checkout step no longer supports the 32-bit ARM Pi).

## Setup needed on the Pi: outgoing email
Production has no `MAIL_*` settings, so no email (booking notices, reminders, confirmations) can be delivered; the app logs "Email NOT delivered" instead. Add to `/opt/hockeyspare/apps/api/.env`, then `sudo systemctl restart hockeyspare-api`:

```
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_SECURE=false          # true only for port 465
MAIL_USER=...
MAIL_PASS=...
MAIL_FROM="HockeySpare <reminders@your-domain>"
```

Use a transactional email service (Brevo, Mailgun, Resend, SendGrid, Amazon SES) or your domain's SMTP, and set up SPF/DKIM for the sending domain so messages don't land in spam. Optional: `PUBLIC_BASE_URL` (defaults to the production site URL), `TOURNAMENT_TIME_ZONE` (defaults to America/Toronto), `REMINDERS_DISABLED=true` to switch the reminder job off.
