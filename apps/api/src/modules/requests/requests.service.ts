import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';

import {
  RequestType as CRequestType,
  Position as CPosition,
  SkillLevel as CSkillLevel,
} from '@hockeyspare/contracts';

import {
  Request as DbRequest,
  RequestType as PRequestType,
  Position as PPosition,
  SkillLevel as PSkillLevel,
} from '../../generated/prisma/client';

const typeToDb: Record<CRequestType, PRequestType> = {
  [CRequestType.TEAM_NEEDS_PLAYER]: PRequestType.TEAM_NEEDS_PLAYER,
  [CRequestType.PLAYER_NEEDS_TEAM]: PRequestType.PLAYER_NEEDS_TEAM,
};

const posToDb: Record<CPosition, PPosition> = {
  [CPosition.GOALIE]: PPosition.GOALIE,
  [CPosition.DEFENSE]: PPosition.DEFENSE,
  [CPosition.FORWARD]: PPosition.FORWARD,
};

const skillToDb: Record<CSkillLevel, PSkillLevel> = {
  [CSkillLevel.BEGINNER]: PSkillLevel.BEGINNER,
  [CSkillLevel.INTERMEDIATE]: PSkillLevel.INTERMEDIATE,
  [CSkillLevel.ADVANCED]: PSkillLevel.ADVANCED,
  [CSkillLevel.ELITE]: PSkillLevel.ELITE
};

const typeFromDb: Record<PRequestType, CRequestType> = {
  [PRequestType.TEAM_NEEDS_PLAYER]: CRequestType.TEAM_NEEDS_PLAYER,
  [PRequestType.PLAYER_NEEDS_TEAM]: CRequestType.PLAYER_NEEDS_TEAM,
};

const posFromDb: Record<PPosition, CPosition> = {
  [PPosition.GOALIE]: CPosition.GOALIE,
  [PPosition.DEFENSE]: CPosition.DEFENSE,
  [PPosition.FORWARD]: CPosition.FORWARD,
};

const skillFromDb: Record<PSkillLevel, CSkillLevel> = {
  [PSkillLevel.BEGINNER]: CSkillLevel.BEGINNER,
  [PSkillLevel.INTERMEDIATE]: CSkillLevel.INTERMEDIATE,
  [PSkillLevel.ADVANCED]: CSkillLevel.ADVANCED,
  [PSkillLevel.ELITE]: CSkillLevel.ELITE
};

function toApi(r: DbRequest) {
  return {
    ...r,
    type: typeFromDb[r.type],
    position: posFromDb[r.position],
    skillLevel: skillFromDb[r.skillLevel],
  };
}

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return (await this.prisma.request.findMany({ orderBy: { id: 'desc' } })).map(toApi);
  }

  async getById(id: number) {
    const item = await this.prisma.request.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Request not found');
    return toApi(item);
  }

  async create(dto: CreateRequestDto) {
    const created = await this.prisma.request.create({
      data: {
        type: typeToDb[dto.type],
        position: posToDb[dto.position],
        skillLevel: skillToDb[dto.skillLevel],
        payAmount: dto.payAmount ?? null,
        teamName: dto.teamName ?? null,
        playerName: dto.playerName ?? null,
        arena: dto.arena,
        arenaAddress: dto.arenaAddress ?? null,
        time: dto.time,
        notes: dto.notes ?? null,
      },
    });

    return toApi(created);
  }
}
