// One-off import of the PFDS Oldtimers 2026 schedule (organizer's spreadsheet
// exported as CSV) into an existing tournament.
//
//   node scripts/import-pfds-oldtimers-schedule.cjs --tournament <id> --csv <file>          (dry run)
//   node scripts/import-pfds-oldtimers-schedule.cjs --tournament <id> --csv <file> --apply  (writes)
//
// Reads DATABASE_URL from the environment (or ../.env). Idempotent: teams,
// venues and games that already exist are left alone, so it is safe to rerun
// and it never touches scores or anything edited by hand afterwards.
const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { PrismaClient } = require('../dist/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : process.argv[i + 1];
}
const apply = process.argv.includes('--apply');
const tournamentId = arg('tournament');
const csvPath = arg('csv');
if (!tournamentId || !csvPath) {
  throw new Error('Usage: --tournament <id> --csv <file> [--apply]');
}

const TIME_ZONE = 'America/Toronto';
const YEAR = 2026;
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
// The game-number letter is the reliable division indicator: the spreadsheet's
// own division column has typos (e.g. B1/B10 labelled 35B).
const DIVISION_BY_LETTER = { A: '35B', B: '35C', C: '50C', D: '60B' };

const VENUES = [
  {
    name: 'CSSR - Centre Sportif Saint-Raphaël',
    address: "750 Boul. Jacques-Bizard, L'Île Bizard, QC H9C 2Y2",
  },
  {
    name: 'PFDS - Pierrefonds Sportplexe (rinks 1 & 2)',
    address: '14700 Boul. Pierrefonds, Pierrefonds, QC H9H 4Y6',
  },
];

function parseCsv(src) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Wall-clock time in TIME_ZONE -> the UTC instant, correct across DST changes.
function zonedToUtc(year, month, day, hour, minute) {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE, hourCycle: 'h23',
    year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric',
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const asIfUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(guess - (asIfUtc - guess));
}

const raw = new TextDecoder('windows-1252').decode(fs.readFileSync(csvPath));
const notes = [];
const entries = [];

for (const r of parseCsv(raw)) {
  const [day, date, time, arena, num, , home, visitor] = r.map((x) => (x ?? '').trim());
  if (!/^(MON|TUE|WED|THU|FRI|SAT|SUN)/.test(day)) continue;

  const [d, mon] = date.split('-');
  const [hh, mm] = time.split(':').map(Number);
  const startsAt = zonedToUtc(YEAR, MONTHS[mon], Number(d), hh, mm);

  if (!num && /faceoff|mise au jeu/i.test(home)) {
    entries.push({ gameNumber: null, division: null, stage: 'EVENT', home, away: '', arena, startsAt });
    continue;
  }
  if (!num) {
    notes.push(`Skipped "${home}" on ${date} ${time} (no game number) - confirm with the organizer.`);
    continue;
  }
  if (num === 'EXH') {
    entries.push({ gameNumber: 'EXH', division: null, stage: 'EXHIBITION', home, away: visitor, arena, startsAt });
    continue;
  }

  const division = DIVISION_BY_LETTER[num[0]];
  if (!division) throw new Error(`Unknown game number "${num}"`);

  if (/^FINALE$/i.test(home)) {
    entries.push({
      gameNumber: num, division, stage: 'PLAYOFF',
      home: `Finalist 1 (${division})`, away: `Finalist 2 (${division})`, arena, startsAt,
    });
    continue;
  }
  if (/^SEMI[- ]?FINAL/i.test(home)) {
    entries.push({
      gameNumber: num, division, stage: 'PLAYOFF',
      home: home.replace(/^SEMI[- ]?FINAL/i, 'SEMI-FINAL'),
      away: visitor.replace(/^SEMI[- ]?FINAL/i, 'SEMI-FINAL'),
      arena, startsAt,
    });
    continue;
  }
  entries.push({ gameNumber: num, division, stage: 'ROUND_ROBIN', home, away: visitor, arena, startsAt });
}

// Teams = every real round-robin team, per division.
const teamNames = new Map(); // division -> Set(name)
for (const e of entries) {
  if (e.stage !== 'ROUND_ROBIN') continue;
  if (!teamNames.has(e.division)) teamNames.set(e.division, new Set());
  teamNames.get(e.division).add(e.home);
  teamNames.get(e.division).add(e.away);
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { createdBy: { select: { email: true } } },
  });
  if (!tournament) throw new Error(`Tournament ${tournamentId} not found`);

  console.log(`Target: "${tournament.name}" (owner ${tournament.createdBy?.email})`);
  console.log(`DB host: ${new URL(process.env.DATABASE_URL).host}`);
  console.log(`Mode: ${apply ? 'APPLY (writes)' : 'DRY RUN (no writes)'}\n`);

  const existingTeams = await prisma.tournamentTeam.findMany({ where: { tournamentId } });
  const existingGames = await prisma.tournamentGame.findMany({ where: { tournamentId } });
  const existingVenues = await prisma.tournamentVenue.findMany({ where: { tournamentId } });

  const newTeams = [];
  for (const [division, names] of teamNames) {
    for (const name of names) {
      if (!existingTeams.some((t) => t.name === name && t.division === division)) newTeams.push({ name, division });
    }
  }
  const gameKey = (e) => e.gameNumber ?? `${e.stage}@${e.startsAt.toISOString()}`;
  const existingKeys = new Set(
    existingGames.map((g) => g.gameNumber ?? `${g.stage}@${g.startsAt.toISOString()}`),
  );
  const newGames = entries.filter((e) => !existingKeys.has(gameKey(e)));
  const newVenues = VENUES.filter((v) => !existingVenues.some((x) => x.name === v.name));

  console.log(`Dates: ${tournament.startDate?.toISOString().slice(0, 10)} - ${tournament.endDate?.toISOString().slice(0, 10)} -> 2026-11-16 - 2026-11-22`);
  console.log(`Venues to add: ${newVenues.length} | Teams to add: ${newTeams.length} | Games to add: ${newGames.length} (of ${entries.length} in the file)`);
  for (const [division, names] of teamNames) console.log(`  ${division}: ${[...names].join(', ')}`);
  console.log('Games by stage:', entries.reduce((a, e) => ((a[e.stage] = (a[e.stage] ?? 0) + 1), a), {}));
  console.log('First game:', entries[0].gameNumber, entries[0].startsAt.toISOString(), '| Last:', entries.at(-1).gameNumber ?? entries.at(-1).stage, entries.at(-1).startsAt.toISOString());
  notes.forEach((n) => console.log('NOTE:', n));

  if (!apply) {
    console.log('\nDry run only. Re-run with --apply to write.');
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { startDate: new Date('2026-11-16'), endDate: new Date('2026-11-22') },
    });
    for (const v of newVenues) await tx.tournamentVenue.create({ data: { tournamentId, ...v } });
    for (const t of newTeams) await tx.tournamentTeam.create({ data: { tournamentId, ...t } });

    const teams = await tx.tournamentTeam.findMany({ where: { tournamentId } });
    const idFor = (name, division) => teams.find((t) => t.name === name && t.division === division)?.id ?? null;

    for (const e of newGames) {
      await tx.tournamentGame.create({
        data: {
          tournamentId,
          homeTeamName: e.home,
          awayTeamName: e.away,
          homeTeamId: e.stage === 'ROUND_ROBIN' ? idFor(e.home, e.division) : null,
          awayTeamId: e.stage === 'ROUND_ROBIN' ? idFor(e.away, e.division) : null,
          gameNumber: e.gameNumber,
          division: e.division,
          stage: e.stage,
          startsAt: e.startsAt,
          arenaName: e.arena || null,
        },
      });
    }

    await tx.tournamentAuditLogEntry.create({
      data: {
        tournamentId,
        userId: null,
        action: 'SCHEDULE_IMPORTED',
        detail: `Imported ${newGames.length} games, ${newTeams.length} teams, ${newVenues.length} venues from the organizer's schedule`,
      },
    });
  });

  console.log(`\nDone: ${newGames.length} games, ${newTeams.length} teams, ${newVenues.length} venues written.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
