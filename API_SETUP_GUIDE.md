# InvestNaija API Setup Guide

This guide provides step-by-step instructions for setting up all external API integrations required for the InvestNaija fintech platform.

## Table of Contents

1. [Overview](#overview)
2. [Environment Variables](#environment-variables)
3. [Paystack Integration](#paystack-integration)
4. [Flutterwave Integration](#flutterwave-integration)
5. [YouVerify KYC Integration](#youverify-kyc-integration)
6. [Termii SMS Integration](#termii-sms-integration)
7. [CoinGecko Crypto Data](#coingecko-crypto-data)
8. [Testing and Validation](#testing-and-validation)
9. [Production Deployment](#production-deployment)
10. [Troubleshooting](#troubleshooting)

## Overview

InvestNaija requires several external API integrations to provide comprehensive fintech services:

- **Paystack**: Primary payment processor for card payments, bank transfers, and bill payments
- **Flutterwave**: Backup payment processor and additional payment methods
- **YouVerify**: KYC verification for BVN and NIN validation
- **Termii**: SMS notifications and OTP services
- **CoinGecko**: Real-time cryptocurrency market data (free, no API key required)

## Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=8080
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
ENCRYPTION_KEY=your-super-secure-encryption-key-min-32-chars

# Database
DATABASE_URL=sqlite:./data/investnaija.db

# Paystack Configuration
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret

# Flutterwave Configuration
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_flutterwave_secret_key
FLUTTERWAVE_WEBHOOK_SECRET=your_flutterwave_webhook_secret

# YouVerify Configuration
YOUVERIFY_API_KEY=your_youverify_api_key
YOUVERIFY_BASE_URL=https://api.youverify.co/v2

# Termii Configuration
TERMII_API_KEY=your_termii_api_key
TERMII_SENDER_ID=InvestNaija

# CoinGecko (Optional - free tier doesn't require API key)
COINGECKO_API_KEY=your_coingecko_api_key

# Optional Services
SENDGRID_API_KEY=your_sendgrid_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## Paystack Integration

### 1. Account Registration

1. Visit [paystack.com](https://paystack.com) and click "Sign Up"
2. Provide your business details:
   - Business name
   - Business email
   - Phone number
   - Business address
3. Verify your email address
4. Complete business verification:
   - Upload CAC certificate (for companies)
   - Provide director's ID
   - Submit BVN for verification

### 2. API Keys Setup

1. Login to your Paystack dashboard
2. Navigate to **Settings** → **API Keys & Webhooks**
3. Copy your keys:
   - **Public Key**: Starts with `pk_test_` or `pk_live_`
   - **Secret Key**: Starts with `sk_test_` or `sk_live_`

### 3. Webhook Configuration

1. In the Paystack dashboard, go to **Settings** → **API Keys & Webhooks**
2. Click **Add Endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/paystack`
4. Select events to listen for:
   - `charge.success`
   - `transfer.success`
   - `transfer.failed`
   - `invoice.payment_failed`
5. Copy the webhook secret and add to your `.env` file

### 4. Bank Account Setup (for transfers)

1. Go to **Settings** → **Preferences**
2. Add your settlement bank account
3. Complete bank verification process
4. Enable automatic settlements

### 5. Testing

```bash
# Test API connection
curl -H "Authorization: Bearer sk_test_your_secret_key" \
     https://api.paystack.co/bank

# Expected response: List of Nigerian banks
```

## Flutterwave Integration

### 1. Account Registration

1. Visit [flutterwave.com](https://flutterwave.com) and click "Get Started"
2. Register with your business email
3. Complete business verification:
   - Business registration documents
   - Director's identification
   - Bank account verification

### 2. API Keys Setup

1. Login to your Flutterwave dashboard
2. Go to **Settings** → **API Keys**
3. Copy your keys:
   - **Public Key**: Starts with `FLWPUBK_TEST-` or `FLWPUBK-`
   - **Secret Key**: Starts with `FLWSECK_TEST-` or `FLWSECK-`

### 3. Webhook Configuration

1. Navigate to **Settings** → **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/webhooks/flutterwave`
3. Select events:
   - `charge.completed`
   - `transfer.completed`
4. Generate and save the webhook hash

### 4. Testing

```bash
# Test API connection
curl -H "Authorization: Bearer FLWSECK_TEST-your_secret_key" \
     https://api.flutterwave.com/v3/banks/NG

# Expected response: List of Nigerian banks
```

## YouVerify KYC Integration

### 1. Account Registration

1. Visit [youverify.co](https://youverify.co)
2. Click "Get Started" and register as a business
3. Provide company details:
   - Company name and registration number
   - Business email and phone
   - Contact person details

### 2. Documentation and KYC

1. Upload required documents:
   - Certificate of incorporation (CAC)
   - Valid ID of directors
   - Utility bill for business address
2. Complete company verification process
3. Wait for approval (typically 1-3 business days)

### 3. API Keys Setup

1. Login to YouVerify dashboard
2. Navigate to **Developer** → **API Keys**
3. Generate API key for your environment:
   - Sandbox for testing
   - Production for live environment

### 4. Configure Services

1. Enable required verification services:
   - **BVN Verification**: ₦50 per verification
   - **NIN Verification**: ₦100 per verification
2. Set up webhook endpoints for verification callbacks
3. Configure callback URLs

### 5. Testing

```bash
# Test BVN verification (sandbox)
curl -X POST https://api.youverify.co/v2/api/identity/ng/bvn \
     -H "Api-Key: your_api_key" \
     -H "Content-Type: application/json" \
     -d '{
       "id": "22234567890",
       "isSubjectConsent": true
     }'
```

## Termii SMS Integration

### 1. Account Registration

1. Visit [termii.com](https://termii.com)
2. Sign up with your business email
3. Verify your email address and phone number

### 2. Account Setup

1. Complete business verification:
   - Upload business registration documents
   - Provide valid ID
   - Business address verification
2. Fund your account:
   - Minimum funding: ₦1,000
   - SMS rates: ₦4-8 per SMS depending on volume
3. Register sender ID:
   - Submit "InvestNaija" as sender ID
   - Provide business documents
   - Wait for approval (1-3 business days)

### 3. API Keys Setup

1. Login to Termii dashboard
2. Go to **Settings** → **API Keys**
3. Copy your API key
4. Note your approved sender ID

### 4. Testing

```bash
# Test SMS sending
curl -X POST https://api.ng.termii.com/api/sms/send \
     -H "Content-Type: application/json" \
     -d '{
       "to": "2348000000000",
       "from": "InvestNaija",
       "sms": "Test message from InvestNaija",
       "type": "plain",
       "channel": "generic",
       "api_key": "your_api_key"
     }'
```

## CoinGecko Crypto Data

### 1. Free Tier (Recommended for development)

CoinGecko offers a free tier with generous limits:

- 50 calls/minute
- 10,000 calls/month
- No API key required

### 2. Paid Plans (For production)

1. Visit [coingecko.com/api](https://www.coingecko.com/api)
2. Choose appropriate plan:
   - **Demo**: $129/month, 10,000 calls/month
   - **Developer**: $999/month, 100,000 calls/month
3. Generate API key after payment

### 3. Testing

```bash
# Test crypto data (no API key required for free tier)
curl https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&per_page=10&page=1

# With API key (paid plans)
curl https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum \
     -H "x-cg-pro-api-key: your_api_key"
```

## Testing and Validation

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-org/investnaija.git
cd investnaija

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env

# Run the application
npm run dev
```

### 2. API Endpoint Testing

Test each integration using the provided test endpoints:

```bash
# Test Paystack
curl -X GET http://localhost:8080/api/payments/banks \
     -H "Authorization: Bearer your_jwt_token"

# Test Flutterwave
curl -X GET http://localhost:8080/api/payments/banks \
     -H "Authorization: Bearer your_jwt_token"

# Test YouVerify
curl -X POST http://localhost:8080/api/kyc/verify-bvn \
     -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     -d '{"bvn": "22234567890"}'

# Test Termii
curl -X POST http://localhost:8080/api/sms/send \
     -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     -d '{"to": "2348000000000", "message": "Test SMS"}'

# Test CoinGecko
curl -X GET http://localhost:8080/api/crypto/market
```

### 3. Integration Status Check

Visit the admin dashboard or check server logs for integration status:

```bash
# Check logs for integration status
npm run dev

# Look for output like:
# ✅ Paystack: Enabled
# ✅ Flutterwave: Enabled
# ✅ YouVerify: Enabled
# ✅ Termii: Enabled
# ✅ CoinGecko: Enabled
```

## Production Deployment

### 1. Environment Variables

Update your production `.env` file:

```bash
# Production Configuration
NODE_ENV=production
PORT=443

# Use production API keys (remove _TEST_ prefixes)
PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key

FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_live_public_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_live_secret_key

# Production database
DATABASE_URL=postgresql://user:password@host:port/database

# Secure secrets (32+ characters)
JWT_SECRET=your-production-jwt-secret-min-32-chars
ENCRYPTION_KEY=your-production-encryption-key-min-32-chars
```

### 2. Security Considerations

1. **HTTPS Only**: Ensure all webhook URLs use HTTPS
2. **IP Whitelisting**: Configure IP restrictions where possible
3. **Rate Limiting**: Implement appropriate rate limits
4. **Monitoring**: Set up error tracking and monitoring
5. **Backup**: Regular database backups
6. **Compliance**: Ensure NDPR and CBN compliance

### 3. Webhook Security

Verify webhook signatures in production:

```typescript
// Paystack webhook verification
const crypto = require("crypto");
const signature = req.headers["x-paystack-signature"];
const hash = crypto
  .createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET)
  .update(JSON.stringify(req.body))
  .digest("hex");

if (hash !== signature) {
  throw new Error("Invalid webhook signature");
}
```

## Troubleshooting

### Common Issues

#### 1. Paystack Issues

**Problem**: "Invalid API Key"

- **Solution**: Ensure you're using the correct key for your environment (test vs live)
- **Check**: Verify the key starts with `sk_test_` or `sk_live_`

**Problem**: "Business not verified"

- **Solution**: Complete business verification in Paystack dashboard
- **Timeline**: 1-5 business days for verification

**Problem**: "Webhook not receiving events"

- **Solution**:
  - Verify webhook URL is accessible
  - Check webhook signature verification
  - Ensure proper SSL certificate

#### 2. Flutterwave Issues

**Problem**: "Authentication failed"

- **Solution**: Verify API key format starts with `FLWSECK_`
- **Check**: Ensure account is activated and verified

**Problem**: "Transaction failed"

- **Solution**: Check account balance and transaction limits
- **Verify**: Customer details are correctly formatted

#### 3. YouVerify Issues

**Problem**: "Insufficient balance"

- **Solution**: Fund your YouVerify account
- **Rates**: BVN (₦50), NIN (₦100) per verification

**Problem**: "Invalid verification response"

- **Solution**: Check BVN/NIN format (must be exactly 11 digits)
- **Debug**: Use sandbox environment for testing

#### 4. Termii Issues

**Problem**: "Insufficient SMS balance"

- **Solution**: Fund your Termii account
- **Minimum**: ₦1,000 funding required

**Problem**: "Sender ID not approved"

- **Solution**: Wait for sender ID approval or use approved generic sender

#### 5. General Network Issues

**Problem**: "Network timeout"

- **Solution**: Implement retry logic with exponential backoff
- **Configure**: Increase timeout values for production

**Problem**: "Rate limiting"

- **Solution**: Implement proper rate limiting and request queuing
- **Monitor**: API usage and optimize call frequency

### Debug Mode

Enable debug logging for API calls:

```bash
# Set debug environment variable
DEBUG=paystack:*,flutterwave:*,youverify:*,termii:*

# Run with debug logging
npm run dev
```

### Support Contacts

- **Paystack**: support@paystack.com, +234 1 888 7278
- **Flutterwave**: support@flutterwave.com, +234 1 888 8881
- **YouVerify**: support@youverify.co, +234 901 000 1234
- **Termii**: hello@termii.com, +234 901 000 5678
- **CoinGecko**: support@coingecko.com

### Monitoring and Alerts

Set up monitoring for:

- API response times
- Error rates
- Webhook delivery success
- Account balances (for SMS and verification services)
- Rate limit usage

### Cost Estimation

Monthly costs for a medium-scale operation (10,000 users):

- **Paystack**: 1.5% + ₦100 per transaction
- **Flutterwave**: 1.4% per transaction
- **YouVerify**: ₦50-100 per verification
- **Termii**: ₦4-8 per SMS
- **CoinGecko**: $0 (free tier) to $129/month

### Compliance Checklist

- [ ] Business registration with CAC
- [ ] CBN approval for financial services (if required)
- [ ] NDPR compliance for data protection
- [ ] KYC processes implemented
- [ ] AML monitoring in place
- [ ] Secure data storage and transmission
- [ ] Regular security audits
- [ ] Incident response procedures

---

For additional support or questions, please refer to the individual service documentation or contact their support teams.
