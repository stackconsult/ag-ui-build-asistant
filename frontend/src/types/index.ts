/**
 * Centralized type definitions for the Agent Orchestra frontend.
 */

// Agent Types
export type AgentType = 'repository_analyzer' | 'requirements_extractor' | 'architecture_designer' | 'implementation_planner' | 'validator';
export type AgentStatus = 'idle' | 'running' | 'completed' | 'error';

export interface Agent {
  readonly id: AgentType;
  readonly name: string;
  status: AgentStatus;
  currentTask?: string;
  lastCompleted?: string;
  error?: string;
  progress?: number;
}

// Workflow Types
export type WorkflowType = 'full_analysis' | 'architecture_only' | 'implementation_plan' | 'validation_only';
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'error';

export interface Workflow {
  readonly id: string;
  readonly type: WorkflowType;
  status: WorkflowStatus;
  startTime?: string;
  endTime?: string;
  readonly steps: readonly string[];
  currentStep?: string;
  results?: unknown;
  error?: string;
}

// Approval Types
export type ActionType = 'deployment' | 'critical_change' | 'resource_intensive' | 'multi_agent_workflow';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  readonly id: string;
  readonly actionType: ActionType;
  readonly description: string;
  readonly riskLevel: RiskLevel;
  readonly estimatedCost?: number;
  readonly estimatedDuration?: number;
  readonly agentInvolved?: string;
  status: ApprovalStatus;
  readonly timestamp: string;
}

// Activity Log Types
export interface ActivityLogEntry {
  readonly id: string;
  readonly agentId: AgentType | 'workflow' | 'system';
  readonly action: string;
  readonly timestamp: string;
  readonly details?: Record<string, unknown>;
}

// API Request/Response Types
export interface AgentTaskRequest {
  agent_type: AgentType;
  task_description: string;
  parameters?: Record<string, unknown>;
}

export interface WorkflowRequest {
  workflow_type: WorkflowType;
  repository_path?: string;
  requirements?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface AgentTaskResponse {
  success: boolean;
  agent_type: AgentType;
  task_description: string;
  result?: unknown;
  error?: string;
  timestamp: string;
  execution_time_ms?: number;
}

export interface WorkflowResponse {
  success: boolean;
  workflow_type: WorkflowType;
  results?: Record<string, unknown>;
  error?: string;
  timestamp: string;
  execution_time_ms?: number;
  steps_completed: readonly string[];
}

// UI State Types
export interface UIState {
  readonly isExecuting: boolean;
  readonly currentTask: string | null;
  readonly selectedRepository: string;
  readonly workflowType: WorkflowType;
}

// Configuration Types
export interface AppConfig {
  readonly apiUrl: string;
  readonly copilotkitUrl: string;
  readonly wsUrl: string;
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
  readonly enableWebSocket: boolean;
  readonly enableAnalytics: boolean;
  readonly requestTimeout: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly agentTimeout: number;
  readonly workflowTimeout: number;
  readonly maxMessageLength: number;
  readonly maxTaskDescriptionLength: number;
  readonly maxRepositoryPathLength: number;
}

// Authentication Types
export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly tenantId: string;
  readonly role: string;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
}

// WebSocket Message Types
export interface WebSocketMessage {
  readonly type: string;
  readonly data: unknown;
  readonly timestamp: string;
}

export interface AgentStatusUpdate {
  readonly agentId: AgentType;
  readonly status: AgentStatus;
  readonly task?: string;
  readonly error?: string;
  readonly progress?: number;
}

export interface WorkflowUpdate {
  readonly workflowId: string;
  readonly status: WorkflowStatus;
  readonly currentStep?: string;
  readonly step?: number;
  readonly totalSteps?: number;
  readonly error?: string;
  readonly results?: unknown;
}

export interface SystemNotification {
  readonly level: 'info' | 'warning' | 'error' | 'success';
  readonly title: string;
  readonly message: string;
  readonly persistent?: boolean;
}

// Error Types
export interface ApiError {
  readonly message: string;
  readonly code?: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly retryable: boolean;
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
}

// Form Types
export interface AgentTaskForm {
  agentType: AgentType;
  taskDescription: string;
  parameters: Record<string, unknown>;
}

export interface WorkflowForm {
  workflowType: WorkflowType;
  repositoryPath: string;
  requirements: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Component Props Types
export interface AgentCardProps {
  readonly agent: Agent;
  onExecute?: (agentId: AgentType) => void;
  disabled?: boolean;
}

export interface WorkflowCardProps {
  readonly workflow: Workflow;
  onCancel?: (workflowId: string) => void;
  onViewResults?: (workflowId: string) => void;
}

export interface ApprovalModalProps {
  readonly request: ApprovalRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, reason?: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Hook Return Types
export interface UseAgentOrchestrationReturn {
  readonly executeAgentTask: (params: AgentTaskRequest) => Promise<AgentTaskResponse>;
  readonly executeWorkflow: (params: WorkflowRequest) => Promise<WorkflowResponse>;
  readonly isExecuting: boolean;
  readonly currentTask: AgentTaskRequest | null;
}

export interface UseHumanApprovalReturn {
  readonly requestApproval: (params: ApprovalRequest) => void;
  readonly requestInput: (params: { prompt: string; inputType: string; context?: Record<string, unknown> }) => void;
  readonly pendingApprovals: readonly ApprovalRequest[];
}

export interface UseAuthReturn {
  readonly user: AuthUser | null;
  readonly isAuthenticated: boolean;
  readonly login: (email: string, password: string) => Promise<AuthUser>;
  readonly logout: () => Promise<void>;
  readonly refreshAuth: () => Promise<boolean>;
  readonly getAuthHeaders: () => Record<string, string>;
}

export interface UseWebSocketReturn {
  readonly isConnected: boolean;
  readonly send: (event: string, data: unknown) => void;
  readonly on: (event: string, callback: (data: unknown) => void) => void;
  readonly off: (event: string, callback: (data: unknown) => void) => void;
  readonly disconnect: () => void;
  readonly connect: () => Promise<boolean>;
}

// Store Types
export interface AgentStore {
  // Agents
  readonly agents: readonly Agent[];
  updateAgentStatus: (agentId: AgentType, status: AgentStatus, task?: string, error?: string) => void;
  updateAgentProgress: (agentId: AgentType, progress: number) => void;
  resetAgents: () => void;
  
  // Workflows
  readonly workflows: readonly Workflow[];
  readonly activeWorkflow: Workflow | null;
  startWorkflow: (type: WorkflowType, steps: readonly string[]) => void;
  updateWorkflowStatus: (workflowId: string, status: WorkflowStatus, currentStep?: string, error?: string) => void;
  completeWorkflow: (workflowId: string, results: unknown) => void;
  clearWorkflows: () => void;
  
  // Approvals
  readonly pendingApprovals: readonly ApprovalRequest[];
  addApprovalRequest: (request: Omit<ApprovalRequest, 'id' | 'timestamp' | 'status'>) => void;
  resolveApprovalRequest: (requestId: string, approved: boolean) => void;
  clearApprovals: () => void;
  
  // UI State
  readonly isExecuting: boolean;
  readonly currentTask: string | null;
  setExecuting: (executing: boolean, task?: string) => void;
  
  // Activity Log
  readonly activityLog: readonly ActivityLogEntry[];
  addActivity: (agentId: AgentType | 'workflow' | 'system', action: string, details?: Record<string, unknown>) => void;
  clearActivity: () => void;
}

// Type Guards
export function isAgentType(value: unknown): value is AgentType {
  return typeof value === 'string' && 
    ['repository_analyzer', 'requirements_extractor', 'architecture_designer', 'implementation_planner', 'validator'].includes(value);
}

export function isWorkflowType(value: unknown): value is WorkflowType {
  return typeof value === 'string' && 
    ['full_analysis', 'architecture_only', 'implementation_plan', 'validation_only'].includes(value);
}

export function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === 'string' && 
    ['low', 'medium', 'high', 'critical'].includes(value);
}

export function isApiError(value: unknown): value is ApiError {
  return typeof value === 'object' && value !== null && 
    'message' in value && 
    'retryable' in value;
}

// Constants
export const AGENT_TYPES = ['repository_analyzer', 'requirements_extractor', 'architecture_designer', 'implementation_planner', 'validator'] as const;
export const WORKFLOW_TYPES = ['full_analysis', 'architecture_only', 'implementation_plan', 'validation_only'] as const;
export const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const AGENT_STATUSES = ['idle', 'running', 'completed', 'error'] as const;
export const WORKFLOW_STATUSES = ['pending', 'running', 'completed', 'error'] as const;
