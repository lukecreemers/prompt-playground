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
};
