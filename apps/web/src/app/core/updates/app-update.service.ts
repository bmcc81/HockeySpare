import { Injectable, NgZone, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

/** How often an open tab asks the server whether a newer version exists. */
const CHECK_EVERY_MS = 5 * 60 * 1000;

/**
 * The installed-app copy of the site is cached on the phone. After a deploy
 * it keeps showing the old copy until it downloads the new one, so this finds
 * out when a new version is ready and lets the person reload onto it. It never
 * reloads by itself, so nobody loses what they are typing.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  private readonly sw = inject(SwUpdate);
  private readonly zone = inject(NgZone);
  private started = false;

  /** True once a newer version is downloaded and waiting. */
  readonly updateReady = signal(false);

  start(): void {
    if (this.started || !this.sw.isEnabled) {
      return;
    }
    this.started = true;

    this.sw.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.updateReady.set(true));

    // The cached copy is broken (e.g. files it needs were removed): reloading fixes it.
    this.sw.unrecoverable.subscribe(() => this.updateReady.set(true));

    this.check();

    // Outside Angular's zone so a timer never keeps the app "busy" and delays
    // the service worker's first registration.
    this.zone.runOutsideAngular(() => {
      setInterval(() => this.check(), CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.check();
        }
      });
    });
  }

  async reload(): Promise<void> {
    try {
      await this.sw.activateUpdate();
    } catch {
      // Reloading is still the right move.
    }
    window.location.reload();
  }

  private check(): void {
    this.sw.checkForUpdate().catch(() => {
      // Offline or the server is busy: try again next time.
    });
  }
}
