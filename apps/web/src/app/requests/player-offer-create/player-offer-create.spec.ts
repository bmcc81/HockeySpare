import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PlayerOfferCreateComponent } from './player-offer-create';

describe('PlayerOfferCreateComponent', () => {
  let component: PlayerOfferCreateComponent;
  let fixture: ComponentFixture<PlayerOfferCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerOfferCreateComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerOfferCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
