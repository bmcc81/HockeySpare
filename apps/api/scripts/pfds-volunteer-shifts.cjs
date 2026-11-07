#!/usr/bin/env node
/**
 * Generates seed-pfds-volunteer-shifts.sql: the volunteer shifts for the
 * Pierrefonds Oldtimers Tournament 2026, from the organizer's list (Nov 6).
 *
 *   node scripts/pfds-volunteer-shifts.cjs > scripts/seed-pfds-volunteer-shifts.sql
 *
 * To change a time, a name or a head count, edit the list below, regenerate and
 * run the SQL again: shifts have fixed ids, so a re-run updates them in place
 * and keeps any names already on them.
 *
 * Roles and notes are bilingual ("English / Français") because the volunteer
 * page shows them as typed. "close" has no fixed time, so each day gets an
 * approximate one (CLOSE below) and the shift's note says it is approximate.
 */

const TOURNAMENT_ID = 'cmspgfwhd0006g3yqolfrjj9j';
// Nov 16-22 2026 is after the clocks went back (Nov 1), so Montreal is UTC-5.
const UTC_OFFSET_HOURS = 5;

// Arenas as they appear on the schedule.
const PFDS = 'PFDS';
const PFDS1 = 'PFDS 1';
const PFDS2 = 'PFDS 2';
const IB = 'CSSR (Île Bizard)';

// Approximate closing time per day (24-hour, Montreal time).
const CLOSE = {
  16: '23:30',
  17: '23:30',
  18: '23:30',
  19: '23:30',
  20: '23:30',
  21: '23:30',
  22: '15:30',
};

const UNTIL_CLOSE = 'Until close (end time is approximate) / Jusqu’à la fermeture (heure de fin approximative)';

// --- Roles -----------------------------------------------------------------
const SUPERVISOR = 'Supervisor / Superviseur';
const TIMEKEEPER = 'Timekeeper / Chronométreur';
const REFEREES = 'Referees / Arbitres';
const HOST = 'Host / Accueil';
const BAR_HOST = 'Bar host / Hôte au bar';
const KITCHEN = 'Kitchen helper / Aide-cuisine';
const RAFFLE = 'Raffle & beer tickets / Billets de tirage et de bière';
const BEER = 'Beer tickets / Billets de bière';
const LOUNGE = 'Lounge helper & cleaner / Aide au salon et entretien';
const LOUNGE_DRIVER = 'Lounge helper, cleaner & IGA pizza driver / Aide au salon, entretien et livreur de pizza IGA';

// --- Notes -----------------------------------------------------------------
const ALL_GAMES = 'For all games / Pour tous les matchs';
const THREE_GAMES = 'For 3 games / Pour 3 matchs';
const TWO_GAMES = 'For 2 games / Pour 2 matchs';
const WELCOME =
  'Welcome teams, guide them to their rooms, neck guards, roster sheets / Accueillir les équipes, les guider vers les vestiaires, protège-cous, feuilles d’alignement';
const WELCOME_PFDS =
  `${WELCOME}; tell people no tickets are sold at PFDS / ne pas oublier de dire qu’aucun billet n’est vendu au PFDS`;
const BAR_NOTE = 'Coordinate food and beer with the kitchen and bar / Coordonner la nourriture et la bière avec la cuisine et le bar';
const RAFFLE_9PM = 'Raffle is at 9 PM! / Le tirage a lieu à 21 h !';

// --- The list ---------------------------------------------------------------
// [day, arena, role, people, from, to, note]  ("close" = that day's CLOSE time)
const shifts = [];
const add = (day, arena, role, people, from, to, note) => shifts.push({ day, arena, role, people, from, to, note });

// Mon Nov 16 - PFDS
add(16, PFDS, SUPERVISOR, 1, '19:30', '23:00', ALL_GAMES);
add(16, PFDS2, TIMEKEEPER, 1, '20:15', '22:15');
add(16, PFDS2, REFEREES, 2, '20:15', '22:15');
add(16, PFDS1, TIMEKEEPER, 1, '20:30', '22:30');
add(16, PFDS1, REFEREES, 2, '20:30', '22:30');
add(16, PFDS, HOST, 1, '19:30', '21:30', WELCOME_PFDS);
add(16, PFDS, BAR_HOST, 1, '20:45', '23:15', BAR_NOTE);
// Mon Nov 16 - Île Bizard
add(16, IB, TIMEKEEPER, 1, '18:00', '20:00');
add(16, IB, REFEREES, 2, '18:00', '20:00');
add(16, IB, TIMEKEEPER, 1, '20:00', '22:00');
add(16, IB, REFEREES, 2, '20:00', '22:00');
add(16, IB, HOST, 1, '17:30', '21:00', WELCOME);
add(16, IB, SUPERVISOR, 1, '17:30', '22:30', ALL_GAMES);
add(16, IB, KITCHEN, 1, '18:30', '22:30');
add(16, IB, RAFFLE, 1, '18:30', 'close', UNTIL_CLOSE);
add(16, IB, LOUNGE, 1, '18:30', 'close', UNTIL_CLOSE);

// Tue Nov 17 and Wed Nov 18 - Île Bizard (same every night)
for (const day of [17, 18]) {
  add(day, IB, TIMEKEEPER, 1, '18:00', '20:00');
  add(day, IB, REFEREES, 2, '18:00', '20:00');
  add(day, IB, TIMEKEEPER, 1, '20:00', '22:00');
  add(day, IB, REFEREES, 2, '20:00', '22:00');
  add(day, IB, HOST, 1, '17:15', '21:15', WELCOME);
  add(day, IB, SUPERVISOR, 1, '17:30', '22:30', ALL_GAMES);
  add(day, IB, KITCHEN, 1, '18:30', '22:30');
  add(day, IB, RAFFLE, 1, '18:30', 'close', UNTIL_CLOSE);
  add(day, IB, LOUNGE, 1, '18:30', 'close', UNTIL_CLOSE);
}

// Thu Nov 19 and Fri Nov 20 - Île Bizard (same every night)
for (const day of [19, 20]) {
  add(day, IB, TIMEKEEPER, 1, '18:00', '20:00');
  add(day, IB, REFEREES, 2, '18:00', '20:00');
  add(day, IB, TIMEKEEPER, 1, '20:00', '23:00');
  add(day, IB, REFEREES, 2, '20:00', '23:00');
  add(day, IB, HOST, 1, '17:15', '21:15', WELCOME);
  add(day, IB, SUPERVISOR, 1, '17:30', '20:30', THREE_GAMES);
  add(day, IB, SUPERVISOR, 1, '20:30', 'close', `${TWO_GAMES}. ${UNTIL_CLOSE}`);
  add(day, IB, KITCHEN, 1, '18:30', '20:30');
  add(day, IB, KITCHEN, 1, '20:30', '23:30');
  add(day, IB, RAFFLE, 1, '18:30', '20:30');
  add(day, IB, LOUNGE, 1, '18:30', '21:00');
  add(day, IB, LOUNGE, 1, '21:00', 'close', UNTIL_CLOSE);
}

// Sat Nov 21 - Île Bizard
add(21, IB, TIMEKEEPER, 1, '11:00', '14:00');
add(21, IB, REFEREES, 2, '11:00', '14:00');
add(21, IB, TIMEKEEPER, 1, '14:00', '16:30');
add(21, IB, REFEREES, 2, '14:00', '16:30');
add(21, IB, TIMEKEEPER, 1, '16:30', '19:00');
add(21, IB, REFEREES, 2, '16:30', '19:00');
add(21, IB, TIMEKEEPER, 1, '19:00', '22:00');
add(21, IB, REFEREES, 2, '19:00', '22:00');
add(21, IB, HOST, 1, '10:15', '14:15', WELCOME);
add(21, IB, HOST, 1, '14:15', '18:15', WELCOME);
add(21, IB, HOST, 1, '18:15', '22:00', WELCOME);
add(21, IB, SUPERVISOR, 1, '10:30', '14:30');
add(21, IB, SUPERVISOR, 1, '14:30', '18:30');
add(21, IB, SUPERVISOR, 1, '18:30', '22:30');
add(21, IB, SUPERVISOR, 1, '20:30', 'close', UNTIL_CLOSE);
add(21, IB, KITCHEN, 1, '11:00', '14:00');
add(21, IB, KITCHEN, 1, '14:00', '17:00');
add(21, IB, KITCHEN, 1, '17:00', '20:00');
add(21, IB, KITCHEN, 1, '20:00', '23:00');
add(21, IB, RAFFLE, 1, '11:30', '14:30');
add(21, IB, RAFFLE, 1, '14:30', '17:30');
add(21, IB, RAFFLE, 1, '17:30', '20:30');
add(21, IB, RAFFLE, 1, '20:30', 'close', `${RAFFLE_9PM} ${UNTIL_CLOSE}`);
add(21, IB, LOUNGE, 1, '11:30', '15:30');
add(21, IB, LOUNGE, 1, '15:30', '19:30');
add(21, IB, LOUNGE, 1, '19:30', 'close', UNTIL_CLOSE);

// Sun Nov 22 - Île Bizard
add(22, IB, TIMEKEEPER, 1, '10:00', '13:00');
add(22, IB, REFEREES, 2, '10:00', '13:00');
add(22, IB, TIMEKEEPER, 1, '13:00', '15:00');
add(22, IB, REFEREES, 2, '13:00', '15:00');
add(22, IB, HOST, 1, '09:15', '14:15', WELCOME);
add(22, IB, SUPERVISOR, 1, '09:30', '12:30', TWO_GAMES);
add(22, IB, SUPERVISOR, 1, '11:30', 'close', `${THREE_GAMES}. ${UNTIL_CLOSE}`);
add(22, IB, KITCHEN, 1, '10:30', '13:00');
add(22, IB, KITCHEN, 1, '13:00', '15:30');
add(22, IB, BEER, 1, '11:00', 'close', UNTIL_CLOSE);
add(22, IB, LOUNGE_DRIVER, 1, '10:45', '15:15');
add(22, IB, LOUNGE, 1, '13:00', 'close', UNTIL_CLOSE);

// --- SQL -------------------------------------------------------------------
const sql = (s) => `'${String(s).replace(/'/g, "''")}'`;

function utc(day, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(Date.UTC(2026, 10, day, h + UTC_OFFSET_HOURS, m));
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

const rows = shifts.map((s, i) => {
  const to = s.to === 'close' ? CLOSE[s.day] : s.to;
  if (to <= s.from) throw new Error(`Shift ${i + 1} ends before it starts: day ${s.day} ${s.from}-${to}`);
  const id = `vs_pfds2026_${String(i + 1).padStart(3, '0')}`;
  const local = `Nov ${s.day} ${s.from}-${to}`;
  const values = `(${sql(id)}, ${sql(TOURNAMENT_ID)}, ${sql(s.role)}, ${s.note ? sql(s.note) : 'NULL'}, ${sql(utc(s.day, s.from))}, ${sql(utc(s.day, to))}, ${sql(s.arena)}, ${s.people})`;
  // The comma must come before the comment, or it would become part of the comment.
  const comma = i < shifts.length - 1 ? ',' : '';
  return `  ${values}${comma} -- ${local} ${s.arena}`;
});

const totalPeople = shifts.reduce((n, s) => n + s.people, 0);

console.log(`-- Pierrefonds Oldtimers Tournament 2026: volunteer shifts (${shifts.length} shifts, ${totalPeople} people).
-- GENERATED by scripts/pfds-volunteer-shifts.cjs, so edit that file and regenerate.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apps/api/scripts/seed-pfds-volunteer-shifts.sql
--
-- Times are stored in UTC (Montreal is UTC-5 that week); the comment after each
-- row shows the Montreal time it stands for.
--
-- The first time it runs it also hides the Volunteer tab from the public, so
-- the organizers can preview and test before members see it. Re-running it
-- never hides the page again, and updates shifts in place (names stay).
BEGIN;

UPDATE "Tournament" SET "volunteersOpen" = false
WHERE id = ${sql(TOURNAMENT_ID)}
  AND NOT EXISTS (SELECT 1 FROM "TournamentVolunteerShift" WHERE "tournamentId" = ${sql(TOURNAMENT_ID)});

INSERT INTO "TournamentVolunteerShift" (id, "tournamentId", role, description, "startsAt", "endsAt", location, capacity) VALUES
${rows.join('\n')}
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  description = EXCLUDED.description,
  "startsAt" = EXCLUDED."startsAt",
  "endsAt" = EXCLUDED."endsAt",
  location = EXCLUDED.location,
  capacity = EXCLUDED.capacity;

-- What is there now, by day and arena.
SELECT to_char("startsAt" - interval '5 hours', 'Dy Mon DD') AS day, location, count(*) AS shifts, sum(capacity) AS people
FROM "TournamentVolunteerShift"
WHERE "tournamentId" = ${sql(TOURNAMENT_ID)}
GROUP BY 1, 2, date_trunc('day', "startsAt" - interval '5 hours')
ORDER BY date_trunc('day', "startsAt" - interval '5 hours'), location;

SELECT "volunteersOpen" AS sign_up_open_to_public FROM "Tournament" WHERE id = ${sql(TOURNAMENT_ID)};

COMMIT;`);
