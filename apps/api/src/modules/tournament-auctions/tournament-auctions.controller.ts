import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TournamentAuctionsService } from './tournament-auctions.service';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { CreateAuctionItemDto } from './dto/create-auction-item.dto';
import { UpdateAuctionItemDto } from './dto/update-auction-item.dto';
import { PlaceBidDto } from './dto/place-bid.dto';
import { UpdateItemFulfillmentDto } from './dto/update-item-fulfillment.dto';

type AuthRequest = {
  user?: { id?: string; sub?: string };
};

const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

@Controller('tournaments/:tournamentId/auction')
export class TournamentAuctionsController {
  constructor(private readonly auctions: TournamentAuctionsService) {}

  private userId(req: AuthRequest): string {
    const id = req.user?.id ?? req.user?.sub;
    if (!id) {
      throw new UnauthorizedException('Authenticated user id not found');
    }
    return id;
  }

  // --- Public -------------------------------------------------------------

  @Get()
  getPublic(@Param('tournamentId') tournamentId: string) {
    return this.auctions.getPublic(tournamentId);
  }

  @Post('items/:itemId/bids')
  placeBid(
    @Param('tournamentId') tournamentId: string,
    @Param('itemId') itemId: string,
    @Body() dto: PlaceBidDto,
  ) {
    return this.auctions.placeBid(tournamentId, itemId, dto);
  }

  @Get('my-bids')
  myBids(
    @Param('tournamentId') tournamentId: string,
    @Query('token') token?: string,
  ) {
    if (!token) {
      throw new BadRequestException('Missing token.');
    }
    return this.auctions.getMyBids(tournamentId, token);
  }

  @Post('checkout')
  checkout(
    @Param('tournamentId') tournamentId: string,
    @Query('token') token?: string,
  ) {
    if (!token) {
      throw new BadRequestException('Missing token.');
    }
    return this.auctions.startCheckout(tournamentId, token);
  }

  @Get('payments/verify/:sessionId')
  verify(@Param('sessionId') sessionId: string) {
    return this.auctions.verifyCheckoutSession(sessionId);
  }

  // --- Organizer --------------------------------------------------------

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  getAdmin(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
  ) {
    return this.auctions.getAdmin(this.userId(req), tournamentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
    @Body() dto: CreateAuctionDto,
  ) {
    return this.auctions.getOrCreate(this.userId(req), tournamentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  update(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
    @Body() dto: UpdateAuctionDto,
  ) {
    return this.auctions.update(this.userId(req), tournamentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('close')
  close(@Req() req: AuthRequest, @Param('tournamentId') tournamentId: string) {
    return this.auctions.closeAuction(this.userId(req), tournamentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items')
  addItem(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
    @Body() dto: CreateAuctionItemDto,
  ) {
    return this.auctions.addItem(this.userId(req), tournamentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:itemId')
  updateItem(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateAuctionItemDto,
  ) {
    return this.auctions.updateItem(
      this.userId(req),
      tournamentId,
      itemId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:itemId')
  deleteItem(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.auctions.deleteItem(this.userId(req), tournamentId, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('items/:itemId/image')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES } }),
  )
  uploadItemImage(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
    @Param('itemId') itemId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    return this.auctions.uploadItemImage(
      this.userId(req),
      tournamentId,
      itemId,
      file,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('items/:itemId/close')
  closeItem(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.auctions.closeItem(this.userId(req), tournamentId, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:itemId/fulfillment')
  updateFulfillment(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemFulfillmentDto,
  ) {
    return this.auctions.updateItemFulfillment(
      this.userId(req),
      tournamentId,
      itemId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:itemId/bids/:bidId')
  voidBid(
    @Req() req: AuthRequest,
    @Param('tournamentId') tournamentId: string,
    @Param('itemId') itemId: string,
    @Param('bidId') bidId: string,
  ) {
    return this.auctions.voidBid(
      this.userId(req),
      tournamentId,
      itemId,
      bidId,
    );
  }
}
