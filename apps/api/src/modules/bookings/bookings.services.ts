import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { EmailService } from '../../email/email.service';
import { MailError } from '@hockeyspare/contracts';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

async create(userId: string, requestId: number, dto: CreateBookingDto) {
  
    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        userId: true,
        status: true,
        teamName: true,
        arena: true,
        time: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
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

    const existingBooking = await this.prisma.booking.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId,
        },
      },
    });

    if (existingBooking) {
      throw new BadRequestException('You have already booked this request');
    }

    const bookingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    const booking = await this.prisma.booking.create({
      data: {
        requestId,
        userId,
        message: dto.message ?? null,
        status: 'PENDING',
      },
    });

    if (request.user?.email) {
      const bookedByName =
        [bookingUser?.firstName, bookingUser?.lastName].filter(Boolean).join(' ') ||
        bookingUser?.email ||
        'A user';

      const ownerName =
        [request.user.firstName, request.user.lastName].filter(Boolean).join(' ') || '';

      try {

        await this.emailService.sendBookingCreatedToRequestOwner({
          to: request.user.email,
          ownerName,
          requestId: request.id,
          teamName: request.teamName ?? null,
          arena: request.arena ?? null,
          time: request.time ?? null,
          bookedByName,
        });
      } catch (error) {
        const err = error as MailError;
        console.error('Failed to send booking email:',  {
          message: err?.message,
          code: err?.code,
          response: err?.response,
          responseCode: err?.responseCode,
        });
      }
    }

    return booking;
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