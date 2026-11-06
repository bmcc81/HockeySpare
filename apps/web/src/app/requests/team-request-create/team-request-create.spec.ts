import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbTimepickerStubComponent } from '../../../testing/ngb-timepicker-stub';

import { TeamRequestCreateComponent } from './team-request-create';

describe('TeamRequestCreateComponent', () => {
  let component: TeamRequestCreateComponent;
  let fixture: ComponentFixture<TeamRequestCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamRequestCreateComponent],
      providers: [provideRouter([])]
    })
    // The real ngb-timepicker can't be created by the test runner; use a stub.
    .overrideComponent(TeamRequestCreateComponent, {
      remove: { imports: [NgbTimepickerModule] },
      add: { imports: [NgbTimepickerStubComponent] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamRequestCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
