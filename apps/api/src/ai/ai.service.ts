import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
    if (!process.env.OPENAI_API_KEY) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is missing from the API environment.',
      );
    }

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
Do not wrap the JSON in markdown.
Do not include explanations.

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

      if (!text) {
        throw new Error('OpenAI returned an empty response.');
      }

      const cleaned = text
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned) as GenerateSpareMessageResponse;

      return {
        title: parsed.title ?? '',
        message: parsed.message ?? '',
        missingFields: Array.isArray(parsed.missingFields)
          ? parsed.missingFields
          : [],
      };
    } catch (error: any) {
      console.error('OpenAI generateSpareMessage failed:', error);

      if (
        error?.status === 429 ||
        error?.code === 'insufficient_quota' ||
        error?.type === 'insufficient_quota'
      ) {
        throw new HttpException(
          {
            message:
              'AI message generation is unavailable because the OpenAI API quota or billing limit has been reached.',
            error: 'OpenAI quota exceeded',
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new InternalServerErrorException(
        'Failed to generate AI spare message',
      );
    }
  }
}
