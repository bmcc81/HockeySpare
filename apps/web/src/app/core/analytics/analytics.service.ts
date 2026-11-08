import { Injectable, isDevMode } from '@angular/core';
import { environment } from '../../../environments/environment';

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
  init(): void {
    const { umamiWebsiteId, umamiScriptUrl } = environment.analytics;

    if (!umamiWebsiteId || isDevMode() || typeof document === 'undefined') {
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
