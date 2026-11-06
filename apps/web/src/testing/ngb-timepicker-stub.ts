import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Stand-in for ng-bootstrap's `<ngb-timepicker>` in unit tests. The real one
 * can't be instantiated by the test runner (it pulls in a second copy of
 * Angular core), and these specs only need the form control to bind.
 */
@Component({
  selector: 'ngb-timepicker',
  standalone: true,
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NgbTimepickerStubComponent),
      multi: true,
    },
  ],
})
export class NgbTimepickerStubComponent implements ControlValueAccessor {
  @Input() spinners?: boolean;
  @Input() seconds?: boolean;
  @Input() meridian?: boolean;
  @Input() size?: string;

  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
}
