import { deriveItemState, minNextBidCents, rankBids } from './auction-math';

const opts = { startingBidCents: 1000, minIncrementCents: 500 };

function bid(id: string, bidderId: string, amountCents: number, ms: number) {
  return { id, bidderId, amountCents, createdAt: new Date(ms).toISOString() };
}

describe('auction-math', () => {
  describe('deriveItemState', () => {
    it('shows the starting price with no bids', () => {
      const state = deriveItemState([], opts);
      expect(state.displayedPriceCents).toBe(1000);
      expect(state.leaderBidId).toBeNull();
    });

    it('shows the starting price with a single bidder above it', () => {
      const state = deriveItemState([bid('b1', 'A', 5000, 1)], opts);
      expect(state.displayedPriceCents).toBe(1000);
      expect(state.leaderBidId).toBe('b1');
    });

    it('raises the price to one increment over the second-highest max', () => {
      const state = deriveItemState(
        [bid('b1', 'A', 5000, 1), bid('b2', 'B', 2000, 2)],
        opts,
      );
      expect(state.displayedPriceCents).toBe(2500);
      expect(state.leaderBidderId).toBe('A');
    });

    it('caps the displayed price at the leader max', () => {
      const state = deriveItemState(
        [bid('b1', 'A', 2200, 1), bid('b2', 'B', 2000, 2)],
        opts,
      );
      expect(state.displayedPriceCents).toBe(2200);
      expect(state.leaderBidderId).toBe('A');
    });

    it('breaks a tie on the max in favour of the earlier bid', () => {
      const state = deriveItemState(
        [bid('late', 'B', 3000, 20), bid('early', 'A', 3000, 10)],
        opts,
      );
      expect(state.leaderBidId).toBe('early');
      expect(state.displayedPriceCents).toBe(3000);
    });
  });

  describe('minNextBidCents', () => {
    it('is the starting price when there are no bids', () => {
      expect(minNextBidCents([], opts)).toBe(1000);
    });

    it('is one increment over the displayed price once bidding is underway', () => {
      const bids = [bid('b1', 'A', 5000, 1), bid('b2', 'B', 2000, 2)];
      expect(minNextBidCents(bids, opts)).toBe(3000);
    });
  });

  describe('rankBids', () => {
    it('orders by amount desc then time asc', () => {
      const ranked = rankBids([
        bid('c', 'C', 1000, 3),
        bid('a', 'A', 3000, 5),
        bid('b', 'B', 3000, 1),
      ]);
      expect(ranked.map((r) => r.id)).toEqual(['b', 'a', 'c']);
    });
  });
});
