import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { EmailService } from '../email/email.service';
import { FileStorageService } from '../file-storage/file-storage.service';
import { TournamentsService } from '../tournaments/tournaments.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { CreateAuctionItemDto } from './dto/create-auction-item.dto';
import { UpdateAuctionItemDto } from './dto/update-auction-item.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { UpdateItemFulfillmentDto } from './dto/update-item-fulfillment.dto';
import {
  BidLike,
  deriveItemState,
  minNextBidCents,
} from './auction-math';

type ItemWithBids = {
  id: string;
  auctionId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  donorName: string | null;
  fairMarketValueCents: number | null;
  startingBidCents: number;
  minIncrementCents: number;
  buyNowCents: number | null;
  status: string;
  closesAt: Date | null;
  sortOrder: number;
  currentBidCents: number | null;
  winningBidId: string | null;
  paymentId: string | null;
  paidAt: Date | null;
  fulfilledAt: Date | null;
  bids: {
    id: string;
    bidderId: string;
    amountCents: number;
    createdAt: Date;
    bidder?: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
  }[];
};

const MAX_ABSOLUTE_BID_CENTS = 10_000_00; // $10,000 sanity cap

@Injectable()
export class TournamentAuctionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly emailService: EmailService,
    private readonly fileStorageService: FileStorageService,
    private readonly tournamentsService: TournamentsService,
  ) {}

  private appUrl(): string {
    return (process.env.APP_URL ?? 'http://localhost:4200').replace(/\/$/, '');
  }

  private readonly itemInclude = {
    bids: {
      orderBy: { createdAt: 'asc' as const },
      include: {
        bidder: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    },
  };

  private readonly itemArgs = {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    include: this.itemInclude,
  };

  // ---------------------------------------------------------------------------
  // Auction + item management (organizer only)
  // ---------------------------------------------------------------------------

  async getOrCreate(userId: string, tournamentId: string, dto: CreateAuctionDto) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );

    const existing = await this.prisma.tournamentAuction.findUnique({
      where: { tournamentId },
    });

    if (existing) {
      return this.getAdmin(userId, tournamentId);
    }

    await this.prisma.tournamentAuction.create({
      data: {
        tournamentId,
        title: dto.title?.trim() || 'Silent Auction',
        description: dto.description?.trim() || null,
        status: dto.status ?? 'DRAFT',
        opensAt: dto.opensAt ? new Date(dto.opensAt) : null,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
        antiSnipeMinutes: dto.antiSnipeMinutes ?? 2,
      },
    });

    return this.getAdmin(userId, tournamentId);
  }

  async update(userId: string, tournamentId: string, dto: UpdateAuctionDto) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );

    const auction = await this.requireAuction(tournamentId);

    const opensAt =
      dto.opensAt !== undefined
        ? dto.opensAt
          ? new Date(dto.opensAt)
          : null
        : auction.opensAt;
    const closesAt =
      dto.closesAt !== undefined
        ? dto.closesAt
          ? new Date(dto.closesAt)
          : null
        : auction.closesAt;

    if (opensAt && closesAt && opensAt >= closesAt) {
      throw new BadRequestException('Opens-at must be before closes-at.');
    }

    await this.prisma.tournamentAuction.update({
      where: { id: auction.id },
      data: {
        ...(dto.title !== undefined
          ? { title: dto.title.trim() || 'Silent Auction' }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.opensAt !== undefined ? { opensAt } : {}),
        ...(dto.closesAt !== undefined ? { closesAt } : {}),
        ...(dto.antiSnipeMinutes !== undefined
          ? { antiSnipeMinutes: dto.antiSnipeMinutes }
          : {}),
      },
    });

    return this.getAdmin(userId, tournamentId);
  }

  async addItem(
    userId: string,
    tournamentId: string,
    dto: CreateAuctionItemDto,
  ) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );
    const auction = await this.requireAuction(tournamentId);

    await this.prisma.tournamentAuctionItem.create({
      data: {
        auctionId: auction.id,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        donorName: dto.donorName?.trim() || null,
        fairMarketValueCents: dto.fairMarketValueCents ?? null,
        startingBidCents: dto.startingBidCents ?? 0,
        minIncrementCents: dto.minIncrementCents ?? 500,
        buyNowCents: dto.buyNowCents ?? null,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return this.getAdmin(userId, tournamentId);
  }

  async updateItem(
    userId: string,
    tournamentId: string,
    itemId: string,
    dto: UpdateAuctionItemDto,
  ) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );
    const item = await this.requireItem(tournamentId, itemId);

    if (item.bids.length > 0 && dto.startingBidCents !== undefined) {
      throw new BadRequestException(
        'The starting bid cannot change after bidding has started.',
      );
    }

    await this.prisma.tournamentAuctionItem.update({
      where: { id: itemId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.donorName !== undefined
          ? { donorName: dto.donorName?.trim() || null }
          : {}),
        ...(dto.fairMarketValueCents !== undefined
          ? { fairMarketValueCents: dto.fairMarketValueCents ?? null }
          : {}),
        ...(dto.startingBidCents !== undefined
          ? { startingBidCents: dto.startingBidCents }
          : {}),
        ...(dto.minIncrementCents !== undefined
          ? { minIncrementCents: dto.minIncrementCents }
          : {}),
        ...(dto.buyNowCents !== undefined
          ? { buyNowCents: dto.buyNowCents ?? null }
          : {}),
        ...(dto.closesAt !== undefined
          ? { closesAt: dto.closesAt ? new Date(dto.closesAt) : null }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    return this.getAdmin(userId, tournamentId);
  }

  async deleteItem(userId: string, tournamentId: string, itemId: string) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );
    const item = await this.requireItem(tournamentId, itemId);

    if (item.imageUrl) {
      await this.fileStorageService
        .deleteFileByUrl(item.imageUrl)
        .catch(() => undefined);
    }

    await this.prisma.tournamentAuctionItem.delete({ where: { id: itemId } });

    return { id: itemId, deleted: true };
  }

  async uploadItemImage(
    userId: string,
    tournamentId: string,
    itemId: string,
    file: Express.Multer.File,
  ) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );
    const item = await this.requireItem(tournamentId, itemId);

    const url = await this.fileStorageService.uploadFile(
      `tournaments/${tournamentId}/auction-items`,
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    if (item.imageUrl) {
      await this.fileStorageService
        .deleteFileByUrl(item.imageUrl)
        .catch(() => undefined);
    }

    await this.prisma.tournamentAuctionItem.update({
      where: { id: itemId },
      data: { imageUrl: url },
    });

    return this.getAdmin(userId, tournamentId);
  }

  async voidBid(
    userId: string,
    tournamentId: string,
    itemId: string,
    bidId: string,
  ) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );
    const item = await this.requireItem(tournamentId, itemId);
    const bid = item.bids.find((b) => b.id === bidId);

    if (!bid) {
      throw new NotFoundException('Bid not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      if (item.winningBidId === bidId) {
        await tx.tournamentAuctionItem.update({
          where: { id: itemId },
          data: { winningBidId: null },
        });
      }
      await tx.tournamentAuctionBid.delete({ where: { id: bidId } });
    });

    return this.getAdmin(userId, tournamentId);
  }

  async updateItemFulfillment(
    userId: string,
    tournamentId: string,
    itemId: string,
    dto: UpdateItemFulfillmentDto,
  ) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );
    const item = await this.requireItem(tournamentId, itemId);

    const data: Record<string, unknown> = {};

    if (dto.paid !== undefined) {
      data.paidAt = dto.paid ? item.paidAt ?? new Date() : null;
      if (dto.paid && item.status === 'CLOSED') data.status = 'PAID';
      if (!dto.paid && item.status === 'PAID') data.status = 'CLOSED';
    }

    if (dto.fulfilled !== undefined) {
      data.fulfilledAt = dto.fulfilled ? item.fulfilledAt ?? new Date() : null;
      if (dto.fulfilled) data.status = 'FULFILLED';
      else if (
        item.status === 'FULFILLED' &&
        (data.paidAt ?? item.paidAt)
      ) {
        data.status = 'PAID';
      } else if (item.status === 'FULFILLED') {
        data.status = 'CLOSED';
      }
    }

    await this.prisma.tournamentAuctionItem.update({
      where: { id: itemId },
      data,
    });

    return this.getAdmin(userId, tournamentId);
  }

  // ---------------------------------------------------------------------------
  // Closing
  // ---------------------------------------------------------------------------

  async closeItem(userId: string, tournamentId: string, itemId: string) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );
    const item = await this.requireItem(tournamentId, itemId);
    await this.finalizeItem(item, tournamentId);
    return this.getAdmin(userId, tournamentId);
  }

  async closeAuction(userId: string, tournamentId: string) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );
    const auction = await this.requireAuction(tournamentId);

    const items = (await this.prisma.tournamentAuctionItem.findMany({
      where: { auctionId: auction.id, status: 'OPEN' },
      ...this.itemArgs,
    })) as unknown as ItemWithBids[];

    for (const item of items) {
      await this.finalizeItem(item, tournamentId);
    }

    await this.prisma.tournamentAuction.update({
      where: { id: auction.id },
      data: { status: 'CLOSED' },
    });

    return this.getAdmin(userId, tournamentId);
  }

  /**
   * Closes any OPEN item whose effective close time has passed. Runs on every
   * public fetch so the board finalizes itself while people are watching, with
   * no scheduler.
   */
  private async finalizeDueItems(
    auction: { id: string; status: string; closesAt: Date | null },
    tournamentId: string,
  ): Promise<void> {
    if (auction.status === 'DRAFT') {
      return;
    }

    const now = Date.now();
    const items = (await this.prisma.tournamentAuctionItem.findMany({
      where: { auctionId: auction.id, status: 'OPEN' },
      ...this.itemArgs,
    })) as unknown as ItemWithBids[];

    for (const item of items) {
      const closesAt = item.closesAt ?? auction.closesAt;
      if (closesAt && closesAt.getTime() <= now) {
        await this.finalizeItem(item, tournamentId);
      }
    }
  }

  private async finalizeItem(
    item: ItemWithBids,
    tournamentId: string,
    opts?: { forcePriceCents?: number; forceWinningBidId?: string },
  ): Promise<void> {
    if (item.status !== 'OPEN') {
      return;
    }

    const state = deriveItemState(this.toBidLikes(item.bids), {
      startingBidCents: item.startingBidCents,
      minIncrementCents: item.minIncrementCents,
    });

    const winningBidId = opts?.forceWinningBidId ?? state.leaderBidId;
    const finalPriceCents = winningBidId
      ? opts?.forcePriceCents ?? state.displayedPriceCents
      : null;

    await this.prisma.tournamentAuctionItem.update({
      where: { id: item.id },
      data: {
        status: 'CLOSED',
        winningBidId,
        currentBidCents: finalPriceCents,
      },
    });

    if (winningBidId) {
      const winnerBid = item.bids.find((b) => b.id === winningBidId);
      if (winnerBid?.bidder) {
        await this.sendWonEmail(
          winnerBid.bidder,
          item.name,
          finalPriceCents ?? 0,
          tournamentId,
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Public bidding
  // ---------------------------------------------------------------------------

  async getPublic(tournamentId: string) {
    const auction = await this.prisma.tournamentAuction.findUnique({
      where: { tournamentId },
    });

    if (!auction) {
      throw new NotFoundException('This tournament has no auction.');
    }

    await this.finalizeDueItems(auction, tournamentId);

    const items = (await this.prisma.tournamentAuctionItem.findMany({
      where: { auctionId: auction.id, status: { not: 'CANCELLED' } },
      ...this.itemArgs,
    })) as unknown as ItemWithBids[];

    const stripePaymentsEnabled = await this.stripePaymentsEnabled(tournamentId);

    return {
      auction: this.publicAuctionShape(auction),
      items: items.map((item) => this.publicItemShape(item, auction)),
      stripePaymentsEnabled,
    };
  }

  async getAdmin(userId: string, tournamentId: string) {
    await this.tournamentsService.assertCanManageTournament(
      userId,
      tournamentId,
    );

    const auction = await this.requireAuction(tournamentId);
    await this.finalizeDueItems(auction, tournamentId);

    const items = (await this.prisma.tournamentAuctionItem.findMany({
      where: { auctionId: auction.id },
      ...this.itemArgs,
    })) as unknown as ItemWithBids[];

    const stripePaymentsEnabled = await this.stripePaymentsEnabled(tournamentId);

    const bidderTotals = new Map<
      string,
      {
        bidderId: string;
        name: string;
        email: string;
        phone: string | null;
        itemsWon: number;
        totalOwedCents: number;
        totalPaidCents: number;
      }
    >();

    const adminItems = items.map((item) => {
      const base = this.publicItemShape(item, auction);
      const winnerBid = item.winningBidId
        ? item.bids.find((b) => b.id === item.winningBidId)
        : null;
      const winner =
        winnerBid && winnerBid.bidder
          ? {
              bidderId: winnerBid.bidder.id,
              name: winnerBid.bidder.name,
              email: winnerBid.bidder.email,
              phone: winnerBid.bidder.phone,
              amountCents: item.currentBidCents ?? base.currentBidCents,
            }
          : null;

      if (winner) {
        const row =
          bidderTotals.get(winner.bidderId) ??
          {
            bidderId: winner.bidderId,
            name: winner.name,
            email: winner.email,
            phone: winner.phone,
            itemsWon: 0,
            totalOwedCents: 0,
            totalPaidCents: 0,
          };
        row.itemsWon += 1;
        if (item.status === 'PAID' || item.status === 'FULFILLED') {
          row.totalPaidCents += winner.amountCents;
        } else {
          row.totalOwedCents += winner.amountCents;
        }
        bidderTotals.set(winner.bidderId, row);
      }

      return {
        ...base,
        auctionId: item.auctionId,
        winningBidId: item.winningBidId,
        paidAt: item.paidAt?.toISOString() ?? null,
        fulfilledAt: item.fulfilledAt?.toISOString() ?? null,
        winner,
        bids: [...item.bids]
          .sort((a, b) => b.amountCents - a.amountCents)
          .map((b) => ({
            id: b.id,
            itemId: item.id,
            amountCents: b.amountCents,
            createdAt: b.createdAt.toISOString(),
            bidder: {
              id: b.bidder?.id ?? b.bidderId,
              name: b.bidder?.name ?? 'Unknown',
              email: b.bidder?.email ?? '',
              phone: b.bidder?.phone ?? null,
            },
          })),
      };
    });

    return {
      auction: this.publicAuctionShape(auction),
      items: adminItems,
      bidders: Array.from(bidderTotals.values()).sort(
        (a, b) => b.totalOwedCents - a.totalOwedCents,
      ),
      stripePaymentsEnabled,
    };
  }

  async placeBid(tournamentId: string, itemId: string, dto: PlaceBidDto) {
    const auction = await this.prisma.tournamentAuction.findUnique({
      where: { tournamentId },
    });

    if (!auction) {
      throw new NotFoundException('This tournament has no auction.');
    }

    if (auction.status !== 'OPEN') {
      throw new BadRequestException('Bidding is not open.');
    }

    if (auction.opensAt && auction.opensAt.getTime() > Date.now()) {
      throw new BadRequestException('Bidding has not opened yet.');
    }

    await this.finalizeDueItems(auction, tournamentId);

    const item = (await this.prisma.tournamentAuctionItem.findFirst({
      where: { id: itemId, auctionId: auction.id },
      ...this.itemArgs,
    })) as unknown as ItemWithBids | null;

    if (!item) {
      throw new NotFoundException('Auction item not found.');
    }

    if (item.status !== 'OPEN') {
      throw new BadRequestException('Bidding on this item has closed.');
    }

    const email = dto.bidderEmail.trim().toLowerCase();
    const maxAmountCents = dto.maxAmountCents;

    if (maxAmountCents > MAX_ABSOLUTE_BID_CENTS) {
      throw new BadRequestException('That bid is too large.');
    }

    const pricingOpts = {
      startingBidCents: item.startingBidCents,
      minIncrementCents: item.minIncrementCents,
    };

    // Upsert the bidder for this auction.
    const bidder = await this.prisma.tournamentAuctionBidder.upsert({
      where: { auctionId_email: { auctionId: auction.id, email } },
      update: {
        name: dto.bidderName.trim(),
        ...(dto.bidderPhone?.trim()
          ? { phone: dto.bidderPhone.trim() }
          : {}),
      },
      create: {
        auctionId: auction.id,
        name: dto.bidderName.trim(),
        email,
        phone: dto.bidderPhone?.trim() || null,
        claimToken: randomBytes(24).toString('hex'),
      },
    });

    const existingOwnBid = item.bids.find((b) => b.bidderId === bidder.id);
    if (existingOwnBid && maxAmountCents <= existingOwnBid.amountCents) {
      throw new BadRequestException(
        'Your new maximum must be higher than your current one.',
      );
    }

    const required = minNextBidCents(this.toBidLikes(item.bids), pricingOpts);
    const isBuyNow =
      !!item.buyNowCents && maxAmountCents >= item.buyNowCents;

    if (!isBuyNow && maxAmountCents < required) {
      throw new BadRequestException(
        `The minimum bid is ${(required / 100).toFixed(2)}.`,
      );
    }

    const priorState = deriveItemState(
      this.toBidLikes(item.bids),
      pricingOpts,
    );
    const priorLeaderBidderId = priorState.leaderBidderId;

    const bid = await this.prisma.tournamentAuctionBid.create({
      data: { itemId: item.id, bidderId: bidder.id, amountCents: maxAmountCents },
    });

    const allBids = [
      ...item.bids.map((b) => ({ ...b })),
      { id: bid.id, bidderId: bidder.id, amountCents: maxAmountCents, createdAt: bid.createdAt },
    ] as ItemWithBids['bids'];

    let wonViaBuyNow = false;
    let youAreLeading: boolean;
    let itemForResponse: ItemWithBids;

    if (isBuyNow) {
      const refreshed = (await this.prisma.tournamentAuctionItem.findUniqueOrThrow(
        { where: { id: item.id }, include: this.itemInclude },
      )) as unknown as ItemWithBids;

      await this.finalizeItem(refreshed, tournamentId, {
        forcePriceCents: item.buyNowCents!,
        forceWinningBidId: bid.id,
      });
      wonViaBuyNow = true;
      youAreLeading = true;
      itemForResponse = (await this.prisma.tournamentAuctionItem.findUniqueOrThrow(
        { where: { id: item.id }, include: this.itemInclude },
      )) as unknown as ItemWithBids;
    } else {
      const newState = deriveItemState(this.toBidLikes(allBids), pricingOpts);
      youAreLeading = newState.leaderBidderId === bidder.id;

      // Outbid notice to the previous leader if they've been displaced.
      if (
        priorLeaderBidderId &&
        priorLeaderBidderId !== bidder.id &&
        newState.leaderBidderId !== priorLeaderBidderId
      ) {
        const prevBidder = item.bids.find(
          (b) => b.bidderId === priorLeaderBidderId,
        )?.bidder;
        if (prevBidder) {
          await this.sendOutbidEmail(
            prevBidder,
            item.name,
            newState.displayedPriceCents,
            tournamentId,
          );
        }
      }

      // Anti-snipe: extend the item's close if a bid lands in the window.
      const effectiveClose = item.closesAt ?? auction.closesAt;
      if (
        auction.antiSnipeMinutes > 0 &&
        effectiveClose &&
        effectiveClose.getTime() - Date.now() <
          auction.antiSnipeMinutes * 60_000
      ) {
        const extended = new Date(
          Date.now() + auction.antiSnipeMinutes * 60_000,
        );
        await this.prisma.tournamentAuctionItem.update({
          where: { id: item.id },
          data: { closesAt: extended },
        });
      }

      itemForResponse = (await this.prisma.tournamentAuctionItem.findUniqueOrThrow(
        { where: { id: item.id }, include: this.itemInclude },
      )) as unknown as ItemWithBids;
    }

    // First-time bidders get their tracking link.
    if (!existingOwnBid) {
      await this.sendClaimLinkEmail(bidder, auction.title, tournamentId).catch(
        () => undefined,
      );
    }

    const shaped = this.publicItemShape(itemForResponse, auction);

    return {
      item: shaped,
      youAreLeading,
      wonViaBuyNow,
      minNextBidCents: shaped.minNextBidCents,
      claimUrl: this.claimUrl(tournamentId, bidder.claimToken),
    };
  }

  // ---------------------------------------------------------------------------
  // Bidder "my bids" + settlement
  // ---------------------------------------------------------------------------

  async getMyBids(tournamentId: string, token: string) {
    const bidder = await this.requireBidder(tournamentId, token);
    const auction = await this.requireAuction(tournamentId);
    await this.finalizeDueItems(auction, tournamentId);

    const items = (await this.prisma.tournamentAuctionItem.findMany({
      where: {
        auctionId: auction.id,
        bids: { some: { bidderId: bidder.id } },
      },
      ...this.itemArgs,
    })) as unknown as ItemWithBids[];

    const stripePaymentsEnabled = await this.stripePaymentsEnabled(tournamentId);

    let totalOwedCents = 0;

    const rows = items.map((item) => {
      const yourMaxCents = Math.max(
        ...item.bids
          .filter((b) => b.bidderId === bidder.id)
          .map((b) => b.amountCents),
      );
      const shaped = this.publicItemShape(item, auction);
      const winnerBidderId = item.winningBidId
        ? item.bids.find((b) => b.id === item.winningBidId)?.bidderId
        : deriveItemState(this.toBidLikes(item.bids), {
            startingBidCents: item.startingBidCents,
            minIncrementCents: item.minIncrementCents,
          }).leaderBidderId;
      const youWin = winnerBidderId === bidder.id;

      let status: 'LEADING' | 'OUTBID' | 'WON' | 'PAID' | 'LOST';
      let amountOwedCents = 0;

      if (item.status === 'OPEN') {
        status = youWin ? 'LEADING' : 'OUTBID';
      } else if (item.status === 'PAID' || item.status === 'FULFILLED') {
        status = youWin ? 'PAID' : 'LOST';
      } else {
        // CLOSED
        if (youWin) {
          status = 'WON';
          amountOwedCents = item.currentBidCents ?? shaped.currentBidCents;
          totalOwedCents += amountOwedCents;
        } else {
          status = 'LOST';
        }
      }

      return {
        itemId: item.id,
        itemName: item.name,
        imageUrl: item.imageUrl,
        status,
        yourMaxCents,
        currentBidCents: item.currentBidCents ?? shaped.currentBidCents,
        amountOwedCents,
        closesAt: shaped.closesAt,
      };
    });

    return {
      auctionTitle: auction.title,
      tournamentId,
      bidderName: bidder.name,
      rows,
      totalOwedCents,
      stripePaymentsEnabled,
    };
  }

  async startCheckout(tournamentId: string, token: string) {
    const bidder = await this.requireBidder(tournamentId, token);
    const auction = await this.requireAuction(tournamentId);
    await this.finalizeDueItems(auction, tournamentId);

    const tournament = await this.prisma.tournament.findUniqueOrThrow({
      where: { id: tournamentId },
      select: {
        id: true,
        name: true,
        stripeAccountId: true,
        stripePayoutsEnabled: true,
      },
    });

    if (!tournament.stripeAccountId || !tournament.stripePayoutsEnabled) {
      throw new BadRequestException(
        'The organizer is collecting payment for won items directly.',
      );
    }

    const items = (await this.prisma.tournamentAuctionItem.findMany({
      where: {
        auctionId: auction.id,
        status: 'CLOSED',
        paymentId: null,
        winningBid: { bidderId: bidder.id },
      },
      ...this.itemArgs,
    })) as unknown as ItemWithBids[];

    if (items.length === 0) {
      throw new BadRequestException('You have no items to pay for.');
    }

    const totalCents = items.reduce(
      (sum, item) => sum + (item.currentBidCents ?? 0),
      0,
    );

    const payment = await this.prisma.tournamentAuctionPayment.create({
      data: {
        auctionId: auction.id,
        bidderId: bidder.id,
        amountCents: totalCents,
        status: 'PENDING',
      },
    });

    const returnBase = `${this.appUrl()}/tournaments/${tournamentId}/auction/my-bids?token=${token}`;

    const session = await this.stripeService.getClient().checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: bidder.email,
        line_items: items.map((item) => ({
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: item.currentBidCents ?? 0,
            product_data: {
              name: `${tournament.name} auction - ${item.name}`,
            },
          },
        })),
        success_url: `${returnBase}&paymentSessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: returnBase,
        metadata: {
          type: 'tournament_auction',
          auctionPaymentId: payment.id,
        },
      },
      { stripeAccount: tournament.stripeAccountId },
    );

    await this.prisma.$transaction([
      this.prisma.tournamentAuctionPayment.update({
        where: { id: payment.id },
        data: { stripeCheckoutSessionId: session.id },
      }),
      this.prisma.tournamentAuctionItem.updateMany({
        where: { id: { in: items.map((i) => i.id) } },
        data: { paymentId: payment.id },
      }),
    ]);

    return { checkoutUrl: session.url! };
  }

  async verifyCheckoutSession(sessionId: string) {
    const payment = await this.prisma.tournamentAuctionPayment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
      include: {
        auction: { select: { tournament: { select: { stripeAccountId: true } } } },
        items: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment session not found.');
    }

    if (payment.status === 'SUCCEEDED') {
      return {
        status: payment.status,
        paidItemNames: payment.items.map((i) => i.name),
      };
    }

    const stripeAccountId = payment.auction.tournament.stripeAccountId;
    if (!stripeAccountId) {
      throw new BadRequestException('This tournament is no longer connected.');
    }

    const session = await this.stripeService
      .getClient()
      .checkout.sessions.retrieve(sessionId, {}, { stripeAccount: stripeAccountId });

    if (session.payment_status === 'paid') {
      await this.claimAuctionPaymentSuccess(payment.id, session);
      return {
        status: 'SUCCEEDED' as const,
        paidItemNames: payment.items.map((i) => i.name),
      };
    }

    return {
      status: payment.status,
      paidItemNames: payment.items.map((i) => i.name),
    };
  }

  async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const payment = await this.prisma.tournamentAuctionPayment.findUnique({
      where: { stripeCheckoutSessionId: session.id },
    });

    if (!payment || payment.status === 'SUCCEEDED') {
      return;
    }

    if (session.payment_status !== 'paid') {
      return;
    }

    await this.claimAuctionPaymentSuccess(payment.id, session);
  }

  private async claimAuctionPaymentSuccess(
    paymentId: string,
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const result = await this.prisma.$transaction(async (tx) => {
      const claim = await tx.tournamentAuctionPayment.updateMany({
        where: { id: paymentId, status: { not: 'SUCCEEDED' } },
        data: {
          status: 'SUCCEEDED',
          stripePaymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : (session.payment_intent?.id ?? null),
        },
      });

      if (claim.count === 0) {
        return { claimed: false, bidderEmail: '', itemNames: [] as string[] };
      }

      await tx.tournamentAuctionItem.updateMany({
        where: { paymentId },
        data: { status: 'PAID', paidAt: new Date() },
      });

      const payment = await tx.tournamentAuctionPayment.findUniqueOrThrow({
        where: { id: paymentId },
        include: { bidder: true, items: true },
      });

      return {
        claimed: true,
        bidderEmail: payment.bidder.email,
        bidderName: payment.bidder.name,
        itemNames: payment.items.map((i) => i.name),
        amountCents: payment.amountCents,
      };
    });

    if (result.claimed && result.bidderEmail) {
      await this.emailService
        .sendMail({
          to: result.bidderEmail,
          subject: 'Your auction payment is confirmed',
          text:
            `Thanks ${result.bidderName ?? ''}! We received your payment of ` +
            `$${((result.amountCents ?? 0) / 100).toFixed(2)} for: ` +
            `${result.itemNames.join(', ')}.`,
        })
        .catch((err) => console.warn('Auction receipt email failed', err));
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private toBidLikes(bids: ItemWithBids['bids']): BidLike[] {
    return bids.map((b) => ({
      id: b.id,
      bidderId: b.bidderId,
      amountCents: b.amountCents,
      createdAt: b.createdAt,
    }));
  }

  private async requireAuction(tournamentId: string) {
    const auction = await this.prisma.tournamentAuction.findUnique({
      where: { tournamentId },
    });
    if (!auction) {
      throw new NotFoundException('This tournament has no auction yet.');
    }
    return auction;
  }

  private async requireItem(
    tournamentId: string,
    itemId: string,
  ): Promise<ItemWithBids> {
    const auction = await this.requireAuction(tournamentId);
    const item = (await this.prisma.tournamentAuctionItem.findFirst({
      where: { id: itemId, auctionId: auction.id },
      ...this.itemArgs,
    })) as unknown as ItemWithBids | null;
    if (!item) {
      throw new NotFoundException('Auction item not found.');
    }
    return item;
  }

  private async requireBidder(tournamentId: string, token: string) {
    const bidder = await this.prisma.tournamentAuctionBidder.findUnique({
      where: { claimToken: token },
      include: { auction: { select: { tournamentId: true } } },
    });
    if (!bidder || bidder.auction.tournamentId !== tournamentId) {
      throw new ForbiddenException('Invalid or expired link.');
    }
    return bidder;
  }

  private async stripePaymentsEnabled(tournamentId: string): Promise<boolean> {
    const t = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { stripeAccountId: true, stripePayoutsEnabled: true },
    });
    return !!t?.stripeAccountId && !!t?.stripePayoutsEnabled;
  }

  private claimUrl(tournamentId: string, token: string): string {
    return `${this.appUrl()}/tournaments/${tournamentId}/auction/my-bids?token=${token}`;
  }

  private publicAuctionShape(auction: {
    id: string;
    tournamentId: string;
    title: string;
    description: string | null;
    status: string;
    opensAt: Date | null;
    closesAt: Date | null;
    antiSnipeMinutes: number;
  }) {
    return {
      id: auction.id,
      tournamentId: auction.tournamentId,
      title: auction.title,
      description: auction.description,
      status: auction.status,
      opensAt: auction.opensAt?.toISOString() ?? null,
      closesAt: auction.closesAt?.toISOString() ?? null,
      antiSnipeMinutes: auction.antiSnipeMinutes,
    };
  }

  private publicItemShape(
    item: ItemWithBids,
    auction: { closesAt: Date | null },
  ) {
    const pricingOpts = {
      startingBidCents: item.startingBidCents,
      minIncrementCents: item.minIncrementCents,
    };
    const isOpen = item.status === 'OPEN';
    const state = deriveItemState(this.toBidLikes(item.bids), pricingOpts);

    const currentBidCents = isOpen
      ? state.displayedPriceCents
      : (item.currentBidCents ?? state.displayedPriceCents);

    const leaderBid = state.leaderBidId
      ? item.bids.find((b) => b.id === state.leaderBidId)
      : null;

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      donorName: item.donorName,
      fairMarketValueCents: item.fairMarketValueCents,
      startingBidCents: item.startingBidCents,
      minIncrementCents: item.minIncrementCents,
      buyNowCents: item.buyNowCents,
      status: item.status,
      closesAt:
        (item.closesAt ?? auction.closesAt)?.toISOString() ?? null,
      sortOrder: item.sortOrder,
      currentBidCents,
      bidCount: item.bids.length,
      minNextBidCents: isOpen
        ? minNextBidCents(this.toBidLikes(item.bids), pricingOpts)
        : currentBidCents,
      leaderName: leaderBid?.bidder
        ? this.shortName(leaderBid.bidder.name)
        : null,
    };
  }

  private shortName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }

  private async sendOutbidEmail(
    bidder: { email: string; name: string },
    itemName: string,
    newPriceCents: number,
    tournamentId: string,
  ): Promise<void> {
    await this.emailService
      .sendMail({
        to: bidder.email,
        subject: `You've been outbid on "${itemName}"`,
        text:
          `Hi ${bidder.name}, someone has placed a higher bid on "${itemName}". ` +
          `The current bid is now $${(newPriceCents / 100).toFixed(2)}. ` +
          `Place a new bid here: ${this.appUrl()}/tournaments/${tournamentId}/auction`,
      })
      .catch((err) => console.warn('Outbid email failed', err));
  }

  private async sendWonEmail(
    bidder: { email: string; name: string },
    itemName: string,
    priceCents: number,
    tournamentId: string,
  ): Promise<void> {
    const b = await this.prisma.tournamentAuctionBidder.findFirst({
      where: { email: bidder.email, auction: { tournamentId } },
    });
    const link = b
      ? this.claimUrl(tournamentId, b.claimToken)
      : `${this.appUrl()}/tournaments/${tournamentId}/auction`;

    await this.emailService
      .sendMail({
        to: bidder.email,
        subject: `You won "${itemName}"!`,
        text:
          `Congratulations ${bidder.name}! You won "${itemName}" with a bid of ` +
          `$${(priceCents / 100).toFixed(2)}. ` +
          `View your items and pay here: ${link}`,
      })
      .catch((err) => console.warn('Won email failed', err));
  }

  private async sendClaimLinkEmail(
    bidder: { email: string; name: string; claimToken: string },
    auctionTitle: string,
    tournamentId: string,
  ): Promise<void> {
    await this.emailService.sendMail({
      to: bidder.email,
      subject: `Your bids for ${auctionTitle}`,
      text:
        `Hi ${bidder.name}, thanks for bidding in ${auctionTitle}. ` +
        `Track your bids and get outbid alerts here: ` +
        `${this.claimUrl(tournamentId, bidder.claimToken)}`,
    });
  }
}
