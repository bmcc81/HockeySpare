import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Position, SkillLevel } from '@hockeyspare/contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlayerOfferDto } from './dto/create-player-offer.dto';
import { PlayerOffer } from './player-offers.types';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Position as PrismaPosition,
  SkillLevel as PrismaSkillLevel,
  NotificationType,
  OfferStatus,
  RequestStatus,
} from '../../generated/prisma/client';

function toPrismaPosition(v: Position): PrismaPosition {
  const pv = v as unknown as PrismaPosition;
  if (
    !(Object.values(PrismaPosition) as unknown as string[]).includes(
      pv as unknown as string,
    )
  ) {
    throw new BadRequestException(`Invalid position: ${v}`);
  }
  return pv;
}

function toPrismaSkillLevel(v: SkillLevel): PrismaSkillLevel {
  const sv = v as unknown as PrismaSkillLevel;
  if (
    !(Object.values(PrismaSkillLevel) as unknown as string[]).includes(
      sv as unknown as string,
    )
  ) {
    throw new BadRequestException(`Invalid skillLevel: ${v}`);
  }
  return sv;
}

@Injectable()
export class PlayerOffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(): Promise<PlayerOffer[]> {
    const rows = await this.prisma.playerOffer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((r) => ({
      ...r,
      position: r.position as unknown as Position,
      skillLevel: r.skillLevel as unknown as SkillLevel,
    })) as unknown as PlayerOffer[];
  }

  async findOne(id: number): Promise<PlayerOffer> {
    const row = await this.prisma.playerOffer.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`PlayerOffer ${id} not found`);

    return {
      ...row,
      position: row.position as unknown as Position,
      skillLevel: row.skillLevel as unknown as SkillLevel,
    } as unknown as PlayerOffer;
  }

  async create(
    userId: string,
    dto: CreatePlayerOfferDto,
  ): Promise<PlayerOffer> {
    const created = await this.prisma.playerOffer.create({
      data: {
        userId,
        status: OfferStatus.OPEN,
        playerName: dto.playerName,
        position: toPrismaPosition(dto.position),
        skillLevel: toPrismaSkillLevel(dto.skillLevel),
        payAmount: dto.payAmount ?? null,
        arena: dto.arena,
        date: this.toPrismaDate(dto.date),
        arenaAddress: dto.arenaAddress ?? null,
        time: dto.time,
        notes: dto.notes ?? null,
      },
    });

    const matchingRequests = await this.prisma.request.findMany({
      where: {
        position: created.position,
        skillLevel: created.skillLevel,
        status: RequestStatus.OPEN,
        userId: { not: userId },
      },
    });

    await this.notificationsService.createMany(
      matchingRequests.map((req) => ({
        userId: req.userId,
        type: NotificationType.OFFER_MATCH,
        title: 'A player offer matches your request',
        body: `${created.playerName} is available for ${created.position} at ${created.arena}${created.payAmount ? ` for $${created.payAmount}` : ''}`,
        link: `/requests/${req.id}`,
        metadata: {
          requestId: req.id,
          offerId: created.id,
          offerPosition: created.position,
          offerSkillLevel: created.skillLevel,
        },
      })),
    );

    return {
      ...created,
      position: created.position as unknown as Position,
      skillLevel: created.skillLevel as unknown as SkillLevel,
    } as unknown as PlayerOffer;
  }

  private toPrismaDate(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }
}
