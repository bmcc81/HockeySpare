import { Injectable } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';

type SpareRequest = CreateRequestDto & { id: number };

@Injectable()
export class RequestsService {
  private seq = 2;

  private data: SpareRequest[] = [
    {
      id: 1,
      type: 'team_needs_player',
      position: 'goalie',
      skillLevel: 'intermediate',
      payAmount: 40,
      arena: 'Vaudreuil Arena',
      time: 'Tonight 8:30 PM',
      notes: 'Beer league C level',
    },
    {
      id: 2,
      type: 'player_needs_team',
      position: 'forward',
      skillLevel: 'advanced',
      payAmount: 15,
      arena: 'Any rink near Dorion',
      time: 'Tonight 7-10 PM',
      notes: 'Looking for extra ice',
    },
  ];

  getAll() {
    return this.data;
  }

  create(dto: CreateRequestDto) {
    const created: SpareRequest = { id: ++this.seq, ...dto };
    this.data.unshift(created);
    return created;
  }
}
