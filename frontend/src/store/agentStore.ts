/**
 * Zustand store for agent orchestration state management.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentTask?: string;
  lastCompleted?: string;
  error?: string;
  progress?: number;
}

export interface Workflow {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: string;
  endTime?: string;
  steps: string[];
  currentStep?: string;
  results?: any;
  error?: string;
}

export interface ApprovalRequest {
  id: string;
  actionType: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost?: number;
  estimatedDuration?: number;
  agentInvolved?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

interface AgentState {
  // Agents
  agents: Agent[];
  updateAgentStatus: (agentId: string, status: Agent['status'], task?: string, error?: string) => void;
  updateAgentProgress: (agentId: string, progress: number) => void;
  resetAgents: () => void;
  
  // Workflows
  workflows: Workflow[];
  activeWorkflow: Workflow | null;
  startWorkflow: (type: string, steps: string[]) => void;
  updateWorkflowStatus: (workflowId: string, status: Workflow['status'], currentStep?: string, error?: string) => void;
  completeWorkflow: (workflowId: string, results: any) => void;
  clearWorkflows: () => void;
  
  // Approvals
  pendingApprovals: ApprovalRequest[];
  addApprovalRequest: (request: Omit<ApprovalRequest, 'id' | 'timestamp' | 'status'>) => void;
  resolveApprovalRequest: (requestId: string, approved: boolean) => void;
  clearApprovals: () => void;
  
  // UI State
  isExecuting: boolean;
  currentTask: string | null;
  setExecuting: (executing: boolean, task?: string) => void;
  
  // Activity Log
  activityLog: Array<{
    id: string;
    agentId: string;
    action: string;
    timestamp: string;
    details?: any;
  }>;
  addActivity: (agentId: string, action: string, details?: any) => void;
  clearActivity: () => void;
}

const initialAgents: Agent[] = [
  { id: 'repository_analyzer', name: 'Repository Analyzer', status: 'idle' },
  { id: 'requirements_extractor', name: 'Requirements Extractor', status: 'idle' },
  { id: 'architecture_designer', name: 'Architecture Designer', status: 'idle' },
  { id: 'implementation_planner', name: 'Implementation Planner', status: 'idle' },
  { id: 'validator', name: 'Validator', status: 'idle' },
];

export const useAgentStore = create<AgentState>()(
  devtools(
    (set, get) => ({
      // Initial state
      agents: initialAgents,
      workflows: [],
      activeWorkflow: null,
      pendingApprovals: [],
      isExecuting: false,
      currentTask: null,
      activityLog: [],

      // Agent actions
      updateAgentStatus: (agentId, status, task, error) =>
        set(
          (state) => ({
            agents: state.agents.map((agent) =>
              agent.id === agentId
                ? { ...agent, status, currentTask: task, error, progress: status === 'completed' ? 100 : 0 }
                : agent
            ),
          }),
          false,
          'updateAgentStatus'
        ),

      updateAgentProgress: (agentId, progress) =>
        set(
          (state) => ({
            agents: state.agents.map((agent) =>
              agent.id === agentId ? { ...agent, progress } : agent
            ),
          }),
          false,
          'updateAgentProgress'
        ),

      resetAgents: () =>
        set(
          { agents: initialAgents },
          false,
          'resetAgents'
        ),

      // Workflow actions
      startWorkflow: (type, steps) => {
        const workflow: Workflow = {
          id: `workflow_${Date.now()}`,
          type,
          status: 'running',
          startTime: new Date().toISOString(),
          steps,
          currentStep: steps[0],
        };
        
        set(
          (state) => ({
            workflows: [...state.workflows, workflow],
            activeWorkflow: workflow,
            isExecuting: true,
            currentTask: `Running ${type} workflow`,
          }),
          false,
          'startWorkflow'
        );
      },

      updateWorkflowStatus: (workflowId, status, currentStep, error) =>
        set(
          (state) => ({
            workflows: state.workflows.map((w) =>
              w.id === workflowId
                ? { ...w, status, currentStep, error, endTime: status === 'completed' || status === 'error' ? new Date().toISOString() : undefined }
                : w
            ),
            activeWorkflow: state.activeWorkflow?.id === workflowId
              ? { ...state.activeWorkflow, status, currentStep, error }
              : state.activeWorkflow,
          }),
          false,
          'updateWorkflowStatus'
        ),

      completeWorkflow: (workflowId, results) =>
        set(
          (state) => ({
            workflows: state.workflows.map((w) =>
              w.id === workflowId
                ? { ...w, status: 'completed', results, endTime: new Date().toISOString() }
                : w
            ),
            activeWorkflow: state.activeWorkflow?.id === workflowId
              ? { ...state.activeWorkflow, status: 'completed', results }
              : state.activeWorkflow,
            isExecuting: false,
            currentTask: null,
          }),
          false,
          'completeWorkflow'
        ),

      clearWorkflows: () =>
        set(
          { workflows: [], activeWorkflow: null },
          false,
          'clearWorkflows'
        ),

      // Approval actions
      addApprovalRequest: (request) => {
        const approval: ApprovalRequest = {
          ...request,
          id: `approval_${Date.now()}`,
          timestamp: new Date().toISOString(),
          status: 'pending',
        };
        
        set(
          (state) => ({
            pendingApprovals: [...state.pendingApprovals, approval],
          }),
          false,
          'addApprovalRequest'
        );
      },

      resolveApprovalRequest: (requestId, approved) =>
        set(
          (state) => ({
            pendingApprovals: state.pendingApprovals.map((req) =>
              req.id === requestId
                ? { ...req, status: approved ? 'approved' : 'rejected' }
                : req
            ),
          }),
          false,
          'resolveApprovalRequest'
        ),

      clearApprovals: () =>
        set(
          { pendingApprovals: [] },
          false,
          'clearApprovals'
        ),

      // UI actions
      setExecuting: (executing, task) =>
        set(
          { isExecuting: executing, currentTask: task || null },
          false,
          'setExecuting'
        ),

      // Activity log actions
      addActivity: (agentId, action, details) => {
        const activity = {
          id: `activity_${Date.now()}`,
          agentId,
          action,
          timestamp: new Date().toISOString(),
          details,
        };
        
        set(
          (state) => ({
            activityLog: [activity, ...state.activityLog.slice(0, 99)], // Keep last 100 activities
          }),
          false,
          'addActivity'
        );
      },

      clearActivity: () =>
        set(
          { activityLog: [] },
          false,
          'clearActivity'
        ),
    }),
    {
      name: 'agent-store',
    }
  )
);

// Selectors for commonly used state combinations
export const useAgentStatuses = () => useAgentStore((state) => state.agents);
export const useActiveWorkflow = () => useAgentStore((state) => state.activeWorkflow);
export const usePendingApprovals = () => useAgentStore((state) => state.pendingApprovals);
export const useActivityLog = () => useAgentStore((state) => state.activityLog);
export const useIsExecuting = () => useAgentStore((state) => state.isExecuting);
