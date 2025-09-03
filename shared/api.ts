/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */


/**
 * User Authentication Types
 */
export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  password?: string; // Optional - only for internal use, never sent to client
  bvn?: string;
  nin?: string;
  kycStatus: "pending" | "verified" | "rejected";
  status: "active" | "suspended";
  role: "user" | "admin" | "super_admin";
  createdAt: string;
  lastLogin?: string;
}

export interface UserWallet {
  userId: string;
  balance: number;
  totalInvested: number;
  totalReturns: number;
  lastUpdated: string;
}

export interface Investment {
  id: string;
  userId: string;
  type: "money_market" | "treasury_bills" | "round_up" | "fixed_deposit";
  amount: number;
  currentValue: number;
  returns: number;
  createdAt: string;
  status: "active" | "matured" | "withdrawn";
  metadata?: Record<string, any>;
}

export interface InvestmentProduct {
  id: string;
  name: string;
  type: "money_market" | "treasury_bills" | "fixed_deposit";
  minAmount: number;
  maxAmount?: number;
  interestRate: number;
  duration: number; // in days
  description: string;
  riskLevel: "low" | "medium" | "high";
  active: boolean;
}

export interface UserInvestment extends Investment {
  product?: InvestmentProduct;
  maturityDate?: string;
}

export interface PortfolioSummary {
  totalInvestments: number;
  totalReturns: number;
  totalValue: number;
  performance: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  breakdown: {
    [key: string]: {
      amount: number;
      percentage: number;
    };
  };
}

export interface Transaction {
  id: string;
  userId: string;
  type:
    | "deposit"
    | "withdrawal"
    | "investment"
    | "return"
    | "round_up"
    | "bill_payment"
    | "airtime"
    | "data_bundle"
    | "cable_tv"
    | "transfer"
    | "transfer_in"
    | "transfer_out"
    | "bank_withdrawal";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * API Request/Response Types
 */
export interface RegisterRequest {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface WalletResponse {
  success: boolean;
  wallet?: UserWallet;
  message?: string;
}

export interface TransactionRequest {
  type: "deposit" | "withdrawal" | "investment";
  amount: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface TransactionResponse {
  success: boolean;
  transaction?: Transaction;
  message?: string;
}

export interface DashboardData {
  user: User;
  wallet: UserWallet;
  recentTransactions: Transaction[];
  recentInvestments: Investment[];
  investmentGoal: {
    target: number;
    current: number;
    percentage: number;
  };
  streak: number;
}

export interface PortfolioData {
  wallet: UserWallet;
  investments: Investment[];
  performance: {
    sevenDays: number;
    thirtyDays: number;
    allTime: number;
  };
  allocation: {
    moneyMarket: number;
    treasuryBills: number;
  };
}

/**
 * Cryptocurrency Types
 */
export interface CryptoCurrency {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface CryptoHolding {
  currency: string;
  symbol: string;
  amount: number;
  value: number;
  averagePrice: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface CryptoPortfolioResponse {
  success: boolean;
  data?: {
    holdings: CryptoHolding[];
    portfolioValue: number;
    totalProfitLoss: number;
  };
  message?: string;
}

export interface CryptoMarketResponse {
  success: boolean;
  data?: CryptoCurrency[];
  message?: string;
}

export interface CryptoTransactionRequest {
  cryptoId: string;
  amount: number;
}

export interface CryptoTransactionResponse {
  success: boolean;
  message?: string;
  data?: {
    cryptoId: string;
    cryptoSymbol: string;
    cryptoName: string;
    amountSpent?: number;
    cryptoAmount?: number;
    amountSold?: number;
    saleValue?: number;
    price: number;
  };
}

/**
 * Error Response Type
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}
