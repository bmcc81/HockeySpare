import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, requestId: number, dto: CreateBookingDto) {
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.userId === userId) {
      throw new BadRequestException('You cannot book your own request');
    }

    if (request.status !== 'OPEN') {
      throw new BadRequestException('This request is not open');
    }

    return this.prisma.booking.create({
      data: {
        requestId,
        userId,
        message: dto.message ?? null,
        status: 'PENDING',
      },
    });
  }

  async getMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        request: true,
      },
    });
  }

  async getForOwnedRequests(userId: string) {
    return this.prisma.booking.findMany({
      where: {
        request: {
          userId,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        request: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateStatus(userId: string, bookingId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        request: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.request.userId !== userId) {
      throw new ForbiddenException('You do not own this request');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: dto.status,
      },
      include: {
        request: true,
      },
    });

    if (dto.status === 'CONFIRMED') {
      await this.prisma.request.update({
        where: { id: booking.requestId },
        data: {
          status: 'FILLED',
        },
      });
    }

    return updated;
  }

  async cancelMine(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.userId !== userId) {
      throw new NotFoundException('Booking not found');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}