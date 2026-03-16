import { LlmProvider } from '../interfaces/llm-provider.interface';
import { AnthropicProvider } from './anthropic.provider';

export class ProviderRegistry {
  private providers: Map<string, LlmProvider> = new Map();

  constructor() {
    const anthropic = new AnthropicProvider();
    this.providers.set(anthropic.providerKey, anthropic);
  }

  resolve(model: string): LlmProvider | undefined {
    for (const provider of this.providers.values()) {
      if (provider.supportsModel(model)) {
        return provider;
      }
    }
    return undefined;
  }

  getAll(): LlmProvider[] {
    return Array.from(this.providers.values());
  }
}
