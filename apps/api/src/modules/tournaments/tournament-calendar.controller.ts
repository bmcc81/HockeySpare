import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TournamentsService } from './tournaments.service';
import { buildIcs } from './tournament-calendar';

const DEFAULT_ORIGIN = 'https://hockeyspare.webinkgraphics.com';

/**
 * Public calendar feed: `/api/tournaments/:id/calendar.ics?team=<teamId>`
 * (or `?division=35B`, or neither for the whole tournament). People subscribe
 * to this URL from Google Calendar, Apple Calendar or Outlook.
 */
@Controller('tournaments')
export class TournamentCalendarController {
  constructor(private readonly tournaments: TournamentsService) {}

  @Get(':id/calendar.ics')
  @Header('Cache-Control', 'public, max-age=600')
  async calendar(
    @Param('id') id: string,
    @Query('team') teamId: string | undefined,
    @Query('division') division: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const origin = (process.env.PUBLIC_BASE_URL ?? DEFAULT_ORIGIN).replace(/\/+$/, '');
    // A pasted address often drags a trailing space along; don't fail on it.
    const data = await this.tournaments.getCalendarData(id, teamId?.trim(), division?.trim());

    const calendarName = data.team
      ? `${data.team.name} - ${data.tournament.name}`
      : division
        ? `${data.tournament.name} (${division})`
        : data.tournament.name;

    const ics = buildIcs({
      calendarName,
      tournamentId: data.tournament.id,
      tournamentName: data.tournament.name,
      origin,
      games: data.games,
      venues: data.venues,
      now: new Date(),
    });

    const filename =
      calendarName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60) || 'schedule';

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${filename}.ics"`);
    res.send(ics);
  }
}
