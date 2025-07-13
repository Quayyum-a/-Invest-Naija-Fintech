import axios, { AxiosResponse } from "axios";
import { randomUUID } from "crypto";
import { env } from "../config/env";
import { walletService } from "./walletService";
import {
  createTransaction,
  getUserById,
  createNotification,
} from "../data/storage";

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

interface FlutterwaveResponse {
  status: string;
  message: string;
  data: any;
}

export class PaymentsService {
  private paystackClient = axios.create({
    baseURL: "https://api.paystack.co",
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  private flutterwaveClient = axios.create({
    baseURL: "https://api.flutterwave.com/v3",
    headers: {
      Authorization: `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  // Paystack Methods
  async initializePaystackPayment(
    userId: string,
    amount: number,
    email: string,
    callbackUrl?: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const reference = `INV_${randomUUID()}`;

      const payload = {
        amount: amount * 100, // Paystack uses kobo
        email,
        reference,
        callback_url: callbackUrl || `${env.FRONTEND_URL}/payment/callback`,
        metadata: {
          userId,
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: userId,
            },
          ],
        },
      };

      const response: AxiosResponse<PaystackResponse> =
        await this.paystackClient.post("/transaction/initialize", payload);

      if (response.data.status) {
        // Create pending transaction
        createTransaction({
          userId,
          type: "deposit",
          amount,
          description: "Wallet funding via Paystack",
          status: "pending",
          metadata: {
            provider: "paystack",
            reference,
            authorization_url: response.data.data.authorization_url,
          },
        });

        return {
          success: true,
          data: {
            authorization_url: response.data.data.authorization_url,
            access_code: response.data.data.access_code,
            reference,
          },
        };
      }

      return { success: false, error: response.data.message };
    } catch (error: any) {
      console.error("Paystack initialization error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Payment initialization failed",
      };
    }
  }

  async verifyPaystackPayment(
    reference: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response: AxiosResponse<PaystackResponse> =
        await this.paystackClient.get(`/transaction/verify/${reference}`);

      if (response.data.status && response.data.data.status === "success") {
        const { amount, metadata } = response.data.data;
        const userId = metadata.userId;
        const actualAmount = amount / 100; // Convert from kobo

        // Add funds to wallet
        const result = await walletService.addFunds(
          userId,
          actualAmount,
          "paystack",
          reference,
          { gateway_response: response.data.data.gateway_response },
        );

        if (result.success) {
          // Create success notification
          createNotification({
            userId,
            title: "Payment Successful",
            message: `Your wallet has been funded with ₦${actualAmount.toLocaleString()}`,
            type: "transaction",
            priority: "normal",
          });

          return {
            success: true,
            data: {
              amount: actualAmount,
              reference,
              status: "success",
            },
          };
        }

        return { success: false, error: "Failed to update wallet" };
      }

      return {
        success: false,
        error: "Payment verification failed",
      };
    } catch (error: any) {
      console.error("Paystack verification error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Payment verification failed",
      };
    }
  }

  // Bank Transfer Methods
  async initiateBankTransfer(
    userId: string,
    amount: number,
    bankDetails: {
      accountNumber: string;
      bankCode: string;
      accountName: string;
    },
    narration?: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const reference = `TRF_${randomUUID()}`;

      // Use Paystack Transfer API
      const payload = {
        source: "balance",
        amount: amount * 100, // Convert to kobo
        recipient: bankDetails.accountNumber,
        reason: narration || "Wallet withdrawal",
        reference,
      };

      // First, create a transfer recipient
      const recipientPayload = {
        type: "nuban",
        name: bankDetails.accountName,
        account_number: bankDetails.accountNumber,
        bank_code: bankDetails.bankCode,
        currency: "NGN",
      };

      const recipientResponse: AxiosResponse<PaystackResponse> =
        await this.paystackClient.post("/transferrecipient", recipientPayload);

      if (!recipientResponse.data.status) {
        return {
          success: false,
          error: recipientResponse.data.message,
        };
      }

      const recipientCode = recipientResponse.data.data.recipient_code;

      // Initiate transfer
      const transferPayload = {
        source: "balance",
        amount: amount * 100,
        recipient: recipientCode,
        reason: narration || "Wallet withdrawal",
        reference,
      };

      const transferResponse: AxiosResponse<PaystackResponse> =
        await this.paystackClient.post("/transfer", transferPayload);

      if (transferResponse.data.status) {
        return {
          success: true,
          data: {
            reference,
            transfer_code: transferResponse.data.data.transfer_code,
            status: "pending",
          },
        };
      }

      return {
        success: false,
        error: transferResponse.data.message,
      };
    } catch (error: any) {
      console.error("Bank transfer error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Bank transfer failed",
      };
    }
  }

  // Bill Payment Methods
  async payElectricityBill(
    userId: string,
    billData: {
      customer: string;
      amount: number;
      disco: string; // Distribution company code
      meterType: "prepaid" | "postpaid";
    },
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Using Flutterwave Bill Payment API
      const reference = `BILL_${randomUUID()}`;

      const payload = {
        country: "NG",
        customer: billData.customer,
        amount: billData.amount,
        type: billData.disco,
        reference,
      };

      const response: AxiosResponse<FlutterwaveResponse> =
        await this.flutterwaveClient.post("/bills", payload);

      if (response.data.status === "success") {
        // Deduct from wallet
        const result = await walletService.transferFunds(
          userId,
          "system", // System account for bill payments
          billData.amount,
          `Electricity bill payment - ${billData.disco}`,
          {
            provider: "flutterwave",
            reference,
            customer: billData.customer,
            disco: billData.disco,
          },
        );

        if (result.success) {
          createNotification({
            userId,
            title: "Bill Payment Successful",
            message: `Electricity bill of ₦${billData.amount.toLocaleString()} paid successfully`,
            type: "transaction",
          });

          return {
            success: true,
            data: {
              reference,
              token: response.data.data.token,
              amount: billData.amount,
            },
          };
        }

        return { success: false, error: "Failed to deduct from wallet" };
      }

      return {
        success: false,
        error: response.data.message,
      };
    } catch (error: any) {
      console.error("Electricity bill payment error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Bill payment failed",
      };
    }
  }

  async buyAirtime(
    userId: string,
    airtimeData: {
      phone: string;
      amount: number;
      network: "MTN" | "AIRTEL" | "GLO" | "9MOBILE";
    },
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const reference = `AIR_${randomUUID()}`;

      // Map network names to Flutterwave codes
      const networkCodes = {
        MTN: "MTN",
        AIRTEL: "AIRTEL",
        GLO: "GLO",
        "9MOBILE": "9MOBILE",
      };

      const payload = {
        country: "NG",
        customer: airtimeData.phone,
        amount: airtimeData.amount,
        type: networkCodes[airtimeData.network],
        reference,
      };

      const response: AxiosResponse<FlutterwaveResponse> =
        await this.flutterwaveClient.post("/bills", payload);

      if (response.data.status === "success") {
        // Deduct from wallet
        const result = await walletService.transferFunds(
          userId,
          "system",
          airtimeData.amount,
          `Airtime purchase - ${airtimeData.network}`,
          {
            provider: "flutterwave",
            reference,
            phone: airtimeData.phone,
            network: airtimeData.network,
          },
        );

        if (result.success) {
          createNotification({
            userId,
            title: "Airtime Purchase Successful",
            message: `₦${airtimeData.amount.toLocaleString()} airtime sent to ${airtimeData.phone}`,
            type: "transaction",
          });

          return {
            success: true,
            data: {
              reference,
              phone: airtimeData.phone,
              amount: airtimeData.amount,
            },
          };
        }

        return { success: false, error: "Failed to deduct from wallet" };
      }

      return {
        success: false,
        error: response.data.message,
      };
    } catch (error: any) {
      console.error("Airtime purchase error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Airtime purchase failed",
      };
    }
  }

  // Virtual Account Methods
  async createVirtualAccount(
    userId: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const user = getUserById(userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      // Create virtual account using Paystack
      const payload = {
        customer: user.email,
        preferred_bank: "wema-bank", // Default bank
      };

      const response: AxiosResponse<PaystackResponse> =
        await this.paystackClient.post("/dedicated_account", payload);

      if (response.data.status) {
        return {
          success: true,
          data: {
            account_number: response.data.data.account_number,
            account_name: response.data.data.account_name,
            bank_name: response.data.data.bank.name,
            bank_code: response.data.data.bank.code,
          },
        };
      }

      return {
        success: false,
        error: response.data.message,
      };
    } catch (error: any) {
      console.error("Virtual account creation error:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Virtual account creation failed",
      };
    }
  }

  // Bank Verification Methods
  async verifyAccountNumber(
    accountNumber: string,
    bankCode: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response: AxiosResponse<PaystackResponse> =
        await this.paystackClient.get(
          `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        );

      if (response.data.status) {
        return {
          success: true,
          data: {
            account_number: response.data.data.account_number,
            account_name: response.data.data.account_name,
          },
        };
      }

      return {
        success: false,
        error: response.data.message,
      };
    } catch (error: any) {
      console.error("Account verification error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Account verification failed",
      };
    }
  }

  async getBanks(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response: AxiosResponse<PaystackResponse> =
        await this.paystackClient.get("/bank");

      if (response.data.status) {
        return {
          success: true,
          data: response.data.data,
        };
      }

      return {
        success: false,
        error: response.data.message,
      };
    } catch (error: any) {
      console.error("Get banks error:", error);
      return {
        success: false,
        error: error.response?.data?.message || "Failed to fetch banks",
      };
    }
  }
}

export const paymentsService = new PaymentsService();
