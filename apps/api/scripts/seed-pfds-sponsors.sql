-- Pierrefonds Oldtimers Tournament 2026: add the confirmed sponsors (names + logos).
-- Logos are static files shipped with the web app in /images/sponsors/ (see apps/web/public).
-- Safe to run more than once: each sponsor has a fixed id, so re-running replaces it.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/api/scripts/seed-pfds-sponsors.sql
--
-- Not included until the organizers confirm them: Coke, Sleeman, Yum Yum.
BEGIN;

DELETE FROM "TournamentSponsor"
WHERE "tournamentId" = 'cmspgfwhd0006g3yqolfrjj9j' AND id LIKE 'sp_pfds2026_%';

INSERT INTO "TournamentSponsor" (id, "tournamentId", name, "logoUrl", "linkUrl", tier, "createdAt") VALUES
  ('sp_pfds2026_01_molson',     'cmspgfwhd0006g3yqolfrjj9j', 'Molson Coors',                '/images/sponsors/molson-coors.png',          NULL, NULL, '2026-11-06 15:00:01'),
  ('sp_pfds2026_02_budweiser',  'cmspgfwhd0006g3yqolfrjj9j', 'Budweiser',                   '/images/sponsors/budweiser.png',             NULL, NULL, '2026-11-06 15:00:02'),
  ('sp_pfds2026_03_michelob',   'cmspgfwhd0006g3yqolfrjj9j', 'Michelob ULTRA',              '/images/sponsors/michelob-ultra.png',        NULL, NULL, '2026-11-06 15:00:03'),
  ('sp_pfds2026_04_fanelli',    'cmspgfwhd0006g3yqolfrjj9j', 'Birra Fanelli',               '/images/sponsors/birra-fanelli.png',         NULL, NULL, '2026-11-06 15:00:04'),
  ('sp_pfds2026_05_bellegueule','cmspgfwhd0006g3yqolfrjj9j', 'Belle Gueule',                '/images/sponsors/belle-gueule.png',          NULL, NULL, '2026-11-06 15:00:05'),
  ('sp_pfds2026_06_iga',        'cmspgfwhd0006g3yqolfrjj9j', 'IGA Famille Sévigny',         '/images/sponsors/iga-famille-sevigny.png',   NULL, NULL, '2026-11-06 15:00:06'),
  ('sp_pfds2026_07_duke',       'cmspgfwhd0006g3yqolfrjj9j', 'Duke & Devine''s Pub Irlandais, Vaudreuil', '/images/sponsors/duke-and-devines.png', NULL, NULL, '2026-11-06 15:00:07'),
  ('sp_pfds2026_08_dickiemoore','cmspgfwhd0006g3yqolfrjj9j', 'Location Dickie Moore',        '/images/sponsors/location-dickie-moore.png', NULL, NULL, '2026-11-06 15:00:08'),
  ('sp_pfds2026_09_bonheur',    'cmspgfwhd0006g3yqolfrjj9j', 'Matelas Bonheur',             '/images/sponsors/matelas-bonheur.png',       NULL, NULL, '2026-11-06 15:00:09'),
  ('sp_pfds2026_10_arterra',    'cmspgfwhd0006g3yqolfrjj9j', 'Vins Arterra Canada',         '/images/sponsors/vins-arterra.png',          NULL, NULL, '2026-11-06 15:00:10'),
  ('sp_pfds2026_11_station22',  'cmspgfwhd0006g3yqolfrjj9j', 'Station 22',                  NULL,                                         NULL, NULL, '2026-11-06 15:00:11'),
  ('sp_pfds2026_12_maisonverte','cmspgfwhd0006g3yqolfrjj9j', 'La Maison Verte',             '/images/sponsors/la-maison-verte.png',       'https://lamaisonverte.ca', NULL, '2026-11-11 20:00:00'),
  ('sp_pfds2026_13_tacochon',  'cmspgfwhd0006g3yqolfrjj9j', 'Tacochon',                    '/images/sponsors/tacochon.png',              NULL, NULL, '2026-11-12 15:30:00');

SELECT name, "logoUrl" FROM "TournamentSponsor"
WHERE "tournamentId" = 'cmspgfwhd0006g3yqolfrjj9j' ORDER BY "createdAt";

COMMIT;
