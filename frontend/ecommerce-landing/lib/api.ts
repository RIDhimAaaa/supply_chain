import axios, { AxiosError, AxiosResponse } from 'axios';

const API_BASE_URL = "https://supplychain-azure.vercel.app";

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`Response received:`, response.status, response.statusText);
    return response;
  },
  (error: AxiosError) => {
    // More detailed error logging
    if (error.response) {
      // Server responded with error status
      console.error('Response error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        method: error.config?.method
      });
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - no response:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        method: error.config?.method
      });
    } else {
      // Something else happened
      console.error('Request setup error:', {
        message: error.message,
        url: error.config?.url,
        method: error.config?.method
      });
    }
    return Promise.reject(error);
  }
);

export interface SignupRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user?: any;
}

export interface SignupResponse {
  message: string;
  user_id?: string;
  requires_profile_selection?: boolean;
}

export interface ProfileType {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  profile_type: string;
  is_complete: boolean;
  created_at: string;
}

export interface ProfileSelectionRequest {
  profile_type: string;
}

export interface ProfileSelectionResponse {
  message: string;
  profile: UserProfile;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

export const authApi = {
  async signup(data: SignupRequest): Promise<SignupResponse> {
    try {
      console.log("Attempting signup with data:", { ...data, password: "[REDACTED]" });

      const response = await apiClient.post<SignupResponse>('/auth/signup', data);

      console.log("Signup successful:", response.status);
      return response.data;
      
    } catch (error) {
      console.error("Signup error caught:", error);
      
      if (error instanceof AxiosError) {
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const message = error.response.data?.detail || 
                         error.response.data?.message || 
                         `Server error: ${status}`;
          
          console.error("Server error during signup:", { status, message, data: error.response.data });
          throw new ApiError(status, message, error.response.data);
          
        } else if (error.request) {
          // Network error - no response received
          console.error("Network error during signup:", error.message);
          throw new ApiError(0, "Unable to connect to server. Please check your internet connection.");
          
        } else {
          // Request setup error
          console.error("Request setup error during signup:", error.message);
          throw new ApiError(0, "Request failed to send. Please try again.");
        }
      }
      
      console.error("Unexpected signup error:", error);
      throw new ApiError(500, 'An unexpected error occurred');
    }
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      console.log("Attempting login with email:", data.email);

      const response = await apiClient.post<AuthResponse>('/auth/login', data);

      console.log("Login successful:", response.status);
      return response.data;
      
    } catch (error) {
      console.error("Login error caught:", error);
      
      if (error instanceof AxiosError) {
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const message = error.response.data?.detail || 
                         error.response.data?.message || 
                         `Server error: ${status}`;
          
          console.error("Server error during login:", { status, message, data: error.response.data });
          throw new ApiError(status, message, error.response.data);
          
        } else if (error.request) {
          // Network error - no response received
          console.error("Network error during login:", error.message);
          throw new ApiError(0, "Unable to connect to server. Please check your internet connection.");
          
        } else {
          // Request setup error
          console.error("Request setup error during login:", error.message);
          throw new ApiError(0, "Request failed to send. Please try again.");
        }
      }
      
      console.error("Unexpected login error:", error);
      throw new ApiError(500, 'An unexpected error occurred');
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refresh_token: refreshToken
      });
      
      return response.data;
      
    } catch (error) {
      console.error("Token refresh error caught:", error);
      
      if (error instanceof AxiosError) {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.detail || 
                         error.response.data?.message || 
                         'Token refresh failed';
          
          throw new ApiError(status, message, error.response.data);
          
        } else if (error.request) {
          throw new ApiError(0, "Unable to connect to server for token refresh.");
        } else {
          throw new ApiError(0, "Token refresh request failed.");
        }
      }
      
      throw new ApiError(500, 'Token refresh failed');
    }
  }
};

// Profile API methods
export const profileApi = {
  async getProfileTypes(): Promise<ProfileType[]> {
    try {
      // For now, return hardcoded profile types since backend might not have this endpoint
      // You can replace this with actual API call when backend is ready
      return [
        {
          id: 'supplier',
          name: 'Raw Material Supplier',
          description: 'I supply raw materials to vendors',
          icon: '🏭'
        },
        {
          id: 'vendor',
          name: 'Raw Material Buyer',
          description: 'I buy raw materials for my business',
          icon: '🛒'
        },
        {
          id: 'distributor',
          name: 'Distributor',
          description: 'I distribute materials between suppliers and vendors',
          icon: '🚚'
        },
        {
          id: 'manufacturer',
          name: 'Manufacturer',
          description: 'I manufacture products using raw materials',
          icon: '⚙️'
        }
      ];
    } catch (error) {
      console.error("Error fetching profile types:", error);
      throw new ApiError(500, 'Failed to load profile types');
    }
  },

  async selectProfile(data: ProfileSelectionRequest): Promise<ProfileSelectionResponse> {
    try {
      console.log("Selecting profile:", data.profile_type);

      // For now, simulate API call since backend might not have this endpoint yet
      // Replace with actual API call: const response = await apiClient.post('/profile/select', data);
      
      const mockResponse: ProfileSelectionResponse = {
        message: "Profile selected successfully",
        profile: {
          id: Date.now().toString(),
          user_id: "current-user",
          profile_type: data.profile_type,
          is_complete: true,
          created_at: new Date().toISOString()
        }
      };

      console.log("Profile selection successful");
      return mockResponse;
      
    } catch (error) {
      console.error("Profile selection error:", error);
      
      if (error instanceof AxiosError) {
        if (error.response) {
          const status = error.response.status;
          const message = error.response.data?.detail || 
                         error.response.data?.message || 
                         'Profile selection failed';
          
          throw new ApiError(status, message, error.response.data);
        } else if (error.request) {
          throw new ApiError(0, "Unable to connect to server.");
        } else {
          throw new ApiError(0, "Request failed to send.");
        }
      }
      
      throw new ApiError(500, 'Profile selection failed');
    }
  },

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      // For now, check localStorage for profile selection
      // Replace with actual API call when backend is ready
      const savedProfile = localStorage.getItem('user_profile');
      if (savedProfile) {
        return JSON.parse(savedProfile);
      }
      return null;
      
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }
};

// Token management utilities
export const tokenManager = {
  setTokens(tokens: { access_token: string; refresh_token: string; expires_in: number }) {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    localStorage.setItem("token_expires_at", (Date.now() + tokens.expires_in * 1000).toString());
    
    // Set axios default header for future requests
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.access_token}`;
  },

  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token");
  },

  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
    
    // Remove axios default header
    delete apiClient.defaults.headers.common['Authorization'];
  },

  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem("token_expires_at");
    if (!expiresAt) return true;
    return Date.now() >= parseInt(expiresAt);
  },

  // Initialize token on app start
  initializeToken() {
    const token = this.getAccessToken();
    if (token && !this.isTokenExpired()) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else if (this.isTokenExpired()) {
      this.clearTokens();
    }
  }
};

// Onboarding state management
export const onboardingManager = {
  setOnboardingState(state: 'signup_complete' | 'profile_pending' | 'profile_complete' | 'onboarding_complete') {
    localStorage.setItem('onboarding_state', state);
  },

  getOnboardingState(): string | null {
    return localStorage.getItem('onboarding_state');
  },

  isProfileSelectionPending(): boolean {
    const state = this.getOnboardingState();
    return state === 'signup_complete' || state === 'profile_pending';
  },

  isOnboardingComplete(): boolean {
    const state = this.getOnboardingState();
    return state === 'onboarding_complete';
  },

  markSignupComplete() {
    this.setOnboardingState('signup_complete');
  },

  markProfileSelectionComplete(profile: UserProfile) {
    localStorage.setItem('user_profile', JSON.stringify(profile));
    this.setOnboardingState('onboarding_complete');
  },

  clearOnboardingState() {
    localStorage.removeItem('onboarding_state');
    localStorage.removeItem('user_profile');
  },

  // Check if user needs profile selection after login
  requiresProfileSelection(): boolean {
    const hasToken = !!tokenManager.getAccessToken() && !tokenManager.isTokenExpired();
    const hasProfile = !!localStorage.getItem('user_profile');
    const onboardingState = this.getOnboardingState();
    
    return hasToken && !hasProfile && onboardingState !== 'onboarding_complete';
  }
};

// Validation utilities based on FastAPI patterns
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password: string): { isValid: boolean; message?: string } => {
    if (password.length < 6) {
      return { isValid: false, message: "Password must be at least 6 characters long" };
    }
    if (password.length > 100) {
      return { isValid: false, message: "Password must be less than 100 characters" };
    }
    return { isValid: true };
  },

  name: (name: string): boolean => {
    return name.trim().length > 0 && name.trim().length <= 50;
  }
};

// Initialize token on module load
if (typeof window !== 'undefined') {
  tokenManager.initializeToken();
}
