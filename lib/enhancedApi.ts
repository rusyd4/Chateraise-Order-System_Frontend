import { toast } from 'sonner';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Error types
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  OFFLINE_ERROR = 'OFFLINE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  message: string;
  code: ErrorCode;
  statusCode?: number;
  details?: any;
  retryable?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code: string;
    statusCode: number;
    details?: any;
  };
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  showToast?: boolean;
  skipAuth?: boolean;
  onRetry?: (attempt: number, error: ApiError) => void;
}

class EnhancedApiClient {
  private isOnline: boolean = true;
  private requestQueue: Array<() => Promise<any>> = [];

  constructor() {
    this.setupOnlineListener();
  }

  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  private async processQueue() {
    while (this.requestQueue.length > 0 && this.isOnline) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queue request failed:', error);
        }
      }
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private parseError(response: Response, data: any): ApiError {
    let code = ErrorCode.UNKNOWN_ERROR;
    let message = 'Terjadi kesalahan yang tidak diketahui';
    let retryable = false;

    if (!response.ok) {
      switch (response.status) {
        case 400:
          code = ErrorCode.VALIDATION_ERROR;
          message = 'Data yang dikirim tidak valid';
          break;
        case 401:
          code = ErrorCode.AUTHENTICATION_ERROR;
          message = 'Sesi Anda telah berakhir. Silakan login kembali';
          this.handleAuthError();
          break;
        case 403:
          code = ErrorCode.AUTHORIZATION_ERROR;
          message = 'Anda tidak memiliki akses untuk melakukan tindakan ini';
          break;
        case 429:
          code = ErrorCode.RATE_LIMIT_ERROR;
          message = 'Terlalu banyak request. Silakan coba lagi nanti';
          retryable = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          code = ErrorCode.SERVER_ERROR;
          message = 'Server mengalami gangguan. Silakan coba lagi nanti';
          retryable = true;
          break;
        default:
          message = 'Terjadi kesalahan pada server';
      }
    }

    // Override dengan message dari server jika ada
    if (data?.error?.message) {
      message = data.error.message;
    }

    // Override dengan error code dari server jika ada
    if (data?.error?.code) {
      // Map server error codes jika perlu
      switch (data.error.code) {
        case 'INVALID_CREDENTIALS':
          code = ErrorCode.AUTHENTICATION_ERROR;
          break;
        case 'MISSING_REQUIRED_FIELDS':
        case 'VALIDATION_ERROR':
          code = ErrorCode.VALIDATION_ERROR;
          break;
        // Tambahkan mapping lainnya sesuai kebutuhan
      }
    }

    return {
      message,
      code,
      statusCode: response.status,
      details: data?.error?.details,
      retryable
    };
  }

  private handleAuthError() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('full_name');
      
      // Redirect ke login jika bukan di halaman login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private showErrorToast(error: ApiError) {
    toast.error(error.message, {
      description: error.code === ErrorCode.SERVER_ERROR 
        ? 'Tim teknis kami sedang menangani masalah ini' 
        : undefined,
      action: error.retryable ? {
        label: 'Coba Lagi',
        onClick: () => {} // Will be handled by retry logic
      } : undefined
    });
  }

  public async request<T = any>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      timeout = 30000,
      retries = 2,
      retryDelay = 1000,
      showToast = true,
      skipAuth = false,
      onRetry,
      ...requestOptions
    } = options;

    // Check offline status
    if (!this.isOnline) {
      const offlineError: ApiError = {
        message: 'Tidak ada koneksi internet. Periksa koneksi Anda dan coba lagi',
        code: ErrorCode.OFFLINE_ERROR,
        retryable: true
      };
      
      if (showToast) {
        this.showErrorToast(offlineError);
      }
      
      throw offlineError;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Prepare headers
    const headers: Record<string, string> = {
      ...(requestOptions.headers as Record<string, string>),
    };

    // Add auth headers if not skipped
    if (!skipAuth) {
      Object.assign(headers, this.getAuthHeaders());
    }

    // Set content type for JSON requests
    if (!headers['Content-Type'] && !(requestOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const requestConfig: RequestInit = {
      ...requestOptions,
      headers,
      signal: controller.signal,
    };

    let lastError: ApiError | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, requestConfig);
        clearTimeout(timeoutId);

        let data: any;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (!response.ok) {
          const error = this.parseError(response, data);
          
          // Retry logic
          if (attempt < retries && error.retryable) {
            if (onRetry) {
              onRetry(attempt + 1, error);
            }
            await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
            continue;
          }
          
          lastError = error;
          break;
        }

        // Return data directly if response structure is not standard API response
        if (typeof data === 'string' || !data.hasOwnProperty('success')) {
          return data as T;
        }

        // Handle standard API response
        const apiResponse = data as ApiResponse<T>;
        if (apiResponse.success) {
          return apiResponse.data as T;
        } else {
          throw this.parseError(response, apiResponse);
        }

      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          lastError = {
            message: 'Request timeout. Silakan coba lagi',
            code: ErrorCode.TIMEOUT_ERROR,
            retryable: true
          };
        } else if (error.message && error.code) {
          // Already an ApiError
          lastError = error;
        } else {
          lastError = {
            message: 'Gagal terhubung ke server. Periksa koneksi internet Anda',
            code: ErrorCode.NETWORK_ERROR,
            retryable: true
          };
        }

        // Retry logic for network errors
        if (attempt < retries && lastError?.retryable) {
          if (onRetry && lastError) {
            onRetry(attempt + 1, lastError);
          }
          await this.delay(retryDelay * Math.pow(2, attempt));
          continue;
        }
        
        break;
      }
    }

    // Fallback error jika tidak ada error yang di-set
    const finalError: ApiError = lastError || {
      message: 'Terjadi kesalahan yang tidak diketahui',
      code: ErrorCode.UNKNOWN_ERROR,
      retryable: false
    };

    // Show error toast if requested
    if (showToast) {
      this.showErrorToast(finalError);
    }

    throw finalError;
  }

  // Convenience methods
  public async get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public async put<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public async delete<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public async patch<T = any>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }
}

// Create singleton instance
const apiClient = new EnhancedApiClient();

export default apiClient;

// Also export the old apiFetch function for backward compatibility
export const apiFetch = (endpoint: string, options: RequestInit = {}) => {
  return apiClient.request(endpoint, options);
}; 