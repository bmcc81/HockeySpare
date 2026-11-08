import { DOCUMENT } from '@angular/common';
import { EnvironmentInjector, Injectable, effect, inject } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../environments/environment';
import { I18nService } from '../i18n/i18n.service';

/** Set as `data: { seo: ... }` on a route. */
export interface SeoRouteData {
  /** English title; shown translated to French visitors. */
  title?: string;
  description?: string;
  /**
   * Leave the page's tags alone. Used by tournament pages, whose title,
   * description and event data are filled in on the server for each tournament.
   */
  keep?: boolean;
}

export const DEFAULT_TITLE = 'HockeySpare - Find a spare, run your league or tournament';
export const DEFAULT_DESCRIPTION =
  'Find a spare player or goalie, run your hockey league, and manage your tournament with live scores, standings and schedules. Works in English and French.';

/**
 * Gives every page its own title, description and canonical address, so Google
 * doesn't read /terms or /requests as copies of the home page. Pages without
 * their own text fall back to the site-wide title.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly i18n = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(EnvironmentInjector);

  private started = false;

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.apply());

    // Re-translate the title when the visitor switches language.
    effect(() => {
      this.i18n.lang();
      this.apply();
    }, { injector: this.injector });
  }

  apply(): void {
    const seo = this.currentSeoData();

    if (seo?.keep) {
      return;
    }

    this.document.title = this.i18n.t(seo?.title ?? DEFAULT_TITLE);
    this.setMeta('description', this.i18n.t(seo?.description ?? DEFAULT_DESCRIPTION));
    this.setCanonical(this.canonicalUrl());
  }

  private currentSeoData(): SeoRouteData | undefined {
    let route: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let found: SeoRouteData | undefined;

    while (route) {
      const data = route.data?.['seo'] as SeoRouteData | undefined;
      if (data) {
        found = data;
      }
      route = route.firstChild;
    }

    return found;
  }

  private canonicalUrl(): string {
    const path = this.router.url.split(/[?#]/)[0] || '/';
    return environment.siteUrl.replace(/\/+$/, '') + (path.startsWith('/') ? path : `/${path}`);
  }

  private setMeta(name: string, content: string): void {
    let el = this.document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
    if (!el) {
      el = this.document.createElement('meta');
      el.setAttribute('name', name);
      this.document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  private setCanonical(href: string): void {
    let el = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
      el = this.document.createElement('link');
      el.setAttribute('rel', 'canonical');
      this.document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }
}
