import { Observable } from 'rxjs';
import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider, LlmRequest, LlmChunk } from '../interfaces/llm-provider.interface';
import { MODEL_CATALOG } from '../config/model-catalog';

export class AnthropicProvider implements LlmProvider {
  readonly providerKey = 'anthropic';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  supportsModel(model: string): boolean {
    return MODEL_CATALOG.some((m) => m.id === model && m.provider === 'anthropic');
  }

  stream(request: LlmRequest): Observable<LlmChunk> {
    return new Observable<LlmChunk>((subscriber) => {
      const run = async () => {
        try {
          const params = this.buildParams(request);
          const stream = this.client.messages.stream(params);

          let fullText = '';
          let fullThinking = '';

          stream.on('streamEvent' as any, (event: any) => {
            if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if (delta.type === 'text_delta') {
                fullText += delta.text;
                subscriber.next({ type: 'text_delta', content: delta.text });
              } else if (delta.type === 'thinking_delta') {
                fullThinking += delta.thinking;
                subscriber.next({ type: 'thinking_delta', content: delta.thinking });
              }
            }
          });

          const finalMessage = await stream.finalMessage();
          const usage = finalMessage.usage || {};

          subscriber.next({
            type: 'done',
            content: fullText,
            metadata: { fullText, fullThinking, usage },
          });
          subscriber.complete();
        } catch (error: any) {
          subscriber.next({
            type: 'error',
            content: error.message || 'Unknown error',
          });
          subscriber.complete();
        }
      };

      run();
    });
  }

  async complete(request: LlmRequest): Promise<string> {
    const params = this.buildParams(request);
    const response = await this.client.messages.create(params);

    const textBlocks = (response as any).content.filter((b: any) => b.type === 'text');
    return textBlocks.map((b: any) => b.text).join('');
  }

  private buildParams(request: LlmRequest): any {
    const params: any = {
      model: request.model,
      max_tokens: request.maxTokens,
    };

    // Use multi-turn messages if provided, otherwise wrap single prompt
    if (request.messages && request.messages.length > 0) {
      params.messages = request.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    } else {
      params.messages = [{ role: 'user' as const, content: request.prompt }];
    }

    // Set system prompt if provided
    if (request.system) {
      params.system = request.system;
    }

    if (request.thinking?.enabled) {
      params.temperature = 1;
      params.thinking = {
        type: 'enabled',
        budget_tokens: request.thinking.budgetTokens || Math.min(10000, request.maxTokens - 1000),
      };
    } else {
      params.temperature = request.temperature;
    }

    return params;
  }
}
