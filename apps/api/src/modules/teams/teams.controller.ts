import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TeamsService } from './teams.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { CreateTeamGameDto } from './dto/create-team-game.dto';
import { NotifyTeamGameDto } from './dto/notify-team-game.dto';
import { UpdateTeamDto } from './dto/update-team.dto';  

@Controller('my-team')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  private getUserId(req: any): string {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Authenticated user id not found');
    }

    return userId;
  }

  @Get()
  getMyTeam(@Req() req: any) {
    return this.teamsService.getMyTeam(this.getUserId(req));
  }

  @Post('members')
  addMember(@Req() req: any, @Body() dto: CreateTeamMemberDto) {
    return this.teamsService.addMember(this.getUserId(req), dto);
  }

  @Delete('members/:memberId')
  removeMember(@Req() req: any, @Param('memberId') memberId: string) {
    return this.teamsService.removeMember(this.getUserId(req), memberId);
  }

  @Post('games')
  createGame(@Req() req: any, @Body() dto: CreateTeamGameDto) {
    return this.teamsService.createGame(this.getUserId(req), dto);
  }

  @Patch()
  updateMyTeam(@Req() req: any, @Body() dto: UpdateTeamDto) {
    return this.teamsService.updateMyTeam(this.getUserId(req), dto);
  }

  @Post('games/:gameId/notify')
  notifyGame(
    @Req() req: any,
    @Param('gameId') gameId: string,
    @Body() dto: NotifyTeamGameDto,
  ) {
    return this.teamsService.notifyGame(this.getUserId(req), gameId, dto);
  }
}