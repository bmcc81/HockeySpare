import { Body, Controller, Post } from '@nestjs/common';
import { AiService, GenerateSpareMessageResponse } from './ai.service';
import { GenerateSpareMessageDto } from './dto/generate-spare-message.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-spare-message')
  generateSpareMessage(
    @Body() dto: GenerateSpareMessageDto,
  ): Promise<GenerateSpareMessageResponse> {
    return this.aiService.generateSpareMessage(dto);
  }
}