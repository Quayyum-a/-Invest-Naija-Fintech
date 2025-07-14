import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";

interface TermiiResponse<T = any> {
  message: string;
  data?: T;
  code?: string;
  message_id?: string;
  pin_id?: string;
  verified?: boolean;
  msisdn?: string;
}

interface SendSMSRequest {
  to: string;
  from: string;
  sms: string;
  type: "plain" | "unicode";
  channel: "generic" | "dnd" | "whatsapp";
  api_key: string;
}

interface SendOTPRequest {
  api_key: string;
  message_type: "NUMERIC" | "ALPHANUMERIC";
  to: string;
  from: string;
  channel: "generic" | "dnd" | "whatsapp";
  pin_attempts: number;
  pin_time_to_live: number;
  pin_length: number;
  pin_placeholder: string;
  message_text: string;
  pin_type: "NUMERIC" | "ALPHANUMERIC";
}

interface VerifyOTPRequest {
  api_key: string;
  pin_id: string;
  pin: string;
}

class TermiiService {
  private client: AxiosInstance;
  private isEnabled: boolean;
  private senderId: string;

  constructor() {
    this.isEnabled = !!env.TERMII_API_KEY;
    this.senderId = env.TERMII_SENDER_ID || "InvestNaija";

    this.client = axios.create({
      baseURL: "https://api.ng.termii.com/api",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `Termii API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => {
        console.error("Termii request error:", error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `Termii API Response: ${response.status} - ${response.data?.message || "Success"}`,
        );
        return response;
      },
      (error) => {
        console.error(
          "Termii API error:",
          error.response?.data || error.message,
        );
        throw error;
      },
    );
  }

  private checkEnabled() {
    if (!this.isEnabled) {
      throw new Error(
        "Termii service is not configured. Please set TERMII_API_KEY environment variable.",
      );
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // Handle Nigerian numbers
    if (cleaned.startsWith("0")) {
      cleaned = "234" + cleaned.substring(1);
    } else if (!cleaned.startsWith("234")) {
      cleaned = "234" + cleaned;
    }

    return cleaned;
  }

  async sendSMS(data: {
    to: string;
    message: string;
    type?: "plain" | "unicode";
    channel?: "generic" | "dnd" | "whatsapp";
  }): Promise<TermiiResponse> {
    this.checkEnabled();

    const formattedPhone = this.formatPhoneNumber(data.to);

    const requestData: SendSMSRequest = {
      to: formattedPhone,
      from: this.senderId,
      sms: data.message,
      type: data.type || "plain",
      channel: data.channel || "generic",
      api_key: env.TERMII_API_KEY!,
    };

    const response = await this.client.post("/sms/send", requestData);
    return response.data;
  }

  async sendOTP(data: {
    to: string;
    message?: string;
    pin_length?: number;
    pin_time_to_live?: number;
    pin_attempts?: number;
    channel?: "generic" | "dnd" | "whatsapp";
  }): Promise<TermiiResponse> {
    this.checkEnabled();

    const formattedPhone = this.formatPhoneNumber(data.to);
    const pin_length = data.pin_length || 6;
    const placeholder =
      "< " + "1234".repeat(pin_length).substring(0, pin_length) + " >";

    const requestData: SendOTPRequest = {
      api_key: env.TERMII_API_KEY!,
      message_type: "NUMERIC",
      to: formattedPhone,
      from: this.senderId,
      channel: data.channel || "generic",
      pin_attempts: data.pin_attempts || 3,
      pin_time_to_live: data.pin_time_to_live || 10, // 10 minutes
      pin_length,
      pin_placeholder: placeholder,
      message_text:
        data.message ||
        `Your InvestNaija verification code is ${placeholder}. Valid for ${data.pin_time_to_live || 10} minutes.`,
      pin_type: "NUMERIC",
    };

    const response = await this.client.post("/sms/otp/send", requestData);
    return response.data;
  }

  async verifyOTP(data: {
    pin_id: string;
    pin: string;
  }): Promise<TermiiResponse> {
    this.checkEnabled();

    const requestData: VerifyOTPRequest = {
      api_key: env.TERMII_API_KEY!,
      pin_id: data.pin_id,
      pin: data.pin,
    };

    const response = await this.client.post("/sms/otp/verify", requestData);
    return response.data;
  }

  // Get sender ID status
  async getSenderIds(): Promise<TermiiResponse> {
    this.checkEnabled();

    const response = await this.client.get(
      `/sender-id?api_key=${env.TERMII_API_KEY}`,
    );
    return response.data;
  }

  // Get account balance
  async getBalance(): Promise<TermiiResponse> {
    this.checkEnabled();

    const response = await this.client.get(
      `/get-balance?api_key=${env.TERMII_API_KEY}`,
    );
    return response.data;
  }

  // Send transaction notification
  async sendTransactionNotification(data: {
    to: string;
    amount: number;
    type: "credit" | "debit";
    balance?: number;
    reference?: string;
  }): Promise<TermiiResponse> {
    const message = this.buildTransactionMessage(data);
    return this.sendSMS({
      to: data.to,
      message,
      type: "plain",
      channel: "generic",
    });
  }

  // Send login notification
  async sendLoginNotification(data: {
    to: string;
    device?: string;
    location?: string;
    time?: Date;
  }): Promise<TermiiResponse> {
    const message = this.buildLoginMessage(data);
    return this.sendSMS({
      to: data.to,
      message,
      type: "plain",
      channel: "generic",
    });
  }

  // Send investment notification
  async sendInvestmentNotification(data: {
    to: string;
    amount: number;
    type: "purchase" | "maturity" | "withdrawal";
    product?: string;
  }): Promise<TermiiResponse> {
    const message = this.buildInvestmentMessage(data);
    return this.sendSMS({
      to: data.to,
      message,
      type: "plain",
      channel: "generic",
    });
  }

  // Mock SMS for development
  async mockSendSMS(data: {
    to: string;
    message: string;
  }): Promise<TermiiResponse> {
    console.log("Mock SMS sent:", {
      to: data.to,
      message: data.message,
      timestamp: new Date().toISOString(),
    });

    return {
      message: "SMS sent successfully (mock)",
      message_id: `mock_${Date.now()}`,
      code: "ok",
    };
  }

  // Mock OTP for development
  async mockSendOTP(data: { to: string }): Promise<TermiiResponse> {
    const mockPinId = `mock_pin_${Date.now()}`;
    console.log("Mock OTP sent:", {
      to: data.to,
      pin_id: mockPinId,
      pin: "123456", // Mock PIN for testing
      timestamp: new Date().toISOString(),
    });

    return {
      message: "OTP sent successfully (mock)",
      pin_id: mockPinId,
      code: "ok",
    };
  }

  // Mock OTP verification for development
  async mockVerifyOTP(data: {
    pin_id: string;
    pin: string;
  }): Promise<TermiiResponse> {
    console.log("Mock OTP verification:", data);

    // Accept '123456' as valid mock PIN
    const isValid = data.pin === "123456";

    return {
      message: isValid
        ? "OTP verified successfully (mock)"
        : "Invalid OTP (mock)",
      verified: isValid,
      code: isValid ? "ok" : "invalid",
    };
  }

  // Helper methods for message building
  private buildTransactionMessage(data: {
    amount: number;
    type: "credit" | "debit";
    balance?: number;
    reference?: string;
  }): string {
    const action = data.type === "credit" ? "credited with" : "debited";
    const balanceText = data.balance
      ? ` Balance: ₦${data.balance.toLocaleString()}`
      : "";
    const refText = data.reference ? ` Ref: ${data.reference}` : "";

    return `InvestNaija: Your account has been ${action} ₦${data.amount.toLocaleString()}.${balanceText}${refText}`;
  }

  private buildLoginMessage(data: {
    device?: string;
    location?: string;
    time?: Date;
  }): string {
    const timeStr = data.time
      ? data.time.toLocaleString()
      : new Date().toLocaleString();
    const deviceStr = data.device ? ` from ${data.device}` : "";
    const locationStr = data.location ? ` in ${data.location}` : "";

    return `InvestNaija: New login detected${deviceStr}${locationStr} at ${timeStr}. If this wasn't you, please secure your account immediately.`;
  }

  private buildInvestmentMessage(data: {
    amount: number;
    type: "purchase" | "maturity" | "withdrawal";
    product?: string;
  }): string {
    const productStr = data.product ? ` in ${data.product}` : "";

    switch (data.type) {
      case "purchase":
        return `InvestNaija: You've successfully invested ₦${data.amount.toLocaleString()}${productStr}. Thank you for choosing InvestNaija!`;
      case "maturity":
        return `InvestNaija: Your investment${productStr} of ₦${data.amount.toLocaleString()} has matured and been credited to your wallet.`;
      case "withdrawal":
        return `InvestNaija: You've successfully withdrawn ₦${data.amount.toLocaleString()} from your investment${productStr}.`;
      default:
        return `InvestNaija: Investment transaction of ₦${data.amount.toLocaleString()} completed.`;
    }
  }

  // Check if service is enabled
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  // Use mock or real SMS based on environment
  async sendSMSSafe(data: {
    to: string;
    message: string;
    type?: "plain" | "unicode";
    channel?: "generic" | "dnd" | "whatsapp";
  }): Promise<TermiiResponse> {
    if (this.isEnabled) {
      return this.sendSMS(data);
    } else {
      return this.mockSendSMS(data);
    }
  }

  async sendOTPSafe(data: {
    to: string;
    message?: string;
    pin_length?: number;
    pin_time_to_live?: number;
    pin_attempts?: number;
    channel?: "generic" | "dnd" | "whatsapp";
  }): Promise<TermiiResponse> {
    if (this.isEnabled) {
      return this.sendOTP(data);
    } else {
      return this.mockSendOTP(data);
    }
  }

  async verifyOTPSafe(data: {
    pin_id: string;
    pin: string;
  }): Promise<TermiiResponse> {
    if (this.isEnabled) {
      return this.verifyOTP(data);
    } else {
      return this.mockVerifyOTP(data);
    }
  }
}

export const termiiService = new TermiiService();
export default TermiiService;
