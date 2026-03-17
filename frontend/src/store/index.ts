import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Prompt, TestCase, ModelInfo, TokenUsage } from '../types';
import { api } from '../lib/api';

interface AppState {
  // Prompts
  prompts: Prompt[];
  activePromptId: string | null;
  activePrompt: Prompt | null;

  // Variables (tester sidebar)
  testerVariables: Record<string, string>;
  drawerOpen: boolean;
  focusVariable: string | null;

  // Test cases
  testCases: Record<string, TestCase>;
  selectedTestCaseIds: Record<string, true>;

  // Stream state
  testerResponse: string;
  testerThinking: string;
  testerStatus: 'idle' | 'running' | 'completed' | 'error';
  testerUsage: TokenUsage | null;
  abortController: AbortController | null;

  // Models
  models: ModelInfo[];

  // Sidebar page
  activePage: 'prompt-tester' | 'agent-tester' | 'benchmarks';
  // Sub-tab within prompt tester page
  activeSubTab: 'tester' | 'test-cases';

  // Actions
  loadPrompts: () => Promise<void>;
  setActivePrompt: (id: string) => Promise<void>;
  createPrompt: () => Promise<void>;
  updatePrompt: (data: Partial<Prompt>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;

  setTesterVariable: (key: string, value: string) => void;
  setTesterVariables: (vars: Record<string, string>) => void;
  saveTesterVariables: () => Promise<void>;
  setDrawerOpen: (open: boolean) => void;
  setFocusVariable: (name: string | null) => void;

  loadTestCases: () => Promise<void>;
  addTestCase: () => Promise<void>;
  updateTestCase: (id: string, data: Partial<TestCase>) => Promise<void>;
  deleteTestCase: (id: string) => Promise<void>;
  deleteAllTestCases: () => Promise<void>;
  toggleTestCaseSelection: (id: string) => void;
  selectAllTestCases: () => void;
  deselectAllTestCases: () => void;
  setTestCaseOutput: (id: string, field: 'output' | 'thinking' | 'evalResult', value: string) => void;
  appendTestCaseOutput: (id: string, field: 'output' | 'thinking', content: string) => void;
  setTestCaseStatus: (id: string, status: TestCase['status']) => void;
  setTestCaseEvalStatus: (id: string, evalStatus: TestCase['evalStatus']) => void;

  setTesterResponse: (text: string) => void;
  appendTesterResponse: (text: string) => void;
  setTesterThinking: (text: string) => void;
  appendTesterThinking: (text: string) => void;
  setTesterStatus: (status: 'idle' | 'running' | 'completed' | 'error') => void;
  setTesterUsage: (usage: TokenUsage | null) => void;
  setAbortController: (controller: AbortController | null) => void;

  loadModels: () => Promise<void>;
  setActivePage: (page: 'prompt-tester' | 'agent-tester' | 'benchmarks') => void;
  setActiveSubTab: (tab: 'tester' | 'test-cases') => void;
  syncVariables: () => Promise<void>;
}

export const useStore = create<AppState>()(
  immer((set, get) => ({
    prompts: [],
    activePromptId: null,
    activePrompt: null,
    testerVariables: {},
    drawerOpen: false,
    focusVariable: null,
    testCases: {},
    selectedTestCaseIds: {},
    testerResponse: '',
    testerThinking: '',
    testerStatus: 'idle',
    testerUsage: null,
    abortController: null,
    models: [],
    activePage: 'prompt-tester',
    activeSubTab: 'tester',

    loadPrompts: async () => {
      const prompts = await api.getPrompts();
      set((s) => { s.prompts = prompts; });
    },

    setActivePrompt: async (id: string) => {
      const prompt = await api.getPrompt(id);
      const vars = await api.getVariables(id);
      const varMap: Record<string, string> = {};
      vars.forEach((v: any) => { varMap[v.key] = v.value; });

      set((s) => {
        s.activePromptId = id;
        s.activePrompt = prompt;
        s.testerVariables = varMap;
        s.testerResponse = '';
        s.testerThinking = '';
        s.testerStatus = 'idle';
        s.testerUsage = null;
      });

      // Load test cases
      get().loadTestCases();
    },

    createPrompt: async () => {
      const prompt = await api.createPrompt({ name: 'Untitled Prompt', content: '' });
      set((s) => { s.prompts.unshift(prompt); });
      await get().setActivePrompt(prompt.id);
    },

    updatePrompt: async (data: Partial<Prompt>) => {
      const id = get().activePromptId;
      if (!id) return;
      const updated = await api.updatePrompt(id, data);
      set((s) => {
        s.activePrompt = updated;
        const idx = s.prompts.findIndex((p) => p.id === id);
        if (idx >= 0) s.prompts[idx] = updated;
      });
    },

    deletePrompt: async (id: string) => {
      await api.deletePrompt(id);
      set((s) => {
        s.prompts = s.prompts.filter((p) => p.id !== id);
        if (s.activePromptId === id) {
          s.activePromptId = null;
          s.activePrompt = null;
          s.testerVariables = {};
          s.testCases = {};
        }
      });
    },

    setTesterVariable: (key, value) => {
      set((s) => { s.testerVariables[key] = value; });
    },

    setTesterVariables: (vars) => {
      set((s) => { s.testerVariables = vars; });
    },

    saveTesterVariables: async () => {
      const id = get().activePromptId;
      if (!id) return;
      const vars = get().testerVariables;
      const arr = Object.entries(vars).map(([key, value]) => ({ key, value }));
      await api.upsertVariables(id, arr);
    },

    setDrawerOpen: (open) => {
      set((s) => { s.drawerOpen = open; });
    },

    setFocusVariable: (name) => {
      set((s) => { s.focusVariable = name; });
    },

    loadTestCases: async () => {
      const id = get().activePromptId;
      if (!id) return;
      const cases = await api.getTestCases(id);
      const map: Record<string, TestCase> = {};
      cases.forEach((tc: TestCase) => { map[tc.id] = tc; });
      set((s) => {
        s.testCases = map;
        s.selectedTestCaseIds = {};
      });
    },

    addTestCase: async () => {
      const id = get().activePromptId;
      if (!id) return;
      const tc = await api.createTestCase(id, {});
      set((s) => { s.testCases[tc.id] = tc; });
    },

    updateTestCase: async (tcId, data) => {
      const updated = await api.updateTestCase(tcId, data);
      set((s) => { s.testCases[tcId] = updated; });
    },

    deleteTestCase: async (tcId) => {
      await api.deleteTestCase(tcId);
      set((s) => {
        delete s.testCases[tcId];
        delete s.selectedTestCaseIds[tcId];
      });
    },

    deleteAllTestCases: async () => {
      const id = get().activePromptId;
      if (!id) return;
      await api.deleteAllTestCases(id);
      set((s) => {
        s.testCases = {};
        s.selectedTestCaseIds = {};
      });
    },

    toggleTestCaseSelection: (tcId) => {
      set((s) => {
        if (s.selectedTestCaseIds[tcId]) {
          delete s.selectedTestCaseIds[tcId];
        } else {
          s.selectedTestCaseIds[tcId] = true;
        }
      });
    },

    selectAllTestCases: () => {
      set((s) => {
        const sel: Record<string, true> = {};
        for (const id of Object.keys(s.testCases)) sel[id] = true;
        s.selectedTestCaseIds = sel;
      });
    },

    deselectAllTestCases: () => {
      set((s) => { s.selectedTestCaseIds = {}; });
    },

    setTestCaseOutput: (tcId, field, value) => {
      set((s) => {
        if (s.testCases[tcId]) {
          (s.testCases[tcId] as any)[field] = value;
        }
      });
    },

    appendTestCaseOutput: (tcId, field, content) => {
      set((s) => {
        if (s.testCases[tcId]) {
          const current = (s.testCases[tcId] as any)[field] || '';
          (s.testCases[tcId] as any)[field] = current + content;
        }
      });
    },

    setTestCaseStatus: (tcId, status) => {
      set((s) => {
        if (s.testCases[tcId]) {
          s.testCases[tcId].status = status;
        }
      });
    },

    setTestCaseEvalStatus: (tcId, evalStatus) => {
      set((s) => {
        if (s.testCases[tcId]) {
          s.testCases[tcId].evalStatus = evalStatus;
        }
      });
    },

    setTesterResponse: (text) => { set((s) => { s.testerResponse = text; }); },
    appendTesterResponse: (text) => { set((s) => { s.testerResponse += text; }); },
    setTesterThinking: (text) => { set((s) => { s.testerThinking = text; }); },
    appendTesterThinking: (text) => { set((s) => { s.testerThinking += text; }); },
    setTesterStatus: (status) => { set((s) => { s.testerStatus = status; }); },
    setTesterUsage: (usage) => { set((s) => { s.testerUsage = usage; }); },
    setAbortController: (controller) => { set((s) => { s.abortController = controller; }); },

    loadModels: async () => {
      const models = await api.getModels();
      set((s) => { s.models = models; });
    },

    setActivePage: (page) => { set((s) => { s.activePage = page; }); },
    setActiveSubTab: (tab) => { set((s) => { s.activeSubTab = tab; }); },

    syncVariables: async () => {
      const id = get().activePromptId;
      if (!id) return;
      const result = await api.syncVariables(id);
      // Reload variables
      const vars = await api.getVariables(id);
      const varMap: Record<string, string> = {};
      vars.forEach((v: any) => { varMap[v.key] = v.value; });
      set((s) => { s.testerVariables = varMap; });
      return result;
    },
  })),
);
