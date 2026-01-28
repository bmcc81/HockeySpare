import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamProfile } from './team-profile';

describe('TeamProfile', () => {
  let component: TeamProfile;
  let fixture: ComponentFixture<TeamProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
