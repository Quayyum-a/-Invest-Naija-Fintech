import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiService } from "../services/ApiService";

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  bvn?: string;
  nin?: string;
  kycStatus: "pending" | "verified" | "rejected";
  status: "active" | "suspended";
  createdAt: string;
  lastLogin?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  biometricEnabled: boolean;

  // Actions
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; message?: string }>;
  register: (userData: {
    email: string;
    password: string;
    phone: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      biometricEnabled: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await ApiService.login(email, password);

          if (response.success && response.user && response.token) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
            });

            // Store token in secure storage
            await AsyncStorage.setItem("auth_token", response.token);

            return { success: true };
          } else {
            set({ isLoading: false });
            return {
              success: false,
              message: response.message || "Login failed",
            };
          }
        } catch (error) {
          set({ isLoading: false });
          console.error("Login error:", error);
          return { success: false, message: "Network error occurred" };
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          const response = await ApiService.register(userData);

          if (response.success && response.user && response.token) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
            });

            // Store token in secure storage
            await AsyncStorage.setItem("auth_token", response.token);

            return { success: true };
          } else {
            set({ isLoading: false });
            return {
              success: false,
              message: response.message || "Registration failed",
            };
          }
        } catch (error) {
          set({ isLoading: false });
          console.error("Registration error:", error);
          return { success: false, message: "Network error occurred" };
        }
      },

      logout: async () => {
        try {
          const { token } = get();
          if (token) {
            await ApiService.logout();
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          // Clear stored data
          await AsyncStorage.multiRemove(["auth_token", "biometric_enabled"]);

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            biometricEnabled: false,
          });
        }
      },

      initializeAuth: async () => {
        try {
          const token = await AsyncStorage.getItem("auth_token");
          const biometricEnabled =
            await AsyncStorage.getItem("biometric_enabled");

          if (token) {
            // Verify token with server
            const response = await ApiService.verifyToken(token);

            if (response.success && response.user) {
              set({
                user: response.user,
                token,
                isAuthenticated: true,
                biometricEnabled: biometricEnabled === "true",
              });
            } else {
              // Token is invalid, clear storage
              await AsyncStorage.removeItem("auth_token");
            }
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          // Clear invalid data
          await AsyncStorage.removeItem("auth_token");
        }
      },

      setBiometricEnabled: async (enabled: boolean) => {
        set({ biometricEnabled: enabled });
        await AsyncStorage.setItem("biometric_enabled", enabled.toString());
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        biometricEnabled: state.biometricEnabled,
      }),
    },
  ),
);
