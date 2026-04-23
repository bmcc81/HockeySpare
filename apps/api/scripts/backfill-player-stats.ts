import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const stats = await prisma.playerStat.findMany();

  for (const stat of stats) {
    if (!stat.userId) continue;

    const member = await prisma.teamMember.findFirst({
      where: {
        teamId: stat.teamId,
        userId: stat.userId,
      },
      select: { id: true },
    });

    if (!member) {
      console.log(`No TeamMember found for stat ${stat.id}`);
      continue;
    }

    await prisma.playerStat.update({
      where: { id: stat.id },
      data: { memberId: member.id },
    });

    console.log(`Updated stat ${stat.id} -> member ${member.id}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });