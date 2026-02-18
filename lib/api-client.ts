import { getCookie } from "./cookie-utils";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
let isRedirecting = false;

function handleUnauthorized(): void {
  if (typeof window === "undefined" || isRedirecting) {
    return;
  }

  isRedirecting = true;

  localStorage.removeItem("auth_token");
  localStorage.removeItem("user_data");

  document.cookie = "auth-token=; path=/; max-age=0; SameSite=Lax";

  window.dispatchEvent(new Event("user-role-updated"));

  const currentPath = window.location.pathname;
  const loginUrl =
    currentPath === "/" || currentPath === "/login"
      ? "/login"
      : `/login?redirect=${encodeURIComponent(currentPath)}`;

  window.location.href = loginUrl;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  // Try to get token from cookies first
  const cookieToken = getCookie("auth-token");
  if (cookieToken) {
    if (process.env.NODE_ENV === "development") {
      console.log("[api-client] Token found in cookie, length:", cookieToken.length);
    }
    return cookieToken;
  }

  // Fallback to localStorage
  const localStorageToken = localStorage.getItem("auth_token");
  if (localStorageToken) {
    if (process.env.NODE_ENV === "development") {
      console.log("[api-client] Token found in localStorage, length:", localStorageToken.length);
      // Also try to set it as cookie if it's in localStorage but not in cookie
      try {
        document.cookie = `auth-token=${localStorageToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      } catch (e) {
        // Ignore cookie setting errors
      }
    }
    return localStorageToken;
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("[api-client] No token found in cookies or localStorage");
    console.warn("[api-client] document.cookie:", document.cookie.substring(0, 200));
    console.warn("[api-client] localStorage keys:", Object.keys(localStorage));
  }

  return null;
}

/**
 * Fetch data from backend API with automatic JWT authentication
 */
export async function fetchFromBackend(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${BACKEND_API_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  // Get auth token
  const token = getAuthToken();

  // Prepare headers
  const headers: any = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    // Log warning if no token is found (with debugging info)
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      const cookieToken = getCookie("auth-token");
      const localStorageToken = localStorage.getItem("auth_token");
      console.warn(
        "[api-client] No auth token found for request to:",
        endpoint
      );
      console.warn(
        "[api-client] Cookie auth-token:",
        cookieToken ? "Found" : "Not found"
      );
      console.warn(
        "[api-client] localStorage auth_token:",
        localStorageToken ? "Found" : "Not found"
      );
      console.warn(
        "[api-client] document.cookie:",
        document.cookie.substring(0, 200)
      );
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      // Note: We don't use credentials: 'include' because we're sending the token
      // manually in the Authorization header. This avoids CORS issues when the
      // backend uses origin: '*' in CORS configuration.
    });
  } catch (fetchError: any) {
    // Handle network errors (backend not running, CORS, etc.)
    if (process.env.NODE_ENV === "development") {
      console.error("[api-client] Network error fetching:", endpoint);
      console.error("[api-client] URL:", url);
      console.error("[api-client] Error:", fetchError);
    }
    
    const error = new Error(
      fetchError?.message?.includes("fetch failed") || fetchError?.message?.includes("Failed to fetch")
        ? `Cannot connect to backend server at ${BACKEND_API_URL}. Please check if the backend is running.`
        : fetchError?.message || "Network error: Failed to fetch"
    ) as Error & { status?: number; isNetworkError?: boolean };
    error.status = 0;
    error.isNetworkError = true;
    throw error;
  }

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    if (process.env.NODE_ENV === "development") {
      const cookieToken = getCookie("auth-token");
      const localStorageToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      console.error(
        "[api-client] 401 Unauthorized for:",
        endpoint,
        "Token present:",
        !!token
      );
      console.error(
        "[api-client] Token sources - Cookie:",
        cookieToken ? `Found (${cookieToken.length} chars)` : "Not found",
        "LocalStorage:",
        localStorageToken ? `Found (${localStorageToken.length} chars)` : "Not found"
      );
    }

    // Only redirect if we actually had a token (it might be expired)
    // If we never had a token, it's likely the user isn't logged in yet
    if (typeof window !== "undefined" && token) {
      handleUnauthorized();
    }

    const error = new Error(
      token 
        ? "Session expired. Please login again." 
        : "Authentication required. Please login."
    ) as Error & {
      status?: number;
    };
    error.status = 401;
    throw error;
  }

  const rawText = await response.text();
  const contentType = response.headers.get("content-type") || "";
  let parsedBody: any = rawText || null;
  if (rawText && contentType.includes("application/json")) {
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }
  }

  if (!response.ok) {
    const errorData = parsedBody ?? {};
    if (process.env.NODE_ENV === "development") {
      console.error(`Backend Error: ${response.status}`, errorData);
    }
    const message =
      typeof errorData === "string"
        ? errorData
        : errorData.message || `API Error: ${response.status}`;
    const err = new Error(message) as Error & { status?: number; body?: any };
    err.status = response.status;
    err.body = errorData;
    throw err;
  }

  return parsedBody;
}

/**
 * Fetch binary content (e.g., PDF) from backend API with JWT auth.
 */
export async function fetchBlobFromBackend(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${BACKEND_API_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  const token = getAuthToken();
  const headers: any = {
    Accept: "application/pdf",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Clear stale token and redirect to login in browser context
    if (typeof window !== "undefined") {
      handleUnauthorized();
    }

    const error = new Error("Session expired. Please login again.") as Error & {
      status?: number;
    };
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(
      errorText || `API Error: ${response.status}`
    ) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  return response.blob();
}
