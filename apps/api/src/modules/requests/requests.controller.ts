import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  list() {
    return this.requestsService.list();
  }

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateRequestDto) {
    const devUserId = 'dev-user-1';
    return this.requestsService.create(devUserId, dto);
  }
}