import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { isAppAdmin } from '../../common/is-app-admin';
import { EmailService } from '../email/email.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingMessageDto } from './dto/update-booking-message.dto';

type MailError = {
  message?: string;
  code?: string;
  response?: string;
  responseCode?: number;
};

type UpdateBookingStatus = 'CONFIRMED' | 'DECLINED';

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
        date: true,
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

    const bookedByName =
      [bookingUser?.firstName, bookingUser?.lastName]
        .filter(Boolean)
        .join(' ') ||
      bookingUser?.email ||
      'A user';

    const ownerName =
      [request.user?.firstName, request.user?.lastName]
        .filter(Boolean)
        .join(' ') || '';

    const emailTasks: Promise<unknown>[] = [];

    if (request.user?.email) {
      emailTasks.push(
        this.emailService.sendBookingCreatedToRequestOwner({
          to: request.user.email,
          ownerName,
          requestId: request.id,
          teamName: request.teamName ?? null,
          arena: request.arena ?? null,
          date: request.date ? request.date.toISOString().slice(0, 10) : null,
          time: request.time ?? null,
          bookedByName,
        }),
      );
    }

    if (bookingUser?.email) {
      emailTasks.push(
        this.emailService.sendBookingCreatedToBookingUser({
          to: bookingUser.email,
          bookedByName,
          requestId: request.id,
          teamName: request.teamName ?? null,
          arena: request.arena ?? null,
          date: request.date ? request.date.toISOString().slice(0, 10) : null,
          time: request.time ?? null,
        }),
      );
    }

    const emailResults = await Promise.allSettled(emailTasks);

    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const err = result.reason as MailError;

        console.error(`Failed to send booking email ${index + 1}:`, {
          message: err?.message,
          code: err?.code,
          response: err?.response,
          responseCode: err?.responseCode,
        });
      }
    });

    return booking;
  }

  async getMine(userId: string) {
    return this.prisma.booking.findMany({
      where: {
        userId,
      },
      include: {
        request: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(
    userId: string,
    bookingId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const status = dto.status as UpdateBookingStatus;
    const responseMessage = dto.message?.trim() || null;

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        request: {
          select: {
            id: true,
            userId: true,
            teamName: true,
            arena: true,
            date: true,
            time: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (
      booking.request.userId !== userId &&
      !(await isAppAdmin(this.prisma, userId))
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage this booking',
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        responseMessage,
      },
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

    if (status === 'CONFIRMED' && booking.user.email) {
      const bookedByName =
        [booking.user.firstName, booking.user.lastName]
          .filter(Boolean)
          .join(' ') || booking.user.email;

      try {
        await this.emailService.sendBookingConfirmedToBookingUser({
          to: booking.user.email,
          bookedByName,
          requestId: booking.request.id,
          teamName: booking.request.teamName ?? null,
          arena: booking.request.arena ?? null,
          date: booking.request.date
            ? booking.request.date.toISOString().slice(0, 10)
            : null,
          time: booking.request.time ?? null,
          message: responseMessage,
        });
      } catch (error) {
        const err = error as MailError;

        console.error('Failed to send confirmed booking email:', {
          message: err?.message,
          code: err?.code,
          response: err?.response,
          responseCode: err?.responseCode,
        });
      }
    }

    if (status === 'DECLINED' && booking.user.email) {
      const bookedByName =
        [booking.user.firstName, booking.user.lastName]
          .filter(Boolean)
          .join(' ') || booking.user.email;

      try {
        await this.emailService.sendBookingDeclinedToBookingUser({
          to: booking.user.email,
          bookedByName,
          requestId: booking.request.id,
          teamName: booking.request.teamName ?? null,
          arena: booking.request.arena ?? null,
          date: booking.request.date
            ? booking.request.date.toISOString().slice(0, 10)
            : null,
          time: booking.request.time ?? null,
          message: responseMessage,
        });
      } catch (error) {
        const err = error as MailError;

        console.error('Failed to send declined booking email:', {
          message: err?.message,
          code: err?.code,
          response: err?.response,
          responseCode: err?.responseCode,
        });
      }
    }

    return updatedBooking;
  }

  async cancelMine(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (
      booking.userId !== userId &&
      !(await isAppAdmin(this.prisma, userId))
    ) {
      throw new ForbiddenException(
        'You do not have permission to cancel this booking',
      );
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Only pending bookings can be cancelled');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'DECLINED',
      },
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

  async updateMineMessage(
    userId: string,
    bookingId: string,
    dto: UpdateBookingMessageDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (
      booking.userId !== userId &&
      !(await isAppAdmin(this.prisma, userId))
    ) {
      throw new ForbiddenException(
        'You do not have permission to update this booking',
      );
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        message: dto.message?.trim() || null,
      },
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
}
