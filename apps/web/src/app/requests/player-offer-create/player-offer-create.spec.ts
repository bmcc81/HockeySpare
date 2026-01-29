import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerOfferCreate } from './player-offer-create';

describe('PlayerOfferCreate', () => {
  let component: PlayerOfferCreate;
  let fixture: ComponentFixture<PlayerOfferCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerOfferCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerOfferCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
