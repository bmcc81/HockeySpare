import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from './i18n.service';

/** EN | FR switch; shows the language you would switch to. */
@Component({
  selector: 'app-language-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="lang-toggle"
      [attr.lang]="i18n.lang() === 'fr' ? 'en' : 'fr'"
      [attr.aria-label]="i18n.lang() === 'fr' ? 'Switch to English' : 'Passer au français'"
      (click)="i18n.toggle()"
    >
      {{ i18n.lang() === 'fr' ? 'EN' : 'FR' }}
    </button>
  `,
  styles: [
    `
      .lang-toggle {
        border: 1px solid currentColor;
        border-radius: 999px;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        line-height: 1;
        padding: 0.4rem 0.7rem;
        min-width: 2.6rem;
        cursor: pointer;
      }
      .lang-toggle:hover,
      .lang-toggle:focus-visible {
        background: rgba(127, 127, 127, 0.18);
      }
    `,
  ],
})
export class LanguageToggleComponent {
  readonly i18n = inject(I18nService);
}
