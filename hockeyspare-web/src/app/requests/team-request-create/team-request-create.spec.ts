import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamRequestCreate } from './team-request-create';

describe('TeamRequestCreate', () => {
  let component: TeamRequestCreate;
  let fixture: ComponentFixture<TeamRequestCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamRequestCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamRequestCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
