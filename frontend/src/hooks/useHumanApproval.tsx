'use client';
import { useHumanInTheLoop } from '@copilotkit/react-core';
import { useState } from 'react';
import { ApprovalModal } from '../components/ApprovalModal';
import { InputModal } from '../components/InputModal';

interface ApprovalRequest {
  action_id: string;
  action_type: 'deployment' | 'critical_change' | 'resource_intensive' | 'multi_agent_workflow';
  description: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_cost?: number;
  estimated_duration?: number;
  agent_involved?: string;
}

export function useHumanApproval() {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);

  // Human approval for critical actions
  useHumanInTheLoop({
    name: 'requestHumanApproval',
    description: 'Request human approval for critical agent actions',
    parameters: [
      {
        name: 'action_id',
        type: 'string',
        description: 'Unique identifier for the action',
        required: false,
      },
      {
        name: 'action_type',
        type: 'string',
        description: 'Type of action requiring approval',
        required: true,
      },
      {
        name: 'description',
        type: 'string',
        description: 'Detailed description of the action',
        required: true,
      },
      {
        name: 'risk_level',
        type: 'string',
        description: 'Risk level of the action',
        required: true,
      },
      {
        name: 'estimated_cost',
        type: 'number',
        description: 'Estimated cost in USD',
        required: false,
      },
      {
        name: 'estimated_duration',
        type: 'number',
        description: 'Estimated duration in minutes',
        required: false,
      },
      {
        name: 'agent_involved',
        type: 'string',
        description: 'Agent involved in the action',
        required: false,
      },
    ],
    render: ({ args, respond, status }) => {
      return (
        <ApprovalModal
          args={args as any}
          respond={respond as any}
          status={status}
        />
      );
    },
  });

  // Human input for additional information
  useHumanInTheLoop({
    name: 'requestHumanInput',
    description: 'Request human input for agent tasks',
    parameters: [
      {
        name: 'prompt',
        type: 'string',
        description: 'Prompt to show the user',
        required: true,
      },
      {
        name: 'input_type',
        type: 'string',
        description: 'Type of input required',
        required: true,
      },
      {
        name: 'context',
        type: 'object',
        description: 'Additional context',
        required: false,
      },
    ],
    render: ({ args, respond, status }) => {
      return (
        <InputModal
          args={args as any}
          respond={respond as any}
          status={status}
        />
      );
    },
  });

  return {
    pendingApprovals,
  };
}
