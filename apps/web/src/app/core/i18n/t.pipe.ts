import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from './i18n.service';

/**
 * `{{ 'Standings' | t }}` or `{{ '{n} spots left' | t: { n: 3 } }}`.
 *
 * Impure on purpose: it reads the language signal, so views re-render when
 * the language changes. The lookup is a single map read, so this is cheap.
 */
@Pipe({ name: 't', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(
    key: string | null | undefined,
    params?: Record<string, string | number | null | undefined>,
  ): string {
    return key ? this.i18n.t(key, params) : '';
  }
}

/** Same as `date`, but formatted in the current language (`| ldate: 'mediumDate' : 'UTC'`). */
@Pipe({ name: 'ldate', standalone: true, pure: false })
export class LocalDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private readonly datePipe = new DatePipe('en-US');

  /** Custom English patterns that read differently in French (day first, 24-hour clock). */
  private static readonly FR_FORMATS: Record<string, string> = {
    'MMM d': 'd MMM',
    'MMM d, y': 'd MMM y',
    'MMM d, h:mm a': 'd MMM, HH:mm',
    'MMM d, h:mm:ss a': 'd MMM, HH:mm:ss',
    'EEE, MMM d': 'EEE d MMM',
    'EEE, MMM d, y': 'EEE d MMM y',
    'EEE, MMM d, y, h:mm a': 'EEE d MMM y, HH:mm',
    'h:mm:ss a': 'HH:mm:ss',
  };

  transform(
    value: Date | string | number | null | undefined,
    format = 'mediumDate',
    timezone?: string,
  ): string | null {
    const locale = this.i18n.locale();
    const pattern =
      this.i18n.lang() === 'fr' ? (LocalDatePipe.FR_FORMATS[format] ?? format) : format;

    return this.datePipe.transform(value, pattern, timezone, locale);
  }
}
