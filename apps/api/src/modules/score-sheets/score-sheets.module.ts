import { Module } from '@nestjs/common';
import { ScoreSheetsController } from './score-sheets.controller';
import { ScoreSheetsService } from './score-sheets.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ScoreSheetsController],
  providers: [ScoreSheetsService, PrismaService],
})
export class ScoreSheetsModule {}