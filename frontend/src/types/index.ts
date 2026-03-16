export interface Prompt {
  id: string;
  name: string;
  content: string;
  evalPrompt: string | null;
  modelName: string;
  temperature: number;
  maxTokens: number;
  thinkingEnabled: number;
  thinkingBudget: number | null;
  evalModelName: string | null;
  evalTemperature: number | null;
  evalMaxTokens: number | null;
  evalThinkingEnabled: number | null;
  evalThinkingBudget: number | null;
  concurrencyLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTesterVariable {
  id: string;
  promptId: string;
  key: string;
  value: string;
}

export interface TestCase {
  id: string;
  promptId: string;
  variables: string; // JSON string
  output: string | null;
  thinking: string | null;
  evalResult: string | null;
  status: 'idle' | 'running' | 'completed' | 'failed';
  createdAt: string;
}

export interface ModelInfo {
  id: string;
  displayName: string;
  provider: string;
  maxOutputTokens: number;
  supportsThinking: boolean;
}
