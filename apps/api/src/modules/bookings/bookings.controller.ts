import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { BookingsService } from './bookings.services';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  private getUserId(req: any): string {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user id not found');
    }

    return userId;
  }

  @Post('requests/:requestId')
  create(
    @Req() req: any,
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(this.getUserId(req), requestId, dto);
  }

  @Get('mine')
  getMine(@Req() req: any) {
    return this.bookingsService.getMine(this.getUserId(req));
  }

  @Get('incoming')
  getIncoming(@Req() req: any) {
    return this.bookingsService.getForOwnedRequests(this.getUserId(req));
  }

  @Patch(':bookingId/status')
  updateStatus(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(this.getUserId(req), bookingId, dto);
  }

  @Patch(':bookingId/cancel')
  cancelMine(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.bookingsService.cancelMine(this.getUserId(req), bookingId);
  }
}