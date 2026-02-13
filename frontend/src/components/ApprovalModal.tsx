'use client';
import { useState } from 'react';

interface ApprovalModalProps {
  args: {
    action_id: string;
    action_type: string;
    description: string;
    risk_level: string;
    estimated_cost?: number;
    estimated_duration?: number;
    agent_involved?: string;
  };
  respond: (response: any) => void;
  status: string;
}

export function ApprovalModal({ args, respond, status }: ApprovalModalProps) {
  const [reason, setReason] = useState('');

  if (status !== 'executing') {
    return null;
  }

  const handleApprove = () => {
    respond({ approved: true, reason: '' });
  };

  const handleReject = () => {
    respond({ approved: false, reason });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Approval Required</h3>
        
        <div className="space-y-3 mb-4">
          <p><strong>Action:</strong> {args.action_type}</p>
          <p><strong>Description:</strong> {args.description}</p>
          <p><strong>Risk Level:</strong> 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              args.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
              args.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
              args.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {args.risk_level}
            </span>
          </p>
          {args.estimated_cost && (
            <p><strong>Estimated Cost:</strong> ${args.estimated_cost}</p>
          )}
          {args.estimated_duration && (
            <p><strong>Estimated Duration:</strong> {args.estimated_duration} minutes</p>
          )}
          {args.agent_involved && (
            <p><strong>Agent:</strong> {args.agent_involved}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for rejection (optional):
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={3}
            placeholder="Enter reason for rejection..."
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleApprove}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
