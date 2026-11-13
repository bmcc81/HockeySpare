import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { TournamentsService } from './tournaments.service';
import { buildShareTags, fallbackHtml, injectShareTags } from './tournament-share';

const DEFAULT_ORIGIN = 'https://hockeyspare.webinkgraphics.com';

/**
 * Serves the web app's index.html with the tournament's own link-preview
 * tags, so a pasted `/tournaments/<id>` link shows its name, dates and logo
 * in chats and social apps. nginx sends those page requests here; people
 * still get the normal single-page app.
 */
@Controller('share/tournaments')
export class TournamentShareController {
  constructor(private readonly tournaments: TournamentsService) {}

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=300')
  async share(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const origin = (process.env.PUBLIC_BASE_URL ?? DEFAULT_ORIGIN).replace(/\/+$/, '');
    const indexHtml = await this.readIndexHtml();
    const info = await this.tournaments.getShareInfo(id);

    res.type('html');

    if (!info) {
      // Not a tournament (e.g. /tournaments/new): the plain app page, unchanged.
      res.send(indexHtml ?? '<!doctype html><title>HockeySpare</title>');
      return;
    }

    const tags = buildShareTags(info, origin, `${origin}/images/hockey-share.jpg`);
    res.send(indexHtml ? injectShareTags(indexHtml, tags) : fallbackHtml(tags));
  }

  private async readIndexHtml(): Promise<string | null> {
    const candidates = [
      process.env.WEB_INDEX_PATH ?? '/var/www/hockeyspare/browser/index.html',
      join(process.cwd(), '..', 'web', 'dist', 'hockeyspare-web', 'browser', 'index.html'),
    ];

    for (const candidate of candidates) {
      try {
        return await readFile(candidate, 'utf8');
      } catch {
        // try the next one
      }
    }

    return null;
  }
}
