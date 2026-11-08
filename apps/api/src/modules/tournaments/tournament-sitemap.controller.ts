import { Controller, Get, Header } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { buildSitemapXml } from './tournament-sitemap';

const DEFAULT_ORIGIN = 'https://hockeyspare.webinkgraphics.com';

/**
 * The sitemap Google reads (robots.txt points here), so every tournament page
 * is listed automatically as soon as it is created.
 */
@Controller('sitemap.xml')
export class TournamentSitemapController {
  constructor(private readonly tournaments: TournamentsService) {}

  @Get()
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  async sitemap(): Promise<string> {
    const origin = process.env.PUBLIC_BASE_URL ?? DEFAULT_ORIGIN;
    return buildSitemapXml(origin, await this.tournaments.listForSitemap());
  }
}
