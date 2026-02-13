/**
 * Configuration management for the frontend application.
 * Uses environment variables with fallbacks for development.
 */

export const config = {
  // API URLs
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
  copilotkitUrl: process.env.NEXT_PUBLIC_COPKIT_URL ?? 'http://localhost:8000/copilotkit',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws',

  // Environment
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Feature Flags
  enableWebSocket: process.env.NEXT_PUBLIC_ENABLE_WEBSOCKET === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',

  // Timeouts and Limits
  requestTimeout: 300000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000, // 1 second

  // Agent Configuration
  agentTimeout: 300000, // 5 minutes per agent
  workflowTimeout: 1800000, // 30 minutes for workflows

  // UI Configuration
  maxMessageLength: 1000,
  maxTaskDescriptionLength: 500,
  maxRepositoryPathLength: 255,
} as const;

// Validation functions
export const validateConfig = () => {
  const errors: string[] = [];

  if (!config.apiUrl) {
    errors.push('API URL is required');
  }

  if (!config.copilotkitUrl) {
    errors.push('CopilotKit URL is required');
  }

  if (config.isDevelopment && !config.apiUrl.includes('localhost')) {
    console.warn('Running in development mode but API URL is not localhost');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }

  return true;
};

export default config;
