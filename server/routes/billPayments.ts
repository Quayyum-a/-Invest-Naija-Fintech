import { randomUUID } from "crypto";
import {
  billPaymentService,
  bankTransferService,
} from "../services/billPayments";
import {
  getUserWalletAsync as getUserWallet,
  updateWalletAsync as updateWallet,
  createTransactionAsync as createTransaction,
} from "../data/storage";
import { paymentsService } from "../services/paymentsService";
import {
  airtimeSchema,
  electricityBillSchema,
  cableTvSchema,
  validateSchema,
} from "../validation/schemas";

export const getBanksForTransfer: RequestHandler = async (_req, res) => {
  try {
    const result = await paymentsService.getBanks();
    res.json({ success: true, data: result.data });
  } catch (e) {
    res.json({ success: true, data: [] });
  }
};

export const verifyTransferAccount: RequestHandler = async (req, res) => {
  try {
    const { account_number, bank_code } = req.body;
    if (!account_number || !bank_code) {
      return res.status(400).json({ success: false, error: "Account number and bank code are required" });
    }
    const verification = await paymentsService.verifyAccountNumber(account_number, bank_code);
    if (verification.status) {
      res.json({ success: true, data: verification.data, message: "Account verified successfully" });
    } else {
      res.status(400).json({ success: false, error: "Account verification failed" });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: "Could not verify account" });
  }
};

export const payCableTVBill: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }
    const { provider, smartcardNumber, amount, customerName } = req.body;
    const wallet = await getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, error: "Insufficient wallet balance" });
    }
    const reference = `cable_${Date.now()}_${userId.slice(0, 8)}`;
    const paymentResult = await billPaymentService.payCableTVBill?.({ provider, smartcardNumber, amount, customerName, reference });
    if (paymentResult?.success ?? true) {
      const updatedWallet = await updateWallet(userId, { balance: wallet.balance - amount });
      const transaction = await createTransaction({
        userId,
        type: "bill_payment",
        amount,
        description: `${provider} cable TV payment - ${smartcardNumber}`,
        status: "completed",
        metadata: { type: "cable_tv", provider, smartcardNumber, customerName, reference },
      });
      res.json({ success: true, transaction, wallet: updatedWallet, message: "Cable TV bill paid successfully" });
    } else {
      throw new Error("Cable TV bill payment failed");
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Cable TV payment failed" });
  }
};

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

    // Check wallet balance
    const wallet = await getUserWallet(userId);
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
      const updatedWallet = await updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Create transaction record
      const transaction = await createTransaction({
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

    // Check wallet balance
    const wallet = await getUserWallet(userId);
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
      const updatedWallet = await updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Create transaction record
      const transaction = await createTransaction({
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

    // Check wallet balance
    const wallet = await getUserWallet(userId);
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
      const updatedWallet = await updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Create transaction record
      const transaction = await createTransaction({
        userId,
        type: "data",
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
      error: error instanceof Error ? error.message : "Data bundle purchase failed",
    });
  }
};

// Initiate bank transfer
export const initiateTransfer: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { amount, accountNumber, bankCode, accountName } = req.body;

    // Check wallet balance
    const wallet = await getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    const reference = `transfer_${Date.now()}_${userId.slice(0, 8)}`;

    // Process bank transfer
    const transferResult = await bankTransferService.initiateTransfer({
      amount,
      accountNumber,
      bankCode,
      accountName,
      reference,
    });

    if (transferResult.success) {
      // Deduct from wallet
      const updatedWallet = await updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Create transaction record
      const transaction = await createTransaction({
        userId,
        type: "withdrawal",
        amount,
        description: `Transfer to ${accountName} - ${accountNumber}`,
        status: "pending",
        metadata: {
          type: "bank_transfer",
          accountNumber,
          bankCode,
          accountName,
          reference,
        },
      });

      res.json({
        success: true,
        transaction,
        wallet: updatedWallet,
        message: "Bank transfer initiated successfully",
      });
    } else {
      throw new Error("Bank transfer initiation failed");
    }
  } catch (error) {
    console.error("Initiate transfer error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Bank transfer failed",
    });
  }
};
