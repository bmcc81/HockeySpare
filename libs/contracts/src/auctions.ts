export type AuctionStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

export type AuctionItemStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'PAID'
  | 'FULFILLED'
  | 'CANCELLED';

export interface Auction {
  id: string;
  tournamentId: string;
  title: string;
  description?: string | null;
  status: AuctionStatus;
  opensAt?: string | null;
  closesAt?: string | null;
  antiSnipeMinutes: number;
}

/** An item as shown on the public bidding page - no other bidders' details. */
export interface AuctionItemPublic {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  donorName?: string | null;
  fairMarketValueCents?: number | null;
  startingBidCents: number;
  minIncrementCents: number;
  buyNowCents?: number | null;
  status: AuctionItemStatus;
  /** Effective close time: the item's own, else the auction's. */
  closesAt?: string | null;
  sortOrder: number;
  /** Live displayed price (proxy-bid derived) while open; final price once closed. */
  currentBidCents: number;
  bidCount: number;
  minNextBidCents: number;
  /** First name + last initial of the current leader, or null. */
  leaderName?: string | null;
}

export interface AuctionPublicView {
  auction: Auction;
  items: AuctionItemPublic[];
  /** Whether the tournament can take card payment for winning bids. */
  stripePaymentsEnabled: boolean;
}

export interface AuctionBidAdmin {
  id: string;
  itemId: string;
  amountCents: number;
  createdAt: string;
  bidder: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

export interface AuctionItemAdmin extends AuctionItemPublic {
  auctionId: string;
  winningBidId?: string | null;
  paidAt?: string | null;
  fulfilledAt?: string | null;
  bids: AuctionBidAdmin[];
  winner?: {
    bidderId: string;
    name: string;
    email: string;
    phone?: string | null;
    amountCents: number;
  } | null;
}

export interface AuctionBidderTotals {
  bidderId: string;
  name: string;
  email: string;
  phone?: string | null;
  itemsWon: number;
  totalOwedCents: number;
  totalPaidCents: number;
}

export interface AuctionAdminView {
  auction: Auction;
  items: AuctionItemAdmin[];
  bidders: AuctionBidderTotals[];
  stripePaymentsEnabled: boolean;
}

export interface CreateAuctionInput {
  title?: string;
  description?: string | null;
  status?: AuctionStatus;
  opensAt?: string | null;
  closesAt?: string | null;
  antiSnipeMinutes?: number;
}

export type UpdateAuctionInput = CreateAuctionInput;

export interface CreateAuctionItemInput {
  name: string;
  description?: string | null;
  donorName?: string | null;
  fairMarketValueCents?: number | null;
  startingBidCents?: number;
  minIncrementCents?: number;
  buyNowCents?: number | null;
  closesAt?: string | null;
  sortOrder?: number;
}

export type UpdateAuctionItemInput = Partial<CreateAuctionItemInput> & {
  status?: Extract<AuctionItemStatus, 'OPEN' | 'CANCELLED'>;
};

export interface UpdateItemFulfillmentInput {
  paid?: boolean;
  fulfilled?: boolean;
}

export interface PlaceBidInput {
  bidderName: string;
  bidderEmail: string;
  bidderPhone?: string | null;
  maxAmountCents: number;
}

export interface PlaceBidResult {
  item: AuctionItemPublic;
  youAreLeading: boolean;
  wonViaBuyNow: boolean;
  minNextBidCents: number;
  claimUrl: string;
}

export type MyBidRowStatus = 'LEADING' | 'OUTBID' | 'WON' | 'PAID' | 'LOST';

export interface MyBidRow {
  itemId: string;
  itemName: string;
  imageUrl?: string | null;
  status: MyBidRowStatus;
  yourMaxCents: number;
  currentBidCents: number;
  amountOwedCents: number;
  closesAt?: string | null;
}

export interface MyBidsView {
  auctionTitle: string;
  tournamentId: string;
  bidderName: string;
  rows: MyBidRow[];
  totalOwedCents: number;
  stripePaymentsEnabled: boolean;
}

export interface AuctionCheckoutResult {
  checkoutUrl: string;
}

export interface AuctionPaymentVerification {
  status: PaymentStatusString;
  paidItemNames: string[];
}

type PaymentStatusString = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED';
