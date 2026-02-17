import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Position, SkillLevel } from '@hockeyspare/contracts';
import { PrismaService } from '../../prisma/prisma.service'; 
import { CreatePlayerOfferDto } from './dto/create-player-offer.dto';
import { PlayerOffer } from './player-offers.types';
import { Position as PrismaPosition, SkillLevel as PrismaSkillLevel } from '../../generated/prisma/client';

function toPrismaPosition(v: Position): PrismaPosition {
  const pv = v as unknown as PrismaPosition;
  if (!(Object.values(PrismaPosition) as unknown as string[]).includes(pv as unknown as string)) {
    throw new BadRequestException(`Invalid position: ${v}`);
  }
  return pv;
}

function toPrismaSkillLevel(v: SkillLevel): PrismaSkillLevel {
  const sv = v as unknown as PrismaSkillLevel;
  if (!(Object.values(PrismaSkillLevel) as unknown as string[]).includes(sv as unknown as string)) {
    throw new BadRequestException(`Invalid skillLevel: ${v}`);
  }
  return sv;
}

@Injectable()
export class PlayerOffersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PlayerOffer[]> {
    const rows = await this.prisma.playerOffer.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // return contracts enums outward
    return rows.map(r => ({
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

  async create(dto: CreatePlayerOfferDto): Promise<PlayerOffer> {
    const created = await this.prisma.playerOffer.create({
      data: {
        playerName: dto.playerName,
        position: toPrismaPosition(dto.position),         // ✅ FIX
        skillLevel: toPrismaSkillLevel(dto.skillLevel),   // ✅ FIX
        payAmount: dto.payAmount,
        arena: dto.arena,
        arenaAddress: dto.arenaAddress,
        time: dto.time,
        notes: dto.notes ?? null,
      },
    });

    return {
      ...created,
      position: created.position as unknown as Position,
      skillLevel: created.skillLevel as unknown as SkillLevel,
    } as unknown as PlayerOffer;
  }
}
