import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Prompt, TestCase, ModelInfo, TokenUsage, Agent, AgentMessage, Chain, ChainDetail, CodeFunction } from '../types';
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { api } from '../lib/api';
import { createSSEStream } from '../lib/sse';

interface CodeAiProposal {
  code: string;
  inputs: string[];
  outputs: string[];
  explanation: string;
}

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

  // Agents
  agents: Agent[];
  activeAgentId: string | null;
  activeAgent: Agent | null;
  agentMessages: AgentMessage[];
  agentVariables: Record<string, string>;
  agentDrawerOpen: boolean;
  agentFocusVariable: string | null;
  agentResponse: string;
  agentThinking: string;
  agentStatus: 'idle' | 'running' | 'completed' | 'error';
  agentUsage: TokenUsage | null;
  agentAbortController: AbortController | null;
  agentGenerations: Array<{ response: string; thinking: string; usage: TokenUsage | null }>;
  agentGenerationIndex: number;

  // Chains
  chains: Chain[];
  activeChainId: string | null;
  activeChain: ChainDetail | null;
  chainNodes: Node[];
  chainEdges: Edge[];
  chainNodeStates: Record<string, { status: string; output: string; thinking: string; error: string | null }>;
  chainStatus: 'idle' | 'running' | 'completed' | 'error';
  chainAbortController: AbortController | null;
  selectedChainNodeId: string | null;

  // Code Functions
  codeFunctions: CodeFunction[];
  activeCodeFunctionId: string | null;
  activeCodeFunction: CodeFunction | null;
  codeFunctionTestInputs: Record<string, string>;
  codeFunctionTestResult: { outputs: Record<string, string> } | null;
  codeFunctionTestError: string | null;
  codeFunctionTestStatus: 'idle' | 'running' | 'completed' | 'error';

  // Code AI Assistant
  codeAiHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  codeAiStatus: 'idle' | 'running' | 'completed' | 'error';
  codeAiAbortController: AbortController | null;
  codeAiModel: string;
  codeAiProposal: CodeAiProposal | null;
  codeAiError: string | null;

  // Sidebar page
  activePage: 'prompt-tester' | 'agent-tester' | 'chains' | 'code-functions' | 'benchmarks';
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
  selectTestCase: (id: string) => void;
  deselectTestCase: (id: string) => void;
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
  setActivePage: (page: 'prompt-tester' | 'agent-tester' | 'chains' | 'code-functions' | 'benchmarks') => void;
  setActiveSubTab: (tab: 'tester' | 'test-cases') => void;
  syncVariables: () => Promise<void>;

  // Agent actions
  loadAgents: () => Promise<void>;
  setActiveAgent: (id: string) => Promise<void>;
  createAgent: () => Promise<void>;
  updateAgent: (data: Partial<Agent>) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;

  loadAgentMessages: () => Promise<void>;
  addAgentMessagePair: (assistantContent?: string) => Promise<void>;
  addAgentUserMessage: () => Promise<void>;
  updateAgentMessage: (msgId: string, content: string) => Promise<void>;
  deleteAgentMessage: (msgId: string) => Promise<void>;
  deleteAgentMessagePair: (msgId1: string, msgId2: string) => Promise<void>;

  setAgentVariable: (key: string, value: string) => void;
  saveAgentVariables: () => Promise<void>;
  syncAgentVariables: () => Promise<void>;
  setAgentDrawerOpen: (open: boolean) => void;
  setAgentFocusVariable: (name: string | null) => void;

  setAgentResponse: (text: string) => void;
  appendAgentResponse: (text: string) => void;
  setAgentThinking: (text: string) => void;
  appendAgentThinking: (text: string) => void;
  setAgentStatus: (status: 'idle' | 'running' | 'completed' | 'error') => void;
  setAgentUsage: (usage: TokenUsage | null) => void;
  setAgentAbortController: (controller: AbortController | null) => void;

  addAgentGeneration: (gen: { response: string; thinking: string; usage: TokenUsage | null }) => void;
  setAgentGenerationIndex: (index: number) => void;
  clearAgentGenerations: () => void;
  acceptAgentResponse: () => Promise<void>;

  // Code Function actions
  loadCodeFunctions: () => Promise<void>;
  setActiveCodeFunction: (id: string) => Promise<void>;
  createCodeFunction: () => Promise<void>;
  updateCodeFunction: (data: Partial<CodeFunction>) => Promise<void>;
  deleteCodeFunction: (id: string) => Promise<void>;
  setCodeFunctionTestInput: (key: string, value: string) => void;
  runCodeFunctionTest: () => Promise<void>;
  sendCodeAiInstruction: (instruction: string) => void;
  cancelCodeAi: () => void;
  acceptCodeAiProposal: () => void;
  rejectCodeAiProposal: () => void;
  setCodeAiModel: (model: string) => void;
  resetCodeAiState: () => void;

  // Chain actions
  loadChains: () => Promise<void>;
  createChain: () => Promise<void>;
  setActiveChain: (id: string) => Promise<void>;
  updateChain: (data: Partial<Chain>) => Promise<void>;
  deleteChain: (id: string) => Promise<void>;
  saveChainGraph: () => Promise<void>;
  setChainNodes: (nodes: Node[]) => void;
  setChainEdges: (edges: Edge[]) => void;
  onChainNodesChange: (changes: NodeChange[]) => void;
  onChainEdgesChange: (changes: EdgeChange[]) => void;
  onChainConnect: (connection: Connection) => void;
  addChainNode: (type: string, position: { x: number; y: number }) => void;
  updateChainNodeConfig: (nodeId: string, config: any) => void;
  removeChainNode: (nodeId: string) => void;
  setChainNodeStatus: (nodeId: string, status: string) => void;
  appendChainNodeOutput: (nodeId: string, content: string) => void;
  appendChainNodeThinking: (nodeId: string, content: string) => void;
  setChainNodeDone: (nodeId: string, output: string) => void;
  setChainNodeError: (nodeId: string, error: string) => void;
  resetChainExecution: () => void;
  stopChainExecution: () => void;
  setChainStatus: (status: 'idle' | 'running' | 'completed' | 'error') => void;
  setChainAbortController: (controller: AbortController | null) => void;
  setSelectedChainNodeId: (id: string | null) => void;
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
    agents: [],
    activeAgentId: null,
    activeAgent: null,
    agentMessages: [],
    agentVariables: {},
    agentDrawerOpen: false,
    agentFocusVariable: null,
    agentResponse: '',
    agentThinking: '',
    agentStatus: 'idle',
    agentUsage: null,
    agentAbortController: null,
    agentGenerations: [],
    agentGenerationIndex: 0,
    codeFunctions: [],
    activeCodeFunctionId: null,
    activeCodeFunction: null,
    codeFunctionTestInputs: {},
    codeFunctionTestResult: null,
    codeFunctionTestError: null,
    codeFunctionTestStatus: 'idle',
    codeAiHistory: [],
    codeAiStatus: 'idle',
    codeAiAbortController: null,
    codeAiModel: 'claude-sonnet-4-6',
    codeAiProposal: null,
    codeAiError: null,
    chains: [],
    activeChainId: null,
    activeChain: null,
    chainNodes: [],
    chainEdges: [],
    chainNodeStates: {},
    chainStatus: 'idle',
    chainAbortController: null,
    selectedChainNodeId: null,
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

    selectTestCase: (tcId) => {
      set((s) => { s.selectedTestCaseIds[tcId] = true; });
    },

    deselectTestCase: (tcId) => {
      set((s) => { delete s.selectedTestCaseIds[tcId]; });
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

    // Agent actions

    loadAgents: async () => {
      const agents = await api.getAgents();
      set((s) => { s.agents = agents; });
    },

    setActiveAgent: async (id: string) => {
      const agent = await api.getAgent(id);
      const messages = await api.getAgentMessages(id);
      const vars = await api.getAgentVariables(id);
      const varMap: Record<string, string> = {};
      vars.forEach((v: any) => { varMap[v.key] = v.value; });

      set((s) => {
        s.activeAgentId = id;
        s.activeAgent = agent;
        s.agentMessages = messages;
        s.agentVariables = varMap;
        s.agentResponse = '';
        s.agentThinking = '';
        s.agentStatus = 'idle';
        s.agentUsage = null;
        s.agentGenerations = [];
        s.agentGenerationIndex = 0;
      });
    },

    createAgent: async () => {
      const agent = await api.createAgent({ name: 'Untitled Agent' });
      set((s) => { s.agents.unshift(agent); });
      await get().setActiveAgent(agent.id);
    },

    updateAgent: async (data: Partial<Agent>) => {
      const id = get().activeAgentId;
      if (!id) return;
      const updated = await api.updateAgent(id, data);
      set((s) => {
        s.activeAgent = updated;
        const idx = s.agents.findIndex((a) => a.id === id);
        if (idx >= 0) s.agents[idx] = updated;
      });
    },

    deleteAgent: async (id: string) => {
      await api.deleteAgent(id);
      set((s) => {
        s.agents = s.agents.filter((a) => a.id !== id);
        if (s.activeAgentId === id) {
          s.activeAgentId = null;
          s.activeAgent = null;
          s.agentMessages = [];
          s.agentVariables = {};
          s.agentGenerations = [];
          s.agentGenerationIndex = 0;
        }
      });
    },

    loadAgentMessages: async () => {
      const id = get().activeAgentId;
      if (!id) return;
      const messages = await api.getAgentMessages(id);
      set((s) => { s.agentMessages = messages; });
    },

    addAgentMessagePair: async (assistantContent?: string) => {
      const id = get().activeAgentId;
      if (!id) return;
      const messages = await api.addAgentMessagePair(id, assistantContent);
      set((s) => { s.agentMessages = messages; });
    },

    addAgentUserMessage: async () => {
      const id = get().activeAgentId;
      if (!id) return;
      const messages = await api.addAgentMessage(id, 'user');
      set((s) => { s.agentMessages = messages; });
    },

    updateAgentMessage: async (msgId: string, content: string) => {
      await api.updateAgentMessage(msgId, content);
      await get().loadAgentMessages();
    },

    deleteAgentMessage: async (msgId: string) => {
      await api.deleteAgentMessage(msgId);
      await get().loadAgentMessages();
    },

    deleteAgentMessagePair: async (msgId1: string, msgId2: string) => {
      await api.deleteAgentMessage(msgId1);
      await api.deleteAgentMessage(msgId2);
      await get().loadAgentMessages();
    },

    setAgentVariable: (key, value) => {
      set((s) => { s.agentVariables[key] = value; });
    },

    saveAgentVariables: async () => {
      const id = get().activeAgentId;
      if (!id) return;
      const vars = get().agentVariables;
      const arr = Object.entries(vars).map(([key, value]) => ({ key, value }));
      await api.upsertAgentVariables(id, arr);
    },

    syncAgentVariables: async () => {
      const id = get().activeAgentId;
      if (!id) return;
      await api.syncAgentVariables(id);
      const vars = await api.getAgentVariables(id);
      const varMap: Record<string, string> = {};
      vars.forEach((v: any) => { varMap[v.key] = v.value; });
      set((s) => { s.agentVariables = varMap; });
    },

    setAgentDrawerOpen: (open) => {
      set((s) => { s.agentDrawerOpen = open; });
    },

    setAgentFocusVariable: (name) => {
      set((s) => { s.agentFocusVariable = name; });
    },

    setAgentResponse: (text) => { set((s) => { s.agentResponse = text; }); },
    appendAgentResponse: (text) => { set((s) => { s.agentResponse += text; }); },
    setAgentThinking: (text) => { set((s) => { s.agentThinking = text; }); },
    appendAgentThinking: (text) => { set((s) => { s.agentThinking += text; }); },
    setAgentStatus: (status) => { set((s) => { s.agentStatus = status; }); },
    setAgentUsage: (usage) => { set((s) => { s.agentUsage = usage; }); },
    setAgentAbortController: (controller) => { set((s) => { s.agentAbortController = controller; }); },

    addAgentGeneration: (gen) => {
      set((s) => {
        s.agentGenerations.push(gen);
        s.agentGenerationIndex = s.agentGenerations.length - 1;
      });
    },

    setAgentGenerationIndex: (index) => {
      set((s) => {
        s.agentGenerationIndex = index;
        const gen = s.agentGenerations[index];
        if (gen) {
          s.agentResponse = gen.response;
          s.agentThinking = gen.thinking;
          s.agentUsage = gen.usage;
        }
      });
    },

    clearAgentGenerations: () => {
      set((s) => {
        s.agentGenerations = [];
        s.agentGenerationIndex = 0;
      });
    },

    acceptAgentResponse: async () => {
      const id = get().activeAgentId;
      const gens = get().agentGenerations;
      const genIdx = get().agentGenerationIndex;
      if (!id || gens.length === 0) return;

      const currentGen = gens[genIdx];
      await api.addAgentMessagePair(id, currentGen.response);
      const messages = await api.getAgentMessages(id);

      set((s) => {
        s.agentMessages = messages;
        s.agentResponse = '';
        s.agentThinking = '';
        s.agentStatus = 'idle';
        s.agentUsage = null;
        s.agentGenerations = [];
        s.agentGenerationIndex = 0;
      });
    },

    // Code Function actions

    loadCodeFunctions: async () => {
      const codeFunctions = await api.getCodeFunctions();
      set((s) => { s.codeFunctions = codeFunctions; });
    },

    setActiveCodeFunction: async (id: string) => {
      const fn = await api.getCodeFunction(id);
      set((s) => {
        s.activeCodeFunctionId = id;
        s.activeCodeFunction = fn;
        s.codeFunctionTestInputs = {};
        s.codeFunctionTestResult = null;
        s.codeFunctionTestError = null;
        s.codeFunctionTestStatus = 'idle';
        // Reset AI state when switching functions
        s.codeAiHistory = [];
        s.codeAiStatus = 'idle';
        s.codeAiProposal = null;
        s.codeAiError = null;
      });
      // Abort any in-flight AI request
      get().codeAiAbortController?.abort();
      set((s) => { s.codeAiAbortController = null; });
    },

    createCodeFunction: async () => {
      const fn = await api.createCodeFunction({ name: 'Untitled Function', code: '', inputs: '[]', outputs: '[]' });
      set((s) => { s.codeFunctions.unshift(fn); });
      await get().setActiveCodeFunction(fn.id);
    },

    updateCodeFunction: async (data: Partial<CodeFunction>) => {
      const id = get().activeCodeFunctionId;
      if (!id) return;
      const updated = await api.updateCodeFunction(id, data);
      set((s) => {
        s.activeCodeFunction = updated;
        const idx = s.codeFunctions.findIndex((f) => f.id === id);
        if (idx >= 0) s.codeFunctions[idx] = updated;
      });
    },

    deleteCodeFunction: async (id: string) => {
      await api.deleteCodeFunction(id);
      set((s) => {
        s.codeFunctions = s.codeFunctions.filter((f) => f.id !== id);
        if (s.activeCodeFunctionId === id) {
          s.activeCodeFunctionId = null;
          s.activeCodeFunction = null;
        }
      });
    },

    setCodeFunctionTestInput: (key, value) => {
      set((s) => { s.codeFunctionTestInputs[key] = value; });
    },

    runCodeFunctionTest: async () => {
      const id = get().activeCodeFunctionId;
      if (!id) return;
      set((s) => {
        s.codeFunctionTestStatus = 'running';
        s.codeFunctionTestResult = null;
        s.codeFunctionTestError = null;
      });
      try {
        const result = await api.testCodeFunction(id, get().codeFunctionTestInputs);
        if (result.error) {
          set((s) => {
            s.codeFunctionTestStatus = 'error';
            s.codeFunctionTestError = result.error!;
          });
        } else {
          set((s) => {
            s.codeFunctionTestStatus = 'completed';
            s.codeFunctionTestResult = { outputs: result.outputs! };
          });
        }
      } catch (err: any) {
        set((s) => {
          s.codeFunctionTestStatus = 'error';
          s.codeFunctionTestError = err.message;
        });
      }
    },

    sendCodeAiInstruction: (instruction: string) => {
      const state = get();
      const fn = state.activeCodeFunction;
      if (!fn) return;

      const controller = new AbortController();
      const currentInputs: string[] = JSON.parse(fn.inputs || '[]');
      const currentOutputs: string[] = JSON.parse(fn.outputs || '[]');
      const history = [...state.codeAiHistory];

      set((s) => {
        s.codeAiStatus = 'running';
        s.codeAiAbortController = controller;
        s.codeAiProposal = null;
        s.codeAiError = null;
        s.codeAiHistory.push({ role: 'user', content: instruction });
      });

      let fullText = '';

      createSSEStream(
        `/api/code-functions/${fn.id}/ai-assist`,
        {
          instruction,
          currentCode: fn.code || '',
          inputs: currentInputs,
          outputs: currentOutputs,
          history,
          model: state.codeAiModel,
        },
        {
          onEvent: (event, data) => {
            if (event === 'text') {
              fullText += data.content;
            } else if (event === 'done') {
              try {
                // Try to parse the full text as JSON
                const parsed = JSON.parse(fullText);
                set((s) => {
                  s.codeAiProposal = {
                    code: parsed.code || '',
                    inputs: parsed.inputs || currentInputs,
                    outputs: parsed.outputs || currentOutputs,
                    explanation: parsed.explanation || 'Changes applied',
                  };
                  s.codeAiStatus = 'completed';
                  s.codeAiHistory.push({ role: 'assistant', content: fullText });
                });
              } catch {
                set((s) => {
                  s.codeAiError = 'Failed to parse AI response as JSON';
                  s.codeAiStatus = 'error';
                });
              }
            } else if (event === 'error') {
              set((s) => {
                s.codeAiError = data.message || 'AI request failed';
                s.codeAiStatus = 'error';
              });
            }
          },
          onError: (err) => {
            set((s) => {
              s.codeAiError = err.message || 'Connection error';
              s.codeAiStatus = 'error';
            });
          },
          onClose: () => {
            set((s) => { s.codeAiAbortController = null; });
          },
        },
        controller.signal,
      );
    },

    cancelCodeAi: () => {
      get().codeAiAbortController?.abort();
      set((s) => {
        s.codeAiStatus = 'idle';
        s.codeAiAbortController = null;
      });
    },

    acceptCodeAiProposal: async () => {
      const proposal = get().codeAiProposal;
      if (!proposal) return;
      await get().updateCodeFunction({
        code: proposal.code,
        inputs: JSON.stringify(proposal.inputs),
        outputs: JSON.stringify(proposal.outputs),
      });
      set((s) => {
        s.codeAiProposal = null;
        s.codeAiStatus = 'idle';
      });
    },

    rejectCodeAiProposal: () => {
      set((s) => {
        s.codeAiProposal = null;
        s.codeAiStatus = 'idle';
      });
    },

    setCodeAiModel: (model: string) => {
      set((s) => { s.codeAiModel = model; });
    },

    resetCodeAiState: () => {
      get().codeAiAbortController?.abort();
      set((s) => {
        s.codeAiHistory = [];
        s.codeAiStatus = 'idle';
        s.codeAiAbortController = null;
        s.codeAiProposal = null;
        s.codeAiError = null;
      });
    },

    // Chain actions

    loadChains: async () => {
      const chains = await api.getChains();
      set((s) => { s.chains = chains; });
    },

    createChain: async () => {
      const chain = await api.createChain({ name: 'Untitled Chain' });
      set((s) => { s.chains.unshift(chain); });
      await get().setActiveChain(chain.id);
    },

    setActiveChain: async (id: string) => {
      const chain = await api.getChain(id);
      const nodes: Node[] = (chain.nodes || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        position: { x: n.positionX, y: n.positionY },
        data: { config: JSON.parse(n.config || '{}') },
      }));
      const edges: Edge[] = (chain.edges || []).map((e: any) => ({
        id: e.id,
        source: e.sourceNodeId,
        sourceHandle: e.sourceHandle,
        target: e.targetNodeId,
        targetHandle: e.targetHandle,
      }));

      set((s) => {
        s.activeChainId = id;
        s.activeChain = chain;
        s.chainNodes = nodes;
        s.chainEdges = edges;
        s.chainNodeStates = {};
        s.chainStatus = 'idle';
      });
    },

    updateChain: async (data: Partial<Chain>) => {
      const id = get().activeChainId;
      if (!id) return;
      const updated = await api.updateChain(id, data);
      set((s) => {
        s.activeChain = { ...s.activeChain!, ...updated };
        const idx = s.chains.findIndex((c) => c.id === id);
        if (idx >= 0) s.chains[idx] = { ...s.chains[idx], ...updated };
      });
    },

    deleteChain: async (id: string) => {
      await api.deleteChain(id);
      set((s) => {
        s.chains = s.chains.filter((c) => c.id !== id);
        if (s.activeChainId === id) {
          s.activeChainId = null;
          s.activeChain = null;
          s.chainNodes = [];
          s.chainEdges = [];
          s.chainNodeStates = {};
        }
      });
    },

    saveChainGraph: async () => {
      const id = get().activeChainId;
      if (!id) return;
      const nodes = get().chainNodes.map((n) => ({
        id: n.id,
        type: n.type!,
        positionX: n.position.x,
        positionY: n.position.y,
        config: JSON.stringify((n.data as any).config || {}),
      }));
      const edges = get().chainEdges.map((e) => ({
        id: e.id,
        sourceNodeId: e.source,
        sourceHandle: e.sourceHandle || 'output',
        targetNodeId: e.target,
        targetHandle: e.targetHandle || 'input',
      }));
      await api.saveChainGraph(id, { nodes, edges });
    },

    setChainNodes: (nodes) => { set((s) => { s.chainNodes = nodes; }); },
    setChainEdges: (edges) => { set((s) => { s.chainEdges = edges; }); },

    onChainNodesChange: (changes) => {
      set((s) => {
        s.chainNodes = applyNodeChanges(changes, s.chainNodes) as Node[];
      });
    },

    onChainEdgesChange: (changes) => {
      set((s) => {
        s.chainEdges = applyEdgeChanges(changes, s.chainEdges) as Edge[];
      });
    },

    onChainConnect: (connection) => {
      set((s) => {
        // Remove existing edge to same target handle (one input allowed)
        s.chainEdges = s.chainEdges.filter(
          (e) => !(e.target === connection.target && e.targetHandle === connection.targetHandle),
        );
        s.chainEdges = addEdge(connection, s.chainEdges);
      });
    },

    addChainNode: (type, position) => {
      const id = crypto.randomUUID();
      const defaultConfig =
        type === 'variable' ? { text: '' }
        : type === 'conditional' ? { conditions: [] }
        : type === 'merge' ? { inputCount: 2 }
        : type === 'code' ? { codeFunctionId: '' }
        : { promptId: '' };
      const newNode: Node = {
        id,
        type,
        position,
        data: { config: defaultConfig },
      };
      set((s) => { s.chainNodes.push(newNode); });
    },

    updateChainNodeConfig: (nodeId, config) => {
      set((s) => {
        const node = s.chainNodes.find((n) => n.id === nodeId);
        if (node) {
          (node.data as any).config = config;
        }
      });
    },

    removeChainNode: (nodeId) => {
      set((s) => {
        s.chainNodes = s.chainNodes.filter((n) => n.id !== nodeId);
        s.chainEdges = s.chainEdges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      });
    },

    setChainNodeStatus: (nodeId, status) => {
      set((s) => {
        if (!s.chainNodeStates[nodeId]) {
          s.chainNodeStates[nodeId] = { status: 'idle', output: '', thinking: '', error: null };
        }
        s.chainNodeStates[nodeId].status = status;
      });
    },

    appendChainNodeOutput: (nodeId, content) => {
      set((s) => {
        if (!s.chainNodeStates[nodeId]) {
          s.chainNodeStates[nodeId] = { status: 'running', output: '', thinking: '', error: null };
        }
        s.chainNodeStates[nodeId].output += content;
      });
    },

    appendChainNodeThinking: (nodeId, content) => {
      set((s) => {
        if (!s.chainNodeStates[nodeId]) {
          s.chainNodeStates[nodeId] = { status: 'running', output: '', thinking: '', error: null };
        }
        s.chainNodeStates[nodeId].thinking += content;
      });
    },

    setChainNodeDone: (nodeId, output) => {
      set((s) => {
        if (!s.chainNodeStates[nodeId]) {
          s.chainNodeStates[nodeId] = { status: 'completed', output, thinking: '', error: null };
        } else {
          s.chainNodeStates[nodeId].status = 'completed';
          s.chainNodeStates[nodeId].output = output;
        }
      });
    },

    setChainNodeError: (nodeId, error) => {
      set((s) => {
        if (!s.chainNodeStates[nodeId]) {
          s.chainNodeStates[nodeId] = { status: 'error', output: '', thinking: '', error };
        } else {
          s.chainNodeStates[nodeId].status = 'error';
          s.chainNodeStates[nodeId].error = error;
        }
      });
    },

    resetChainExecution: () => {
      set((s) => {
        s.chainNodeStates = {};
        s.chainStatus = 'idle';
      });
    },

    stopChainExecution: () => {
      set((s) => {
        for (const nodeId of Object.keys(s.chainNodeStates)) {
          if (s.chainNodeStates[nodeId].status === 'running') {
            s.chainNodeStates[nodeId].status = 'idle';
          }
        }
        s.chainStatus = 'idle';
      });
    },

    setChainStatus: (status) => { set((s) => { s.chainStatus = status; }); },
    setChainAbortController: (controller) => { set((s) => { s.chainAbortController = controller; }); },
    setSelectedChainNodeId: (id) => { set((s) => { s.selectedChainNodeId = id; }); },
  })),
);
