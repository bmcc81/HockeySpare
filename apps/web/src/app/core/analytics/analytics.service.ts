import { Injectable, isDevMode } from '@angular/core';
import { environment } from '../../../environments/environment';

/** The key Umami's own script checks before it records anything. */
const OPT_OUT_KEY = 'umami.disabled';

type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (name: string, data?: EventData) => void };
  }
}

/**
 * Umami visitor statistics (cookieless, no personal data).
 *
 * Page views are counted by Umami's own script, which follows the app's
 * route changes. `track()` adds named events such as "calendar_copy_link".
 * Never pass names, emails or phone numbers as event data.
 *
 * Switched off until `environment.analytics.umamiWebsiteId` is set, and in
 * development, so local testing never reaches the numbers.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  /**
   * Lets the site owner leave their own visits out of the numbers: open any
   * page with `?notrack=1` once on a device to stop counting it, and
   * `?notrack=0` to count it again. Umami itself honours the same flag.
   */
  private applyOptOut(): boolean {
    try {
      const choice = new URLSearchParams(window.location.search).get('notrack');
      if (choice === '1') {
        localStorage.setItem(OPT_OUT_KEY, '1');
      } else if (choice === '0') {
        localStorage.removeItem(OPT_OUT_KEY);
      }
      return localStorage.getItem(OPT_OUT_KEY) !== null;
    } catch {
      return false;
    }
  }

  init(): void {
    const { umamiWebsiteId, umamiScriptUrl } = environment.analytics;

    if (typeof document === 'undefined') {
      return;
    }

    const optedOut = this.applyOptOut();

    if (!umamiWebsiteId || isDevMode() || optedOut) {
      return;
    }
    if (document.querySelector('script[data-website-id]')) {
      return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.src = umamiScriptUrl;
    script.dataset['websiteId'] = umamiWebsiteId;
    // Respect the browser's "Do Not Track" setting.
    script.dataset['doNotTrack'] = 'true';
    document.head.appendChild(script);
  }

  track(name: string, data?: EventData): void {
    try {
      window.umami?.track(name, data);
    } catch {
      // Statistics must never break the page.
    }
  }
}
