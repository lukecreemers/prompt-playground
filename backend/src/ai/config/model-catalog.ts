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
];

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}
