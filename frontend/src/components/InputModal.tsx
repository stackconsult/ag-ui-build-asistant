'use client';
import { useState } from 'react';

interface InputModalProps {
  args: {
    prompt: string;
    input_type: string;
    context?: any;
  };
  respond: (response: any) => void;
  status: string;
}

export function InputModal({ args, respond, status }: InputModalProps) {
  const [inputValue, setInputValue] = useState('');

  if (status !== 'executing') {
    return null;
  }

  const handleSubmit = () => {
    if (args.input_type === 'number') {
      respond({ input: parseFloat(inputValue) });
    } else if (args.input_type === 'boolean') {
      respond({ input: inputValue.toLowerCase() === 'true' });
    } else {
      respond({ input: inputValue });
    }
  };

  const handleCancel = () => {
    respond({ cancelled: true });
  };

  const renderInputField = () => {
    switch (args.input_type) {
      case 'text':
        return (
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            rows={4}
            placeholder="Enter your response..."
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter a number..."
          />
        );

      case 'boolean':
        return (
          <select
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            aria-label="Select boolean option"
          >
            <option value="">Select an option...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'select':
        const options = args.context?.options || [];
        return (
          <select
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            aria-label="Select option from list"
          >
            <option value="">Select an option...</option>
            {options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter your response..."
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Input Required</h3>
        <p className="text-gray-600 mb-4">{args.prompt}</p>

        <div className="mb-4">
          {renderInputField()}
        </div>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
