import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";

interface YouVerifyResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: any[];
}

interface BVNVerificationRequest {
  id: string;
  isSubjectConsent?: boolean;
  validations?: {
    data: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
    };
  };
}

interface NINVerificationRequest {
  id: string;
  isSubjectConsent?: boolean;
  validations?: {
    data: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
    };
  };
}

interface BVNData {
  bvn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  phoneNumber: string;
  registrationDate: string;
  enrollmentBank: string;
  enrollmentBranch: string;
  watchListed: string;
  nationality: string;
  gender: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  residentialAddress: string;
  stateOfResidence: string;
  lgaOfResidence: string;
  imageBase64?: string;
}

interface NINData {
  nin: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  phoneNumber: string;
  gender: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  residentialAddress: string;
  stateOfResidence: string;
  lgaOfResidence: string;
  nationality: string;
  religion: string;
  maritalStatus: string;
  educationalLevel: string;
  employmentStatus: string;
  imageBase64?: string;
}

class YouVerifyService {
  private client: AxiosInstance;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!env.YOUVERIFY_API_KEY;

    this.client = axios.create({
      baseURL: env.YOUVERIFY_BASE_URL || "https://api.youverify.co/v2",
      headers: {
        "Api-Key": env.YOUVERIFY_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `YouVerify API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => {
        console.error("YouVerify request error:", error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `YouVerify API Response: ${response.status} - ${response.data?.message || "Success"}`,
        );
        return response;
      },
      (error) => {
        console.error(
          "YouVerify API error:",
          error.response?.data || error.message,
        );
        throw error;
      },
    );
  }

  private checkEnabled() {
    if (!this.isEnabled) {
      throw new Error(
        "YouVerify service is not configured. Please set YOUVERIFY_API_KEY environment variable.",
      );
    }
  }

  async verifyBVN(
    data: BVNVerificationRequest,
  ): Promise<YouVerifyResponse<BVNData>> {
    this.checkEnabled();

    const response = await this.client.post("/api/identity/ng/bvn", {
      ...data,
      isSubjectConsent: true, // Required for NDPR compliance
    });

    return response.data;
  }

  async verifyNIN(
    data: NINVerificationRequest,
  ): Promise<YouVerifyResponse<NINData>> {
    this.checkEnabled();

    const response = await this.client.post("/api/identity/ng/nin", {
      ...data,
      isSubjectConsent: true, // Required for NDPR compliance
    });

    return response.data;
  }

  // Simplified BVN verification method
  async validateBVN(
    bvn: string,
    userData?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
    },
  ): Promise<{ valid: boolean; data?: BVNData; message?: string }> {
    try {
      this.checkEnabled();

      const result = await this.verifyBVN({
        id: bvn,
        isSubjectConsent: true,
        validations: userData ? { data: userData } : undefined,
      });

      if (result.success && result.data) {
        return {
          valid: true,
          data: result.data,
          message: "BVN verified successfully",
        };
      } else {
        return {
          valid: false,
          message: result.message || "BVN verification failed",
        };
      }
    } catch (error: any) {
      console.error("BVN validation error:", error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        return {
          valid: false,
          message: "BVN not found or invalid",
        };
      }

      if (error.response?.status === 400) {
        return {
          valid: false,
          message: "Invalid BVN format",
        };
      }

      return {
        valid: false,
        message: "BVN verification service temporarily unavailable",
      };
    }
  }

  // Simplified NIN verification method
  async validateNIN(
    nin: string,
    userData?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
    },
  ): Promise<{ valid: boolean; data?: NINData; message?: string }> {
    try {
      this.checkEnabled();

      const result = await this.verifyNIN({
        id: nin,
        isSubjectConsent: true,
        validations: userData ? { data: userData } : undefined,
      });

      if (result.success && result.data) {
        return {
          valid: true,
          data: result.data,
          message: "NIN verified successfully",
        };
      } else {
        return {
          valid: false,
          message: result.message || "NIN verification failed",
        };
      }
    } catch (error: any) {
      console.error("NIN validation error:", error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        return {
          valid: false,
          message: "NIN not found or invalid",
        };
      }

      if (error.response?.status === 400) {
        return {
          valid: false,
          message: "Invalid NIN format",
        };
      }

      return {
        valid: false,
        message: "NIN verification service temporarily unavailable",
      };
    }
  }

  // Get verification status
  async getVerificationStatus(requestId: string): Promise<YouVerifyResponse> {
    this.checkEnabled();

    const response = await this.client.get(`/api/verification/${requestId}`);
    return response.data;
  }

  // Mock verification for development/testing
  async mockBVNVerification(
    bvn: string,
  ): Promise<{ valid: boolean; data?: any; message?: string }> {
    console.log("Using mock BVN verification for development");

    // Basic BVN format validation (11 digits)
    if (!/^\d{11}$/.test(bvn)) {
      return {
        valid: false,
        message: "Invalid BVN format. BVN must be 11 digits.",
      };
    }

    // Mock successful verification
    return {
      valid: true,
      data: {
        bvn,
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
        phoneNumber: "08012345678",
        gender: "Male",
        nationality: "Nigerian",
        stateOfOrigin: "Lagos",
        lgaOfOrigin: "Lagos Island",
        residentialAddress: "123 Test Street, Lagos",
        stateOfResidence: "Lagos",
        lgaOfResidence: "Lagos Island",
        enrollmentBank: "GTBank",
        registrationDate: "2010-01-01",
        watchListed: "NO",
      },
      message: "BVN verified successfully (mock)",
    };
  }

  // Mock NIN verification for development/testing
  async mockNINVerification(
    nin: string,
  ): Promise<{ valid: boolean; data?: any; message?: string }> {
    console.log("Using mock NIN verification for development");

    // Basic NIN format validation (11 digits)
    if (!/^\d{11}$/.test(nin)) {
      return {
        valid: false,
        message: "Invalid NIN format. NIN must be 11 digits.",
      };
    }

    // Mock successful verification
    return {
      valid: true,
      data: {
        nin,
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
        phoneNumber: "08012345678",
        gender: "Male",
        nationality: "Nigerian",
        stateOfOrigin: "Lagos",
        lgaOfOrigin: "Lagos Island",
        residentialAddress: "123 Test Street, Lagos",
        stateOfResidence: "Lagos",
        lgaOfResidence: "Lagos Island",
        religion: "Christianity",
        maritalStatus: "Single",
        educationalLevel: "University",
        employmentStatus: "Employed",
      },
      message: "NIN verified successfully (mock)",
    };
  }

  // Check if service is enabled
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  // Use mock or real verification based on environment
  async verifyBVNSafe(
    bvn: string,
    userData?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
    },
  ): Promise<{ valid: boolean; data?: any; message?: string }> {
    if (this.isEnabled) {
      return this.validateBVN(bvn, userData);
    } else {
      return this.mockBVNVerification(bvn);
    }
  }

  async verifyNINSafe(
    nin: string,
    userData?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
    },
  ): Promise<{ valid: boolean; data?: any; message?: string }> {
    if (this.isEnabled) {
      return this.validateNIN(nin, userData);
    } else {
      return this.mockNINVerification(nin);
    }
  }
}

export const youVerifyService = new YouVerifyService();
export default YouVerifyService;
