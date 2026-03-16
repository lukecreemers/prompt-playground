export interface ModelInfo {
  id: string;
  displayName: string;
  provider: string;
  maxOutputTokens: number;
  supportsThinking: boolean;
}

export const MODEL_CATALOG: ModelInfo[] = [
  {
    id: 'claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    maxOutputTokens: 16384,
    supportsThinking: true,
  },
  {
    id: 'claude-haiku-4-5',
    displayName: 'Claude Haiku 4.5',
    provider: 'anthropic',
    maxOutputTokens: 16384,
    supportsThinking: true,
  },
  {
    id: 'claude-opus-4-6',
    displayName: 'Claude Opus 4.6',
    provider: 'anthropic',
    maxOutputTokens: 16384,
    supportsThinking: true,
  },
];

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return MODEL_CATALOG.find((m) => m.id === modelId);
}
