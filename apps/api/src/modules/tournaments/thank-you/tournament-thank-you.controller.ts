import { Body, Controller, Get, Param, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { SendThankYouDto } from './send-thank-you.dto';
import { TournamentThankYouService } from './tournament-thank-you.service';

interface AuthRequest {
  user?: { id?: string; sub?: string };
}

/** Organizer-only: email everyone who followed a team or volunteered, once, after the final. */
@Controller('tournaments/:id/thank-you')
@UseGuards(JwtAuthGuard)
export class TournamentThankYouController {
  constructor(private readonly thankYou: TournamentThankYouService) {}

  private userId(req: AuthRequest): string {
    const id = req.user?.id ?? req.user?.sub;
    if (!id) throw new UnauthorizedException('Authenticated user id not found');
    return id;
  }

  @Get()
  preview(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.thankYou.preview(this.userId(req), id);
  }

  @Post()
  send(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: SendThankYouDto) {
    return this.thankYou.send(this.userId(req), id, dto.note);
  }
}
