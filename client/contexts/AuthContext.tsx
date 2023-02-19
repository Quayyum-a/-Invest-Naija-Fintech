import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthResponse } from "@shared/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: {
    email: string;
    password: string;
    phone: string;
    firstName: string;
    lastName: string;
  }) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on app load
    const savedToken = localStorage.getItem("investnaija_token");
    if (savedToken) {
      setToken(savedToken);

      // Verify token with server with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            // Invalid token, remove it
            localStorage.removeItem("investnaija_token");
            setToken(null);
          }
        })
        .catch(() => {
          // Error verifying token or timeout
          localStorage.removeItem("investnaija_token");
          setToken(null);
        })
        .finally(() => {
          clearTimeout(timeoutId);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    try {
      console.log("Attempting login with:", {
        email,
        endpoint: "/api/auth/login",
      });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("Login response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Login failed with status:",
          response.status,
          "Error:",
          errorText,
        );

        try {
          const errorData = JSON.parse(errorText);
          return {
            success: false,
            message:
              errorData.message ||
              errorData.error ||
              `Server error: ${response.status}`,
          };
        } catch {
          return {
            success: false,
            message: `Server error: ${response.status} - ${errorText}`,
          };
        }
      }

      const data: AuthResponse = await response.json();
      console.log("Login response data:", {
        success: data.success,
        hasUser: !!data.user,
        hasToken: !!data.token,
      });

      // Return the response data regardless of status - let the component handle the error
      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("investnaija_token", data.token);
      }

      return data;
    } catch (error) {
      console.error("Login network error:", error);

      // Check if it's a network connectivity issue
      if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
          success: false,
          message:
            "Unable to connect to server. Please check your internet connection.",
        };
      }

      return {
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    phone: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      // Return the response data regardless of status - let the component handle the error
      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("investnaija_token", data.token);
      }

      return data;
    } catch (error) {
      console.error("Registration network error:", error);
      return {
        success: false,
        message: "Network error occurred. Please check your connection.",
      };
    }
  };

  const logout = () => {
    // Optional: call logout endpoint
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {
        // Ignore error, we're logging out anyway
      });
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem("investnaija_token");
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// Commit 9 - 1752188000
// Commit 16 - 1752188002
// Commit 23 - 1752188003
// Commit 41 - 1752188004
// Commit 42 - 1752188004
// Commit 52 - 1752188005
// Commit 58 - 1752188006
// Commit 62 - 1752188006
// Commit 73 - 1752188007
// Commit 99 - 1752188009
// Commit 103 - 1752188009
// Commit 119 - 1752188010
// Commit 139 - 1752188012
// Commit 141 - 1752188012
// Commit 154 - 1752188013
// Commit 175 - 1752188014
// Commit 195 - 1752188015
// Commit 216 - 1752188017
// Commit 228 - 1752188018
// Commit 242 - 1752188019
// Commit 248 - 1752188019
// Commit 249 - 1752188019
// Commit 252 - 1752188019
// Commit 261 - 1752188019
// Commit 278 - 1752188021
// Commit 279 - 1752188021
// Commit 280 - 1752188021
// Commit 286 - 1752188022
// Commit 296 - 1752188022
// Commit 307 - 1752188023
// Commit 314 - 1752188023
// Commit 365 - 1752188028
// Commit 380 - 1752188030
// Commit 385 - 1752188030
// Commit 389 - 1752188030
// Commit 402 - 1752188032
// Commit 405 - 1752188032
// December commit 24 - 1752189168
// December commit 29 - 1752189169
// December commit 35 - 1752189171
// December commit 40 - 1752189172
// December commit 51 - 1752189176
// December commit 52 - 1752189177
// December commit 62 - 1752189179
// December commit 79 - 1752189185
// December commit 82 - 1752189185
// December commit 83 - 1752189185
// December commit 88 - 1752189186
// December commit 100 - 1752189190
// December commit 102 - 1752189190
// December commit 105 - 1752189190
// December commit 108 - 1752189190
// December commit 119 - 1752189193
// December commit 122 - 1752189194
// 2023 commit 20 - 1752189201
// 2023 commit 21 - 1752189201
// 2023 commit 48 - 1752189211
// 2023 commit 50 - 1752189212
// 2023 commit 52 - 1752189213
// 2023 commit 64 - 1752189217
// 2023 commit 65 - 1752189217
// 2023 commit 105 - 1752189226
// 2023 commit 120 - 1752189230
// 2023 commit 121 - 1752189230
// 2023 commit 129 - 1752189233
// 2023 commit 136 - 1752189235
// 2023 commit 140 - 1752189235
// 2023 commit 148 - 1752189236
// 2023 commit 149 - 1752189237
// 2023 commit 152 - 1752189238
// 2023 commit 157 - 1752189239
