/**
 * Pure proxy-bidding math for the silent auction. Kept free of Prisma / Nest so
 * it can be unit-tested in isolation and reasoned about on its own.
 *
 * Each bid records the bidder's *maximum* they are willing to pay. The price
 * shown to everyone (`displayedPriceCents`) only rises as far as it needs to for
 * the current leader to be one increment clear of the next-highest bidder -
 * eBay-style.
 */

export interface BidLike {
  id: string;
  bidderId: string;
  amountCents: number;
  /** ISO string or Date - compared chronologically for tie-breaking. */
  createdAt: string | Date;
}

export interface ItemPricingOpts {
  startingBidCents: number;
  minIncrementCents: number;
}

export interface ItemState {
  displayedPriceCents: number;
  leaderBidId: string | null;
  leaderBidderId: string | null;
}

function chronological(a: BidLike, b: BidLike): number {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

/**
 * Highest max wins; ties on the max amount go to whoever bid first.
 * Returns bids sorted best-first.
 */
export function rankBids(bids: BidLike[]): BidLike[] {
  return [...bids].sort((a, b) => {
    if (b.amountCents !== a.amountCents) {
      return b.amountCents - a.amountCents;
    }
    return chronological(a, b);
  });
}

export function deriveItemState(
  bids: BidLike[],
  opts: ItemPricingOpts,
): ItemState {
  const ranked = rankBids(bids);

  if (ranked.length === 0) {
    return {
      displayedPriceCents: opts.startingBidCents,
      leaderBidId: null,
      leaderBidderId: null,
    };
  }

  const [top, second] = ranked;

  if (!second) {
    return {
      displayedPriceCents: opts.startingBidCents,
      leaderBidId: top.id,
      leaderBidderId: top.bidderId,
    };
  }

  // If the top two maxes are equal, the earlier bid leads and the price is
  // simply that shared max (the challenger can't be beaten by an increment).
  const priceIfClear = second.amountCents + opts.minIncrementCents;
  const displayedPriceCents = Math.max(
    opts.startingBidCents,
    Math.min(top.amountCents, priceIfClear),
  );

  return {
    displayedPriceCents,
    leaderBidId: top.id,
    leaderBidderId: top.bidderId,
  };
}

/**
 * Smallest max a *new* bidder must enter to be accepted. The first bid must
 * merely meet the starting price; after that a bid must clear the displayed
 * price by one increment.
 */
export function minNextBidCents(
  bids: BidLike[],
  opts: ItemPricingOpts,
): number {
  if (bids.length === 0) {
    return opts.startingBidCents;
  }
  const state = deriveItemState(bids, opts);
  return state.displayedPriceCents + opts.minIncrementCents;
}
