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
      arena: 'Vaudreuil Arena',
      time: 'Tonight 8:30 PM',
      notes: 'Beer league C level',
    },
    {
      id: 2,
      type: RequestType.PLAYER_NEEDS_TEAM,
      position: Position.FORWARD,
      skillLevel: SkillLevel.ADVANCED,
      payAmount: 15,
      arena: 'Any rink near Dorion',
      time: 'Tonight 7-10 PM',
      notes: 'Looking for extra ice',
    },
    {
      id: 3,
      type: RequestType.PLAYER_NEEDS_TEAM,
      position: Position.DEFENSE,
      skillLevel: SkillLevel.INTERMEDIATE,
      payAmount: 15,
      arena: 'Any rink near Dorion',
      time: 'Tonight 7-10 PM',
      notes: 'Looking for extra ice',
    },
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
    const created: SpareRequest = {
      id: this.nextId++,
      ...dto,
    };
    this.requests.unshift(created);
    return created;
  }
}