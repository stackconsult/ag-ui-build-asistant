'use client';
import { useFrontendTool } from '@copilotkit/react-core';
import { useState } from 'react';
import axios from 'axios';
import { config } from '@/lib/config';

interface AgentTask {
  agent_type: 'repository_analyzer' | 'requirements_extractor' | 'architecture_designer' | 'implementation_planner' | 'validator';
  task_description: string;
  parameters?: Record<string, any>;
}

export function useAgentOrchestration() {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);

  // Execute a single agent task
  useFrontendTool({
    name: 'executeAgentTask',
    description: 'Execute a specific agent task in the orchestra',
    parameters: [
      {
        name: 'agent_type',
        type: 'string',
        description: 'Type of agent to execute',
        required: true,
      },
      {
        name: 'task_description',
        type: 'string',
        description: 'Description of the task to execute',
        required: true,
      },
      {
        name: 'parameters',
        type: 'object',
        description: 'Additional parameters for the task',
        required: false,
      },
    ],
    handler: async ({ agent_type, task_description, parameters }) => {
      setIsExecuting(true);
      setCurrentTask({ agent_type: agent_type as any, task_description, parameters });

      try {
        const response = await axios.post(`${config.copilotkitUrl}/actions`, {
          name: 'executeAgentTask',
          parameters: {
            agent_type,
            task_description,
            parameters,
          },
        }, {
          timeout: config.requestTimeout,
        });

        return {
          success: true,
          result: response.data,
          agent_type,
          task_description,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          agent_type,
          task_description,
        };
      } finally {
        setIsExecuting(false);
        setCurrentTask(null);
      }
    },
  });

  // Execute multi-agent workflow
  useFrontendTool({
    name: 'executeWorkflow',
    description: 'Execute a complete multi-agent workflow',
    parameters: [
      {
        name: 'workflow_type',
        type: 'string',
        description: 'Type of workflow to execute',
        required: true,
      },
      {
        name: 'repository_path',
        type: 'string',
        description: 'Path to the repository',
        required: false,
      },
      {
        name: 'requirements',
        type: 'string',
        description: 'Requirements for the workflow',
        required: false,
      },
    ],
    handler: async ({ workflow_type, repository_path, requirements }) => {
      setIsExecuting(true);

      try {
        const response = await axios.post(`${config.copilotkitUrl}/actions`, {
          name: 'executeWorkflow',
          parameters: {
            workflow_type,
            repository_path,
            requirements,
          },
        }, {
          timeout: config.requestTimeout,
        });

        return {
          success: true,
          result: response.data,
          workflow_type,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          workflow_type,
        };
      } finally {
        setIsExecuting(false);
      }
    },
  });

  return {
    isExecuting,
    currentTask,
  };
}
