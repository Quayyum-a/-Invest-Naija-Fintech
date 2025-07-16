"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardManagementService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const connection_1 = __importDefault(require("../database/connection"));
class CardManagementService {
    constructor() {
        this.db = connection_1.default.getInstance();
        this.flutterwaveApiKey =
            process.env.FLUTTERWAVE_SECRET_KEY || "FLWSECK_TEST-default";
        this.paystackApiKey =
            process.env.PAYSTACK_SECRET_KEY ||
                "sk_test_52dc872013582129d489989e914c772186924031";
    }
    // Issue a new virtual card
    issueVirtualCard(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Try Flutterwave virtual cards first
                if (this.flutterwaveApiKey !== "FLWSECK_TEST-default") {
                    const flutterwaveResult = yield this.createFlutterwaveVirtualCard(request);
                    if (flutterwaveResult.success) {
                        return yield this.saveCardToDatabase(flutterwaveResult.data, request);
                    }
                }
                // Fallback to mock card creation
                return yield this.createMockVirtualCard(request);
            }
            catch (error) {
                console.error("Virtual card issuance error:", error);
                return { success: false, error: "Failed to issue virtual card" };
            }
        });
    }
    // Order a physical card
    orderPhysicalCard(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!request.deliveryAddress) {
                    return { success: false, error: "Delivery address is required" };
                }
                // Create physical card order
                const cardData = yield this.generateCardDetails("physical", request.cardBrand);
                const cardRecord = {
                    userId: request.userId,
                    accountId: request.accountId,
                    cardNumber: this.encryptCardNumber(cardData.cardNumber),
                    cardType: "physical",
                    cardBrand: request.cardBrand || "verve",
                    expiryMonth: cardData.expiryMonth,
                    expiryYear: cardData.expiryYear,
                    cvv: this.encryptCVV(cardData.cvv),
                    status: "active",
                    dailyLimit: 500000,
                    monthlyLimit: 2000000,
                    onlineEnabled: true,
                    contactlessEnabled: true,
                    internationalEnabled: false,
                    deliveryAddress: request.deliveryAddress,
                    deliveryStatus: "processing",
                    issuedDate: new Date(),
                };
                const result = yield this.db.query(`INSERT INTO cards (
          user_id, account_id, card_number, card_type, card_brand,
          expiry_month, expiry_year, cvv, status, daily_limit,
          monthly_limit, online_enabled, contactless_enabled,
          international_enabled, delivery_address, delivery_status,
          issued_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING id`, [
                    cardRecord.userId,
                    cardRecord.accountId,
                    cardRecord.cardNumber,
                    cardRecord.cardType,
                    cardRecord.cardBrand,
                    cardRecord.expiryMonth,
                    cardRecord.expiryYear,
                    cardRecord.cvv,
                    cardRecord.status,
                    cardRecord.dailyLimit,
                    cardRecord.monthlyLimit,
                    cardRecord.onlineEnabled,
                    cardRecord.contactlessEnabled,
                    cardRecord.internationalEnabled,
                    JSON.stringify(cardRecord.deliveryAddress),
                    cardRecord.deliveryStatus,
                    cardRecord.issuedDate,
                ]);
                return {
                    success: true,
                    data: {
                        cardId: result.rows[0].id,
                        maskedCardNumber: this.maskCardNumber(cardData.cardNumber),
                        cardType: "physical",
                        cardBrand: request.cardBrand || "verve",
                        deliveryStatus: "processing",
                        estimatedDelivery: "3-5 business days",
                        trackingNumber: `INV${Date.now()}`,
                    },
                };
            }
            catch (error) {
                console.error("Physical card order error:", error);
                return { success: false, error: "Failed to order physical card" };
            }
        });
    }
    // Get user's cards
    getUserCards(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.db.query(`SELECT c.*, ba.account_number, ba.account_name
         FROM cards c
         JOIN bank_accounts ba ON c.account_id = ba.id
         WHERE c.user_id = $1
         ORDER BY c.created_at DESC`, [userId]);
                const cards = result.rows.map((card) => ({
                    id: card.id,
                    accountNumber: card.account_number,
                    accountName: card.account_name,
                    maskedCardNumber: this.maskCardNumber(this.decryptCardNumber(card.card_number)),
                    cardType: card.card_type,
                    cardBrand: card.card_brand,
                    expiryMonth: card.expiry_month,
                    expiryYear: card.expiry_year,
                    status: card.status,
                    dailyLimit: parseFloat(card.daily_limit),
                    monthlyLimit: parseFloat(card.monthly_limit),
                    onlineEnabled: card.online_enabled,
                    contactlessEnabled: card.contactless_enabled,
                    internationalEnabled: card.international_enabled,
                    deliveryStatus: card.delivery_status,
                    issuedDate: card.issued_date,
                    lastUsed: card.last_used,
                }));
                return { success: true, data: cards };
            }
            catch (error) {
                console.error("Get user cards error:", error);
                return { success: false, error: "Failed to retrieve cards" };
            }
        });
    }
    // Get card details (sensitive information)
    getCardDetails(cardId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.db.query("SELECT * FROM cards WHERE id = $1 AND user_id = $2", [cardId, userId]);
                if (result.rows.length === 0) {
                    return { success: false, error: "Card not found" };
                }
                const card = result.rows[0];
                return {
                    success: true,
                    data: {
                        id: card.id,
                        cardNumber: this.decryptCardNumber(card.card_number),
                        cardType: card.card_type,
                        cardBrand: card.card_brand,
                        expiryMonth: card.expiry_month,
                        expiryYear: card.expiry_year,
                        cvv: this.decryptCVV(card.cvv),
                        status: card.status,
                    },
                };
            }
            catch (error) {
                console.error("Get card details error:", error);
                return { success: false, error: "Failed to retrieve card details" };
            }
        });
    }
    // Freeze/unfreeze card
    toggleCardStatus(cardId, userId, action) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newStatus = action === "freeze" ? "blocked" : "active";
                const result = yield this.db.query("UPDATE cards SET status = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *", [newStatus, cardId, userId]);
                if (result.rows.length === 0) {
                    return { success: false, error: "Card not found" };
                }
                // If using real card provider, sync status
                if (this.flutterwaveApiKey !== "FLWSECK_TEST-default") {
                    yield this.syncCardStatusWithProvider(cardId, newStatus);
                }
                return {
                    success: true,
                    data: {
                        cardId,
                        status: newStatus,
                        message: `Card ${action}d successfully`,
                    },
                };
            }
            catch (error) {
                console.error("Toggle card status error:", error);
                return { success: false, error: `Failed to ${action} card` };
            }
        });
    }
    // Update spending limits
    updateSpendingLimits(cardId, userId, limits) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updateFields = [];
                const values = [];
                let paramCount = 1;
                if (limits.dailyLimit !== undefined) {
                    updateFields.push(`daily_limit = $${paramCount++}`);
                    values.push(limits.dailyLimit);
                }
                if (limits.monthlyLimit !== undefined) {
                    updateFields.push(`monthly_limit = $${paramCount++}`);
                    values.push(limits.monthlyLimit);
                }
                if (limits.onlineEnabled !== undefined) {
                    updateFields.push(`online_enabled = $${paramCount++}`);
                    values.push(limits.onlineEnabled);
                }
                if (limits.contactlessEnabled !== undefined) {
                    updateFields.push(`contactless_enabled = $${paramCount++}`);
                    values.push(limits.contactlessEnabled);
                }
                if (limits.internationalEnabled !== undefined) {
                    updateFields.push(`international_enabled = $${paramCount++}`);
                    values.push(limits.internationalEnabled);
                }
                if (updateFields.length === 0) {
                    return { success: false, error: "No valid fields to update" };
                }
                updateFields.push(`updated_at = NOW()`);
                values.push(cardId, userId);
                const query = `
        UPDATE cards
        SET ${updateFields.join(", ")}
        WHERE id = $${paramCount++} AND user_id = $${paramCount++}
        RETURNING *
      `;
                const result = yield this.db.query(query, values);
                if (result.rows.length === 0) {
                    return { success: false, error: "Card not found" };
                }
                return {
                    success: true,
                    data: {
                        cardId,
                        message: "Spending limits updated successfully",
                        limits: {
                            dailyLimit: parseFloat(result.rows[0].daily_limit),
                            monthlyLimit: parseFloat(result.rows[0].monthly_limit),
                            onlineEnabled: result.rows[0].online_enabled,
                            contactlessEnabled: result.rows[0].contactless_enabled,
                            internationalEnabled: result.rows[0].international_enabled,
                        },
                    },
                };
            }
            catch (error) {
                console.error("Update spending limits error:", error);
                return { success: false, error: "Failed to update spending limits" };
            }
        });
    }
    // Process card transaction
    processCardTransaction(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get card details
                const cardResult = yield this.db.query(`SELECT c.*, ba.balance, ba.user_id
         FROM cards c
         JOIN bank_accounts ba ON c.account_id = ba.id
         WHERE c.id = $1`, [transactionData.cardId]);
                if (cardResult.rows.length === 0) {
                    return { success: false, error: "Card not found" };
                }
                const card = cardResult.rows[0];
                // Check card status
                if (card.status !== "active") {
                    return { success: false, error: "Card is not active" };
                }
                // Check spending limits
                if (transactionData.amount > card.daily_limit) {
                    return { success: false, error: "Transaction exceeds daily limit" };
                }
                // Check if online transactions are enabled
                if (transactionData.online && !card.online_enabled) {
                    return { success: false, error: "Online transactions are disabled" };
                }
                // Check account balance
                if (transactionData.amount > card.balance) {
                    return { success: false, error: "Insufficient funds" };
                }
                // Process transaction
                const transactionId = yield this.db.transaction((client) => __awaiter(this, void 0, void 0, function* () {
                    // Debit account
                    yield client.query("UPDATE bank_accounts SET balance = balance - $1 WHERE id = $2", [transactionData.amount, card.account_id]);
                    // Create transaction record
                    const txnResult = yield client.query(`INSERT INTO transactions (
            user_id, account_id, card_id, transaction_type, amount,
            description, reference, status, channel, location,
            fee_amount, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id`, [
                        card.user_id,
                        card.account_id,
                        transactionData.cardId,
                        "card_payment",
                        transactionData.amount,
                        `Payment to ${transactionData.merchantName}`,
                        `card_${Date.now()}_${card.user_id.slice(0, 8)}`,
                        "completed",
                        transactionData.online ? "online" : "pos",
                        JSON.stringify(transactionData.location),
                        0,
                        JSON.stringify({
                            merchantName: transactionData.merchantName,
                            merchantCategory: transactionData.merchantCategory,
                            cardBrand: card.card_brand,
                            cardType: card.card_type,
                        }),
                    ]);
                    // Update card last used
                    yield client.query("UPDATE cards SET last_used = NOW() WHERE id = $1", [
                        transactionData.cardId,
                    ]);
                    return txnResult.rows[0].id;
                }));
                return {
                    success: true,
                    data: {
                        transactionId,
                        amount: transactionData.amount,
                        merchantName: transactionData.merchantName,
                        status: "completed",
                        timestamp: new Date().toISOString(),
                    },
                };
            }
            catch (error) {
                console.error("Process card transaction error:", error);
                return { success: false, error: "Transaction failed" };
            }
        });
    }
    // Get card transactions
    getCardTransactions(cardId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (cardId, userId, limit = 50) {
            try {
                const result = yield this.db.query(`SELECT * FROM transactions
         WHERE card_id = $1 AND user_id = $2
         ORDER BY created_at DESC
         LIMIT $3`, [cardId, userId, limit]);
                return { success: true, data: result.rows };
            }
            catch (error) {
                console.error("Get card transactions error:", error);
                return { success: false, error: "Failed to retrieve transactions" };
            }
        });
    }
    // Private methods
    createFlutterwaveVirtualCard(request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post("https://api.flutterwave.com/v3/virtual-cards", {
                    currency: "NGN",
                    amount: 1000, // Initial funding
                    debit_currency: "NGN",
                    first_name: "User",
                    last_name: "Name",
                    date_of_birth: "1990-01-01",
                    email: "user@example.com",
                    phone: "+2348000000000",
                    title: "Mr",
                    gender: "M",
                }, {
                    headers: {
                        Authorization: `Bearer ${this.flutterwaveApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    createMockVirtualCard(request) {
        return __awaiter(this, void 0, void 0, function* () {
            const cardData = yield this.generateCardDetails("virtual", request.cardBrand);
            const cardRecord = {
                userId: request.userId,
                accountId: request.accountId,
                cardNumber: this.encryptCardNumber(cardData.cardNumber),
                cardType: "virtual",
                cardBrand: request.cardBrand || "verve",
                expiryMonth: cardData.expiryMonth,
                expiryYear: cardData.expiryYear,
                cvv: this.encryptCVV(cardData.cvv),
                status: "active",
                dailyLimit: 100000,
                monthlyLimit: 1000000,
                onlineEnabled: true,
                contactlessEnabled: false,
                internationalEnabled: false,
                issuedDate: new Date(),
            };
            const result = yield this.db.query(`INSERT INTO cards (
        user_id, account_id, card_number, card_type, card_brand,
        expiry_month, expiry_year, cvv, status, daily_limit,
        monthly_limit, online_enabled, contactless_enabled,
        international_enabled, issued_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`, [
                cardRecord.userId,
                cardRecord.accountId,
                cardRecord.cardNumber,
                cardRecord.cardType,
                cardRecord.cardBrand,
                cardRecord.expiryMonth,
                cardRecord.expiryYear,
                cardRecord.cvv,
                cardRecord.status,
                cardRecord.dailyLimit,
                cardRecord.monthlyLimit,
                cardRecord.onlineEnabled,
                cardRecord.contactlessEnabled,
                cardRecord.internationalEnabled,
                cardRecord.issuedDate,
            ]);
            return {
                success: true,
                data: {
                    cardId: result.rows[0].id,
                    maskedCardNumber: this.maskCardNumber(cardData.cardNumber),
                    cardType: "virtual",
                    cardBrand: request.cardBrand || "verve",
                    expiryMonth: cardData.expiryMonth,
                    expiryYear: cardData.expiryYear,
                    status: "active",
                },
            };
        });
    }
    saveCardToDatabase(flutterwaveCard, request) {
        return __awaiter(this, void 0, void 0, function* () {
            // Save Flutterwave card details to database
            // This would map Flutterwave response to our database structure
            return {
                success: true,
                data: {
                    cardId: flutterwaveCard.id,
                    maskedCardNumber: flutterwaveCard.masked_pan,
                    cardType: "virtual",
                    status: "active",
                },
            };
        });
    }
    generateCardDetails(cardType_1) {
        return __awaiter(this, arguments, void 0, function* (cardType, cardBrand = "verve") {
            // Generate realistic card details
            const cardNumber = yield this.db.query("SELECT generate_card_number($1) as card_number", [cardBrand]);
            const currentYear = new Date().getFullYear();
            const expiryYear = currentYear + 4;
            const expiryMonth = Math.floor(Math.random() * 12) + 1;
            const cvv = Math.floor(Math.random() * 900) + 100;
            return {
                cardNumber: cardNumber.rows[0].card_number,
                expiryMonth,
                expiryYear,
                cvv: cvv.toString(),
            };
        });
    }
    encryptCardNumber(cardNumber) {
        // In production, use proper encryption (AES-256)
        const hash = (0, crypto_1.createHash)("sha256");
        hash.update(cardNumber + process.env.CARD_ENCRYPTION_KEY);
        return hash.digest("hex");
    }
    decryptCardNumber(encryptedCardNumber) {
        // In production, use proper decryption
        // For demo, return mock card number
        return "5060990000000001";
    }
    encryptCVV(cvv) {
        const hash = (0, crypto_1.createHash)("sha256");
        hash.update(cvv + process.env.CVV_ENCRYPTION_KEY);
        return hash.digest("hex");
    }
    decryptCVV(encryptedCVV) {
        // In production, use proper decryption
        return "123";
    }
    maskCardNumber(cardNumber) {
        if (cardNumber.length < 8)
            return cardNumber;
        const first4 = cardNumber.slice(0, 4);
        const last4 = cardNumber.slice(-4);
        const middle = "*".repeat(cardNumber.length - 8);
        return `${first4}${middle}${last4}`;
    }
    syncCardStatusWithProvider(cardId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            // Sync card status with external provider (Flutterwave, etc.)
            try {
                if (this.flutterwaveApiKey !== "FLWSECK_TEST-default") {
                    const action = status === "blocked" ? "freeze" : "unfreeze";
                    yield axios_1.default.put(`https://api.flutterwave.com/v3/virtual-cards/${cardId}/status/${action}`, {}, {
                        headers: {
                            Authorization: `Bearer ${this.flutterwaveApiKey}`,
                        },
                    });
                }
            }
            catch (error) {
                console.error("Failed to sync card status with provider:", error);
            }
        });
    }
}
exports.cardManagementService = new CardManagementService();
