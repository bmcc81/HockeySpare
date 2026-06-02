import { Body, Controller, Post } from '@nestjs/common';
// import { AiService, GenerateSpareMessageResponse } from './ai.service';
import { GenerateSpareMessageDto } from './dto/generate-spare-message.dto';
// import { HelpAnswerResponse } from './dto/help-answer-response.dto';
import { RewriteMessageDto } from './dto/rewrite-message.dto';
import { AskHelpDto } from './dto/ask-help.dto';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate-spare-message')
  generateSpareMessage(@Body() dto: GenerateSpareMessageDto) {
    return this.aiService.generateSpareMessage(dto);
  }

  @Post('help/seed')
  seedHelpArticles() {
    return this.aiService.seedHelpArticles();
  }

  @Post('help/ask')
  askHelp(@Body() dto: AskHelpDto) {
    return this.aiService.askHelp(dto);
  }

  @Post('rewrite-message')
  rewriteMessage(@Body() dto: RewriteMessageDto) {
    return this.aiService.rewriteMessage(dto);
  }
}
