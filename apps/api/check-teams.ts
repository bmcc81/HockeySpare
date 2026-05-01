import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './src/generated/prisma/client';

config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing. Check apps/api/.env');
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const teams = await prisma.team.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      leagueId: true,
      createdById: true,
      games: {
        select: {
          id: true,
          title: true,
          startsAt: true,
          opponent: true,
        },
        orderBy: {
          startsAt: 'asc',
        },
      },
    },
  });

  console.dir(teams, { depth: null });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });