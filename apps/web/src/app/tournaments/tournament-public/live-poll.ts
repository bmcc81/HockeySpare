/** How long after the tournament's end date the page keeps refreshing live scores. */
export const LIVE_POLL_GRACE_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * Whether the public page should refresh the live scores right now.
 * Not while the tab is in the background (nobody is looking), and not once the
 * tournament has been over for a couple of days (nothing is changing).
 */
export function shouldPollLiveScores(input: {
  hidden: boolean;
  endDate: string | Date | null | undefined;
  now?: number;
}): boolean {
  if (input.hidden) {
    return false;
  }

  if (!input.endDate) {
    return true;
  }

  const end = new Date(input.endDate).getTime();

  if (!Number.isFinite(end)) {
    return true;
  }

  return (input.now ?? Date.now()) <= end + LIVE_POLL_GRACE_MS;
}
