import { Body, Controller, Get, Post, Version } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateRequestDto } from './dto/create-request.dto';
import { RequestsService } from './requests.service';

@ApiTags('requests')
@Controller('requests')
@Version('1')
export class RequestsController {
  constructor(private readonly service: RequestsService) {}

  @Get()
  @ApiOkResponse({ description: 'List requests' })
  getAll() {
    return this.service.getAll();
  }

  @Post()
  @ApiCreatedResponse({ description: 'Create a request' })
  create(@Body() dto: CreateRequestDto) {
    return this.service.create(dto);
  }
}
