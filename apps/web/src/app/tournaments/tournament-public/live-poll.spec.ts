import { LIVE_POLL_GRACE_MS, shouldPollLiveScores } from './live-poll';

const END = '2026-11-22T00:00:00.000Z';
const endMs = new Date(END).getTime();

describe('shouldPollLiveScores', () => {
  it('polls while the tab is visible and the tournament is on', () => {
    expect(shouldPollLiveScores({ hidden: false, endDate: END, now: endMs - 1000 })).toBe(true);
  });

  it('does not poll while the tab is in the background', () => {
    expect(shouldPollLiveScores({ hidden: true, endDate: END, now: endMs - 1000 })).toBe(false);
  });

  it('keeps polling through the last day of games', () => {
    expect(shouldPollLiveScores({ hidden: false, endDate: END, now: endMs + 24 * 3600 * 1000 })).toBe(true);
  });

  it('stops once the tournament has been over for the grace period', () => {
    expect(
      shouldPollLiveScores({ hidden: false, endDate: END, now: endMs + LIVE_POLL_GRACE_MS + 1 }),
    ).toBe(false);
  });

  it('keeps polling when there is no usable end date', () => {
    expect(shouldPollLiveScores({ hidden: false, endDate: null })).toBe(true);
    expect(shouldPollLiveScores({ hidden: false, endDate: 'not a date' })).toBe(true);
  });
});
