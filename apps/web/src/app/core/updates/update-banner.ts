import { Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '../i18n/t.pipe';
import { AppUpdateService } from './app-update.service';

/** "A new version is available" notice shown at the bottom of the screen. */
@Component({
  selector: 'app-update-banner',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (updates.updateReady() && !dismissed()) {
      <div class="update-banner" role="status" aria-live="polite">
        <span>{{ 'A new version of HockeySpare is available.' | t }}</span>
        <button type="button" class="btn btn-sm btn-light" (click)="updates.reload()">
          {{ 'Refresh' | t }}
        </button>
        <button type="button" class="btn btn-sm btn-link text-white" (click)="dismissed.set(true)">
          {{ 'Later' | t }}
        </button>
      </div>
    }
  `,
  styles: `
    .update-banner {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: 12px;
      z-index: 1080;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px 12px;
      padding: 10px 14px;
      border-radius: 10px;
      background: #0d1b2a;
      color: #fff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
  `,
})
export class UpdateBannerComponent {
  protected readonly updates = inject(AppUpdateService);
  protected readonly dismissed = signal(false);

  constructor() {
    this.updates.start();
  }
}
