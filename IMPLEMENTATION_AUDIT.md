# InvestNaija Implementation Audit & TODO

## 🔍 **CRITICAL ISSUES TO FIX**

### 1. **Hardcoded Demo/Test Data** ❌

#### A. **Demo User IDs in Core Logic**

- `server/routes/social.ts` - Lines 196, 204, 316, 332: Using `"demo-user-id"` for money requests and social payments
- `server/routes/wallet.ts` - Line 550: Using `"demo-recipient-id"` for transfers
- `server/database/connection.ts` - Demo user creation with hardcoded data

#### B. **Test API Keys in Services**

- `server/services/billPayments.ts` - Line 13: Using test Paystack key as fallback
- `server/services/payments.ts` - Line 11: Using test Paystack key as fallback

#### C. **Mock Data in Components**

- `client/components/InvestmentProducts.tsx` - Lines 104-324: Complete mock investment data
- `client/components/BulkPayments.tsx` - Lines 96-131: Mock bulk payment data
- `client/pages/Crypto.tsx` - Lines 83-142: Mock cryptocurrency data
- `client/pages/AdminDashboard.tsx` - Lines 102-105: Mock admin statistics

### 2. **Unimplemented Core Features** ❌

#### A. **User Management System**

- **Issue**: No proper user lookup by phone number or email for transfers
- **Files**: `server/routes/social.ts`, `server/routes/wallet.ts`
- **Fix**: Implement `getUserByPhone()`, `getUserByEmail()` functions

#### B. **Real Payment Processing**

- **Issue**: Paystack integration returns mock responses when API key is invalid
- **Files**: `server/services/payments.ts`, `server/services/paymentsService.ts`
- **Fix**: Implement proper API key validation and error handling

#### C. **Bill Payment Integration**

- **Issue**: Using fallback mock data when APIs fail
- **Files**: `server/services/billPayments.ts`
- **Fix**: Implement proper error handling and user notifications

### 3. **Security Vulnerabilities** ⚠️

#### A. **Exposed Test Credentials**

- Test API keys hardcoded in source code
- Demo user credentials in production build

#### B. **Missing Input Validation**

- Some endpoints still use manual validation instead of Zod schemas
- File upload endpoints lack proper validation

### 4. **Frontend Placeholder Content** ❌

#### A. **"Coming Soon" Features**

- `client/pages/Portfolio.tsx` - Line 593: "Detailed investment transaction history coming soon!"
- `client/pages/Dashboard.tsx` - Line 497: "Additional services coming soon!"
- `client/pages/AdminDashboard.tsx` - Lines 565, 576, 588, 600: Multiple admin interfaces marked as "coming soon"

#### B. **Hardcoded External URLs**

- Cryptocurrency images pointing to GitHub raw content
- Test email addresses in forms and examples

---

## 🛠️ **IMPLEMENTATION PLAN**

### **Phase 1: Critical Backend Fixes (Priority: HIGH)**

#### 1.1 **User Lookup System**

```typescript
// server/data/storage.ts - ADD THESE FUNCTIONS
export const getUserByPhone = (phone: string): User | null => {
  const stmt = db.prepare("SELECT * FROM users WHERE phone = ?");
  return stmt.get(phone) as User | null;
};

export const getUserByEmail = (email: string): User | null => {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email) as User | null;
};

export const getUserByEmailOrPhone = (identifier: string): User | null => {
  const emailStmt = db.prepare("SELECT * FROM users WHERE email = ?");
  const phoneStmt = db.prepare("SELECT * FROM users WHERE phone = ?");

  return (
    (emailStmt.get(identifier) as User) ||
    (phoneStmt.get(identifier) as User) ||
    null
  );
};
```

#### 1.2 **Fix Social Banking Routes**

```typescript
// server/routes/social.ts - REPLACE demo-user-id logic
export const requestMoney: RequestHandler = async (req, res) => {
  // ... existing code ...

  // REPLACE: const toUserId = "demo-user-id";
  const recipientUser = getUserByEmailOrPhone(toUserIdentifier);
  if (!recipientUser) {
    return res.status(404).json({
      success: false,
      error: "Recipient not found. Please check the email or phone number.",
    });
  }

  const toUserId = recipientUser.id;
  // ... rest of implementation
};
```

#### 1.3 **Fix Wallet Transfer Logic**

```typescript
// server/routes/wallet.ts - REPLACE demo-recipient-id
export const transferToUser: RequestHandler = async (req, res) => {
  // ... existing code ...

  // REPLACE: const toUserId = "demo-recipient-id";
  const recipientUser = getUserByEmailOrPhone(toUserIdentifier);
  if (!recipientUser) {
    return res.status(404).json({
      success: false,
      error: "Recipient not found. Please verify the email or phone number.",
    });
  }

  const toUserId = recipientUser.id;
  // ... rest of implementation
};
```

#### 1.4 **Remove Test API Keys**

```typescript
// server/services/payments.ts - SECURE API KEY HANDLING
constructor() {
  this.apiKey = process.env.PAYSTACK_SECRET_KEY;

  if (!this.apiKey) {
    throw new Error("PAYSTACK_SECRET_KEY environment variable is required");
  }

  if (this.apiKey.includes("test") && process.env.NODE_ENV === "production") {
    throw new Error("Test API keys cannot be used in production");
  }
}
```

### **Phase 2: Frontend Implementation (Priority: HIGH)**

#### 2.1 **Replace Mock Data in Investment Products**

```typescript
// client/components/InvestmentProducts.tsx - IMPLEMENT REAL API CALLS
const fetchInvestmentProducts = async () => {
  try {
    const response = await fetch("/api/investments/products");
    const result = await response.json();

    if (result.success) {
      setProducts(result.data.products);
      setUserInvestments(result.data.userInvestments);
      setPortfolioSummary(result.data.portfolioSummary);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to load investment data",
      variant: "destructive",
    });
  }
};
```

#### 2.2 **Implement Missing Admin Features**

```typescript
// client/pages/AdminDashboard.tsx - REPLACE "coming soon" placeholders
const TransactionManagement = () => (
  <Card>
    <CardHeader>
      <CardTitle>Transaction Management</CardTitle>
    </CardHeader>
    <CardContent>
      <TransactionTable />
      <TransactionFilters />
      <TransactionActions />
    </CardContent>
  </Card>
);
```

#### 2.3 **Fix Crypto Data Integration**

```typescript
// client/pages/Crypto.tsx - IMPLEMENT REAL COINGECKO API
const fetchCryptoData = async () => {
  try {
    const response = await fetch("/api/crypto/market-data");
    const result = await response.json();

    if (result.success) {
      setCryptos(result.data);
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error("Failed to fetch crypto data:", error);
    // Fallback to cached data or show error message
    setError("Unable to load cryptocurrency data");
  }
};
```

### **Phase 3: API Implementations (Priority: MEDIUM)**

#### 3.1 **Investment Products API**

```typescript
// server/routes/investments.ts - ADD MISSING ENDPOINTS
export const getInvestmentProducts: RequestHandler = async (req, res) => {
  try {
    // Fetch real investment products from Nigerian market
    const products = await getAvailableInvestmentProducts();
    const userInvestments = await getUserInvestments(req.user!.id);
    const portfolioSummary = await calculatePortfolioSummary(req.user!.id);

    res.json({
      success: true,
      data: { products, userInvestments, portfolioSummary },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to load investment data",
    });
  }
};
```

#### 3.2 **Real-time Crypto API**

```typescript
// server/routes/crypto.ts - IMPLEMENT COINGECKO INTEGRATION
export const getCryptoMarketData: RequestHandler = async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "ngn",
          order: "market_cap_desc",
          per_page: 20,
          page: 1,
          sparkline: true,
        },
      },
    );

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch crypto data",
    });
  }
};
```

### **Phase 4: Production Readiness (Priority: MEDIUM)**

#### 4.1 **Environment Configuration**

- Remove all hardcoded test values
- Implement proper environment validation
- Add production environment checks

#### 4.2 **Error Handling & Logging**

- Implement structured logging
- Add error tracking (Sentry integration)
- Improve user-facing error messages

#### 4.3 **Performance Optimization**

- Implement API response caching
- Add database query optimization
- Implement lazy loading for heavy components

### **Phase 5: Security Hardening (Priority: MEDIUM)**

#### 5.1 **API Security**

- Implement API rate limiting per user
- Add request signature validation
- Implement proper session management

#### 5.2 **Data Security**

- Encrypt sensitive user data
- Implement data retention policies
- Add audit logging for financial transactions

---

## 📝 **SPECIFIC FILES TO MODIFY**

### **Immediate Action Required:**

1. **server/routes/social.ts** - Fix demo user IDs
2. **server/routes/wallet.ts** - Fix demo recipient IDs
3. **server/data/storage.ts** - Add user lookup functions
4. **server/services/payments.ts** - Remove test API keys
5. **client/components/InvestmentProducts.tsx** - Replace mock data
6. **client/pages/Crypto.tsx** - Implement real API calls
7. **client/pages/AdminDashboard.tsx** - Replace "coming soon" placeholders

### **Environment Variables to Add:**

```bash
# Required for production
COINGECKO_API_KEY=your_coingecko_api_key
INVESTMENT_PROVIDER_API_KEY=your_provider_key
REAL_PAYSTACK_SECRET_KEY=sk_live_your_live_key
```

### **Database Schema Updates:**

```sql
-- Add indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_transactions_user_id ON transactions(userId);
CREATE INDEX idx_investments_user_id ON investments(userId);
```

---

## ⚡ **QUICK WINS (Can implement immediately)**

1. **Replace all demo-user-id references** - 30 minutes
2. **Add user lookup functions** - 45 minutes
3. **Remove test API keys from code** - 15 minutes
4. **Replace "coming soon" messages with proper components** - 2 hours
5. **Add proper error handling for API failures** - 1 hour

---

## 🎯 **SUCCESS CRITERIA**

- [ ] No hardcoded demo/test data in production code
- [ ] All API integrations working with real providers
- [ ] User-to-user transfers working with real user lookup
- [ ] Investment products loading from real data sources
- [ ] Admin dashboard fully functional
- [ ] Crypto data loading from CoinGecko API
- [ ] All "coming soon" placeholders replaced with working features
- [ ] Production environment variables properly configured
- [ ] All test API keys removed from codebase
- [ ] Error handling implemented for all API calls

This audit reveals that while the application has a solid foundation, there are critical production-readiness issues that need immediate attention to make it a fully functional fintech platform.
