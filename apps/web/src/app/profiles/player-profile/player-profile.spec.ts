import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerProfileComponent } from './player-profile';

describe('PlayerProfileComponent', () => {
  let component: PlayerProfileComponent;
  let fixture: ComponentFixture<PlayerProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerProfileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
