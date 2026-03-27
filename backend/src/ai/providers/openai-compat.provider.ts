import { Observable } from 'rxjs';
import OpenAI from 'openai';
import { LlmProvider, LlmRequest, LlmChunk } from '../interfaces/llm-provider.interface';

interface OpenAiCompatConfig {
  providerKey: string;
  baseURL: string;
  apiKeyEnvVar: string;
  modelIds: string[];
}

export class OpenAiCompatProvider implements LlmProvider {
  readonly providerKey: string;
  private client: OpenAI;
  private modelIds: Set<string>;

  constructor(config: OpenAiCompatConfig) {
    this.providerKey = config.providerKey;
    this.modelIds = new Set(config.modelIds);
    this.client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: process.env[config.apiKeyEnvVar] || '',
    });
  }

  supportsModel(model: string): boolean {
    return this.modelIds.has(model);
  }

  stream(request: LlmRequest): Observable<LlmChunk> {
    return new Observable<LlmChunk>((subscriber) => {
      const controller = new AbortController();

      const run = async () => {
        try {
          const params = this.buildParams(request);
          const stream = await this.client.chat.completions.create(
            { ...params, stream: true, stream_options: { include_usage: true } } as any,
            { signal: controller.signal },
          ) as any;

          let fullText = '';
          let fullThinking = '';
          let lastUsage: any = null;

          for await (const chunk of stream) {
            // Capture usage if present (final chunk has empty choices but includes usage)
            if (chunk.usage) {
              lastUsage = chunk.usage;
            }

            const delta = chunk.choices?.[0]?.delta as any;
            if (!delta) continue;

            // Text content
            if (delta.content) {
              fullText += delta.content;
              subscriber.next({ type: 'text_delta', content: delta.content });
            }

            // Reasoning / thinking content (used by some models like DeepSeek R1, GLM-5)
            const reasoning = delta.reasoning_content || delta.reasoning;
            if (reasoning) {
              fullThinking += reasoning;
              subscriber.next({ type: 'thinking_delta', content: reasoning });
            }
          }

          const usage = lastUsage
            ? { input_tokens: lastUsage.prompt_tokens || 0, output_tokens: lastUsage.completion_tokens || 0 }
            : { input_tokens: 0, output_tokens: 0 };

          subscriber.next({
            type: 'done',
            content: fullText,
            metadata: { fullText, fullThinking, usage },
          });
          subscriber.complete();
        } catch (error: any) {
          if (error.name === 'AbortError') {
            subscriber.complete();
            return;
          }
          subscriber.next({
            type: 'error',
            content: error.message || 'Unknown error',
          });
          subscriber.complete();
        }
      };

      run();

      return () => {
        controller.abort();
      };
    });
  }

  async complete(request: LlmRequest): Promise<string> {
    const params = this.buildParams(request);
    const response = await this.client.chat.completions.create(params);
    return (response as any).choices?.[0]?.message?.content || '';
  }

  private buildParams(request: LlmRequest): any {
    const messages: Array<{ role: string; content: string }> = [];

    if (request.system) {
      messages.push({ role: 'system', content: request.system });
    }

    if (request.messages && request.messages.length > 0) {
      for (const m of request.messages) {
        messages.push({ role: m.role, content: m.content });
      }
    } else {
      messages.push({ role: 'user', content: request.prompt });
    }

    return {
      model: request.model,
      messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    };
  }
}
