import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ProviderRegistry } from './providers/provider-registry';
import { LlmChunk, LlmRequest } from './interfaces/llm-provider.interface';
import { MODEL_CATALOG, ModelInfo } from './config/model-catalog';

@Injectable()
export class AiService {
  private registry = new ProviderRegistry();

  stream(request: LlmRequest): Observable<LlmChunk> {
    const provider = this.registry.resolve(request.model);
    if (!provider) {
      return new Observable((sub) => {
        sub.next({ type: 'error', content: `No provider found for model: ${request.model}` });
        sub.complete();
      });
    }
    return provider.stream(request);
  }

  async complete(request: LlmRequest): Promise<string> {
    const provider = this.registry.resolve(request.model);
    if (!provider) {
      throw new Error(`No provider found for model: ${request.model}`);
    }
    return provider.complete(request);
  }

  getModels(): ModelInfo[] {
    return MODEL_CATALOG;
  }
}
