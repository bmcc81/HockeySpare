import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { FollowTeamDto } from './follow-team.dto';
import { TournamentFollowService } from './tournament-follow.service';

/**
 * "Follow this team": email reminders before a team's tournament games.
 * No account needed; the address is confirmed by a link first.
 */
@Controller()
export class TournamentFollowController {
  constructor(private readonly follows: TournamentFollowService) {}

  @Post('tournaments/:id/teams/:teamId/follow')
  @HttpCode(200)
  follow(
    @Param('id') id: string,
    @Param('teamId') teamId: string,
    @Body() dto: FollowTeamDto,
    @Req() req: Request,
  ) {
    return this.follows.follow(id, teamId, dto.email, dto.lang, req.ip);
  }

  // The links in the emails. Both land back on the tournament page with a message.
  @Get('follow/confirm')
  async confirm(@Query('token') token: string | undefined, @Res() res: Response): Promise<void> {
    const tournamentId = token ? await this.follows.confirm(token) : null;
    res.redirect(tournamentId ? `/tournaments/${tournamentId}?follow=confirmed` : '/?follow=invalid');
  }

  @Get('follow/unsubscribe')
  async unsubscribe(@Query('token') token: string | undefined, @Res() res: Response): Promise<void> {
    const tournamentId = token ? await this.follows.unsubscribe(token) : null;
    res.redirect(tournamentId ? `/tournaments/${tournamentId}?follow=unsubscribed` : '/?follow=invalid');
  }
}
