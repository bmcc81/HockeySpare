import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ScoreSheetsService } from './score-sheets.service';
import { UpdateScoreSheetDto } from './dto/update-score-sheet.dto';
import { UpsertScoreSheetPlayerDto } from './dto/upsert-score-sheet-player.dto';

@Controller('score-sheets')
@UseGuards(JwtAuthGuard)
export class ScoreSheetsController {
  constructor(private readonly scoreSheetsService: ScoreSheetsService) {}

  private getUserId(req: any): string {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user id not found');
    }

    return userId;
  }

  @Get('game/:gameId')
  getByGame(@Req() req: any, @Param('gameId') gameId: string) {
    return this.scoreSheetsService.getByGame(this.getUserId(req), gameId);
  }

  @Post('game/:gameId')
  createForGame(
    @Req() req: any,
    @Param('gameId') gameId: string,
    @Body() dto: UpdateScoreSheetDto,
  ) {
    return this.scoreSheetsService.createForGame(
      this.getUserId(req),
      gameId,
      dto,
    );
  }

  @Patch(':scoreSheetId')
  updateScoreSheet(
    @Req() req: any,
    @Param('scoreSheetId') scoreSheetId: string,
    @Body() dto: UpdateScoreSheetDto,
  ) {
    return this.scoreSheetsService.updateScoreSheet(
      this.getUserId(req),
      scoreSheetId,
      dto,
    );
  }

  @Post(':scoreSheetId/players')
  upsertPlayerLine(
    @Req() req: any,
    @Param('scoreSheetId') scoreSheetId: string,
    @Body() dto: UpsertScoreSheetPlayerDto,
  ) {
    return this.scoreSheetsService.upsertPlayerLine(
      this.getUserId(req),
      scoreSheetId,
      dto,
    );
  }

  @Patch(':scoreSheetId/players/:lineId')
  updatePlayerLine(
    @Req() req: any,
    @Param('scoreSheetId') scoreSheetId: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpsertScoreSheetPlayerDto,
  ) {
    return this.scoreSheetsService.updatePlayerLine(
      this.getUserId(req),
      scoreSheetId,
      lineId,
      dto,
    );
  }

  @Delete(':scoreSheetId/players/:lineId')
  deletePlayerLine(
    @Req() req: any,
    @Param('scoreSheetId') scoreSheetId: string,
    @Param('lineId') lineId: string,
  ) {
    return this.scoreSheetsService.deletePlayerLine(
      this.getUserId(req),
      scoreSheetId,
      lineId,
    );
  }

  @Post(':scoreSheetId/finalize')
  finalizeScoreSheet(
    @Req() req: any,
    @Param('scoreSheetId') scoreSheetId: string,
  ) {
    return this.scoreSheetsService.finalizeScoreSheet(
      this.getUserId(req),
      scoreSheetId,
    );
  }
}