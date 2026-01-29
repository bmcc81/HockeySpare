import { Controller, Get } from '@nestjs/common';

@Controller('requests')
export class RequestsController {
  @Get()
  findAll() {
    return [
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
        time: 'Tonight 10:30 PM',
        notes: 'Looking for extra ice',
      }
    ];
  }
}
