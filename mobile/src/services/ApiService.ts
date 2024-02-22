import axios, { AxiosInstance, AxiosResponse } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Base URL for your API - adjust for your environment
const BASE_URL = __DEV__
  ? Platform.OS === "android"
    ? "http://10.0.2.2:3000/api" // Android emulator
    : "http://localhost:3000/api" // iOS simulator
  : "https://your-production-api.com/api";

interface AuthResponse {
  success: boolean;
  message?: string;
  user?: any;
  token?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

class ApiServiceClass {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem("auth_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear auth data
          await AsyncStorage.multiRemove(["auth_token", "biometric_enabled"]);
          // You might want to redirect to login here
        }
        return Promise.reject(error);
      },
    );
  }

  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post(
        "/auth/login",
        {
          email,
          password,
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("Login API error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  }

  async register(userData: {
    email: string;
    password: string;
    phone: string;
    firstName: string;
    lastName: string;
  }): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post(
        "/auth/register",
        userData,
      );
      return response.data;
    } catch (error: any) {
      console.error("Register API error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    }
  }

  async verifyToken(token: string): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.get(
        "/auth/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("Token verification error:", error);
      return {
        success: false,
        message: "Token verification failed",
      };
    }
  }

  // User Profile
  async updateProfile(userData: any): Promise<ApiResponse> {
    try {
      const response = await this.api.put("/auth/profile", userData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Profile update failed",
      };
    }
  }

  // Wallet & Transactions
  async getWalletBalance(): Promise<ApiResponse> {
    try {
      const response = await this.api.get("/wallet/balance");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch balance",
      };
    }
  }

  async getTransactions(page = 1, limit = 20): Promise<ApiResponse> {
    try {
      const response = await this.api.get(
        `/transactions?page=${page}&limit=${limit}`,
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch transactions",
      };
    }
  }

  async sendMoney(data: {
    recipientAccount: string;
    amount: number;
    bankCode: string;
    narration?: string;
  }): Promise<ApiResponse> {
    try {
      const response = await this.api.post("/transactions/transfer", data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Transfer failed",
      };
    }
  }

  // Bills & Payments
  async getBillers(category: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(
        `/bills/billers?category=${category}`,
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch billers",
      };
    }
  }

  async payBill(data: {
    billerId: string;
    amount: number;
    customerNumber: string;
    type: string;
  }): Promise<ApiResponse> {
    try {
      const response = await this.api.post("/bills/pay", data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Bill payment failed",
      };
    }
  }

  async buyAirtime(data: {
    network: string;
    amount: number;
    phoneNumber: string;
  }): Promise<ApiResponse> {
    try {
      const response = await this.api.post("/bills/airtime", data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Airtime purchase failed",
      };
    }
  }

  // Investments
  async getInvestmentProducts(): Promise<ApiResponse> {
    try {
      const response = await this.api.get("/investments/products");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to fetch investment products",
      };
    }
  }

  async getPortfolio(): Promise<ApiResponse> {
    try {
      const response = await this.api.get("/portfolio");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch portfolio",
      };
    }
  }

  async createInvestment(data: {
    productId: string;
    amount: number;
    duration?: number;
  }): Promise<ApiResponse> {
    try {
      const response = await this.api.post("/investments", data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Investment creation failed",
      };
    }
  }

  // Crypto
  async getCryptoMarket(): Promise<ApiResponse> {
    try {
      const response = await this.api.get("/crypto/market");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch crypto market",
      };
    }
  }

  async getCryptoHoldings(): Promise<ApiResponse> {
    try {
      const response = await this.api.get("/crypto/holdings");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to fetch crypto holdings",
      };
    }
  }

  // Device & Notifications
  async registerDeviceToken(
    platform: "ios" | "android",
    token: string,
  ): Promise<ApiResponse> {
    try {
      const response = await this.api.post("/notifications/register-device", {
        platform,
        token,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Device registration failed",
      };
    }
  }

  // Banks
  async getBanks(): Promise<ApiResponse> {
    try {
      const response = await this.api.get("/payments/banks");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch banks",
      };
    }
  }

  async verifyAccountNumber(
    accountNumber: string,
    bankCode: string,
  ): Promise<ApiResponse> {
    try {
      const response = await this.api.post("/payments/verify-account", {
        account_number: accountNumber,
        bank_code: bankCode,
      });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || "Account verification failed",
      };
    }
  }
}

export const ApiService = new ApiServiceClass();
