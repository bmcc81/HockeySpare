import { PrismaService } from '../prisma/prisma.service';

/**
 * A user with AppRole.ADMIN bypasses ownership/membership checks everywhere
 * (tournaments, teams, leagues, bookings). Always re-checked against the
 * database rather than trusted from the JWT, so a role change takes effect
 * on the user's very next request instead of requiring a fresh login.
 */
export async function isAppAdmin(
  prisma: PrismaService,
  userId: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { appRole: true },
  });

  return user?.appRole === 'ADMIN';
}
