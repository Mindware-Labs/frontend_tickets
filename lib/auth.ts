// Authentication Service
// Handles all authentication-related operations with the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

export const auth = {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Normalize email: trim and lowercase
      const normalizedEmail = email?.trim().toLowerCase();
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      // Read response as text first to avoid parsing issues
      const responseText = await response.text();
      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(responseText || "Invalid response from server");
      }

      if (!response.ok) {
        // Handle NestJS error format
        const errorMessage =
          data.message ||
          (Array.isArray(data.message) ? data.message.join(", ") : null) ||
          data.error ||
          "Login failed";
        throw new Error(errorMessage);
      }

      // Validate response structure
      if (!data.accessToken || !data.user) {
        throw new Error("Invalid response format from server");
      }

      // Store token and user data
      if (typeof window !== "undefined") {
        localStorage.setItem("user_data", JSON.stringify(data.user));

        // Use Secure flag only on HTTPS (production). On HTTP (local dev) omit it
        // so the browser doesn't silently discard the cookie.
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;
        window.dispatchEvent(new Event("user-role-updated"));
      }

      return data as LoginResponse;
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to the server. Please make sure the backend is running on " +
            API_URL,
        );
      }
      // Re-throw other errors with their messages
      throw error;
    }
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      // Ensure data is properly formatted
      const registerPayload = {
        name: data.name.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerPayload),
      });

      // Read response as text first to avoid parsing issues
      const responseText = await response.text();
      let result: any;

      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, use the text as error message
        if (!response.ok) {
          throw new Error(
            responseText ||
              "Registration failed. Invalid response from server.",
          );
        }
        result = { message: responseText || "Registration successful" };
      }

      if (!response.ok) {
        const errorMessage = Array.isArray(result.message)
          ? result.message.join(", ")
          : result.message || result.error || "Registration failed";
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
      }

      // Return success response
      return {
        message:
          result.message || "User registered successfully. You can now log in.",
        email: registerPayload.email,
      };
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Cannot connect to the server. Please make sure the backend is running on " +
            API_URL,
        );
      }

      // Re-throw error with its message
      if (error.message) {
        throw error;
      }

      // Fallback error
      throw new Error("Registration failed. Please try again.");
    }
  },

  /**
   * Request a password reset code
   */
  async requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(responseText || "Invalid response from server");
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || "Request failed";
      throw new Error(errorMessage);
    }

    return data as ForgotPasswordResponse;
  },

  /**
   * Reset password with a 6-digit code
   */
  async resetPasswordWithCode(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<ResetPasswordResponse> {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code, newPassword }),
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(responseText || "Invalid response from server");
    }

    if (!response.ok) {
      const errorMessage = data.message || data.error || "Reset failed";
      throw new Error(errorMessage);
    }

    return data as ResetPasswordResponse;
  },

  /**
   * Verify password reset code before allowing reset
   */
  async verifyResetCode(
    email: string,
    code: string,
  ): Promise<VerifyResetCodeResponse> {
    const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const responseText = await response.text();
    let data: any;

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(responseText || "Invalid response from server");
    }

    if (!response.ok) {
      const errorMessage =
        data.message || data.error || "Code verification failed";
      throw new Error(errorMessage);
    }

    return data as VerifyResetCodeResponse;
  },

  /**
   * Logout user
   */
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user_data");

      // Clear cookie - match the Secure flag based on current protocol
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `auth-token=; path=/; max-age=0; SameSite=Lax${secure}`;
      document.cookie = `auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
      document.cookie = `auth_token=; path=/; max-age=0; SameSite=Lax${secure}`;
      document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;

      window.dispatchEvent(new Event("user-role-updated"));

      // Redirect to login after clearing session
      window.location.href = "/login";
    }
  },

  /**
   * Get stored JWT token (from cookie only)
   */
  getToken(): string | null {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/(?:^|;\s*)auth-token=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : null;
    }
    return null;
  },

  /**
   * Get stored user data
   */
  getUser(): LoginResponse["user"] | null {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user_data");
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  /**
   * Get user profile from backend (validates token)
   */
  async getProfile(): Promise<LoginResponse["user"]> {
    const token = this.getToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Token is invalid, clear it
      this.logout();
      throw new Error("Session expired");
    }

    return response.json();
  },
};
