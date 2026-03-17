const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

export const api = {
  // Prompts
  getPrompts: () => request<any[]>('/prompts'),
  getPrompt: (id: string) => request<any>(`/prompts/${id}`),
  createPrompt: (data: any) => request<any>('/prompts', { method: 'POST', body: JSON.stringify(data) }),
  updatePrompt: (id: string, data: any) => request<any>(`/prompts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePrompt: (id: string) => request<void>(`/prompts/${id}`, { method: 'DELETE' }),

  // Variables
  getVariables: (promptId: string) => request<any[]>(`/prompts/${promptId}/variables`),
  upsertVariables: (promptId: string, variables: { key: string; value: string }[]) =>
    request<any[]>(`/prompts/${promptId}/variables`, { method: 'PUT', body: JSON.stringify({ variables }) }),

  // Test Cases
  getTestCases: (promptId: string) => request<any[]>(`/prompts/${promptId}/test-cases`),
  createTestCase: (promptId: string, variables?: Record<string, string>) =>
    request<any>(`/prompts/${promptId}/test-cases`, { method: 'POST', body: JSON.stringify({ variables }) }),
  updateTestCase: (id: string, data: any) =>
    request<any>(`/test-cases/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTestCase: (id: string) => request<void>(`/test-cases/${id}`, { method: 'DELETE' }),
  deleteAllTestCases: (promptId: string) => request<void>(`/prompts/${promptId}/test-cases`, { method: 'DELETE' }),
  uploadCsv: async (promptId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE}/prompts/${promptId}/test-cases/csv`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('CSV upload failed');
    return res.json();
  },

  // Sync
  syncVariables: (promptId: string) => request<any>(`/prompts/${promptId}/sync-variables`, { method: 'POST' }),

  // Models
  getModels: () => request<any[]>('/models'),

  // Agents
  getAgents: () => request<any[]>('/agents'),
  getAgent: (id: string) => request<any>(`/agents/${id}`),
  createAgent: (data: any) => request<any>('/agents', { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (id: string, data: any) => request<any>(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAgent: (id: string) => request<void>(`/agents/${id}`, { method: 'DELETE' }),

  // Agent Messages
  getAgentMessages: (agentId: string) => request<any[]>(`/agents/${agentId}/messages`),
  addAgentMessagePair: (agentId: string, assistantContent?: string) =>
    request<any[]>(`/agents/${agentId}/messages`, { method: 'POST', body: JSON.stringify({ assistantContent }) }),
  addAgentMessage: (agentId: string, role: 'user' | 'assistant') =>
    request<any[]>(`/agents/${agentId}/messages`, { method: 'POST', body: JSON.stringify({ role }) }),
  updateAgentMessage: (msgId: string, content: string) =>
    request<any>(`/agent-messages/${msgId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  deleteAgentMessage: (msgId: string) =>
    request<void>(`/agent-messages/${msgId}`, { method: 'DELETE' }),

  // Agent Variables
  getAgentVariables: (agentId: string) => request<any[]>(`/agents/${agentId}/variables`),
  upsertAgentVariables: (agentId: string, variables: { key: string; value: string }[]) =>
    request<any[]>(`/agents/${agentId}/variables`, { method: 'PUT', body: JSON.stringify({ variables }) }),
  syncAgentVariables: (agentId: string) => request<any>(`/agents/${agentId}/sync-variables`, { method: 'POST' }),

  // Code Functions
  getCodeFunctions: () => request<any[]>('/code-functions'),
  getCodeFunction: (id: string) => request<any>(`/code-functions/${id}`),
  createCodeFunction: (data: any) => request<any>('/code-functions', { method: 'POST', body: JSON.stringify(data) }),
  updateCodeFunction: (id: string, data: any) => request<any>(`/code-functions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCodeFunction: (id: string) => request<void>(`/code-functions/${id}`, { method: 'DELETE' }),
  testCodeFunction: (id: string, inputs: Record<string, string>) =>
    request<{ outputs?: Record<string, string>; error?: string }>(`/code-functions/${id}/test`, { method: 'POST', body: JSON.stringify({ inputs }) }),

  // Chains
  getChains: () => request<any[]>('/chains'),
  getChain: (id: string) => request<any>(`/chains/${id}`),
  createChain: (data: any) => request<any>('/chains', { method: 'POST', body: JSON.stringify(data) }),
  updateChain: (id: string, data: any) => request<any>(`/chains/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteChain: (id: string) => request<void>(`/chains/${id}`, { method: 'DELETE' }),
  saveChainGraph: (id: string, data: { nodes: any[]; edges: any[] }) =>
    request<any>(`/chains/${id}/graph`, { method: 'PUT', body: JSON.stringify(data) }),
};
