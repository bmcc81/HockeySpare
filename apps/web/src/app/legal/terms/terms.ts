import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Plain-language terms of use. This is a starting point and should be
 * reviewed by a lawyer before it is relied on.
 */
@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms.html',
})
export class TermsComponent {
  readonly updated = 'November 2026';
}
