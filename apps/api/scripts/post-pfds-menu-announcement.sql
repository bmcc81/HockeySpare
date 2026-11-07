-- Pierrefonds Oldtimers Tournament 2026: post the food menu as an announcement
-- (bilingual, one line per day; approved by Chris on Nov 6).
-- Safe to run more than once: it replaces the previous menu announcement.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/api/scripts/post-pfds-menu-announcement.sql
BEGIN;

DELETE FROM "TournamentAnnouncement" WHERE id = 'ann_pfds2026_menu';

INSERT INTO "TournamentAnnouncement" (id, "tournamentId", body, type, "createdAt") VALUES (
  'ann_pfds2026_menu',
  'cmspgfwhd0006g3yqolfrjj9j',
  E'Food menu / Menu des repas (Île Bizard unless noted / sauf indication)\n' ||
  E'Mon / Lun: PFDS: Pizza · Île Bizard: Porky tacos (2) with fries / Tacos de porc (2) avec frites\n' ||
  E'Tue / Mar: Burger with fries / Hamburger avec frites\n' ||
  E'Wed / Mer: 2 toasted hot dogs with fries / 2 hot-dogs grillés avec frites\n' ||
  E'Thu / Jeu: Pulled pork sandwich, Mexican style, with fries / Sandwich au porc effiloché à la mexicaine avec frites\n' ||
  E'Fri / Ven: Chicken quesadilla with fries / Quesadilla au poulet avec frites\n' ||
  E'Sat / Sam: Barbacoa tacos (2) with fries / Tacos barbacoa (2) avec frites\n' ||
  E'Sun / Dim: Pizza and leftovers! with fries / Pizza et restes ! avec frites',
  'GENERAL',
  now()
);

SELECT id, type, left(body, 60) AS start, length(body) AS chars FROM "TournamentAnnouncement"
WHERE "tournamentId" = 'cmspgfwhd0006g3yqolfrjj9j';

COMMIT;
