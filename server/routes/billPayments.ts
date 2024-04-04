import { RequestHandler } from "express";
import { randomUUID } from "crypto";
import {
  billPaymentService,
  bankTransferService,
} from "../services/billPayments";
import {
  getUserWallet,
  updateWallet,
  createTransaction,
} from "../data/storage";

// Get available billers
export const getBillers: RequestHandler = async (req, res) => {
  try {
    const result = await billPaymentService.getBillers();
    res.json(result);
  } catch (error) {
    console.error("Get billers error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch billers",
    });
  }
};

// Get electricity companies
export const getElectricityCompanies: RequestHandler = async (req, res) => {
  try {
    const result = await billPaymentService.getElectricityCompanies();
    res.json(result);
  } catch (error) {
    console.error("Get electricity companies error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch electricity companies",
    });
  }
};

// Validate customer (meter number, phone, etc.)
export const validateCustomer: RequestHandler = async (req, res) => {
  try {
    const { billerId, customerCode } = req.body;

    if (!billerId || !customerCode) {
      return res.status(400).json({
        success: false,
        error: "Biller ID and customer code are required",
      });
    }

    const result = await billPaymentService.validateCustomer(
      billerId,
      customerCode,
    );
    res.json(result);
  } catch (error) {
    console.error("Validate customer error:", error);
    res.status(500).json({
      success: false,
      error: "Customer validation failed",
    });
  }
};

// Pay electricity bill
export const payElectricityBill: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { billerId, meterNumber, amount, customerName } = req.body;

    if (!billerId || !meterNumber || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment details",
      });
    }

    // Check wallet balance
    const wallet = getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    const reference = `elec_${Date.now()}_${userId.slice(0, 8)}`;

    // Process payment through bill service
    const paymentResult = await billPaymentService.payElectricityBill({
      billerId,
      meterNumber,
      amount,
      customerName,
      reference,
    });

    if (paymentResult.success) {
      // Deduct from wallet
      const updatedWallet = updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Create transaction record
      const transaction = createTransaction({
        userId,
        type: "bill_payment",
        amount,
        description: `Electricity bill payment - ${meterNumber}`,
        status: "completed",
        metadata: {
          type: "electricity",
          billerId,
          meterNumber,
          customerName,
          reference,
        },
      });

      res.json({
        success: true,
        transaction,
        wallet: updatedWallet,
        message: "Electricity bill paid successfully",
      });
    } else {
      throw new Error("Payment processing failed");
    }
  } catch (error) {
    console.error("Pay electricity bill error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Electricity bill payment failed",
    });
  }
};

// Buy airtime
export const buyAirtime: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { network, phoneNumber, amount } = req.body;

    if (!network || !phoneNumber || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid airtime purchase details",
      });
    }

    // Check wallet balance
    const wallet = getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    const reference = `airtime_${Date.now()}_${userId.slice(0, 8)}`;

    // Process airtime purchase
    const purchaseResult = await billPaymentService.buyAirtime({
      network,
      phoneNumber,
      amount,
      reference,
    });

    if (purchaseResult.success) {
      // Deduct from wallet
      const updatedWallet = updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Create transaction record
      const transaction = createTransaction({
        userId,
        type: "airtime",
        amount,
        description: `${network.toUpperCase()} airtime - ${phoneNumber}`,
        status: "completed",
        metadata: {
          type: "airtime",
          network,
          phoneNumber,
          reference,
        },
      });

      res.json({
        success: true,
        transaction,
        wallet: updatedWallet,
        message: "Airtime purchase successful",
      });
    } else {
      throw new Error("Airtime purchase failed");
    }
  } catch (error) {
    console.error("Buy airtime error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Airtime purchase failed",
    });
  }
};

// Buy data bundle
export const buyDataBundle: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { network, phoneNumber, planId, amount } = req.body;

    if (!network || !phoneNumber || !planId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid data bundle details",
      });
    }

    // Check wallet balance
    const wallet = getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    const reference = `data_${Date.now()}_${userId.slice(0, 8)}`;

    // Process data purchase
    const purchaseResult = await billPaymentService.buyDataBundle({
      network,
      phoneNumber,
      planId,
      amount,
      reference,
    });

    if (purchaseResult.success) {
      // Deduct from wallet
      const updatedWallet = updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Create transaction record
      const transaction = createTransaction({
        userId,
        type: "data_bundle",
        amount,
        description: `${network.toUpperCase()} data bundle - ${phoneNumber}`,
        status: "completed",
        metadata: {
          type: "data",
          network,
          phoneNumber,
          planId,
          reference,
        },
      });

      res.json({
        success: true,
        transaction,
        wallet: updatedWallet,
        message: "Data bundle purchase successful",
      });
    } else {
      throw new Error("Data bundle purchase failed");
    }
  } catch (error) {
    console.error("Buy data bundle error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Data bundle purchase failed",
    });
  }
};

// Pay cable TV bill
export const payCableTVBill: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { provider, smartCardNumber, planId, amount } = req.body;

    if (!provider || !smartCardNumber || !planId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid cable TV payment details",
      });
    }

    // Check wallet balance
    const wallet = getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    const reference = `cable_${Date.now()}_${userId.slice(0, 8)}`;

    // Process cable TV payment
    const paymentResult = await billPaymentService.payCableTVBill({
      provider,
      smartCardNumber,
      planId,
      amount,
      reference,
    });

    if (paymentResult.success) {
      // Deduct from wallet
      const updatedWallet = updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Create transaction record
      const transaction = createTransaction({
        userId,
        type: "cable_tv",
        amount,
        description: `${provider} subscription - ${smartCardNumber}`,
        status: "completed",
        metadata: {
          type: "cable_tv",
          provider,
          smartCardNumber,
          planId,
          reference,
        },
      });

      res.json({
        success: true,
        transaction,
        wallet: updatedWallet,
        message: "Cable TV subscription successful",
      });
    } else {
      throw new Error("Cable TV payment failed");
    }
  } catch (error) {
    console.error("Pay cable TV bill error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Cable TV payment failed",
    });
  }
};

// Bank transfer
export const initiateTransfer: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { accountNumber, bankCode, accountName, amount, reason } = req.body;

    if (!accountNumber || !bankCode || !accountName || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid transfer details",
      });
    }

    // Check wallet balance
    const wallet = getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    const reference = `transfer_${Date.now()}_${userId.slice(0, 8)}`;

    // Verify account first
    const accountVerification = await bankTransferService.verifyAccount(
      accountNumber,
      bankCode,
    );

    if (!accountVerification.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid account details",
      });
    }

    // Create transfer recipient
    const recipient = await bankTransferService.createTransferRecipient({
      accountNumber,
      bankCode,
      accountName,
    });

    if (!recipient.success) {
      return res.status(400).json({
        success: false,
        error: "Failed to create transfer recipient",
      });
    }

    // Initiate transfer
    const transferResult = await bankTransferService.initiateTransfer({
      recipientCode: recipient.data.recipient_code,
      amount,
      reason,
      reference,
    });

    if (transferResult.success) {
      // Deduct from wallet
      const updatedWallet = updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Create transaction record
      const transaction = createTransaction({
        userId,
        type: "transfer",
        amount,
        description: `Transfer to ${accountName} - ${accountNumber}`,
        status: "completed",
        metadata: {
          type: "bank_transfer",
          accountNumber,
          bankCode,
          accountName,
          reason,
          reference,
          recipientCode: recipient.data.recipient_code,
        },
      });

      res.json({
        success: true,
        transaction,
        wallet: updatedWallet,
        message: "Transfer successful",
      });
    } else {
      throw new Error("Transfer failed");
    }
  } catch (error) {
    console.error("Initiate transfer error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Transfer failed",
    });
  }
};

// Get banks for transfers
export const getBanksForTransfer: RequestHandler = async (req, res) => {
  try {
    const result = await bankTransferService.getBanks();
    res.json(result);
  } catch (error) {
    console.error("Get banks error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch banks",
    });
  }
};

// Verify account for transfer
export const verifyTransferAccount: RequestHandler = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        error: "Account number and bank code are required",
      });
    }

    const result = await bankTransferService.verifyAccount(
      accountNumber,
      bankCode,
    );
    res.json(result);
  } catch (error) {
    console.error("Verify account error:", error);
    res.status(400).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Account verification failed",
    });
  }
};
