# Launch readiness: making HockeySpare ready for new users

Audience: **both** organizers (tournaments, leagues) and players/teams looking for spares.

Legend: [x] done · [ ] to do · (needs X) = blocked on a decision or input

## 1. Ready for strangers
- [x] Cloudflare Web Analytics is installed (already in `index.html`).
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
- [ ] "Follow this team" with optional email reminders before games.
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
