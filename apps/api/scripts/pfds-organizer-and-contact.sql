-- Pierrefonds Oldtimers Tournament 2026 (Chris, Nov 7):
--   1. Public contact email: pohltournament@outlook.com (the address Chris checks daily).
--      It shows on the tournament page (Info tab) and the printable program, and is the
--      Reply-To on volunteer confirmation emails.
--   2. Make Chris (hockeydete@hotmail.com, the account he created) a co-organizer so he
--      can see the Volunteer tab and the Manage page.
--
-- Safe to run more than once. Prints what it did at the end.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/api/scripts/pfds-organizer-and-contact.sql
BEGIN;

UPDATE "Tournament"
SET "contactEmail" = 'pohltournament@outlook.com'
WHERE id = 'cmspgfwhd0006g3yqolfrjj9j';

INSERT INTO "TournamentCoOrganizer" (id, "tournamentId", "userId")
SELECT 'co_pfds2026_chris', t.id, u.id
FROM "Tournament" t
JOIN "User" u ON lower(u.email) = 'hockeydete@hotmail.com'
WHERE t.id = 'cmspgfwhd0006g3yqolfrjj9j'
  AND t."createdById" <> u.id
ON CONFLICT DO NOTHING;

SELECT t."contactEmail",
       (SELECT count(*) FROM "User" WHERE lower(email) = 'hockeydete@hotmail.com') AS chris_has_account,
       (SELECT count(*) FROM "TournamentCoOrganizer" c
          JOIN "User" u ON u.id = c."userId"
         WHERE c."tournamentId" = t.id AND lower(u.email) = 'hockeydete@hotmail.com') AS chris_is_co_organizer
FROM "Tournament" t
WHERE t.id = 'cmspgfwhd0006g3yqolfrjj9j';

COMMIT;
