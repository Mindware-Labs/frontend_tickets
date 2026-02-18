// Authentication Service
// Handles all authentication-related operations with the backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: normalizedEmail, password }),
            });

            // Read response as text first to avoid parsing issues
            const responseText = await response.text();
            let data: any;

            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                throw new Error(responseText || 'Invalid response from server');
            }

            if (!response.ok) {
                // Handle NestJS error format
                const errorMessage = data.message || 
                    (Array.isArray(data.message) ? data.message.join(', ') : null) ||
                    data.error ||
                    'Login failed';
                throw new Error(errorMessage);
            }

            // Validate response structure
            if (!data.accessToken || !data.user) {
                throw new Error('Invalid response format from server');
            }

            // Store token and user data
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', data.accessToken);
                localStorage.setItem('user_data', JSON.stringify(data.user));

                // Also set cookie for middleware compatibility
                // Use Lax instead of Strict to ensure cookie is sent with navigation requests
                document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
                window.dispatchEvent(new Event('user-role-updated'));
            }

            return data as LoginResponse;
        } catch (error: any) {
            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Cannot connect to the server. Please make sure the backend is running on ' + API_URL);
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
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                    throw new Error(responseText || 'Registration failed. Invalid response from server.');
                }
                result = { message: responseText || 'Registration successful' };
            }

            if (!response.ok) {
                // Handle NestJS error formats
                let errorMessage = 'Registration failed';
                
                // Log full result for debugging
                console.error('Backend error response:', result);
                
                // Check for database errors first
                const resultString = JSON.stringify(result).toLowerCase();
                if (resultString.includes('42703') || 
                    resultString.includes('column') || 
                    resultString.includes('does not exist') ||
                    resultString.includes('missing column') ||
                    resultString.includes('errorMissingColumn')) {
                    errorMessage = 'Database schema error: The database is missing required columns. Please contact the administrator to update the database schema or restart the backend server.';
                } else if (result.message) {
                    if (Array.isArray(result.message)) {
                        // NestJS validation errors array
                        errorMessage = result.message.join(', ');
                    } else if (typeof result.message === 'string') {
                        errorMessage = result.message;
                    }
                } else if (result.error) {
                    if (typeof result.error === 'string') {
                        errorMessage = result.error;
                    } else if (typeof result.error === 'object') {
                        errorMessage = JSON.stringify(result.error);
                    }
                } else if (typeof result === 'string') {
                    errorMessage = result;
                } else {
                    // Try to extract any error information
                    errorMessage = result.statusCode ? 
                        `Server error (${result.statusCode}). Please check backend logs.` :
                        'Internal server error. Please check the backend logs for details.';
                }

                const error = new Error(errorMessage);
                (error as any).status = response.status;
                (error as any).response = result;
                throw error;
            }

            // Return success response
            return {
                message: result.message || 'User registered successfully. You can now log in.',
                email: registerPayload.email
            };
        } catch (error: any) {
            // Handle network errors
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('Cannot connect to the server. Please make sure the backend is running on ' + API_URL);
            }
            
            // Re-throw error with its message
            if (error.message) {
                throw error;
            }
            
            // Fallback error
            throw new Error('Registration failed. Please try again.');
        }
    },

    /**
     * Request a password reset code
     */
    async requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const responseText = await response.text();
        let data: any;

        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(responseText || 'Invalid response from server');
        }

        if (!response.ok) {
            const errorMessage = data.message || data.error || 'Request failed';
            throw new Error(errorMessage);
        }

        return data as ForgotPasswordResponse;
    },

    /**
     * Reset password with a 6-digit code
     */
    async resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<ResetPasswordResponse> {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code, newPassword }),
        });

        const responseText = await response.text();
        let data: any;

        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(responseText || 'Invalid response from server');
        }

        if (!response.ok) {
            const errorMessage = data.message || data.error || 'Reset failed';
            throw new Error(errorMessage);
        }

        return data as ResetPasswordResponse;
    },

    /**
     * Verify password reset code before allowing reset
     */
    async verifyResetCode(email: string, code: string): Promise<VerifyResetCodeResponse> {
        const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, code }),
        });

        const responseText = await response.text();
        let data: any;

        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(responseText || 'Invalid response from server');
        }

        if (!response.ok) {
            const errorMessage = data.message || data.error || 'Code verification failed';
            throw new Error(errorMessage);
        }

        return data as VerifyResetCodeResponse;
    },

    /**
     * Logout user
     */
    logout(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');

            // Clear cookie - use multiple methods to ensure it's deleted
            document.cookie = 'auth-token=; path=/; max-age=0; SameSite=Lax';
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
            document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
            document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
            
            window.dispatchEvent(new Event('user-role-updated'));
            
            // Redirect to login after clearing session
            window.location.href = '/login';
        }
    },

    /**
     * Get stored JWT token
     */
    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        return null;
    },

    /**
     * Get stored user data
     */
    getUser(): LoginResponse['user'] | null {
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('user_data');
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
    async getProfile(): Promise<LoginResponse['user']> {
        const token = this.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            // Token is invalid, clear it
            this.logout();
            throw new Error('Session expired');
        }

        return response.json();
    },
};
