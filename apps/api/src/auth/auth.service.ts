import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../modules/email/email.service';
import { welcomeEmail } from './welcome-email';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName?.trim() || null,
        lastName: dto.lastName?.trim() || null,
        appRole: 'USER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        appRole: true,
      },
    });

    await this.linkPendingTeamMemberships(user.id, user.email);

    // Fire and forget: a mail problem must never stop someone from signing up.
    void this.sendWelcomeEmail(user.email, user.firstName, dto.lang);

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn: '7d' },
    );

    return { user, accessToken };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn: '7d' },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        appRole: user.appRole,
      },
    };
  }

  private async sendWelcomeEmail(
    to: string,
    firstName: string | null,
    lang: 'en' | 'fr' | undefined,
  ): Promise<void> {
    try {
      const origin = (process.env.PUBLIC_BASE_URL ?? this.email.getAppUrl()).replace(/\/+$/, '');
      const mail = welcomeEmail({ origin, lang: lang === 'fr' ? 'fr' : 'en', firstName });

      await this.email.sendMail({ to, subject: mail.subject, text: mail.text, html: mail.html });
    } catch (err) {
      this.logger.warn(`Welcome email to ${to} failed: ${(err as Error).message}`);
    }
  }

  private async linkPendingTeamMemberships(
    userId: string,
    email: string,
  ): Promise<void> {
    await this.prisma.teamMember.updateMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        userId: null,
        isActive: true,
      },
      data: {
        userId,
      },
    });
  }
}