import { ApiError, createApiError } from "./api-errors";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Global reference to show unauthorized modal
let globalShowUnauthorizedModal: ((message?: string) => void) | null = null;

export const setGlobalAuthHandler = (handler: (message?: string) => void) => {
  globalShowUnauthorizedModal = handler;
};

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type to application/json if not already set and body is not FormData
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!res.ok) {
    const errorText = await res.text();
    const apiError = createApiError(res, errorText);
    
    // Handle unauthorized errors
    if (apiError.isUnauthorized()) {
      if (globalShowUnauthorizedModal) {
        let message = "Sesi Anda telah berakhir. Silakan login kembali.";
        
        // Try to parse error message from server
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.msg || errorData.message) {
            message = errorData.msg || errorData.message;
          }
        } catch {
          // Use default message if parsing fails
        }
        
        globalShowUnauthorizedModal(message);
      }
    }
    
    throw apiError;
  }

  // Try to parse JSON, fallback to text if fails
  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}

export default apiFetch;
