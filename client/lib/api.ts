import {
  WalletResponse,
  DashboardData,
  PortfolioData,
  CryptoMarketResponse,
  CryptoPortfolioResponse,
  CryptoTransactionResponse,
} from "@shared/api";

class ApiService {
  private getHeaders() {
    return {
      "Content-Type": "application/json",
    };
  }

  private getAuthHeaders() {
    const token = localStorage.getItem("investnaija_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Wallet operations
  async getWallet(): Promise<WalletResponse> {
    const response = await fetch("/api/wallet", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<WalletResponse>(response);
  }

  async addMoney(amount: number, metadata?: Record<string, any>): Promise<any> {
    const response = await fetch("/api/wallet/add", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        amount,
        source: metadata?.method === "paystack" ? "paystack" : "bank_transfer",
        reference: metadata?.reference || `manual_${Date.now()}`,
        description: `Wallet funding of ₦${amount.toLocaleString()}`,
        metadata,
      }),
    });
    return this.handleResponse(response);
  }

  async withdrawMoney(
    amount: number,
    bankDetails?: {
      accountNumber: string;
      bankCode: string;
      accountName: string;
    },
  ): Promise<any> {
    const response = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        amount,
        bankDetails,
        description: `Withdrawal of ₦${amount.toLocaleString()}`,
      }),
    });
    return this.handleResponse(response);
  }

  async investMoney(
    amount: number,
    investmentType: string,
    metadata?: Record<string, any>,
  ): Promise<any> {
    const response = await fetch("/api/wallet/invest", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        amount,
        investmentType,
        metadata,
        description: `Investment in ${investmentType}`,
      }),
    });
    return this.handleResponse(response);
  }

  // Dashboard operations
  async getDashboardData(): Promise<{ success: boolean; data: DashboardData }> {
    const response = await fetch("/api/dashboard", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getPortfolioData(): Promise<{ success: boolean; data: PortfolioData }> {
    const response = await fetch("/api/portfolio", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getTransactions(): Promise<any> {
    const response = await fetch("/api/transactions", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Investment operations
  async getInvestmentProducts(): Promise<any> {
    const response = await fetch("/api/investments/products", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createRoundUpInvestment(
    purchaseAmount: number,
    roundUpAmount: number,
  ): Promise<any> {
    const response = await fetch("/api/investments/roundup", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ purchaseAmount, roundUpAmount }),
    });
    return this.handleResponse(response);
  }

  async withdrawInvestment(investmentId: string, amount: number): Promise<any> {
    const response = await fetch("/api/investments/withdraw", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ investmentId, amount }),
    });
    return this.handleResponse(response);
  }

  async getInvestmentPerformance(): Promise<any> {
    const response = await fetch("/api/investments/performance", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // KYC operations
  async submitKYC(kycData: {
    bvn: string;
    nin: string;
    documents: File[];
  }): Promise<any> {
    const response = await fetch("/api/kyc/submit", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(kycData),
    });
    return this.handleResponse(response);
  }

  async getKYCStatus(): Promise<any> {
    const response = await fetch("/api/kyc/status", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async uploadKYCDocument(documentType: string, file: File): Promise<any> {
    const response = await fetch("/api/kyc/upload", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ documentType, file }),
    });
    return this.handleResponse(response);
  }

  // Payment operations
  async getBanks(): Promise<any> {
    const response = await fetch("/api/payments/banks", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async initiatePaystackPayment(amount: number): Promise<any> {
    const response = await fetch("/api/payments/paystack/initiate", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        amount,
        currency: "NGN",
        callback_url: window.location.origin + "/dashboard",
      }),
    });
    return this.handleResponse(response);
  }

  async linkBankAccount(accountNumber: string, bankCode: string): Promise<any> {
    const response = await fetch("/api/payments/link-bank", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ accountNumber, bankCode }),
    });
    return this.handleResponse(response);
  }

  async initiateBankTransfer(amount: number, accountId: string): Promise<any> {
    const response = await fetch("/api/payments/bank-transfer", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ amount, accountId }),
    });
    return this.handleResponse(response);
  }

  async generateVirtualAccount(): Promise<any> {
    const response = await fetch("/api/payments/virtual-account", {
      method: "POST",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async verifyPaystackPayment(reference: string): Promise<any> {
    const response = await fetch(`/api/payments/paystack/verify/${reference}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async verifyAccountNumber(
    accountNumber: string,
    bankCode: string,
  ): Promise<any> {
    const response = await fetch("/api/payments/verify-account", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ accountNumber, bankCode }),
    });
    return this.handleResponse(response);
  }

  // Identity verification
  async verifyBVN(bvn: string): Promise<any> {
    const response = await fetch("/api/payments/verify-bvn", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ bvn }),
    });
    return this.handleResponse(response);
  }

  async verifyNIN(nin: string): Promise<any> {
    const response = await fetch("/api/payments/verify-nin", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ nin }),
    });
    return this.handleResponse(response);
  }

  // OTP operations
  async sendOTP(phoneNumber: string): Promise<any> {
    const response = await fetch("/api/otp/send", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ phoneNumber }),
    });
    return this.handleResponse(response);
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<any> {
    const response = await fetch("/api/otp/verify", {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ phoneNumber, otp }),
    });
    return this.handleResponse(response);
  }

  // Bill payment operations
  async getBillers(): Promise<any> {
    const response = await fetch("/api/bills/billers", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getElectricityCompanies(): Promise<any> {
    const response = await fetch("/api/bills/electricity/companies", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async validateCustomer(billerId: string, customerCode: string): Promise<any> {
    const response = await fetch("/api/bills/validate-customer", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ billerId, customerCode }),
    });
    return this.handleResponse(response);
  }

  async payElectricityBill({
    billerId,
    customerCode,
    amount,
    phone,
  }: {
    billerId: string;
    customerCode: string;
    amount: number;
    phone: string;
  }): Promise<any> {
    const response = await fetch("/api/bills/pay-electricity", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ billerId, customerCode, amount, phone }),
    });
    return this.handleResponse(response);
  }

  async buyAirtime({
    network,
    phone,
    amount,
  }: {
    network: string;
    phone: string;
    amount: number;
  }): Promise<any> {
    const response = await fetch("/api/bills/buy-airtime", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ network, phone, amount }),
    });
    return this.handleResponse(response);
  }

  async buyDataBundle({
    network,
    phone,
    planId,
    amount,
  }: {
    network: string;
    phone: string;
    planId: string;
    amount: number;
  }): Promise<any> {
    const response = await fetch("/api/bills/buy-data", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ network, phone, planId, amount }),
    });
    return this.handleResponse(response);
  }

  async payCableTVBill({
    provider,
    smartCardNumber,
    planId,
    amount,
  }: {
    provider: string;
    smartCardNumber: string;
    planId: string;
    amount: number;
  }): Promise<any> {
    const response = await fetch("/api/bills/pay-cable-tv", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ provider, smartCardNumber, planId, amount }),
    });
    return this.handleResponse(response);
  }

  // Transfer operations
  async getBanksForTransfer(): Promise<any> {
    const response = await fetch("/api/transfer/banks", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async verifyTransferAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<any> {
    const response = await fetch("/api/transfer/verify-account", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ accountNumber, bankCode }),
    });
    return this.handleResponse(response);
  }

  async initiateTransfer({
    accountNumber,
    bankCode,
    amount,
    narration,
    beneficiaryName,
  }: {
    accountNumber: string;
    bankCode: string;
    amount: number;
    narration?: string;
    beneficiaryName: string;
  }): Promise<any> {
    const response = await fetch("/api/transfer/initiate", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        accountNumber,
        bankCode,
        amount,
        narration,
        beneficiaryName,
      }),
    });
    return this.handleResponse(response);
  }

  // Analytics operations
  async getUserAnalytics(): Promise<any> {
    const response = await fetch("/api/analytics/user", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAppAnalytics(): Promise<any> {
    const response = await fetch("/api/analytics/app", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Admin operations
  async getAdminStats(): Promise<any> {
    const response = await fetch("/api/admin/stats", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getAllUsers(search?: string): Promise<any> {
    const url = search
      ? `/api/admin/users?search=${encodeURIComponent(search)}`
      : "/api/admin/users";
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getUserDetails(userId: string): Promise<any> {
    const response = await fetch(`/api/admin/users/${userId}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async updateUserKYC(userId: string, kycStatus: string): Promise<any> {
    const response = await fetch(`/api/admin/users/${userId}/kyc`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ kycStatus }),
    });
    return this.handleResponse(response);
  }

  async updateUserStatus(userId: string, status: string): Promise<any> {
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return this.handleResponse(response);
  }

  // Notification operations
  async getUserNotifications(
    limit?: number,
    unreadOnly?: boolean,
  ): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (unreadOnly) params.append("unreadOnly", "true");

    const response = await fetch(`/api/notifications?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async markNotificationRead(notificationId: string): Promise<any> {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async markAllNotificationsRead(): Promise<any> {
    const response = await fetch("/api/notifications/mark-all-read", {
      method: "PUT",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteNotification(notificationId: string): Promise<any> {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Achievement operations
  async getUserAchievements(): Promise<any> {
    const response = await fetch("/api/achievements", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getUserLevel(): Promise<any> {
    const response = await fetch("/api/level", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getLeaderboard(category?: string, period?: string): Promise<any> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (period) params.append("period", period);

    const response = await fetch(`/api/leaderboard?${params}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async claimAchievementReward(achievementId: string): Promise<any> {
    const response = await fetch("/api/achievements/claim", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ achievementId }),
    });
    return this.handleResponse(response);
  }

  // Crypto operations
  async getCryptoMarketData(): Promise<CryptoMarketResponse> {
    const response = await fetch("/api/crypto/market", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<CryptoMarketResponse>(response);
  }

  async getUserCryptoHoldings(): Promise<CryptoPortfolioResponse> {
    const response = await fetch("/api/crypto/holdings", {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<CryptoPortfolioResponse>(response);
  }

  async buyCrypto(
    symbol: string,
    amountNGN: number,
  ): Promise<CryptoTransactionResponse> {
    const response = await fetch("/api/crypto/buy", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ symbol, amountNGN }),
    });
    return this.handleResponse<CryptoTransactionResponse>(response);
  }

  async sellCrypto(
    symbol: string,
    quantity: number,
  ): Promise<CryptoTransactionResponse> {
    const response = await fetch("/api/crypto/sell", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ symbol, quantity }),
    });
    return this.handleResponse<CryptoTransactionResponse>(response);
  }
}

export const apiService = new ApiService();
// Commit 3 - 1752188000
// Commit 6 - 1752188000
// Commit 15 - 1752188002
// Commit 17 - 1752188002
// Commit 28 - 1752188003
// Commit 31 - 1752188003
// Commit 35 - 1752188003
// Commit 60 - 1752188006
// Commit 76 - 1752188007
// Commit 79 - 1752188007
// Commit 87 - 1752188008
// Commit 95 - 1752188008
// Commit 101 - 1752188009
// Commit 136 - 1752188012
// Commit 150 - 1752188012
// Commit 155 - 1752188013
// Commit 159 - 1752188013
// Commit 164 - 1752188013
// Commit 181 - 1752188014
// Commit 190 - 1752188015
// Commit 197 - 1752188015
// Commit 198 - 1752188015
// Commit 200 - 1752188016
// Commit 214 - 1752188017
// Commit 225 - 1752188018
// Commit 236 - 1752188018
// Commit 263 - 1752188020
// Commit 288 - 1752188022
// Commit 302 - 1752188023
// Commit 305 - 1752188023
// Commit 315 - 1752188024
// Commit 316 - 1752188024
// Commit 322 - 1752188024
// Commit 323 - 1752188024
// Commit 332 - 1752188025
// Commit 343 - 1752188027
// Commit 367 - 1752188029
// Commit 371 - 1752188029
// Commit 399 - 1752188032
// Commit 408 - 1752188032
// Commit 420 - 1752188033
// December commit 17 - 1752189166
// December commit 19 - 1752189166
// December commit 22 - 1752189168
// December commit 23 - 1752189168
// December commit 34 - 1752189170
// December commit 38 - 1752189172
// December commit 43 - 1752189174
// December commit 49 - 1752189175
// December commit 66 - 1752189180
// December commit 67 - 1752189180
// December commit 73 - 1752189183
// December commit 76 - 1752189184
// December commit 94 - 1752189188
// December commit 107 - 1752189190
// December commit 112 - 1752189191
// December commit 114 - 1752189191
// December commit 121 - 1752189194
// December commit 126 - 1752189195
// 2023 commit 2 - 1752189198
// 2023 commit 7 - 1752189199
// 2023 commit 15 - 1752189200
// 2023 commit 16 - 1752189200
// 2023 commit 25 - 1752189203
// 2023 commit 33 - 1752189205
// 2023 commit 57 - 1752189215
// 2023 commit 58 - 1752189215
// 2023 commit 75 - 1752189220
// 2023 commit 88 - 1752189224
// 2023 commit 143 - 1752189235
// 2023 commit 144 - 1752189236
// 2023 commit 145 - 1752189236
// 2023 commit 156 - 1752189239
// 2023 commit 159 - 1752189240
// 2023 commit 162 - 1752189241
// 2023 commit 177 - 1752189244
// 2023 commit 185 - 1752189245
// 2023 commit 205 - 1752189249
// 2023 commit 213 - 1752189250
// 2023 commit 221 - 1752189251
// 2023 commit 260 - 1752189258
// 2023 commit 262 - 1752189259
// 2023 commit 264 - 1752189259
// 2023 commit 275 - 1752189259
// 2023 commit 283 - 1752189261
// 2023 commit 291 - 1752189263
// 2023 commit 297 - 1752189264
// 2023 commit 339 - 1752189274
// 2023 commit 343 - 1752189275
// December commit 2 - 1752189481
// December commit 10 - 1752189481
// December commit 19 - 1752189482
// December commit 30 - 1752189485
// December commit 35 - 1752189486
// December commit 37 - 1752189486
// December commit 38 - 1752189486
// December commit 42 - 1752189487
// December commit 46 - 1752189488
// December commit 58 - 1752189490
// December commit 69 - 1752189492
// December commit 70 - 1752189492
// December commit 74 - 1752189493
// December commit 92 - 1752189495
// December commit 100 - 1752189496
// December commit 104 - 1752189497
// December commit 109 - 1752189497
// December commit 114 - 1752189497
// December commit 115 - 1752189497
// December commit 125 - 1752189500
// December commit 127 - 1752189500
// Past year commit 16 - 1752189505
// Past year commit 21 - 1752189505
// Past year commit 53 - 1752189511
// Past year commit 61 - 1752189511
// Past year commit 64 - 1752189512
// Past year commit 67 - 1752189512
// Past year commit 77 - 1752189513
// Past year commit 87 - 1752189514
// Past year commit 91 - 1752189515
// Past year commit 102 - 1752189516
// Past year commit 106 - 1752189517
// Past year commit 133 - 1752189520
// Past year commit 168 - 1752189525
// Past year commit 169 - 1752189525
// Past year commit 174 - 1752189526
// Past year commit 186 - 1752189527
// Past year commit 187 - 1752189528
// Past year commit 200 - 1752189529
// Past year commit 205 - 1752189530
// Past year commit 216 - 1752189532
// Past year commit 219 - 1752189532
// Past year commit 220 - 1752189532
// Past year commit 223 - 1752189532
// Past year commit 226 - 1752189533
// Past year commit 229 - 1752189533
// Past year commit 233 - 1752189534
// Past year commit 245 - 1752189536
// Past year commit 269 - 1752189537
// Past year commit 288 - 1752189540
// Past year commit 292 - 1752189541
// Past year commit 297 - 1752189541
// Past year commit 311 - 1752189542
// Past year commit 320 - 1752189544
// Past year commit 347 - 1752189546
