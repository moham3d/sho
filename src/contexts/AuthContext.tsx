import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Types
interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'nurse' | 'doctor' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: 'nurse' | 'doctor' | 'admin';
  nationalId: string;
  phone: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const ACCESS_TOKEN_KEY = 'alshorouk_access_token';
const REFRESH_TOKEN_KEY = 'alshorouk_refresh_token';
const USER_KEY = 'alshorouk_user';

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedTokens = localStorage.getItem(ACCESS_TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedTokens && storedUser) {
          const parsedTokens: AuthTokens = JSON.parse(storedTokens);
          const parsedUser: User = JSON.parse(storedUser);

          // Check if access token is expired
          const isExpired = isTokenExpired(parsedTokens.accessToken);

          if (isExpired) {
            // Try to refresh token
            refreshTokens(parsedTokens.refreshToken).catch(() => {
              // If refresh fails, clear storage
              clearAuthStorage();
            });
          } else {
            setTokens(parsedTokens);
            setUser(parsedUser);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthStorage();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Token utilities
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  const decodeToken = (token: string): any => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  };

  const clearAuthStorage = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setTokens(null);
  };

  const storeAuthData = (newTokens: AuthTokens, newUser: User) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(newTokens));
    localStorage.setItem(REFRESH_TOKEN_KEY, JSON.stringify(newTokens));
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setTokens(newTokens);
    setUser(newUser);
  };

  // API calls
  const apiCall = async <T,>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  };

  const refreshTokens = async (refreshToken?: string): Promise<void> => {
    const tokenToUse = refreshToken || tokens?.refreshToken;
    if (!tokenToUse) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiCall<{ accessToken: string; refreshToken?: string }>(
        '/api/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokenToUse }),
        }
      );

      const newTokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || tokenToUse,
      };

      setTokens(newTokens);
      localStorage.setItem(ACCESS_TOKEN_KEY, JSON.stringify(newTokens));

      if (response.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, JSON.stringify(response.refreshToken));
      }
    } catch (error) {
      clearAuthStorage();
      throw error;
    }
  };

  // Auth methods
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiCall<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      storeAuthData(
        { accessToken: response.accessToken, refreshToken: response.refreshToken },
        response.user
      );

      // Redirect to intended destination or dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiCall<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      storeAuthData(
        { accessToken: response.accessToken, refreshToken: response.refreshToken },
        response.user
      );

      navigate('/dashboard', { replace: true });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (tokens?.accessToken) {
        await apiCall('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuthStorage();
      navigate('/login', { replace: true });
    }
  };

  const refreshTokenAuth = async (): Promise<void> => {
    if (!tokens?.refreshToken) {
      await logout();
      return;
    }

    try {
      await refreshTokens(tokens.refreshToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!tokens?.accessToken || !user) {
      throw new Error('Not authenticated');
    }

    try {
      const updatedUser = await apiCall<User>('/api/auth/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Profile update failed');
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<void> => {
    if (!tokens?.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      await apiCall('/api/auth/change-password', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Password change failed');
    }
  };

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!tokens?.accessToken) return;

    const payload = decodeToken(tokens.accessToken);
    if (!payload?.exp) return;

    const timeUntilExpiry = payload.exp * 1000 - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0); // 5 minutes before expiry

    if (refreshTime > 0) {
      const timer = setTimeout(() => {
        refreshTokenAuth().catch(console.error);
      }, refreshTime);

      return () => clearTimeout(timer);
    }
  }, [tokens?.accessToken]);

  // Context value
  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user && !!tokens,
    isLoading,
    login,
    register,
    logout,
    refreshToken: refreshTokenAuth,
    hasRole,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for role-based access
export const withAuth = (roles: string | string[]) => {
  return <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    return (props: P) => {
      const { hasRole, isAuthenticated, isLoading } = useAuth();
      const navigate = useNavigate();

      useEffect(() => {
        if (!isLoading) {
          if (!isAuthenticated) {
            navigate('/login', {
              state: { from: { pathname: window.location.pathname } }
            });
          } else if (!hasRole(roles)) {
            navigate('/unauthorized');
          }
        }
      }, [isAuthenticated, hasRole, isLoading, navigate]);

      if (isLoading) {
        return <div>Loading...</div>;
      }

      if (!isAuthenticated || !hasRole(roles)) {
        return null;
      }

      return <WrappedComponent {...props} />;
    };
  };
};

export default AuthContext;