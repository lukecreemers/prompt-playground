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
  evalStatus: 'idle' | 'running' | 'completed';
  status: 'idle' | 'running' | 'completed' | 'failed';
  durationMs: number | null;
  cost: number | null;
  createdAt: string;
}

export interface ModelInfo {
  id: string;
  displayName: string;
  provider: string;
  maxOutputTokens: number;
  supportsThinking: boolean;
  inputTokenCost: number;
  outputTokenCost: number;
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface Agent {
  id: string;
  name: string;
  systemPrompt: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  thinkingEnabled: number;
  thinkingBudget: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  role: 'user' | 'assistant';
  content: string;
  orderIndex: number;
  createdAt: string;
}

export interface Chain {
  id: string;
  name: string;
  concurrencyLimit: number;
  evalPrompt: string | null;
  evalModelName: string | null;
  evalTemperature: number | null;
  evalMaxTokens: number | null;
  evalThinkingEnabled: number | null;
  evalThinkingBudget: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChainTestCase {
  id: string;
  chainId: string;
  variables: string;
  output: string | null;
  thinking: string | null;
  evalResult: string | null;
  evalStatus: 'idle' | 'running' | 'completed';
  status: 'idle' | 'running' | 'completed' | 'failed';
  durationMs: number | null;
  cost: number | null;
  createdAt: string;
}

export interface ChainNodeData {
  id: string;
  chainId: string;
  type: string;
  positionX: number;
  positionY: number;
  config: string;
  createdAt: string;
}

export interface ChainEdgeData {
  id: string;
  chainId: string;
  sourceNodeId: string;
  sourceHandle: string;
  targetNodeId: string;
  targetHandle: string;
}

export interface ChainDetail extends Chain {
  nodes: ChainNodeData[];
  edges: ChainEdgeData[];
}

export interface CodeFunction {
  id: string;
  name: string;
  code: string;
  inputs: string;
  outputs: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChainNodeConfig_Code {
  codeFunctionId: string;
}

export interface ChainNodeConfig_Variable {
  text: string;
  name: string;
}

export interface ChainNodeConfig_Prompt {
  promptId: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  thinkingEnabled?: number;
  thinkingBudget?: number | null;
}
