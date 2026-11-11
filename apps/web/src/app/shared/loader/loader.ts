import { Component, Input } from '@angular/core';

/**
 * The site's loading indicator: a puck gliding across a little strip of ice
 * between two goal posts. Pass the (already translated) text to show under it.
 * Use `compact` inside a section of a page instead of for a whole page.
 */
@Component({
  selector: 'app-loader',
  standalone: true,
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class LoaderComponent {
  /** Text shown under the puck, e.g. "Loading standings...". */
  @Input() label = '';

  /** Smaller and left-aligned, for loading one section rather than a whole page. */
  @Input() compact = false;
}
