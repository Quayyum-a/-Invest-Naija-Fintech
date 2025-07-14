import axios from "axios";

// Bill payment service integrating with reliable Nigerian APIs
class BillPaymentService {
  private paystackApiKey: string;
  private flutterwaveApiKey: string;
  private baseUrlPaystack = "https://api.paystack.co";
  private baseUrlFlutterwave = "https://api.flutterwave.com/v3";

  constructor() {
    this.paystackApiKey = process.env.PAYSTACK_SECRET_KEY;
    this.flutterwaveApiKey = process.env.FLUTTERWAVE_SECRET_KEY;

    if (!this.paystackApiKey && !this.flutterwaveApiKey) {
      console.warn(
        "No payment provider API keys configured. Some features may not work.",
      );
    }

    if (process.env.NODE_ENV === "production") {
      if (
        this.paystackApiKey?.includes("test") ||
        this.flutterwaveApiKey?.includes("TEST")
      ) {
        throw new Error("Test API keys cannot be used in production");
      }
    }
  }

  // Get available billers (Electricity, Cable TV, Internet, etc.)
  async getBillers(category?: string) {
    try {
      // Using Flutterwave Bills API
      const response = await axios.get(
        `${this.baseUrlFlutterwave}/bills/categories`,
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveApiKey}`,
          },
        },
      );

      return {
        success: true,
        data: response.data.data || this.getFallbackBillers(),
      };
    } catch (error: any) {
      console.error(
        "Get billers error:",
        error.response?.data || error.message,
      );
      // Return fallback list of major Nigerian billers
      return {
        success: true,
        data: this.getFallbackBillers(),
      };
    }
  }

  // Get electricity distribution companies
  async getElectricityCompanies() {
    try {
      const response = await axios.get(
        `${this.baseUrlFlutterwave}/bills/categories/electricity/billers`,
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveApiKey}`,
          },
        },
      );

      return {
        success: true,
        data: response.data.data || this.getFallbackElectricityCompanies(),
      };
    } catch (error: any) {
      console.error(
        "Get electricity companies error:",
        error.response?.data || error.message,
      );
      return {
        success: true,
        data: this.getFallbackElectricityCompanies(),
      };
    }
  }

  // Validate customer details (meter number, phone number, etc.)
  async validateCustomer(billerId: string, customerCode: string) {
    try {
      const response = await axios.post(
        `${this.baseUrlFlutterwave}/bills/validate`,
        {
          biller_code: billerId,
          customer: customerCode,
        },
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Validate customer error:",
        error.response?.data || error.message,
      );
      // Return actual error for production
      return {
        success: false,
        error: error.response?.data?.message || "Customer validation failed",
      };
    }
  }

  // Pay electricity bill
  async payElectricityBill(data: {
    billerId: string;
    meterNumber: string;
    amount: number;
    customerName?: string;
    reference: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrlFlutterwave}/bills`,
        {
          country: "NG",
          customer: data.meterNumber,
          amount: data.amount,
          type: data.billerId,
          reference: data.reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: "Electricity bill payment successful",
      };
    } catch (error: any) {
      console.error(
        "Pay electricity bill error:",
        error.response?.data || error.message,
      );
      throw new Error("Electricity bill payment failed");
    }
  }

  // Buy airtime
  async buyAirtime(data: {
    network: string;
    phoneNumber: string;
    amount: number;
    reference: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrlFlutterwave}/bills`,
        {
          country: "NG",
          customer: data.phoneNumber,
          amount: data.amount,
          type: this.getAirtimeCode(data.network),
          reference: data.reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: "Airtime purchase successful",
      };
    } catch (error: any) {
      console.error(
        "Buy airtime error:",
        error.response?.data || error.message,
      );
      throw new Error("Airtime purchase failed");
    }
  }

  // Buy data bundle
  async buyDataBundle(data: {
    network: string;
    phoneNumber: string;
    planId: string;
    amount: number;
    reference: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrlFlutterwave}/bills`,
        {
          country: "NG",
          customer: data.phoneNumber,
          amount: data.amount,
          type: data.planId,
          reference: data.reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: "Data bundle purchase successful",
      };
    } catch (error: any) {
      console.error(
        "Buy data bundle error:",
        error.response?.data || error.message,
      );
      throw new Error("Data bundle purchase failed");
    }
  }

  // Pay cable TV subscription
  async payCableTVBill(data: {
    provider: string;
    smartCardNumber: string;
    planId: string;
    amount: number;
    reference: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrlFlutterwave}/bills`,
        {
          country: "NG",
          customer: data.smartCardNumber,
          amount: data.amount,
          type: data.planId,
          reference: data.reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.flutterwaveApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: "Cable TV subscription successful",
      };
    } catch (error: any) {
      console.error(
        "Pay cable TV bill error:",
        error.response?.data || error.message,
      );
      throw new Error("Cable TV payment failed");
    }
  }

  // Helper methods
  private getAirtimeCode(network: string): string {
    const networkCodes: { [key: string]: string } = {
      mtn: "BIL099",
      glo: "BIL102",
      airtel: "BIL100",
      "9mobile": "BIL103",
    };
    return networkCodes[network.toLowerCase()] || "BIL099";
  }

  private getFallbackBillers() {
    return [
      {
        id: "electricity",
        name: "Electricity",
        description: "Pay electricity bills",
        category: "utilities",
      },
      {
        id: "airtime",
        name: "Airtime",
        description: "Buy mobile airtime",
        category: "mobile",
      },
      {
        id: "data",
        name: "Data Bundle",
        description: "Buy mobile data",
        category: "mobile",
      },
      {
        id: "cable",
        name: "Cable TV",
        description: "Pay cable TV subscription",
        category: "entertainment",
      },
      {
        id: "internet",
        name: "Internet",
        description: "Pay internet bills",
        category: "utilities",
      },
    ];
  }

  private getFallbackElectricityCompanies() {
    return [
      {
        id: "EKEDC",
        name: "Eko Electricity Distribution Company",
        code: "BIL119",
      },
      { id: "IKEDC", name: "Ikeja Electric", code: "BIL120" },
      {
        id: "AEDC",
        name: "Abuja Electricity Distribution Company",
        code: "BIL121",
      },
      {
        id: "KEDCO",
        name: "Kano Electricity Distribution Company",
        code: "BIL122",
      },
      {
        id: "PHED",
        name: "Port Harcourt Electricity Distribution",
        code: "BIL123",
      },
      {
        id: "BEDC",
        name: "Benin Electricity Distribution Company",
        code: "BIL124",
      },
      {
        id: "EEDC",
        name: "Enugu Electricity Distribution Company",
        code: "BIL125",
      },
      {
        id: "JEDC",
        name: "Jos Electricity Distribution Company",
        code: "BIL126",
      },
    ];
  }
}

// Bank transfer service using reliable Nigerian APIs
class BankTransferService {
  private paystackApiKey: string;
  private baseUrl = "https://api.paystack.co";

  constructor() {
    this.paystackApiKey =
      process.env.PAYSTACK_SECRET_KEY ||
      "sk_test_52dc872013582129d489989e914c772186924031";
  }

  // Get Nigerian banks
  async getBanks() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/bank?currency=NGN&country=nigeria`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackApiKey}`,
          },
        },
      );

      return {
        success: true,
        data: response.data.data || this.getFallbackBanks(),
      };
    } catch (error: any) {
      console.error("Get banks error:", error.response?.data || error.message);
      return {
        success: true,
        data: this.getFallbackBanks(),
      };
    }
  }

  // Verify account number
  async verifyAccount(accountNumber: string, bankCode: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackApiKey}`,
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Verify account error:",
        error.response?.data || error.message,
      );
      throw new Error("Account verification failed");
    }
  }

  // Create transfer recipient
  async createTransferRecipient(data: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        {
          type: "nuban",
          name: data.accountName,
          account_number: data.accountNumber,
          bank_code: data.bankCode,
          currency: "NGN",
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(
        "Create transfer recipient error:",
        error.response?.data || error.message,
      );
      throw new Error("Failed to create transfer recipient");
    }
  }

  // Initiate transfer
  async initiateTransfer(data: {
    recipientCode: string;
    amount: number;
    reason?: string;
    reference: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfer`,
        {
          source: "balance",
          amount: data.amount * 100, // Convert to kobo
          recipient: data.recipientCode,
          reason: data.reason || "Transfer",
          reference: data.reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: "Transfer initiated successfully",
      };
    } catch (error: any) {
      console.error(
        "Initiate transfer error:",
        error.response?.data || error.message,
      );
      throw new Error("Transfer failed");
    }
  }

  // Transfer to OPay (using phone number)
  async transferToOPay(data: {
    phoneNumber: string;
    amount: number;
    reason?: string;
    reference: string;
  }) {
    try {
      // For OPay transfers, we'd typically use their API
      // For now, using Paystack transfer to OPay account numbers
      const response = await axios.post(
        `${this.baseUrl}/transfer`,
        {
          source: "balance",
          amount: data.amount * 100,
          recipient: data.phoneNumber, // OPay phone as account
          reason: data.reason || "OPay Transfer",
          reference: data.reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystackApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: true,
        data: response.data.data,
        message: "OPay transfer successful",
      };
    } catch (error: any) {
      console.error(
        "OPay transfer error:",
        error.response?.data || error.message,
      );
      throw new Error("OPay transfer failed");
    }
  }

  private getFallbackBanks() {
    return [
      { code: "044", name: "Access Bank" },
      { code: "014", name: "Afribank Nigeria Plc" },
      { code: "023", name: "Citibank Nigeria Limited" },
      { code: "050", name: "Ecobank Nigeria Plc" },
      { code: "011", name: "First Bank of Nigeria Limited" },
      { code: "214", name: "First City Monument Bank Limited" },
      { code: "070", name: "Fidelity Bank Plc" },
      { code: "058", name: "Guaranty Trust Bank Plc" },
      { code: "030", name: "Heritage Banking Company Ltd" },
      { code: "082", name: "Keystone Bank Limited" },
      { code: "076", name: "Polaris Bank Limited" },
      { code: "039", name: "Stanbic IBTC Bank Plc" },
      { code: "232", name: "Sterling Bank Plc" },
      { code: "032", name: "Union Bank of Nigeria Plc" },
      { code: "033", name: "United Bank for Africa Plc" },
      { code: "215", name: "Unity Bank Plc" },
      { code: "035", name: "Wema Bank Plc" },
      { code: "057", name: "Zenith Bank Plc" },
      { code: "999992", name: "OPay" },
      { code: "999991", name: "PalmPay" },
      { code: "999993", name: "Moniepoint" },
      { code: "999994", name: "Kuda Bank" },
    ];
  }
}

export const billPaymentService = new BillPaymentService();
export const bankTransferService = new BankTransferService();
