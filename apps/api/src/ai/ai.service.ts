import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AskHelpDto } from './dto/ask-help.dto';
import { HOCKEYSPARE_HELP_ARTICLES } from './help-seed';

type HelpSource = {
  id: string;
  title: string;
  category: string | null;
};

type HelpAnswerResponse = {
  answer: string;
  sources: HelpSource[];
};

type OllamaEmbedResponse = {
  embeddings: number[][];
};

type OllamaChatResponse = {
  message?: {
    role: string;
    content: string;
  };
};

@Injectable()
export class AiService {
  private readonly ollamaBaseUrl =
    process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  private readonly chatModel =
    process.env.OLLAMA_CHAT_MODEL || 'llama3.2';

  private readonly embeddingModel =
    process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

  constructor(private readonly prisma: PrismaService) {}

  async seedHelpArticles(): Promise<{ count: number }> {
    let count = 0;

    for (const article of HOCKEYSPARE_HELP_ARTICLES) {
      const existing = await this.prisma.helpArticle.findFirst({
        where: {
          title: article.title,
        },
      });

      const embedding = await this.createEmbedding(
        `${article.title}\n\n${article.content}`,
      );

      if (existing) {
        await this.prisma.helpArticle.update({
          where: { id: existing.id },
          data: {
            content: article.content,
            category: article.category,
            embedding,
          },
        });
      } else {
        await this.prisma.helpArticle.create({
          data: {
            title: article.title,
            content: article.content,
            category: article.category,
            embedding,
          },
        });
      }

      count++;
    }

    return { count };
  }

  async askHelp(dto: AskHelpDto): Promise<HelpAnswerResponse> {
    const question = dto.question.trim();

    if (!question) {
      throw new NotFoundException('Question is required.');
    }

    const questionEmbedding = await this.createEmbedding(question);

    const articles = await this.prisma.helpArticle.findMany();

    if (!articles.length) {
      throw new NotFoundException(
        'No help articles found. Seed the help articles first.',
      );
    }

    const rankedArticles = articles
      .map((article) => {
        const embedding = article.embedding as number[] | null;

        return {
          article,
          score: embedding
            ? this.cosineSimilarity(questionEmbedding, embedding)
            : -1,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (!rankedArticles.length) {
      return {
        answer:
          'I could not find that in the available HockeySpare help content.',
        sources: [],
      };
    }

    const context = rankedArticles
      .map(
        ({ article }) =>
          `Title: ${article.title}\nCategory: ${
            article.category || 'General'
          }\nContent: ${article.content}`,
      )
      .join('\n\n');

    const prompt = `
You are a help assistant for HockeySpare, a hockey team and spare player management app.

Answer the user's question using only the provided context.

User question:
${question}

Context:
${context}

Rules:
- Use only the context provided.
- Do not invent features, permissions, buttons, or workflows.
- If the context does not answer the question, say: "I could not find that in the available HockeySpare help content."
- Keep the answer short and practical.
- Do not include markdown tables.
`;

    const answer = await this.generateChatAnswer(prompt);

    return {
      answer,
      sources: rankedArticles.map(({ article }) => ({
        id: article.id,
        title: article.title,
        category: article.category,
      })),
    };
  }

  private async createEmbedding(text: string): Promise<number[]> {
    const response = await fetch(`${this.ollamaBaseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to create Ollama embedding.',
      );
    }

    const data = (await response.json()) as OllamaEmbedResponse;

    const embedding = data.embeddings?.[0];

    if (!embedding) {
      throw new InternalServerErrorException(
        'Ollama did not return an embedding.',
      );
    }

    return embedding;
  }

  private async generateChatAnswer(prompt: string): Promise<string> {
    const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.chatModel,
        stream: false,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        options: {
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException(
        'Failed to generate Ollama chat answer.',
      );
    }

    const data = (await response.json()) as OllamaChatResponse;

    return data.message?.content?.trim() || '';
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return -1;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    if (magnitudeA === 0 || magnitudeB === 0) {
      return -1;
    }

    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  }
}

// import {
//   HttpException,
//   HttpStatus,
//   Injectable,
//   InternalServerErrorException,
// } from '@nestjs/common';
// import OpenAI from 'openai';
// import { GenerateSpareMessageDto } from './dto/generate-spare-message.dto';

// export interface GenerateSpareMessageResponse {
//   title: string;
//   message: string;
//   missingFields: string[];
// }

// @Injectable()
// export class AiService {
//   private readonly client = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
//   });

//   async generateSpareMessage(
//     dto: GenerateSpareMessageDto,
//   ): Promise<GenerateSpareMessageResponse> {
//     if (process.env.AI_PROVIDER === 'mock') {
//       const positionLabel = dto.position.toLowerCase().replace('_', ' ');
//       const skillLabel = dto.skillLevel.toLowerCase().replace('_', ' ');

//       return {
//         title: `${dto.position} needed ${dto.date}`,
//         message: `${dto.playersNeeded} ${positionLabel}${
//           dto.playersNeeded > 1 ? 's' : ''
//         } needed ${dto.date} at ${dto.time} at ${dto.arena} in ${
//           dto.location
//         } for a ${skillLabel} game. Please reply if available.`,
//         missingFields: [],
//       };
//     }

//     if (!process.env.OPENAI_API_KEY) {
//       throw new InternalServerErrorException(
//         'OPENAI_API_KEY is missing from the API environment.',
//       );
//     }

//     const prompt = `
// You are an AI assistant inside HockeySpare, an app that helps hockey teams find spare players.

// Your task is to generate a clear spare player request.

// Use only the information provided below.

// Request details:
// Position: ${dto.position}
// Players needed: ${dto.playersNeeded}
// Date: ${dto.date}
// Time: ${dto.time}
// Arena: ${dto.arena}
// Location: ${dto.location}
// Skill level: ${dto.skillLevel}
// Notes: ${dto.notes || 'None provided'}

// Rules:
// Do not invent missing details.
// Do not mention payment unless payment is provided.
// Keep the message under 60 words.
// Return JSON only.
// Do not wrap the JSON in markdown.
// Do not include explanations.

// Return this exact JSON shape:
// {
//   "title": "",
//   "message": "",
//   "missingFields": []
// }
// `;

//     try {
//       const response = await this.client.responses.create({
//         model: process.env.OPENAI_MODEL || 'gpt-5.5',
//         input: prompt,
//       });

//       const text = response.output_text;

//       if (!text) {
//         throw new Error('OpenAI returned an empty response.');
//       }

//       const cleaned = text
//         .trim()
//         .replace(/^```json\s*/i, '')
//         .replace(/^```\s*/i, '')
//         .replace(/```$/i, '')
//         .trim();

//       const parsed = JSON.parse(cleaned) as GenerateSpareMessageResponse;

//       return {
//         title: parsed.title ?? '',
//         message: parsed.message ?? '',
//         missingFields: Array.isArray(parsed.missingFields)
//           ? parsed.missingFields
//           : [],
//       };
//     } catch (error: any) {
//       console.error('OpenAI generateSpareMessage failed:', error);

//       if (
//         error?.status === 429 ||
//         error?.code === 'insufficient_quota' ||
//         error?.type === 'insufficient_quota'
//       ) {
//         throw new HttpException(
//           {
//             message:
//               'AI message generation is unavailable because the OpenAI API quota or billing limit has been reached.',
//             error: 'OpenAI quota exceeded',
//             statusCode: HttpStatus.TOO_MANY_REQUESTS,
//           },
//           HttpStatus.TOO_MANY_REQUESTS,
//         );
//       }

//       throw new InternalServerErrorException(
//         'Failed to generate AI spare message',
//       );
//     }
//   }
// }
