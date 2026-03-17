import { Observable } from 'rxjs';

export interface LlmChunk {
  type: 'text_delta' | 'thinking_delta' | 'error' | 'done';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface LlmRequest {
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  thinking?: { enabled: boolean; budgetTokens?: number };
  system?: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface LlmProvider {
  readonly providerKey: string;
  stream(request: LlmRequest): Observable<LlmChunk>;
  complete(request: LlmRequest): Promise<string>;
  supportsModel(model: string): boolean;
}
