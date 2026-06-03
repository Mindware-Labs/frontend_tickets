// Authentication Service
// Handles all authentication-related operations with the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** Milliseconds before any auth request is aborted. */
const REQUEST_TIMEOUT_MS = 10_000;

interface LoginResponse {
  message: string;
  accessToken: string;
  user: {
    id: number;
    name: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

interface RegisterData {
  name: string;
  lastName: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  message: string;
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

interface ResetPasswordResponse {
  message: string;
}

interface VerifyResetCodeResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Wraps `fetch` with an AbortController that fires after `timeoutMs`.
 * The timeout timer is always cleared when the request settles.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Normalises low-level fetch/abort errors into user-readable messages and
 * re-throws them so each method's caller gets a consistent Error.
 */
function rethrowNetworkError(error: unknown): never {
  if ((error as DOMException)?.name === "AbortError") {
    throw new Error(
      "Request timed out. Please check your connection and try again.",
    );
  }
  if (error instanceof TypeError && (error as TypeError).message.includes("fetch")) {
    throw new Error(
      `Cannot connect to the server. Please make sure the backend is running on ${API_URL}`,
    );
  }
  throw error;
}

/**
 * Reads a response body as text and parses JSON, or throws a normalised Error
 * when the status is not OK.
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    if (!response.ok) throw new Error(text || "Invalid response from server");
    data = { message: text };
  }

  if (!response.ok) {
    const msg: string =
      (Array.isArray(data.message) ? data.message.join(", ") : data.message) ||
      data.error ||
      `Request failed (${response.status})`;
    const err  = new Error(msg);
    (err as any).status = response.status;
    throw err;
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Public auth object
// ---------------------------------------------------------------------------

export const auth = {
  /** Login user with email and password. */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const normalizedEmail = email?.trim().toLowerCase();
      const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await parseResponse<LoginResponse>(response);

      if (!data.accessToken || !data.user) {
        throw new Error("Invalid response format from server");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("user_data", JSON.stringify(data.user));
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
        window.dispatchEvent(new Event("user-role-updated"));
      }

      return data;
    } catch (error) {
      rethrowNetworkError(error);
    }
  },

  /** Register a new user. */
  async register(data: RegisterData): Promise<RegisterResponse> {
    const payload = {
      name:      data.name.trim(),
      lastName:  data.lastName.trim(),
      email:     data.email.trim().toLowerCase(),
      password:  data.password,
    };

    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await parseResponse<RegisterResponse>(response);

      return {
        message: result.message || "User registered successfully. You can now log in.",
        email:   payload.email,
      };
    } catch (error) {
      rethrowNetworkError(error);
    }
  },

  /** Request a password reset code via email. */
  async requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      return await parseResponse<ForgotPasswordResponse>(response);
    } catch (error) {
      rethrowNetworkError(error);
    }
  },

  /** Verify the 6-digit reset code before allowing the password change. */
  async verifyResetCode(
    email: string,
    code: string,
  ): Promise<VerifyResetCodeResponse> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/verify-reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      return await parseResponse<VerifyResetCodeResponse>(response);
    } catch (error) {
      rethrowNetworkError(error);
    }
  },

  /** Reset the password using the verified code. */
  async resetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<ResetPasswordResponse> {
    try {
      const response = await fetchWithTimeout(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      return await parseResponse<ResetPasswordResponse>(response);
    } catch (error) {
      rethrowNetworkError(error);
    }
  },

  /** Validate the stored JWT against the backend and return the user profile. */
  async getProfile(): Promise<LoginResponse["user"]> {
    const token = this.getToken();
    if (!token) throw new Error("Not authenticated");

    try {
      const response = await fetchWithTimeout(
        `${API_URL}/auth/profile`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.ok) {
        this.logout();
        throw new Error("Session expired");
      }

      return response.json();
    } catch (error) {
      rethrowNetworkError(error);
    }
  },

  /** Clear session and redirect to login. */
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_data");
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `auth-token=; path=/; max-age=0; SameSite=Lax${secure}`;
      document.cookie = `auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
      document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax${secure}`;
      document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
      window.dispatchEvent(new Event("user-role-updated"));
      window.location.href = "/login";
    }
  },

  /** Get the stored JWT token from the cookie. */
  getToken(): string | null {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
    return null;
  },

  /** Get cached user data from localStorage. */
  getUser(): LoginResponse["user"] | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user_data");
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  /** Returns true when a valid, non-expired JWT cookie is present. */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payloadPart = token.split(".")[1];
      if (!payloadPart) return false;
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded));
      if (payload?.exp && Date.now() >= payload.exp * 1000) return false;
    } catch {
      return false;
    }
    return true;
  },
};
