/**
 * Authentication utilities for the Agent Orchestra frontend.
 */

import { useState } from 'react';
import { config } from './config';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class AuthManager {
  private static instance: AuthManager;
  private tokens: AuthTokens | null = null;
  private user: AuthUser | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const storedTokens = localStorage.getItem('auth_tokens');
      const storedUser = localStorage.getItem('auth_user');

      if (storedTokens) {
        try {
          this.tokens = JSON.parse(storedTokens);
        } catch (e) {
          console.error('Failed to parse stored tokens:', e);
          localStorage.removeItem('auth_tokens');
        }
      }

      if (storedUser) {
        try {
          this.user = JSON.parse(storedUser);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
          localStorage.removeItem('auth_user');
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      if (this.tokens) {
        localStorage.setItem('auth_tokens', JSON.stringify(this.tokens));
      } else {
        localStorage.removeItem('auth_tokens');
      }

      if (this.user) {
        localStorage.setItem('auth_user', JSON.stringify(this.user));
      } else {
        localStorage.removeItem('auth_user');
      }
    }
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const response = await fetch(`${config.apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    this.tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    this.user = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      tenantId: data.user.tenant_id,
      role: data.user.role,
    };

    this.saveToStorage();
    return this.user;
  }

  async logout(): Promise<void> {
    if (this.tokens) {
      try {
        await fetch(`${config.apiUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.tokens.accessToken}`,
          },
        });
      } catch (e) {
        console.error('Logout request failed:', e);
      }
    }

    this.tokens = null;
    this.user = null;
    this.saveToStorage();
  }

  async refreshTokens(): Promise<boolean> {
    if (!this.tokens) {
      return false;
    }

    try {
      const response = await fetch(`${config.apiUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.tokens.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      this.tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.tokens.refreshToken,
        expiresAt: Date.now() + (data.expires_in * 1000),
      };

      this.saveToStorage();
      return true;
    } catch (e) {
      console.error('Token refresh failed:', e);
      this.tokens = null;
      this.user = null;
      this.saveToStorage();
      return false;
    }
  }

  isTokenExpired(): boolean {
    if (!this.tokens) {
      return true;
    }
    return Date.now() >= this.tokens.expiresAt;
  }

  async getValidToken(): Promise<string | null> {
    if (!this.tokens) {
      return null;
    }

    if (this.isTokenExpired()) {
      const refreshed = await this.refreshTokens();
      if (!refreshed) {
        return null;
      }
    }

    return this.tokens.accessToken;
  }

  getUser(): AuthUser | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return this.user !== null && this.tokens !== null && !this.isTokenExpired();
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getValidToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  }
}

export const authManager = AuthManager.getInstance();

// React hook for authentication
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(authManager.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authManager.isAuthenticated());

  const login = async (email: string, password: string) => {
    const loggedInUser = await authManager.login(email, password);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    return loggedInUser;
  };

  const logout = async () => {
    await authManager.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshAuth = async () => {
    const isValid = await authManager.refreshTokens();
    setUser(authManager.getUser());
    setIsAuthenticated(isValid);
    return isValid;
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
    getAuthHeaders: authManager.getAuthHeaders.bind(authManager),
  };
}
