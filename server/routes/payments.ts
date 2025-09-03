import { randomUUID } from "crypto";
import {
  paystackService,
  flutterwaveService,
  generateVirtualAccountNumber,
  validateBVN,
  validateNIN,
} from "../services/payments";
import {
  getUserWalletAsync as getUserWallet,
  updateWalletAsync as updateWallet,
  createTransactionAsync as createTransaction,
  updateUserAsync as updateUser,
} from "../data/storage";

// Get Nigerian banks from Paystack
export const getNigerianBanks: RequestHandler = async (req, res) => {
  try {
    const paystackBanks = await paystackService.getBanks();
    const flutterwaveBanks = await flutterwaveService.getBanks();

    // Combine and deduplicate banks
    const allBanks = [
      ...(paystackBanks.data || []),
      ...(flutterwaveBanks.data || []),
    ];

    // Remove duplicates by bank code
    const uniqueBanks = allBanks.filter(
      (bank, index, self) =>
        index === self.findIndex((b) => b.code === bank.code),
    );

    res.json({
      success: true,
      data: uniqueBanks.sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (error) {
    console.error("Get banks error:", error);
    res.json({
      success: true,
      data: [
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
      ],
    });
  }
};

// Create or get virtual account for user
export const createVirtualAccount: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Generate virtual account details
    const accountNumber = generateVirtualAccountNumber();
    const bankName = "InvestNaija Bank";
    const accountName = `${req.user.firstName} ${req.user.lastName}`;

    // In production, create actual virtual account via Paystack/Flutterwave
    // For now, return generated account details
    const virtualAccount = {
      account_number: accountNumber,
      bank_name: bankName,
      account_name: accountName,
      account_reference: `INV-${userId.slice(0, 8)}`,
    };

    res.json({
      success: true,
      data: virtualAccount,
      message:
        "Virtual account created successfully. Use this account to fund your wallet.",
    });
  } catch (error) {
    console.error("Create virtual account error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Initialize Paystack payment
export const initializePaystackPayment: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { amount, callback_url } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        error: "Minimum deposit amount is ₦100",
      });
    }

    const reference = `inv_${Date.now()}_${userId.slice(0, 8)}`;

    const paymentData = {
      email: req.user.email,
      amount: amount,
      currency: "NGN",
      reference,
      callback_url: callback_url || `${process.env.FRONTEND_URL}/dashboard`,
    };

    const result = await paystackService.initializePayment(paymentData);

    res.json({
      success: true,
      data: result.data,
      message: "Payment initialized successfully",
    });
  } catch (error) {
    console.error("Initialize Paystack payment error:", error);
    res.status(500).json({
      success: false,
      error: "Payment initialization failed",
    });
  }
};

// Verify Paystack payment
export const verifyPaystackPayment: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { reference } = req.params;

    const verification = await paystackService.verifyPayment(reference);

    if (verification.status && verification.data.status === "success") {
      const amount = verification.data.amount / 100; // Convert from kobo

      // Get current wallet
      const wallet = await getUserWallet(userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          error: "Wallet not found",
        });
      }

      // Create transaction record
      const transaction = await createTransaction({
        userId,
        type: "deposit",
        amount,
        description: "Wallet funding via Paystack",
        status: "completed",
        metadata: {
          source: "paystack",
          reference,
          gateway_response: verification.data.gateway_response,
        },
      });

      // Update wallet balance
      const updatedWallet = await updateWallet(userId, {
        balance: wallet.balance + amount,
      });

      res.json({
        success: true,
        transaction,
        wallet: updatedWallet,
        message: `₦${amount.toLocaleString()} has been added to your wallet`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Verify Paystack payment error:", error);
    res.status(500).json({
      success: false,
      error: "Payment verification failed",
    });
  }
};

// Initialize bank transfer
export const initiateBankTransfer: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { amount, account_number, bank_code, account_name } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        error: "Minimum withdrawal amount is ₦100",
      });
    }

    if (!account_number || !bank_code || !account_name) {
      return res.status(400).json({
        success: false,
        error: "Bank details are required",
      });
    }

    // Check wallet balance
    const wallet = await getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    // Verify account number first
    try {
      const accountVerification = await paystackService.verifyAccountNumber(
        account_number,
        bank_code,
      );

      if (!accountVerification.status) {
        return res.status(400).json({
          success: false,
          error: "Invalid account details",
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: "Could not verify account details",
      });
    }

    // Create transfer recipient
    const recipient = await paystackService.createTransferRecipient({
      type: "nuban",
      name: account_name,
      account_number,
      bank_code,
      currency: "NGN",
    });

    if (!recipient.status) {
      return res.status(400).json({
        success: false,
        error: "Could not create transfer recipient",
      });
    }

    // Initiate transfer
    const transfer = await paystackService.initiateTransfer({
      source: "balance",
      amount,
      recipient: recipient.data.recipient_code,
      reason: "Wallet withdrawal",
    });

    if (transfer.status) {
      // Create transaction record
      const transaction = await createTransaction({
        userId,
        type: "withdrawal",
        amount,
        description: `Transfer to ${account_name} - ${account_number}`,
        status: "pending",
        metadata: {
          source: "bank_transfer",
          recipient_code: recipient.data.recipient_code,
          transfer_code: transfer.data.transfer_code,
          account_number,
          bank_code,
          account_name,
        },
      });

      // Update wallet balance (deduct amount)
      const updatedWallet = await updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      res.json({
        success: true,
        transaction,
        wallet: updatedWallet,
        message: `Transfer of ₦${amount.toLocaleString()} initiated successfully`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Transfer initiation failed",
      });
    }
  } catch (error) {
    console.error("Initiate bank transfer error:", error);
    res.status(500).json({
      success: false,
      error: "Transfer failed",
    });
  }
};

// Verify account number
export const verifyAccountNumber: RequestHandler = async (req, res) => {
  try {
    const { account_number, bank_code } = req.body;

    if (!account_number || !bank_code) {
      return res.status(400).json({
        success: false,
        error: "Account number and bank code are required",
      });
    }

    const verification = await paystackService.verifyAccountNumber(
      account_number,
      bank_code,
    );

    if (verification.status) {
      res.json({
        success: true,
        data: verification.data,
        message: "Account verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Account verification failed",
      });
    }
  } catch (error) {
    console.error("Account verification error:", error);
    res.status(400).json({
      success: false,
      error: "Could not verify account",
    });
  }
};

// BVN verification
export const verifyBVN: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { bvn } = req.body;

    if (!bvn) {
      return res.status(400).json({
        success: false,
        error: "BVN is required",
      });
    }

    const verification = await validateBVN(bvn);

    if (verification.valid) {
      // Update user with BVN
      const updatedUser = await updateUser(userId, {
        bvn,
        kycStatus: "verified",
      });

      res.json({
        success: true,
        data: verification.data,
        user: updatedUser,
        message: "BVN verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Invalid BVN",
      });
    }
  } catch (error) {
    console.error("BVN verification error:", error);
    res.status(500).json({
      success: false,
      error: "BVN verification failed",
    });
  }
};

// NIN verification
export const verifyNIN: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { nin } = req.body;

    if (!nin) {
      return res.status(400).json({
        success: false,
        error: "NIN is required",
      });
    }

    const verification = await validateNIN(nin);

    if (verification.valid) {
      // Update user with NIN
      const updatedUser = await updateUser(userId, {
        nin,
        kycStatus: "verified",
      });

      res.json({
        success: true,
        data: verification.data,
        user: updatedUser,
        message: "NIN verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Invalid NIN",
      });
    }
  } catch (error) {
    console.error("NIN verification error:", error);
    res.status(500).json({
      success: false,
      error: "NIN verification failed",
    });
  }
};

// Aliases for server compatibility
export const getBanks = getNigerianBanks;
export const initiatePaystackPayment = initializePaystackPayment;
export const handlePaystackCallback = verifyPaystackPayment;
export const linkBankAccount = verifyAccountNumber;
export const generateVirtualAccount = createVirtualAccount;
