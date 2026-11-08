import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { AppUpdateService } from './app-update.service';

describe('AppUpdateService', () => {
  const versionUpdates = new Subject<{ type: string }>();
  const unrecoverable = new Subject<unknown>();
  const checkForUpdate = vi.fn().mockResolvedValue(false);

  function create(isEnabled: boolean): AppUpdateService {
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: { isEnabled, versionUpdates, unrecoverable, checkForUpdate } },
      ],
    });
    return TestBed.inject(AppUpdateService);
  }

  beforeEach(() => checkForUpdate.mockClear());

  it('does nothing when the service worker is off (dev mode)', () => {
    const service = create(false);
    service.start();

    expect(checkForUpdate).not.toHaveBeenCalled();
    expect(service.updateReady()).toBe(false);
  });

  it('checks on start and flags a ready version', () => {
    const service = create(true);
    service.start();
    expect(checkForUpdate).toHaveBeenCalledTimes(1);
    expect(service.updateReady()).toBe(false);

    versionUpdates.next({ type: 'VERSION_DETECTED' });
    expect(service.updateReady()).toBe(false);

    versionUpdates.next({ type: 'VERSION_READY' });
    expect(service.updateReady()).toBe(true);
  });

  it('also offers a reload when the cached copy is broken', () => {
    const service = create(true);
    service.start();

    unrecoverable.next({ reason: 'x' });
    expect(service.updateReady()).toBe(true);
  });

  it('only starts once', () => {
    const service = create(true);
    service.start();
    service.start();

    expect(checkForUpdate).toHaveBeenCalledTimes(1);
  });
});
