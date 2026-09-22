import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamProfileComponent } from './team-profile';

describe('TeamProfileComponent', () => {
  let component: TeamProfileComponent;
  let fixture: ComponentFixture<TeamProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamProfileComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
