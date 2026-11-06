import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbTimepickerStubComponent } from '../../../testing/ngb-timepicker-stub';

import { PlayerOfferCreateComponent } from './player-offer-create';

describe('PlayerOfferCreateComponent', () => {
  let component: PlayerOfferCreateComponent;
  let fixture: ComponentFixture<PlayerOfferCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerOfferCreateComponent],
      providers: [provideRouter([])]
    })
    // The real ngb-timepicker can't be created by the test runner; use a stub.
    .overrideComponent(PlayerOfferCreateComponent, {
      remove: { imports: [NgbTimepickerModule] },
      add: { imports: [NgbTimepickerStubComponent] },
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
