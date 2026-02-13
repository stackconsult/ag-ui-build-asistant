/**
 * API client with comprehensive error handling and retry logic.
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { config } from './config';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
  retryable: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: (string | number)[];
}

class ApiClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor() {
    this.retryConfig = {
      maxAttempts: config.retryAttempts,
      baseDelay: config.retryDelay,
      maxDelay: 30000, // 30 seconds
      backoffFactor: 2,
      retryableErrors: [408, 429, 500, 502, 503, 504, 'ECONNABORTED', 'NETWORK_ERROR'],
    };

    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for debugging
        (config as any).metadata = { startTime: Date.now() };

        return config;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Calculate request duration
        const duration = Date.now() - (response.config as any).metadata?.startTime;
        console.log(`API request completed in ${duration}ms`);

        return response;
      },
      (error) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      return {
        message: data?.message || data?.detail || `HTTP ${status} Error`,
        code: data?.code,
        status,
        details: data,
        retryable: this.isRetryableError(status),
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - no response received',
        code: 'NETWORK_ERROR',
        retryable: true,
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'Unknown error occurred',
        code: error.code,
        retryable: this.isRetryableError(error.code),
      };
    }
  }

  private isRetryableError(error: string | number | undefined): boolean {
    if (!error) return false;
    return this.retryConfig.retryableErrors.includes(error);
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request<T = any>(
    config: any,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<AxiosResponse<T>> {
    const retryConfig = { ...this.retryConfig, ...customRetryConfig };
    let lastError: ApiError = {
      message: 'Unknown error',
      retryable: false,
    };

    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        const response = await this.client.request<T>(config);
        return response;
      } catch (error) {
        lastError = error as ApiError;

        // Don't retry if this is the last attempt or error is not retryable
        if (attempt === retryConfig.maxAttempts || !lastError.retryable) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt);
        console.warn(`Request failed (attempt ${attempt}/${retryConfig.maxAttempts}), retrying in ${delay}ms:`, lastError.message);

        await this.sleep(delay);
      }
    }

    // All attempts failed, throw the last error
    throw lastError;
  }

  // Convenience methods
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  // CopilotKit specific methods with enhanced error handling
  async executeAgentTask(params: any) {
    try {
      const response = await this.post('/copilotkit/actions', {
        name: 'executeAgentTask',
        parameters: params,
      }, {
        timeout: config.agentTimeout,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to execute agent task:', error);
      throw error;
    }
  }

  async executeWorkflow(params: any) {
    try {
      const response = await this.post('/copilotkit/actions', {
        name: 'executeWorkflow',
        parameters: params,
      }, {
        timeout: config.workflowTimeout,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      throw error;
    }
  }

  async sendMessage(messages: any[], context?: any) {
    try {
      const response = await this.post('/copilotkit/messages', {
        messages,
        context,
      });

      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Health check with retry
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', {
        timeout: 5000,
        customRetryConfig: { maxAttempts: 2, baseDelay: 1000 }
      });
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Error boundary for React components
export class ApiErrorBoundary extends Error {
  public readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiErrorBoundary';
    this.apiError = apiError;
  }
}

// Hook for handling API errors in React components
export function useApiErrorHandler() {
  const handleError = (error: ApiError, fallbackMessage?: string) => {
    const message = error.message || fallbackMessage || 'An unexpected error occurred';

    // Log error for debugging
    console.error('API Error:', error);

    // Show user-friendly message
    if (error.status === 401) {
      // Authentication error - redirect to login
      window.location.href = '/login';
      return;
    }

    if (error.status === 403) {
      // Authorization error
      alert('You do not have permission to perform this action.');
      return;
    }

    if (error.retryable) {
      alert(`${message}. The system will retry automatically.`);
    } else {
      alert(message);
    }
  };

  const isRetryableError = (error: any): boolean => {
    return error?.retryable === true;
  };

  return {
    handleError,
    isRetryableError,
  };
}

export default apiClient;
