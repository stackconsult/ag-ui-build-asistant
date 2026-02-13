'use client';
import { useState, useEffect } from 'react';
import { useAgentOrchestration } from '@/hooks/useAgentOrchestration';
import { useHumanApproval } from '@/hooks/useHumanApproval';
import { PlayIcon, PauseIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  currentTask?: string;
  lastCompleted?: string;
}

export default function AgentOrchestraDashboard() {
  const { isExecuting, currentTask } = useAgentOrchestration();
  const { pendingApprovals } = useHumanApproval();
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'repository_analyzer', name: 'Repository Analyzer', status: 'idle' },
    { id: 'requirements_extractor', name: 'Requirements Extractor', status: 'idle' },
    { id: 'architecture_designer', name: 'Architecture Designer', status: 'idle' },
    { id: 'implementation_planner', name: 'Implementation Planner', status: 'idle' },
    { id: 'validator', name: 'Validator', status: 'idle' },
  ]);

  const [selectedRepository, setSelectedRepository] = useState('');
  const [workflowType, setWorkflowType] = useState('full_analysis');

  useEffect(() => {
    // Update agent status based on current task
    if (currentTask) {
      setAgents(prev => prev.map(agent =>
        agent.id === currentTask.agent_type
          ? { ...agent, status: 'running', currentTask: currentTask.task_description }
          : agent
      ));
    }
  }, [currentTask]);

  const handleExecuteWorkflow = () => {
    // The workflow will be executed through CopilotKit's chat interface
    console.log('Workflow execution initiated through CopilotKit');
  };

  const handleSingleAgentTask = (agentType: string) => {
    // The agent task will be executed through CopilotKit's chat interface
    console.log(`Agent ${agentType} task initiated through CopilotKit`);
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'running':
        return <PlayIcon className="w-5 h-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <PauseIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Orchestra Dashboard</h1>
          <p className="text-gray-600">Orchestrate AI agents for intelligent software development</p>
        </div>

        {pendingApprovals.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {pendingApprovals.length} approval{pendingApprovals.length > 1 ? 's' : ''} pending
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Agent Status</h2>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(agent.status)}
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      {agent.currentTask && (
                        <p className="text-sm text-gray-600">{agent.currentTask}</p>
                      )}
                      {agent.lastCompleted && (
                        <p className="text-xs text-gray-500">
                          Last completed: {new Date(agent.lastCompleted).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSingleAgentTask(agent.id)}
                    disabled={isExecuting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Execute
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Workflow Control</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Path
                </label>
                <input
                  type="text"
                  value={selectedRepository}
                  onChange={(e) => setSelectedRepository(e.target.value)}
                  placeholder="/path/to/repository"
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workflow Type
                </label>
                <select
                  value={workflowType}
                  onChange={(e) => setWorkflowType(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  aria-label="Select workflow type"
                >
                  <option value="full_analysis">Full Analysis</option>
                  <option value="architecture_only">Architecture Only</option>
                  <option value="implementation_plan">Implementation Plan</option>
                  <option value="validation_only">Validation Only</option>
                </select>
              </div>

              <button
                onClick={handleExecuteWorkflow}
                disabled={isExecuting || !selectedRepository}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isExecuting ? 'Executing...' : 'Execute Workflow'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
          <div className="space-y-2">
            {agents.filter(a => a.lastCompleted).map((agent) => (
              <div key={agent.id} className="flex items-center space-x-2 text-sm">
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
                <span className="font-medium">{agent.name}</span>
                <span className="text-gray-600">completed task</span>
                <span className="text-gray-500">
                  {agent.lastCompleted && new Date(agent.lastCompleted).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {agents.filter(a => a.lastCompleted).length === 0 && (
              <p className="text-gray-500 text-sm">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
