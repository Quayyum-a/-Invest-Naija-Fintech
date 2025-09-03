import { ErrorResponse } from "@shared/api";
import {
  getUserWalletAsync as getUserWallet,
  updateWalletAsync as updateWallet,
  createTransactionAsync as createTransaction,
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
    } as ErrorResponse);
  }
};

// Buy Airtime
export const buyAirtime: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { networkId, phoneNumber, amount } = req.body;

    // Validation
    if (!networkId || !phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        error: "Network, phone number, and amount are required",
      } as ErrorResponse);
    }

    // Validate network
    const network = nigerianNetworks.find((n) => n.id === networkId);
    if (!network) {
      return res.status(400).json({
        success: false,
        error: "Invalid network selected",
      } as ErrorResponse);
    }

    // Validate amount
    if (
      amount < network.airtimeMinMax.min ||
      amount > network.airtimeMinMax.max
    ) {
      return res.status(400).json({
        success: false,
        error: `Amount must be between ₦${network.airtimeMinMax.min} and ₦${network.airtimeMinMax.max}`,
      } as ErrorResponse);
    }

    // Validate phone number format
    const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Nigerian phone number format",
      } as ErrorResponse);
    }

    // Get wallet and check balance
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    const totalCost = amount + serviceFees.airtime.fee;
    if (wallet.balance < totalCost) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      } as ErrorResponse);
    }

    // Process airtime purchase (simulate API call)
    const transaction = await createTransaction({
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
    const updatedWallet = await updateWallet(userId, {
      balance: wallet.balance - totalCost,
    });

    res.json({
      success: true,
      transaction,
      wallet: updatedWallet,
      message: `₦${amount} airtime sent to ${phoneNumber} successfully`,
    });
  } catch (error) {
    console.error("Buy airtime error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Buy Data
export const buyData: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { networkId, phoneNumber, planId } = req.body;

    // Validation
    if (!networkId || !phoneNumber || !planId) {
      return res.status(400).json({
        success: false,
        error: "Network, phone number, and data plan are required",
      } as ErrorResponse);
    }

    // Validate network and plan
    const network = nigerianNetworks.find((n) => n.id === networkId);
    if (!network) {
      return res.status(400).json({
        success: false,
        error: "Invalid network selected",
      } as ErrorResponse);
    }

    const dataPlan = network.dataPlans.find((p) => p.id === planId);
    if (!dataPlan) {
      return res.status(400).json({
        success: false,
        error: "Invalid data plan selected",
      } as ErrorResponse);
    }

    // Validate phone number
    const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid Nigerian phone number format",
      } as ErrorResponse);
    }

    // Get wallet and check balance
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    const totalCost = dataPlan.price + serviceFees.data.fee;
    if (wallet.balance < totalCost) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      } as ErrorResponse);
    }

    // Process data purchase
    const transaction = await createTransaction({
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
        fee: serviceFees.data.fee,
      },
    });

    // Update wallet
    const updatedWallet = await updateWallet(userId, {
      balance: wallet.balance - totalCost,
    });

    res.json({
      success: true,
      transaction,
      wallet: updatedWallet,
      message: `${dataPlan.name} activated for ${phoneNumber}`,
    });
  } catch (error) {
    console.error("Buy data error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Pay a generic bill (fallback)
export const payBill: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const { providerId, amount, account, description } = req.body;
    if (!providerId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid bill details" });
    }

    const wallet = await getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, error: "Insufficient wallet balance" });
    }

    const transaction = await createTransaction({
      userId,
      type: "bill_payment",
      amount,
      description: description || `Bill payment to ${providerId}`,
      status: "completed",
      metadata: { providerId, account },
    });

    const updatedWallet = await updateWallet(userId, { balance: wallet.balance - amount });

    res.json({ success: true, transaction, wallet: updatedWallet, message: "Bill paid successfully" });
  } catch (error) {
    console.error("Pay bill error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Simple bank transfer (service variant)
export const bankTransfer: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const { amount, accountNumber, bankCode, accountName } = req.body;
    if (!amount || amount < 100 || !accountNumber || !bankCode || !accountName) {
      return res.status(400).json({ success: false, error: "Invalid transfer details" });
    }

    const wallet = await getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, error: "Insufficient wallet balance" });
    }

    const transaction = await createTransaction({
      userId,
      type: "withdrawal",
      amount,
      description: `Transfer to ${accountName} - ${accountNumber}`,
      status: "pending",
      metadata: { bankCode, accountNumber, accountName },
    });

    const updatedWallet = await updateWallet(userId, { balance: wallet.balance - amount });

    res.json({ success: true, transaction, wallet: updatedWallet, message: "Transfer initiated" });
  } catch (error) {
    console.error("Bank transfer error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Simple account verification mock
export const verifyAccount: RequestHandler = async (req, res) => {
  try {
    const { account_number, bank_code } = req.body;
    if (!account_number || !bank_code) {
      return res.status(400).json({ success: false, error: "Account number and bank code are required" });
    }
    res.json({ success: true, data: { account_name: "Verified User", account_number, bank_code } });
  } catch (error) {
    console.error("Verify account error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
