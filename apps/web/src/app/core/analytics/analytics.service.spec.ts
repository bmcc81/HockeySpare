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

  describe('opting out with ?notrack', () => {
    const visit = (query: string) => window.history.replaceState({}, '', '/' + query);

    afterEach(() => {
      visit('');
      localStorage.removeItem('umami.disabled');
    });

    it('?notrack=1 sets the flag Umami checks, and it sticks for later visits', () => {
      visit('?notrack=1');
      new AnalyticsService().init();
      expect(localStorage.getItem('umami.disabled')).toBe('1');

      visit('');
      new AnalyticsService().init();
      expect(localStorage.getItem('umami.disabled')).toBe('1');
    });

    it('?notrack=0 turns counting back on', () => {
      localStorage.setItem('umami.disabled', '1');
      visit('?notrack=0');
      new AnalyticsService().init();
      expect(localStorage.getItem('umami.disabled')).toBeNull();
    });
  });
});
