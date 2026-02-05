import { Injectable } from '@nestjs/common';
import { Position, SkillLevel } from '@hockeyspare/contracts';
import { CreatePlayerOfferDto } from './dto/create-player-offer.dto';
import { PlayerOffer } from './player-offers.types';

@Injectable()
export class PlayerOffersService {

    private offers: PlayerOffer[] = [
        {
        id: 1,
        playerName: 'Brandon',
        position: Position.FORWARD,
        skillLevel: SkillLevel.INTERMEDIATE,
        payAmount: 20,
        arena: 'Vaudreuil Arena',
        time: 'Tonight 9:00 PM',
        notes: 'Can play wing or center',
        },
        {
        id: 2,
        playerName: 'Kelly',
        position: Position.GOALIE,
        skillLevel: SkillLevel.ADVANCED,
        payAmount: 60,
        arena: 'Any rink near Dorion',
        time: 'Weeknights after 7',
        notes: 'Own gear, reliable',
        },
    ];

    private nextId = this.offers.reduce((max, r) => Math.max(max, r.id), 0) + 1;

    findAll() {
        return this.offers;
    }

    findOne(id: number) {
        return this.offers.find(o => o.id === id);
    }

    create(dto: CreatePlayerOfferDto): PlayerOffer {
        const created: PlayerOffer = { id: this.nextId++, ...dto };
        this.offers.unshift(created);
        return created;
    }
}
