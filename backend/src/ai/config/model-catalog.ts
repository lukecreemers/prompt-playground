export interface ModelInfo {
  id: string;
  displayName: string;
  provider: string;
  maxOutputTokens: number;
  supportsThinking: boolean;
  inputTokenCost: number;  // cost per 1M tokens in USD
  outputTokenCost: number; // cost per 1M tokens in USD
}

export const MODEL_CATALOG: ModelInfo[] = [
  // Anthropic (direct API)
  {
    id: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    maxOutputTokens: 16384,
    supportsThinking: true,
    inputTokenCost: 3,
    outputTokenCost: 15,
  },
  {
    id: 'claude-haiku-4-5',
    displayName: 'Claude Haiku 4.5',
    provider: 'anthropic',
    maxOutputTokens: 16384,
    supportsThinking: true,
    inputTokenCost: 0.80,
    outputTokenCost: 4,
  },
  {
    id: 'claude-opus-4-6',
    displayName: 'Claude Opus 4.6',
    provider: 'anthropic',
    maxOutputTokens: 16384,
    supportsThinking: true,
    inputTokenCost: 15,
    outputTokenCost: 75,
  },

  // Together AI
  {
    id: 'zai-org/GLM-5',
    displayName: 'GLM-5',
    provider: 'together',
    maxOutputTokens: 8192,
    supportsThinking: false,
    inputTokenCost: 1,
    outputTokenCost: 3.2,
  },
  {
    id: 'Qwen/Qwen3.5-397B-A17B',
    displayName: 'Qwen 3.5 397B',
    provider: 'together',
    maxOutputTokens: 8192,
    supportsThinking: false,
    inputTokenCost: 0.6,
    outputTokenCost: 3.6,
  },
  {
    id: 'deepseek-ai/DeepSeek-V3.1',
    displayName: 'DeepSeek V3.1',
    provider: 'together',
    maxOutputTokens: 8192,
    supportsThinking: false,
    inputTokenCost: 0,
    outputTokenCost: 0,
  },
  {
    id: 'deepseek-ai/DeepSeek-R1',
    displayName: 'DeepSeek R1',
    provider: 'together',
    maxOutputTokens: 8192,
    supportsThinking: false,
    inputTokenCost: 0,
    outputTokenCost: 0,
  },
  {
    id: 'moonshotai/Kimi-K2.5',
    displayName: 'Kimi K2.5',
    provider: 'together',
    maxOutputTokens: 8192,
    supportsThinking: false,
    inputTokenCost: 0.5,
    outputTokenCost: 2.8,
  },
  {
    id: 'openai/gpt-oss-120b',
    displayName: 'GPT OSS 120B',
    provider: 'together',
    maxOutputTokens: 8192,
    supportsThinking: false,
    inputTokenCost: 0.15,
    outputTokenCost: 0.6,
  },
];

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}
