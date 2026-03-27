import { LlmProvider } from '../interfaces/llm-provider.interface';
import { AnthropicProvider } from './anthropic.provider';
import { OpenAiCompatProvider } from './openai-compat.provider';
import { MODEL_CATALOG } from '../config/model-catalog';

export class ProviderRegistry {
  private providers: Map<string, LlmProvider> = new Map();

  constructor() {
    const anthropic = new AnthropicProvider();
    this.providers.set(anthropic.providerKey, anthropic);

    // Together AI
    const togetherModels = MODEL_CATALOG.filter((m) => m.provider === 'together').map((m) => m.id);
    if (togetherModels.length > 0) {
      const together = new OpenAiCompatProvider({
        providerKey: 'together',
        baseURL: 'https://api.together.xyz/v1',
        apiKeyEnvVar: 'TOGETHER_API_KEY',
        modelIds: togetherModels,
      });
      this.providers.set(together.providerKey, together);
    }
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
