import axios, { AxiosInstance } from "axios";
import { env } from "../config/env";

interface PaystackResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

interface InitializePaymentRequest {
  email: string;
  amount: number;
  currency?: string;
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[];
}

interface TransferRecipientRequest {
  type: "nuban" | "mobile_money" | "basa";
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
  description?: string;
}

interface InitiateTransferRequest {
  source: "balance";
  amount: number;
  recipient: string;
  reason?: string;
  currency?: string;
  reference?: string;
}

interface BankData {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway: string;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
}

class PaystackService {
  private client: AxiosInstance;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !!env.PAYSTACK_SECRET_KEY;

    this.client = axios.create({
      baseURL: "https://api.paystack.co",
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `Paystack API Request: ${config.method?.toUpperCase()} ${config.url}`,
        );
        return config;
      },
      (error) => {
        console.error("Paystack request error:", error);
        return Promise.reject(error);
      },
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `Paystack API Response: ${response.status} - ${response.data?.message || "Success"}`,
        );
        return response;
      },
      (error) => {
        console.error(
          "Paystack API error:",
          error.response?.data || error.message,
        );
        throw error;
      },
    );
  }

  private checkEnabled() {
    if (!this.isEnabled) {
      throw new Error(
        "Paystack service is not configured. Please set PAYSTACK_SECRET_KEY environment variable.",
      );
    }
  }

  async initializePayment(
    data: InitializePaymentRequest,
  ): Promise<PaystackResponse> {
    this.checkEnabled();

    const response = await this.client.post("/transaction/initialize", {
      ...data,
      amount: data.amount * 100, // Convert to kobo
    });
    return response.data;
  }

  async verifyPayment(reference: string): Promise<PaystackResponse> {
    this.checkEnabled();

    const response = await this.client.get(`/transaction/verify/${reference}`);
    return response.data;
  }

  async getBanks(): Promise<PaystackResponse<BankData[]>> {
    this.checkEnabled();

    const response = await this.client.get(
      "/bank?country=nigeria&per_page=100",
    );
    return response.data;
  }

  async verifyAccountNumber(
    account_number: string,
    bank_code: string,
  ): Promise<PaystackResponse> {
    this.checkEnabled();

    const response = await this.client.get(
      `/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
    );
    return response.data;
  }

  async createTransferRecipient(
    data: TransferRecipientRequest,
  ): Promise<PaystackResponse> {
    this.checkEnabled();

    const response = await this.client.post("/transferrecipient", data);
    return response.data;
  }

  async initiateTransfer(
    data: InitiateTransferRequest,
  ): Promise<PaystackResponse> {
    this.checkEnabled();

    const response = await this.client.post("/transfer", {
      ...data,
      amount: data.amount * 100, // Convert to kobo
    });
    return response.data;
  }

  async verifyBVN(bvn: string): Promise<PaystackResponse> {
    this.checkEnabled();

    const response = await this.client.get(`/bank/resolve_bvn/${bvn}`);
    return response.data;
  }

  // Bill payment methods
  async getBillers(): Promise<PaystackResponse> {
    this.checkEnabled();

    const response = await this.client.get("/bill/biller");
    return response.data;
  }

  async validateCustomer(
    biller_code: string,
    customer_id: string,
  ): Promise<PaystackResponse> {
    this.checkEnabled();

    const response = await this.client.get(
      `/bill/validate?biller_code=${biller_code}&customer_id=${customer_id}`,
    );
    return response.data;
  }

  async payBill(data: {
    biller_code: string;
    customer_id: string;
    amount: number;
    reference?: string;
    metadata?: Record<string, any>;
  }): Promise<PaystackResponse> {
    this.checkEnabled();

    const response = await this.client.post("/bill/pay", {
      ...data,
      amount: data.amount * 100, // Convert to kobo
    });
    return response.data;
  }

  // Airtime purchase
  async buyAirtime(data: {
    network: "mtn" | "glo" | "airtel" | "9mobile";
    phone: string;
    amount: number;
    reference?: string;
  }): Promise<PaystackResponse> {
    this.checkEnabled();

    // Map networks to Paystack biller codes
    const networkBillers = {
      mtn: "BIL099",
      glo: "BIL119",
      airtel: "BIL120",
      "9mobile": "BIL121",
    };

    const biller_code = networkBillers[data.network];
    if (!biller_code) {
      throw new Error(`Unsupported network: ${data.network}`);
    }

    return this.payBill({
      biller_code,
      customer_id: data.phone,
      amount: data.amount,
      reference: data.reference,
      metadata: {
        network: data.network,
        phone: data.phone,
        type: "airtime",
      },
    });
  }

  // Data bundle purchase
  async buyData(data: {
    network: "mtn" | "glo" | "airtel" | "9mobile";
    phone: string;
    data_plan: string;
    amount: number;
    reference?: string;
  }): Promise<PaystackResponse> {
    this.checkEnabled();

    // Map networks to data biller codes
    const networkDataBillers = {
      mtn: "BIL108",
      glo: "BIL109",
      airtel: "BIL110",
      "9mobile": "BIL111",
    };

    const biller_code = networkDataBillers[data.network];
    if (!biller_code) {
      throw new Error(`Unsupported network for data: ${data.network}`);
    }

    return this.payBill({
      biller_code,
      customer_id: data.phone,
      amount: data.amount,
      reference: data.reference,
      metadata: {
        network: data.network,
        phone: data.phone,
        data_plan: data.data_plan,
        type: "data",
      },
    });
  }

  // Cable TV payment
  async payCableTV(data: {
    provider: "dstv" | "gotv" | "startimes" | "showmax";
    customer_id: string;
    amount: number;
    reference?: string;
  }): Promise<PaystackResponse> {
    this.checkEnabled();

    // Map providers to biller codes
    const cableBillers = {
      dstv: "BIL112",
      gotv: "BIL113",
      startimes: "BIL114",
      showmax: "BIL115",
    };

    const biller_code = cableBillers[data.provider];
    if (!biller_code) {
      throw new Error(`Unsupported cable provider: ${data.provider}`);
    }

    return this.payBill({
      biller_code,
      customer_id: data.customer_id,
      amount: data.amount,
      reference: data.reference,
      metadata: {
        provider: data.provider,
        customer_id: data.customer_id,
        type: "cable_tv",
      },
    });
  }

  // Electricity bill payment
  async payElectricity(data: {
    disco: "aedc" | "ekedc" | "ikedc" | "phed" | "jedc" | "kedco" | "yola";
    customer_id: string;
    amount: number;
    reference?: string;
  }): Promise<PaystackResponse> {
    this.checkEnabled();

    // Map DISCOs to biller codes
    const discoBillers = {
      aedc: "BIL116", // Abuja Electricity Distribution Company
      ekedc: "BIL117", // Eko Electricity Distribution Company
      ikedc: "BIL118", // Ikeja Electric Distribution Company
      phed: "BIL122", // Port Harcourt Electricity Distribution
      jedc: "BIL123", // Jos Electricity Distribution Company
      kedco: "BIL124", // Kano Electricity Distribution Company
      yola: "BIL125", // Yola Electricity Distribution Company
    };

    const biller_code = discoBillers[data.disco];
    if (!biller_code) {
      throw new Error(
        `Unsupported electricity distribution company: ${data.disco}`,
      );
    }

    return this.payBill({
      biller_code,
      customer_id: data.customer_id,
      amount: data.amount,
      reference: data.reference,
      metadata: {
        disco: data.disco,
        customer_id: data.customer_id,
        type: "electricity",
      },
    });
  }

  // Webhook verification
  verifyWebhook(signature: string, body: string): boolean {
    if (!env.PAYSTACK_WEBHOOK_SECRET) {
      console.warn("Paystack webhook secret not configured");
      return false;
    }

    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha512", env.PAYSTACK_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    return hash === signature;
  }

  // Check if service is enabled
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}

export const paystackService = new PaystackService();
export default PaystackService;
