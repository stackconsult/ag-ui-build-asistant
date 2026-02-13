/**
 * WebSocket client for real-time updates from Agent Orchestra backend.
 */

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { config } from './config';
import { useAgentStore } from '../store/agentStore';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface AgentStatusUpdate {
  agentId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  task?: string;
  error?: string;
  progress?: number;
}

export interface WorkflowUpdate {
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  currentStep?: string;
  step?: number;
  totalSteps?: number;
  error?: string;
  results?: any;
}

export interface SystemNotification {
  level: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  persistent?: boolean;
}

class WebSocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private messageQueue: WebSocketMessage[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.disconnect();
        } else {
          this.connect();
        }
      });
    }

    // Handle page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disconnect();
      });
    }
  }

  async connect(): Promise<boolean> {
    if (this.socket?.connected || this.isConnecting) {
      return true;
    }

    if (!config.enableWebSocket) {
      console.log('WebSocket is disabled in configuration');
      return false;
    }

    this.isConnecting = true;

    try {
      const token = localStorage.getItem('access_token');

      this.socket = io(config.wsUrl, {
        auth: token ? { token } : undefined,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupSocketEventHandlers();

      return new Promise((resolve) => {
        this.socket!.once('connect', () => {
          console.log('WebSocket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.processMessageQueue();
          resolve(true);
        });

        this.socket!.once('connect_error', (error) => {
          console.error('WebSocket connection failed:', error);
          this.isConnecting = false;
          resolve(false);
        });
      });
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.isConnecting = false;
      return false;
    }
  }

  private setupSocketEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        this.connect();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection failed:', error);
      this.reconnectAttempts++;
    });

    // Agent Orchestra specific events
    this.socket.on('agent_status_update', (data: AgentStatusUpdate) => {
      this.handleAgentStatusUpdate(data);
    });

    this.socket.on('workflow_update', (data: WorkflowUpdate) => {
      this.handleWorkflowUpdate(data);
    });

    this.socket.on('system_notification', (data: SystemNotification) => {
      this.handleSystemNotification(data);
    });

    this.socket.on('approval_request', (data: any) => {
      this.handleApprovalRequest(data);
    });

    this.socket.on('approval_response', (data: any) => {
      this.handleApprovalResponse(data);
    });

    // Generic message handler
    this.socket.on('message', (message: WebSocketMessage) => {
      this.handleMessage(message);
    });
  }

  private handleAgentStatusUpdate(data: AgentStatusUpdate) {
    const store = useAgentStore.getState();
    store.updateAgentStatus(data.agentId, data.status, data.task, data.error);

    if (data.progress !== undefined) {
      store.updateAgentProgress(data.agentId, data.progress);
    }

    store.addActivity(data.agentId, `Status changed to ${data.status}`, {
      task: data.task,
      error: data.error,
      progress: data.progress,
    });

    // Emit custom event for React components
    this.emit('agent_status_update', data);
  }

  private handleWorkflowUpdate(data: WorkflowUpdate) {
    const store = useAgentStore.getState();

    if (data.status === 'completed' && data.results) {
      store.completeWorkflow(data.workflowId, data.results);
    } else {
      store.updateWorkflowStatus(data.workflowId, data.status, data.currentStep, data.error);
    }

    store.addActivity('workflow', `Workflow ${data.status}`, {
      workflowId: data.workflowId,
      currentStep: data.currentStep,
      step: data.step,
      totalSteps: data.totalSteps,
    });

    this.emit('workflow_update', data);
  }

  private handleSystemNotification(data: SystemNotification) {
    console.log(`System notification [${data.level}]: ${data.title} - ${data.message}`);

    // Show browser notification if permission granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/favicon.ico',
        tag: data.persistent ? 'persistent' : 'temporary',
      });
    }

    // Emit for React components
    this.emit('system_notification', data);
  }

  private handleApprovalRequest(data: any) {
    const store = useAgentStore.getState();
    store.addApprovalRequest({
      actionType: data.action_type,
      description: data.description,
      riskLevel: data.risk_level,
      estimatedCost: data.estimated_cost,
      estimatedDuration: data.estimated_duration,
      agentInvolved: data.agent_involved,
    });

    this.emit('approval_request', data);
  }

  private handleApprovalResponse(data: any) {
    const store = useAgentStore.getState();
    store.resolveApprovalRequest(data.request_id, data.approved);

    this.emit('approval_response', data);
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('Received WebSocket message:', message);
    this.emit('message', message);
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.socket?.connected) {
      const message = this.messageQueue.shift()!;
      this.socket.emit('message', message);
    }
  }

  // Event emitter pattern for React components
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send messages to server
  send(event: string, data: any) {
    const message: WebSocketMessage = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    };

    if (this.socket?.connected) {
      this.socket.emit('message', message);
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);

      // Try to connect if not already connecting
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

// Create singleton instance
export const wsManager = new WebSocketManager();

// React hook for WebSocket integration
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(wsManager.isConnected());

  useEffect(() => {
    // Update connection status
    const updateConnectionStatus = () => setIsConnected(wsManager.isConnected());

    wsManager.on('connect', updateConnectionStatus);
    wsManager.on('disconnect', updateConnectionStatus);

    // Connect on mount
    wsManager.connect();
    wsManager.requestNotificationPermission();

    return () => {
      wsManager.off('connect', updateConnectionStatus);
      wsManager.off('disconnect', updateConnectionStatus);
    };
  }, []);

  return {
    isConnected,
    send: wsManager.send.bind(wsManager),
    on: wsManager.on.bind(wsManager),
    off: wsManager.off.bind(wsManager),
    disconnect: wsManager.disconnect.bind(wsManager),
    connect: wsManager.connect.bind(wsManager),
  };
}

export default wsManager;
