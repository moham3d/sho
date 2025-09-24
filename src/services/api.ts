import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAuth } from '../contexts/AuthContext';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const POSTGREST_URL = process.env.REACT_APP_POSTGREST_URL || 'http://localhost:3000';

// Types
interface ApiError {
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
}

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

// Custom API Error Class
class ApiRequestError extends Error {
  constructor(
    public message: string,
    public code?: string,
    public details?: any,
    public status?: number,
    public timestamp: string = new Date().toISOString()
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

// API Client Class
class ApiClient {
  private instance: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(baseURL: string = API_BASE_URL, retryConfig: Partial<RetryConfig> = {}) {
    this.retryConfig = {
      retries: 3,
      retryDelay: 1000,
      retryCondition: (error) => {
        // Retry on network errors or 5xx server errors
        return !error.response || (error.response.status >= 500 && error.response.status < 600);
      },
      ...retryConfig,
    };

    this.instance = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const auth = this.getAuthFromContext();
        if (auth?.tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${auth.tokens.accessToken}`;
        }

        // Add request ID for tracking
        config.metadata = { startTime: Date.now(), requestId: this.generateRequestId() };

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request [${config.metadata.requestId}]:`, {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
            headers: this.sanitizeHeaders(config.headers),
          });
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { metadata } = response.config as any;
        const duration = Date.now() - metadata?.startTime;

        // Log successful response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response [${metadata?.requestId}]:`, {
            status: response.status,
            duration: `${duration}ms`,
            data: this.sanitizeResponseData(response.data),
          });
        }

        // Log slow requests
        if (duration > 5000) {
          console.warn(`⚠️ Slow API Request [${metadata?.requestId}]: ${duration}ms`, {
            method: response.config.method?.toUpperCase(),
            url: response.config.url,
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        const { config, response } = error;
        const { metadata } = config as any;

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ API Error [${metadata?.requestId}]:`, {
            status: response?.status,
            message: error.message,
            data: response?.data,
            duration: metadata?.startTime ? `${Date.now() - metadata.startTime}ms` : 'N/A',
          });
        }

        // Handle token refresh for 401 errors
        if (response?.status === 401 && !config.url?.includes('/auth/refresh')) {
          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && config.headers) {
              config.headers.Authorization = `Bearer ${newToken}`;
              return this.instance(config);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Logout user if refresh fails
            this.logoutUser();
          }
        }

        // Retry logic
        if (this.shouldRetry(error) && this.retryConfig.retries > 0) {
          const retryCount = (config as any)._retryCount || 0;
          if (retryCount < this.retryConfig.retries) {
            (config as any)._retryCount = retryCount + 1;

            const delay = this.retryConfig.retryDelay * Math.pow(2, retryCount); // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));

            console.log(`🔄 Retrying request [${metadata?.requestId}] (attempt ${retryCount + 1})`);
            return this.instance(config);
          }
        }

        // Transform error to consistent format
        const apiError = this.transformError(error);
        return Promise.reject(apiError);
      }
    );
  }

  private getAuthFromContext() {
    // This is a simplified approach - in a real app, you might want to use
    // a more sophisticated method to access the auth context
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useAuth();
    } catch {
      // Not in React context, try to get from localStorage
      const tokens = {
        accessToken: localStorage.getItem('alshorouk_access_token'),
        refreshToken: localStorage.getItem('alshorouk_refresh_token'),
      };
      return { tokens };
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer [REDACTED]';
    }
    return sanitized;
  }

  private sanitizeResponseData(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };

      // Redact sensitive fields
      if (sanitized.password) sanitized.password = '[REDACTED]';
      if (sanitized.accessToken) sanitized.accessToken = '[REDACTED]';
      if (sanitized.refreshToken) sanitized.refreshToken = '[REDACTED]';
      if (sanitized.signatureData) sanitized.signatureData = '[REDACTED]';

      return sanitized;
    }
    return data;
  }

  private shouldRetry(error: AxiosError): boolean {
    return this.retryConfig.retryCondition(error);
  }

  private async refreshAccessToken(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('alshorouk_refresh_token');
      if (!refreshToken) return null;

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const { accessToken } = response.data;
      localStorage.setItem('alshorouk_access_token', accessToken);
      return accessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return null;
    }
  }

  private logoutUser() {
    localStorage.removeItem('alshorouk_access_token');
    localStorage.removeItem('alshorouk_refresh_token');
    localStorage.removeItem('alshorouk_user');
    window.location.href = '/login';
  }

  private transformError(error: AxiosError): ApiRequestError {
    const response = error.response;
    const request = error.request;

    if (response) {
      // Server responded with error status
      const serverError = response.data as any;
      return new ApiRequestError(
        serverError?.message || error.message,
        serverError?.code,
        serverError?.details,
        response.status
      );
    } else if (request) {
      // No response received
      return new ApiRequestError(
        'Network error - No response received from server',
        'NETWORK_ERROR',
        { config: error.config }
      );
    } else {
      // Request setup error
      return new ApiRequestError(
        error.message || 'Request configuration error',
        'REQUEST_ERROR',
        { config: error.config }
      );
    }
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.get(url, config);
    return response;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config);
    return response;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config);
    return response;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data, config);
    return response;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, config);
    return response;
  }

  // Convenience methods for common operations
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.instance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; components: any }> {
    const response = await this.get('/health');
    return response.data;
  }

  // PostgREST specific methods
  async postgrestGet<T = any>(table: string, params?: any): Promise<T[]> {
    const response = await axios.get(`${POSTGREST_URL}/${table}`, {
      params,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('alshorouk_access_token')}`,
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation',
      },
    });
    return Array.isArray(response.data) ? response.data : [response.data];
  }

  async postgrestPost<T = any>(table: string, data: any): Promise<T> {
    const response = await axios.post(`${POSTGREST_URL}/${table}`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('alshorouk_access_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation',
      },
    });
    return Array.isArray(response.data) ? response.data[0] : response.data;
  }

  async postgrestPatch<T = any>(table: string, id: string, data: any): Promise<T> {
    const response = await axios.patch(`${POSTGREST_URL}/${table}?id=eq.${id}`, data, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('alshorouk_access_token')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation',
      },
    });
    return Array.isArray(response.data) ? response.data[0] : response.data;
  }

  async postgrestDelete(table: string, id: string): Promise<void> {
    await axios.delete(`${POSTGREST_URL}/${table}?id=eq.${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('alshorouk_access_token')}`,
        'Prefer': 'return=representation',
      },
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for custom instances
export { ApiClient, ApiRequestError };

// React hook for API calls
export const useApi = () => {
  return {
    get: apiClient.get.bind(apiClient),
    post: apiClient.post.bind(apiClient),
    put: apiClient.put.bind(apiClient),
    patch: apiClient.patch.bind(apiClient),
    delete: apiClient.delete.bind(apiClient),
    upload: apiClient.upload.bind(apiClient),
    healthCheck: apiClient.healthCheck.bind(apiClient),
    postgrest: {
      get: apiClient.postgrestGet.bind(apiClient),
      post: apiClient.postgrestPost.bind(apiClient),
      patch: apiClient.postgrestPatch.bind(apiClient),
      delete: apiClient.postgrestDelete.bind(apiClient),
    },
  };
};

export default apiClient;