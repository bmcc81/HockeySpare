import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { GenerateSpareMessageDto } from './dto/generate-spare-message.dto';

export interface GenerateSpareMessageResponse {
  title: string;
  message: string;
  missingFields: string[];
}

@Injectable()
export class AiService {
  private readonly client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async generateSpareMessage(
    dto: GenerateSpareMessageDto,
  ): Promise<GenerateSpareMessageResponse> {
    const prompt = `
You are an AI assistant inside HockeySpare, an app that helps hockey teams find spare players.

Your task is to generate a clear spare player request.

Use only the information provided below.

Request details:
Position: ${dto.position}
Players needed: ${dto.playersNeeded}
Date: ${dto.date}
Time: ${dto.time}
Arena: ${dto.arena}
Location: ${dto.location}
Skill level: ${dto.skillLevel}
Notes: ${dto.notes || 'None provided'}

Rules:
Do not invent missing details.
Do not mention payment unless payment is provided.
Keep the message under 60 words.
Return JSON only.

Return this exact JSON shape:
{
  "title": "",
  "message": "",
  "missingFields": []
}
`;

    try {
      const response = await this.client.responses.create({
        model: process.env.OPENAI_MODEL || 'gpt-5.5',
        input: prompt,
      });

      const text = response.output_text;

      return JSON.parse(text) as GenerateSpareMessageResponse;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to generate AI spare message',
      );
    }
  }
}