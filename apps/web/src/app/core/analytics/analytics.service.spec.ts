import { vi } from 'vitest';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  afterEach(() => {
    delete window.umami;
  });

  it('sends events to Umami when it is loaded', () => {
    const track = vi.fn();
    window.umami = { track };

    new AnalyticsService().track('calendar_copy_link', { tournament: 't1' });

    expect(track).toHaveBeenCalledWith('calendar_copy_link', { tournament: 't1' });
  });

  it('does nothing when Umami is not loaded', () => {
    expect(() => new AnalyticsService().track('calendar_copy_link')).not.toThrow();
  });

  it('never lets a failing script break the page', () => {
    window.umami = {
      track: () => {
        throw new Error('blocked');
      },
    };

    expect(() => new AnalyticsService().track('x')).not.toThrow();
  });

  it('adds no script when no website id is configured', () => {
    new AnalyticsService().init();

    expect(document.querySelector('script[data-website-id]')).toBeNull();
  });
});
