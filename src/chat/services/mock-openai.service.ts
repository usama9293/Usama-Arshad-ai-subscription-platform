import { Injectable } from '@nestjs/common';

export interface MockAiResponse {
  answer: string;
  tokensUsed: number;
}

@Injectable()
export class MockOpenAiService {
  async getCompletion(question: string): Promise<MockAiResponse> {
    const delayMs = 500 + Math.random() * 1000;
    await this.sleep(delayMs);

    const answer = `This is a mocked AI response to: "${question}"`;
    const tokensUsed = Math.ceil((question.length + answer.length) / 4);

    return { answer, tokensUsed };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
