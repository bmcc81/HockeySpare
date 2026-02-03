import { Body, Controller, Get, Post, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  private readonly requestsService: RequestsService;

  constructor(requestsService: RequestsService) {
  console.log('Injected RequestsService =', requestsService);
  this.requestsService = requestsService;
}

  @Get()
  findAll() {
    return this.requestsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const req = this.requestsService.findOne(id);
    if (!req) throw new NotFoundException('Request not found');
    return req;
  }

  @Post()
  create(@Body() dto: CreateRequestDto) {
    return this.requestsService.create(dto);
  }
}