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
- [x] Per-tournament share preview (name + dates in the link card), written on the server for crawlers (`/api/share/tournaments/:id`).
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
- [x] Fix the one-click deploy (GitHub's checkout step no longer supports the 32-bit ARM Pi). Pi job now uses shell-only steps; the runner service re-applies its Node 20 fix on every start.

## 5. Search (SEO) follow-ups
Done (Nov 2026): Google Search Console verified (HTML tag) with `api/sitemap.xml` submitted; `robots.txt`; automatic sitemap (demo tournaments excluded); own title, description and canonical per public page; schema.org event data on tournament pages (passes Google's Rich Results Test); Umami event tracking.

To do:
- [ ] **Around Nov 14:** in Search Console check Sitemaps (status "Success") and Pages (which URLs are indexed, any "Excluded" reasons). Reminder is scheduled.
- [ ] **Get links to the tournament page** from the arenas, the tournament's Facebook page and the sponsors (Arterra etc.). Biggest lever for a new site. Link: `https://hockeyspare.webinkgraphics.com/tournaments/cmspgfwhd0006g3yqolfrjj9j`
- [ ] Tournament **logo** from Chris (needs Chris): used automatically as the event image in Google results and link previews.
- [ ] Optional: add an `organizer` to the event data (needs Chris's OK on the exact name to publish).
- [ ] After the tournament (late Nov): review Search Console Performance (queries, clicks) and the Umami events (calendar buttons, reminders, volunteer sign-ups) to see what people actually used.
- [ ] Speed: initial bundle is about 672 KB against a 500 KB budget; trim it (Core Web Vitals, phones in arenas).
- [ ] **After the tournament: longer browser-cache times** (PageSpeed "Use efficient cache lifetimes", about 700 KiB to 2 MB saved for return visitors). Hashed files (`main-*.js`, `chunk-*.js`, `styles-*.css`) are served with `Cache-Control: max-age=14400` (4 hours) although their names change on every build, so they can safely be cached for a year (`public, max-age=31536000, immutable`). Keep `index.html`, `manifest.webmanifest`, `ngsw.json` and the service worker file uncached or short, and keep unhashed images (`/images/...`) modest (about a day). The 4-hour value is probably Cloudflare's default Browser Cache TTL; check the origin's response headers first, then set a Cache Rule in Cloudflare (or the header on the Pi's web server) for the hashed files only. Not before the tournament: a wrong rule on `index.html` or the service worker could leave visitors on an old version.
- [ ] Separate English/French addresses with `hreflang` so French searches find the site (needs routing changes; today Google only sees the English version).
- [ ] Server-side or pre-rendering of the public pages (bigger job; helps crawlers and first paint).
- Not applicable: `performer` and `offers` event fields (Rich Results Test lists them as optional).

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
