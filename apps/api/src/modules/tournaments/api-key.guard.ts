import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hashApiKey } from './api-key.util';

/**
 * Gates the versioned public API (/api/v1/tournaments/*) with a per-
 * tournament API key, distinct from the unauthenticated internal read
 * endpoints the frontend uses - this is the stable, documented surface
 * for third-party/AI integrations.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tournamentId: string | undefined = req.params?.id;
    const header: string | undefined = req.headers?.['authorization'];

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing API key. Send it as "Authorization: Bearer <key>".',
      );
    }

    const plaintext = header.slice('Bearer '.length).trim();
    const keyHash = hashApiKey(plaintext);

    const apiKey = await this.prisma.tournamentApiKey.findUnique({
      where: { keyHash },
    });

    if (
      !apiKey ||
      apiKey.tournamentId !== tournamentId ||
      apiKey.revokedAt
    ) {
      throw new UnauthorizedException('Invalid or revoked API key.');
    }

    this.prisma.tournamentApiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return true;
  }
}
