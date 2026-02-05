import { Injectable } from '@nestjs/common';
import { SpareRequest } from './requests.types';
import { Position, RequestType, SkillLevel } from '@hockeyspare/contracts';
import { CreateRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestsService {

  private requests: SpareRequest[] = [
    {
      id: 1,
      type: RequestType.TEAM_NEEDS_PLAYER,
      position: Position.GOALIE,
      skillLevel: SkillLevel.INTERMEDIATE,
      payAmount: 40,
      teamName: 'Vaudreuil Beer League', // ✅ teamName for TEAM_NEEDS_PLAYER
      arena: 'Vaudreuil Arena',
      time: 'Tonight 8:30 PM',
      notes: 'Beer league C level',
    },
    {
      id: 2,
      type: RequestType.PLAYER_NEEDS_TEAM,
      position: Position.FORWARD,
      skillLevel: SkillLevel.ADVANCED,
      payAmount: 25,
      playerName: 'Nathan MacKinnon',
      arena: 'Any rink near Dorion',
      time: 'Tonight 7-10 PM',
      notes: 'Looking for extra ice time',
    },
    {
      id: 3,
      type: RequestType.PLAYER_NEEDS_TEAM,
      position: Position.DEFENSE,
      skillLevel: SkillLevel.INTERMEDIATE,
      payAmount: 15,
      playerName: 'Cale Makar',
      arena: 'Any rink near Dorion',
      time: 'Tonight 7-10 PM',
      notes: 'Looking for extra ice',
    },
    {
      id: 4,
      type: RequestType.TEAM_NEEDS_PLAYER,
      position: Position.FORWARD,
      skillLevel: SkillLevel.ADVANCED,
      payAmount: 40,
      teamName: 'Kirkland Beer League', // ✅ teamName for TEAM_NEEDS_PLAYER
      arena: 'Kirkland Arena',
      time: 'Tonight 10:00 PM',
      notes: 'Beer league A level',
    }
  ];

  private nextId =
  this.requests.reduce((max, r) => Math.max(max, r.id), 0) + 1;

  findAll() {
    return this.requests;
  }

  findOne(id: number) {
    return this.requests.find(r => r.id === id);
  }

  create(dto: CreateRequestDto): SpareRequest {
    const base = {
      id: this.nextId++,
      type: dto.type,
      position: dto.position,
      skillLevel: dto.skillLevel,
      payAmount: dto.payAmount,
      arena: dto.arena,
      time: dto.time,
      notes: dto.notes,
    };

    const created: SpareRequest =
      dto.type === RequestType.PLAYER_NEEDS_TEAM
        ? { ...base, type: RequestType.PLAYER_NEEDS_TEAM, playerName: dto.playerName! }
        : { ...base, type: RequestType.TEAM_NEEDS_PLAYER, teamName: dto.teamName! };

    this.requests.unshift(created);
    return created;
  }
}