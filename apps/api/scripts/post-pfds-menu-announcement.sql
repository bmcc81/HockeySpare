-- Pierrefonds Oldtimers Tournament 2026: post the food menu as an announcement
-- (approved by Chris on Nov 6).
--
-- Every line is written "English | Français", and the tournament page shows each
-- visitor only their own language. The first line is the heading; each day is a
-- "Day: text" row. Safe to run more than once: it replaces the previous menu.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/api/scripts/post-pfds-menu-announcement.sql
BEGIN;

DELETE FROM "TournamentAnnouncement" WHERE id = 'ann_pfds2026_menu';

INSERT INTO "TournamentAnnouncement" (id, "tournamentId", body, type, "createdAt") VALUES (
  'ann_pfds2026_menu',
  'cmspgfwhd0006g3yqolfrjj9j',
  E'Food menu (Île Bizard unless noted) | Menu des repas (Île Bizard sauf indication)\n' ||
  E'Mon: PFDS: Pizza · Île Bizard: Porky tacos (2) with fries | Lun : PFDS : Pizza · Île Bizard : Tacos de porc (2) avec frites\n' ||
  E'Tue: Burger with fries | Mar : Hamburger avec frites\n' ||
  E'Wed: 2 toasted hot dogs with fries | Mer : 2 hot-dogs grillés avec frites\n' ||
  E'Thu: Pulled pork sandwich, Mexican style, with fries | Jeu : Sandwich au porc effiloché à la mexicaine avec frites\n' ||
  E'Fri: Chicken quesadilla with fries | Ven : Quesadilla au poulet avec frites\n' ||
  E'Sat: Barbacoa tacos (2) with fries | Sam : Tacos barbacoa (2) avec frites\n' ||
  E'Sun: Pizza and leftovers! with fries | Dim : Pizza et restes ! avec frites',
  'GENERAL',
  now()
);

SELECT id, type, length(body) AS chars FROM "TournamentAnnouncement"
WHERE "tournamentId" = 'cmspgfwhd0006g3yqolfrjj9j';

COMMIT;
