import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { AiService } from '../ai/ai.service';
import { LlmRequest } from '../ai/interfaces/llm-provider.interface';

@Injectable()
export class RunnerService {
  constructor(private readonly ai: AiService) {}

  async runSingle(request: LlmRequest, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    return new Promise<void>((resolve) => {
      const stream$ = this.ai.stream(request);

      const subscription = stream$.subscribe({
        next: (chunk) => {
          switch (chunk.type) {
            case 'text_delta':
              res.write(`event: text\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`);
              break;
            case 'thinking_delta':
              res.write(`event: thinking\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`);
              break;
            case 'done':
              res.write(`event: done\ndata: ${JSON.stringify({ fullText: chunk.content, usage: chunk.metadata?.usage })}\n\n`);
              break;
            case 'error':
              res.write(`event: error\ndata: ${JSON.stringify({ message: chunk.content })}\n\n`);
              break;
          }
        },
        complete: () => {
          res.end();
          resolve();
        },
        error: (err) => {
          res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
          res.end();
          resolve();
        },
      });

      res.on('close', () => {
        subscription.unsubscribe();
        resolve();
      });
    });
  }
}
