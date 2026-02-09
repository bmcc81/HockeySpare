import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { Request as DbRequest, RequestType, Position, SkillLevel } from '@prisma/client';

const typeToDb: Record<CreateRequestDto['type'], RequestType> = {
  team_needs_player: RequestType.TEAM_NEEDS_PLAYER,
  player_needs_team: RequestType.PLAYER_NEEDS_TEAM,
};

const posToDb: Record<CreateRequestDto['position'], Position> = {
  goalie: Position.GOALIE,
  defense: Position.DEFENSE,
  forward: Position.FORWARD,
};

const skillToDb: Record<CreateRequestDto['skillLevel'], SkillLevel> = {
  beginner: SkillLevel.BEGINNER,
  intermediate: SkillLevel.INTERMEDIATE,
  advanced: SkillLevel.ADVANCED,
  elite: SkillLevel.ELITE,
};

function toApi(r: DbRequest) {
  const typeFromDb: Record<RequestType, CreateRequestDto['type']> = {
    [RequestType.TEAM_NEEDS_PLAYER]: 'team_needs_player',
    [RequestType.PLAYER_NEEDS_TEAM]: 'player_needs_team',
  };

  const posFromDb: Record<Position, CreateRequestDto['position']> = {
    [Position.GOALIE]: 'goalie',
    [Position.DEFENSE]: 'defense',
    [Position.FORWARD]: 'forward',
  };

  const skillFromDb: Record<SkillLevel, CreateRequestDto['skillLevel']> = {
    [SkillLevel.BEGINNER]: 'beginner',
    [SkillLevel.INTERMEDIATE]: 'intermediate',
    [SkillLevel.ADVANCED]: 'advanced',
    [SkillLevel.ELITE]: 'elite',
  };  

  return {
    ...r,
    type: typeFromDb[r.type as keyof typeof typeFromDb],
    position: posFromDb[r.position as keyof typeof posFromDb],
    skillLevel: skillFromDb[r.skillLevel as keyof typeof skillFromDb],
  };
}

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const items = await this.prisma.request.findMany({ orderBy: { id: 'desc' } });
    return items.map(toApi);
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
