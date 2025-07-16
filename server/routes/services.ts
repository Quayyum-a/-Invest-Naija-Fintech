import { RequestHandler } from "express";
// import { ErrorResponse } from "@shared/api";
import {
  getUserWallet,
  updateWallet,
  createTransaction,
} from "../data/storage";
import {
  nigerianNetworks,
  billProviders,
  transferBanks,
  serviceCategories,
  serviceFees,
} from "../data/nigerian-services";

// Get all available services
export const getServices: RequestHandler = (req, res) => {
  try {
    res.json({
      success: true,
      services: {
        networks: nigerianNetworks,
        billProviders,
        transferBanks,
        categories: serviceCategories,
        fees: serviceFees,
      },
    });
  } catch (error) {
    console.error("Get services error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Buy Airtime
export const buyAirtime: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { networkId, phoneNumber, amount } = req.body;

    // Validation
    if (!networkId || !phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: "Network, phone number, and amount are required",
      });
    }

    // Validate network
    const network = nigerianNetworks.find((n) => n.id === networkId);
    if (!network) {
      return res.status(400).json({
        success: false,
        error: "Invalid network selected",
      });
    }

    // Validate amount
    if (
      amount < network.airtimeMinMax.min ||
      amount > network.airtimeMinMax.max
    ) {
      return res.status(400).json({
        success: false,
        error: `Amount must be between ₦${network.airtimeMinMax.min} and ₦${network.airtimeMinMax.max}`,
      });
    }

    // Validate phone number format
    const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Nigerian phone number format",
      });
    }

    // Get wallet and check balance
    const wallet = getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    const totalCost = amount + serviceFees.airtime.fee;
    if (wallet.balance < totalCost) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    // Process airtime purchase (simulate API call)
    const transaction = createTransaction({
      userId,
      type: "withdrawal",
      amount: totalCost,
      description: `${network.name} airtime for ${phoneNumber}`,
      status: "completed",
      metadata: {
        service: "airtime",
        network: networkId,
        phoneNumber,
        airtimeAmount: amount,
        fee: serviceFees.airtime.fee,
      },
    });

    // Update wallet
    updateWallet(userId, {
      balance: wallet.balance - totalCost,
    });

    // Simulate processing delay
    setTimeout(() => {
      // In real implementation, this would call MTN/GLO/Airtel/9Mobile API
      console.log(
        `Airtime purchased: ₦${amount} to ${phoneNumber} on ${network.name}`,
      );
    }, 1000);

    res.json({
      success: true,
      transaction,
      message: `₦${amount} airtime sent to ${phoneNumber} successfully`,
    });
  } catch (error) {
    console.error("Buy airtime error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Buy Data
export const buyData: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { networkId, phoneNumber, planId } = req.body;

    // Validation
    if (!networkId || !phoneNumber || !planId) {
      return res.status(400).json({
        success: false,
        error: "Network, phone number, and data plan are required",
      });
    }

    // Validate network and plan
    const network = nigerianNetworks.find((n) => n.id === networkId);
    if (!network) {
      return res.status(400).json({
        success: false,
        error: "Invalid network selected",
      });
    }

    const dataPlan = network.dataPlans.find((p) => p.id === planId);
    if (!dataPlan) {
      return res.status(400).json({
        success: false,
        error: "Invalid data plan selected",
      });
    }

    // Validate phone number
    const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Nigerian phone number format",
      });
    }

    // Get wallet and check balance
    const wallet = getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    const totalCost = dataPlan.price + serviceFees.data.fee;
    if (wallet.balance < totalCost) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    // Process data purchase
    const transaction = createTransaction({
      userId,
      type: "withdrawal",
      amount: totalCost,
      description: `${dataPlan.name} for ${phoneNumber}`,
      status: "completed",
      metadata: {
        service: "data",
        network: networkId,
        phoneNumber,
        planId,
        planName: dataPlan.name,
        dataSize: dataPlan.size,
        validity: dataPlan.validity,
        fee: serviceFees.data.fee,
      },
    });

    // Update wallet
    updateWallet(userId, {
      balance: wallet.balance - totalCost,
    });

    res.json({
      success: true,
      transaction,
      message: `${dataPlan.name} data sent to ${phoneNumber} successfully`,
    });
  } catch (error) {
    console.error("Buy data error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Pay Bills
export const payBill: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { providerId, amount, fields } = req.body;

    // Validation
    if (!providerId || !amount || !fields) {
      return res.status(400).json({
        success: false,
        error: "Provider, amount, and required fields are needed",
      });
    }

    // Validate provider
    const provider = billProviders.find((p) => p.id === providerId);
    if (!provider) {
      return res.status(400).json({
        success: false,
        error: "Invalid bill provider",
      });
    }

    // Validate amount limits
    if (provider.minAmount && amount < provider.minAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum amount is ₦${provider.minAmount}`,
      });
    }

    if (provider.maxAmount && amount > provider.maxAmount) {
      return res.status(400).json({
        success: false,
        error: `Maximum amount is ₦${provider.maxAmount}`,
      });
    }

    // Validate required fields
    for (const field of provider.fields) {
      if (field.required && !fields[field.name]) {
        return res.status(400).json({
          success: false,
          error: `${field.label} is required`,
        });
      }
    }

    // Get wallet and check balance
    const wallet = getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    const serviceFee =
      serviceFees[provider.category as keyof typeof serviceFees]?.fee ||
      serviceFees.billPayment.fee;
    const totalCost = amount + serviceFee;

    if (wallet.balance < totalCost) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    // Process bill payment
    const transaction = createTransaction({
      userId,
      type: "withdrawal",
      amount: totalCost,
      description: `${provider.name} bill payment`,
      status: "completed",
      metadata: {
        service: "bills",
        category: provider.category,
        provider: providerId,
        billAmount: amount,
        fee: serviceFee,
        fields,
      },
    });

    // Update wallet
    updateWallet(userId, {
      balance: wallet.balance - totalCost,
    });

    res.json({
      success: true,
      transaction,
      message: `Bill payment to ${provider.name} successful`,
    });
  } catch (error) {
    console.error("Pay bill error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Bank Transfer
export const bankTransfer: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { bankCode, accountNumber, accountName, amount, narration } =
      req.body;

    // Validation
    if (!bankCode || !accountNumber || !accountName || !amount) {
      return res.status(400).json({
        success: false,
        error: "Bank, account details, and amount are required",
      });
    }

    // Validate bank
    const bank = transferBanks.find((b) => b.code === bankCode);
    if (!bank) {
      return res.status(400).json({
        success: false,
        error: "Invalid bank selected",
      });
    }

    // Validate amount limits
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        error: "Minimum transfer amount is ₦100",
      });
    }

    if (amount > bank.maxDailyLimit) {
      return res.status(400).json({
        success: false,
        error: `Maximum daily limit for ${bank.name} is ₦${bank.maxDailyLimit.toLocaleString()}`,
      });
    }

    // Validate account number format
    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        error: "Account number must be 10 digits",
      });
    }

    // Get wallet and check balance
    const wallet = getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    const totalCost = amount + bank.transferFee;
    if (wallet.balance < totalCost) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    // Process transfer
    const transaction = createTransaction({
      userId,
      type: "withdrawal",
      amount: totalCost,
      description: `Transfer to ${accountName} - ${bank.name}`,
      status: bank.isInstant ? "completed" : "pending",
      metadata: {
        service: "transfer",
        bankCode,
        bankName: bank.name,
        accountNumber,
        accountName,
        transferAmount: amount,
        fee: bank.transferFee,
        narration: narration || "Transfer from InvestNaija",
        processingTime: bank.processingTime,
        isInstant: bank.isInstant,
      },
    });

    // Update wallet
    updateWallet(userId, {
      balance: wallet.balance - totalCost,
    });

    // Simulate processing for non-instant transfers
    if (!bank.isInstant) {
      setTimeout(
        () => {
          // Update transaction status after processing time
          // In real implementation, this would be handled by a job queue
          console.log(
            `Transfer processed: ₦${amount} to ${accountName} at ${bank.name}`,
          );
        },
        parseInt(bank.processingTime) * 60 * 1000,
      );
    }

    res.json({
      success: true,
      transaction,
      message: bank.isInstant
        ? `₦${amount} transferred to ${accountName} successfully`
        : `Transfer initiated. Funds will be delivered in ${bank.processingTime} minutes`,
    });
  } catch (error) {
    console.error("Bank transfer error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Verify Account Number
export const verifyAccount: RequestHandler = (req, res) => {
  try {
    const { bankCode, accountNumber } = req.body;

    if (!bankCode || !accountNumber) {
      return res.status(400).json({
        success: false,
        error: "Bank code and account number are required",
      });
    }

    // Validate bank
    const bank = transferBanks.find((b) => b.code === bankCode);
    if (!bank) {
      return res.status(400).json({
        success: false,
        error: "Invalid bank code",
      });
    }

    // Validate account number format
    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        error: "Account number must be 10 digits",
      });
    }

    // Simulate account verification (in real app, call bank verification API)
    const mockNames = [
      "ADEBAYO JOHNSON",
      "CHIOMA OKORO",
      "IBRAHIM HASSAN",
      "FUNMI ADEYEMI",
      "KEMI OKONKWO",
      "TUNDE BAKARE",
      "AMINA YUSUF",
      "EMEKA NWANKWO",
      "FATIMA ABDULLAHI",
      "SEGUN OLADEJI",
    ];

    const accountName = mockNames[Math.floor(Math.random() * mockNames.length)];

    res.json({
      success: true,
      accountName,
      bankName: bank.name,
    });
  } catch (error) {
    console.error("Verify account error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
