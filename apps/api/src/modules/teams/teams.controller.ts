import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
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
import { RespondToGameDto } from './dto/respond-to-game.dto';
import { UpsertPlayerStatDto } from './dto/upsert-player-stat.dto';
import { UpsertMemberFeeDto } from './dto/upsert-member-fee.dto';
import { CreateMyTeamDto } from './dto/create-my-team.dto';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { CreateTeamMessageDto } from './dto/create-team-message.dto';

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
  getMyTeam(@Req() req: any, @Query('teamId') teamId?: string) {
    return this.teamsService.getMyTeam(this.getUserId(req), teamId);
  }

  @Post()
  createMyTeam(@Req() req: any, @Body() dto: CreateMyTeamDto) {
    return this.teamsService.createMyTeam(this.getUserId(req), dto);
  }

  @Patch()
  updateMyTeam(@Req() req: any, @Body() dto: UpdateTeamDto) {
    return this.teamsService.updateMyTeam(this.getUserId(req), dto);
  }

  @Post('members')
  addMember(
    @Req() req: any,
    @Body() dto: CreateTeamMemberDto,
    @Query('teamId') teamId?: string,
  ) {
    return this.teamsService.addMember(this.getUserId(req), dto, teamId);
  }

  @Delete('members/:memberId')
  removeMember(@Req() req: any, @Param('memberId') memberId: string) {
    return this.teamsService.removeMember(this.getUserId(req), memberId);
  }

  @Patch('members/:memberId/role')
  updateMemberRole(
    @Req() req: any,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateTeamMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(
      this.getUserId(req),
      memberId,
      dto,
    );
  }

  @Post('games')
  createGame(@Req() req: any, @Body() dto: CreateTeamGameDto) {
    return this.teamsService.createGame(this.getUserId(req), dto);
  }

  @Post('games/:gameId/notify')
  notifyGame(
    @Req() req: any,
    @Param('gameId') gameId: string,
    @Body() dto: NotifyTeamGameDto,
  ) {
    return this.teamsService.notifyGame(this.getUserId(req), gameId, dto);
  }

  @Post('games/:gameId/availability')
  respondToGame(
    @Req() req: any,
    @Param('gameId') gameId: string,
    @Body() dto: RespondToGameDto,
  ) {
    return this.teamsService.respondToGame(
      this.getUserId(req),
      gameId,
      dto.status,
      dto.note,
    );
  }

  @Get('games/:gameId/availability')
  getGameAvailability(@Req() req: any, @Param('gameId') gameId: string) {
    return this.teamsService.getGameAvailability(this.getUserId(req), gameId);
  }

  @Get('stats/team')
  getTeamStats(@Req() req: any, @Query('teamId') teamId?: string) {
    return this.teamsService.getTeamStats(this.getUserId(req), teamId);
  }

  @Get('stats/me')
  getMyStats(@Req() req: any) {
    return this.teamsService.getMyStats(this.getUserId(req));
  }

  @Post('stats/member/:memberId')
  upsertMemberStats(
    @Req() req: any,
    @Param('memberId') memberId: string,
    @Body() dto: UpsertPlayerStatDto,
    @Query('teamId') teamId?: string,
  ) {
    return this.teamsService.upsertMemberStats(
      this.getUserId(req),
      memberId,
      dto,
      teamId,
    );
  }

  @Get('stats/member/:memberId')
  getMemberStats(
    @Req() req: any,
    @Param('memberId') memberId: string,
    @Query('season') season?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.teamsService.getMemberStats(
      this.getUserId(req),
      memberId,
      season,
      teamId,
    );
  }

  @Get('fees/team')
  getTeamFees(@Req() req: any, @Query('teamId') teamId?: string) {
    return this.teamsService.getTeamFees(this.getUserId(req), teamId);
  }

  @Post('fees/member/:memberId')
  upsertMemberFee(
    @Req() req: any,
    @Param('memberId') memberId: string,
    @Body() dto: UpsertMemberFeeDto,
    @Query('teamId') teamId?: string,
  ) {
    return this.teamsService.upsertMemberFee(
      this.getUserId(req),
      memberId,
      dto,
      teamId,
    );
  }

  @Get('fees/member/:memberId')
  getMemberFee(
    @Req() req: any,
    @Param('memberId') memberId: string,
    @Query('season') season?: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.teamsService.getMemberFee(
      this.getUserId(req),
      memberId,
      season,
      teamId,
    );
  }

  @Post('members/:memberId/link-user')
  linkMemberToUser(@Req() req: any, @Param('memberId') memberId: string) {
    return this.teamsService.linkMemberToUser(this.getUserId(req), memberId);
  }

  @Get('teams')
  listMyTeams(@Req() req: any) {
    return this.teamsService.listMyTeams(this.getUserId(req));
  }

  @Get('messages')
  getTeamMessages(@Req() req: any, @Query('teamId') teamId: string) {
    return this.teamsService.getTeamMessages(this.getUserId(req), teamId);
  }

  @Post('messages')
  createTeamMessage(
    @Req() req: any,
    @Body() dto: CreateTeamMessageDto,
    @Query('teamId') teamId: string,
  ) {
    return this.teamsService.createTeamMessage(
      this.getUserId(req),
      teamId,
      dto,
    );
  }

  @Get('payments/status')
  getPaymentsStatus(@Req() req: any, @Query('teamId') teamId?: string) {
    return this.teamsService.getPaymentsStatus(this.getUserId(req), teamId);
  }

  @Post('payments/connect')
  connectStripeAccount(@Req() req: any, @Query('teamId') teamId?: string) {
    return this.teamsService.connectStripeAccount(this.getUserId(req), teamId);
  }

  @Post('payments/refresh')
  refreshStripeAccountStatus(
    @Req() req: any,
    @Query('teamId') teamId?: string,
  ) {
    return this.teamsService.refreshStripeAccountStatus(
      this.getUserId(req),
      teamId,
    );
  }

  @Post('payments/checkout/:memberFeeId')
  createFeeCheckoutSession(
    @Req() req: any,
    @Param('memberFeeId') memberFeeId: string,
  ) {
    return this.teamsService.createFeeCheckoutSession(
      this.getUserId(req),
      memberFeeId,
    );
  }

  @Get('payments/verify/:sessionId')
  verifyFeeCheckoutSession(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.teamsService.verifyFeeCheckoutSession(
      this.getUserId(req),
      sessionId,
    );
  }
}
