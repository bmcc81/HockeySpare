// Local-only, repeatable demo data. Rerunning refreshes demo game dates.
const path = require('node:path');
const { randomBytes } = require('node:crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { PrismaClient } = require('../dist/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const host = new URL(connectionString).hostname;
const isLocalDb = ['localhost', '127.0.0.1', '[::1]'].includes(host);
if (!isLocalDb && process.env.ALLOW_NON_LOCAL_SEED !== '1') {
  throw new Error(
    'This demo seed only runs against a local database by default. ' +
      'This inserts fictional players/games with AI-generated portraits -- ' +
      'set ALLOW_NON_LOCAL_SEED=1 to deliberately run it elsewhere (e.g. production).',
  );
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const tournamentId = 'demo-highlights-cup';
const players = [
  { id: 'demo-highlights-alex', displayName: 'Alex Morgan', jerseyNumber: 19, teamId: 'demo-highlights-north', photoUrl: '/images/players/alex-morgan.jpg' },
  { id: 'demo-highlights-marcus', displayName: 'Marcus Reed', jerseyNumber: 27, teamId: 'demo-highlights-rivals', photoUrl: '/images/players/marcus-reed.jpg' },
  { id: 'demo-highlights-leo', displayName: 'Leo Chen', jerseyNumber: 8, teamId: 'demo-highlights-north', photoUrl: '/images/players/leo-chen.jpg' },
];
const games = [
  { daysAgo: 1, homeScore: 5, awayScore: 3, stats: [[3, 2], [3, 0], [2, 2]] },
  { daysAgo: 3, homeScore: 4, awayScore: 4, stats: [[3, 1], [4, 0], [1, 3]] },
  { daysAgo: 5, homeScore: 4, awayScore: 2, stats: [[2, 2], [2, 0], [2, 1]] },
  { daysAgo: 12, homeScore: 2, awayScore: 5, stats: [[1, 1], [5, 0], [1, 1]] },
];

async function main() {
  const now = new Date();
  const passwordHash = await bcrypt.hash(randomBytes(48).toString('hex'), 10);
  await prisma.$transaction(async tx => {
    await tx.user.upsert({
      where: { id: 'demo-highlights-organizer' }, update: {},
      create: { id: 'demo-highlights-organizer', email: 'highlights-demo@example.invalid',
        firstName: 'Demo', lastName: 'Organizer', passwordHash },
    });
    const event = {
      name: 'HockeySpare Showcase · Demo',
      description: 'Fictional sample players, AI-generated portraits, and sample games for previewing player highlights.',
      createdById: 'demo-highlights-organizer',
      startDate: new Date(now.getTime() - 13 * 86400000), endDate: now,
    };
    await tx.tournament.upsert({ where: { id: tournamentId }, create: { id: tournamentId, ...event }, update: event });
    for (const [id, name] of [['demo-highlights-north', 'North Stars (Demo)'], ['demo-highlights-rivals', 'Icebreakers (Demo)']]) {
      await tx.tournamentTeam.upsert({ where: { id }, create: { id, tournamentId, name }, update: { name } });
    }
    for (const player of players) {
      await tx.tournamentTeamPlayer.upsert({ where: { id: player.id }, create: { ...player, position: 'FORWARD' }, update: player });
    }
    for (const [i, game] of games.entries()) {
      const id = `demo-highlights-game-${i + 1}`;
      const values = { tournamentId, homeTeamName: 'North Stars (Demo)', awayTeamName: 'Icebreakers (Demo)',
        homeTeamId: 'demo-highlights-north', awayTeamId: 'demo-highlights-rivals',
        startsAt: new Date(now.getTime() - game.daysAgo * 86400000),
        arenaName: 'Showcase Arena (Demo)', notes: 'Fictional sample game', status: 'FINAL',
        homeScore: game.homeScore, awayScore: game.awayScore };
      await tx.tournamentGame.upsert({ where: { id }, create: { id, ...values }, update: values });
      for (const [j, player] of players.entries()) {
        const [goals, assists] = game.stats[j];
        const values = { goals, assists, penaltyMins: i === j ? 2 : 0 };
        await tx.tournamentGamePlayerStat.upsert({
          where: { gameId_teamPlayerId: { gameId: id, teamPlayerId: player.id } },
          create: { gameId: id, teamPlayerId: player.id, ...values }, update: values,
        });
      }
    }
  });
  console.log('Created/updated 1 demo tournament, 2 teams, 3 players, 4 final games, and 12 stat lines.');
  console.log('View /tournaments/' + tournamentId + ' or the home screen.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
