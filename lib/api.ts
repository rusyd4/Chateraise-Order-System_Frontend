const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

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
    throw new Error(`API request failed: ${res.status} ${res.statusText} - ${errorText}`);
  }

  // Try to parse JSON, fallback to text if fails
  try {
    return await res.json();
  } catch {
    return await res.text();
  }
}

export default apiFetch;
