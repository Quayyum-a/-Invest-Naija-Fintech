import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";

interface FlutterwaveResponse<T = any> {
  status: "success" | "error";
  message: string;
  data: T;
  meta?: any;
}

interface FlutterwavePaymentRequest {
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options?: string;
  customer: {
    email: string;
    phonenumber?: string;
    name?: string;
  };
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  redirect_url?: string;
  meta?: Record<string, any>;
}

interface FlutterwaveTransferRequest {
  account_bank: string;
  account_number: string;
  amount: number;
  narration?: string;
  currency?: string;
  reference?: string;
  callback_url?: string;
  debit_currency?: string;
  beneficiary_name?: string;
}

interface BankData {
  id: number;
  code: string;
  name: string;
}

class FlutterwaveService {
  private client: AxiosInstance;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!env.FLUTTERWAVE_SECRET_KEY;

    this.client = axios.create({
      baseURL: "https://api.flutterwave.com/v3",
      headers: {
        Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `Flutterwave API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => {
        console.error("Flutterwave request error:", error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `Flutterwave API Response: ${response.status} - ${response.data?.message || "Success"}`,
        );
        return response;
      },
      (error) => {
        console.error(
          "Flutterwave API error:",
          error.response?.data || error.message,
        );
        throw error;
      },
    );
  }

  private checkEnabled() {
    if (!this.isEnabled) {
      throw new Error(
        "Flutterwave service is not configured. Please set FLUTTERWAVE_SECRET_KEY environment variable.",
      );
    }
  }

  async initializePayment(
    data: FlutterwavePaymentRequest,
  ): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    const response = await this.client.post("/payments", data);
    return response.data;
  }

  async verifyPayment(tx_ref: string): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    const response = await this.client.get(
      `/transactions/verify_by_reference?tx_ref=${tx_ref}`,
    );
    return response.data;
  }

  async getBanks(): Promise<FlutterwaveResponse<BankData[]>> {
    this.checkEnabled();

    const response = await this.client.get("/banks/NG");
    return response.data;
  }

  async verifyAccountNumber(
    account_number: string,
    account_bank: string,
  ): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    const response = await this.client.post("/accounts/resolve", {
      account_number,
      account_bank,
    });
    return response.data;
  }

  async initiateTransfer(
    data: FlutterwaveTransferRequest,
  ): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    const response = await this.client.post("/transfers", {
      ...data,
      currency: data.currency || "NGN",
    });
    return response.data;
  }

  // Bill payment methods
  async getBillers(): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    const response = await this.client.get("/bill-categories");
    return response.data;
  }

  async validateCustomer(
    item_code: string,
    code: string,
    customer: string,
  ): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    const response = await this.client.get(
      `/bill-items/${item_code}/validate?code=${code}&customer=${customer}`,
    );
    return response.data;
  }

  async payBill(data: {
    country: string;
    customer: string;
    amount: number;
    recurrence?: string;
    type: string;
    reference?: string;
  }): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    const response = await this.client.post("/bills", data);
    return response.data;
  }

  // Airtime purchase
  async buyAirtime(data: {
    network: "MTN" | "GLO" | "AIRTEL" | "9MOBILE";
    phone: string;
    amount: number;
    reference?: string;
  }): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    return this.payBill({
      country: "NG",
      customer: data.phone,
      amount: data.amount,
      type: "AIRTIME",
      reference: data.reference || `airtime_${Date.now()}`,
    });
  }

  // Data bundle purchase
  async buyData(data: {
    network: "MTN" | "GLO" | "AIRTEL" | "9MOBILE";
    phone: string;
    data_plan: string;
    amount: number;
    reference?: string;
  }): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    // Map data plans to Flutterwave codes
    const dataPlanCodes = {
      MTN: {
        "1GB": "MTN-1GB-30",
        "2GB": "MTN-2GB-30",
        "5GB": "MTN-5GB-30",
        "10GB": "MTN-10GB-30",
      },
      GLO: {
        "1GB": "GLO-1GB-30",
        "2GB": "GLO-2GB-30",
        "5GB": "GLO-5GB-30",
        "10GB": "GLO-10GB-30",
      },
      AIRTEL: {
        "1GB": "AIRTEL-1GB-30",
        "2GB": "AIRTEL-2GB-30",
        "5GB": "AIRTEL-5GB-30",
        "10GB": "AIRTEL-10GB-30",
      },
      "9MOBILE": {
        "1GB": "9MOBILE-1GB-30",
        "2GB": "9MOBILE-2GB-30",
        "5GB": "9MOBILE-5GB-30",
        "10GB": "9MOBILE-10GB-30",
      },
    };

    const planCode = dataPlanCodes[data.network]?.[data.data_plan];
    if (!planCode) {
      throw new Error(
        `Unsupported data plan: ${data.data_plan} for ${data.network}`,
      );
    }

    return this.payBill({
      country: "NG",
      customer: data.phone,
      amount: data.amount,
      type: planCode,
      reference: data.reference || `data_${Date.now()}`,
    });
  }

  // Cable TV payment
  async payCableTV(data: {
    provider: "DSTV" | "GOTV" | "STARTIMES";
    customer_id: string;
    package_code: string;
    amount: number;
    reference?: string;
  }): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    const providerCodes = {
      DSTV: "DSTV",
      GOTV: "GOTV",
      STARTIMES: "STARTIMES",
    };

    const typeCode = providerCodes[data.provider];
    if (!typeCode) {
      throw new Error(`Unsupported cable provider: ${data.provider}`);
    }

    return this.payBill({
      country: "NG",
      customer: data.customer_id,
      amount: data.amount,
      type: `${typeCode}-${data.package_code}`,
      reference: data.reference || `cable_${Date.now()}`,
    });
  }

  // Electricity bill payment
  async payElectricity(data: {
    disco: "AEDC" | "EKEDC" | "IKEDC" | "PHED" | "JEDC" | "KEDCO";
    customer_id: string;
    amount: number;
    reference?: string;
  }): Promise<FlutterwaveResponse> {
    this.checkEnabled();

    return this.payBill({
      country: "NG",
      customer: data.customer_id,
      amount: data.amount,
      type: `${data.disco}-PREPAID`,
      reference: data.reference || `electricity_${Date.now()}`,
    });
  }

  // Webhook verification
  verifyWebhook(signature: string, body: string): boolean {
    if (!env.FLUTTERWAVE_WEBHOOK_SECRET) {
      console.warn("Flutterwave webhook secret not configured");
      return false;
    }

    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha256", env.FLUTTERWAVE_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    return hash === signature;
  }

  // Check if service is enabled
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}

export const flutterwaveService = new FlutterwaveService();
export default FlutterwaveService;
