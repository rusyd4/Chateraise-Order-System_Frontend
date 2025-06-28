export interface ApiErrorData {
  message: string;
  status: number;
  statusText: string;
  data?: any;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly data?: any;

  constructor({ message, status, statusText, data }: ApiErrorData) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }

  public isUnauthorized(): boolean {
    return this.status === 401;
  }

  public isForbidden(): boolean {
    return this.status === 403;
  }

  public isServerError(): boolean {
    return this.status >= 500;
  }

  public isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

export const createApiError = (response: Response, errorText: string): ApiError => {
  return new ApiError({
    message: `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
    status: response.status,
    statusText: response.statusText,
    data: errorText
  });
};

export const isUnauthorizedError = (error: unknown): boolean => {
  return error instanceof ApiError && error.isUnauthorized();
};

export const isForbiddenError = (error: unknown): boolean => {
  return error instanceof ApiError && error.isForbidden();
}; 