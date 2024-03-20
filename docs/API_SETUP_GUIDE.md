# Nigerian API Services Setup Guide

This guide will help you obtain API credentials for the Nigerian-specific services required for InvestNaija.

## 🚀 Required Services

### 1. **Termii SMS API** (For OTP & Notifications)

**Purpose:** Send SMS OTP codes and transaction notifications to Nigerian phone numbers

**Steps to Get API Key:**

1. Visit [https://termii.com](https://termii.com)
2. Click "Sign Up" and create a business account
3. Complete KYC verification (provide business documents)
4. Once approved, go to Dashboard → API Settings
5. Copy your API Key
6. Set sender ID as "InvestNaija" (may require approval)

**Environment Variables:**

```bash
TERMII_API_KEY=your_termii_api_key_here
TERMII_SENDER_ID=InvestNaija
```

**Pricing:** ~₦2-4 per SMS (volume discounts available)

---

### 2. **VerifyMe KYC API** (For BVN/NIN Verification)

**Purpose:** Verify Nigerian Bank Verification Numbers (BVN) and National Identity Numbers (NIN)

**Steps to Get API Key:**

1. Visit [https://verifyme.ng](https://verifyme.ng)
2. Contact sales team for business account setup
3. Provide business registration documents
4. Complete compliance review process
5. Receive API credentials after approval
6. Test with sandbox environment first

**Environment Variables:**

```bash
VERIFYME_API_KEY=your_verifyme_api_key_here
VERIFYME_BASE_URL=https://api.verifyme.ng
```

**Pricing:** ~₦50-200 per verification (depends on data depth)

---

### 3. **Alternative KYC Providers**

#### **Prembly (IdentityPass)**

- Website: [https://prembly.com](https://prembly.com)
- Good alternative to VerifyMe
- Supports BVN, NIN, CAC, and international IDs

#### **Smile Identity**

- Website: [https://smileidentity.com](https://smileidentity.com)
- Strong in document verification and biometrics
- Good for facial recognition and liveness checks

---

## 📧 Email Service Setup (Optional but Recommended)

### **SendGrid**

1. Visit [https://sendgrid.com](https://sendgrid.com)
2. Create account and verify business
3. Get API key from Settings → API Keys

```bash
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM_ADDRESS=noreply@investnaija.com
```

---

## 🔗 Cryptocurrency Data (Optional)

### **CoinGecko API**

1. Visit [https://coingecko.com/api](https://coingecko.com/api)
2. Free tier: 50 calls/minute (sufficient for MVP)
3. Pro plans available for higher limits

```bash
COINGECKO_API_KEY=your_coingecko_api_key_here  # Optional for free tier
```

---

## ⚙️ Setup Instructions

1. **Copy environment template:**

   ```bash
   cp .env.example .env
   ```

2. **Add your API credentials to `.env`:**

   ```bash
   # Required for SMS
   TERMII_API_KEY=your_actual_termii_key

   # Required for KYC
   VERIFYME_API_KEY=your_actual_verifyme_key

   # Optional services
   SENDGRID_API_KEY=your_sendgrid_key
   COINGECKO_API_KEY=your_coingecko_key
   ```

3. **Test the integrations:**

   ```bash
   npm run dev
   ```

4. **Verify in admin dashboard:**
   - Login as super admin
   - Check "Service Integration Status"
   - ✅ Green = Connected, ⚠️ Yellow = Development Mode

---

## 🧪 Development Mode

The system will work in development mode without API keys:

- **SMS:** Messages logged to console instead of sending
- **KYC:** Basic format validation only
- **Email:** Messages logged to console

This allows development and testing without requiring all API integrations upfront.

---

## 💰 Cost Estimation (Monthly)

For a growing fintech with ~1000 active users:

| Service            | Usage                    | Cost               |
| ------------------ | ------------------------ | ------------------ |
| **Termii SMS**     | ~2000 OTPs/month         | ₦6,000             |
| **VerifyMe KYC**   | ~200 verifications/month | ₦20,000            |
| **SendGrid Email** | ~5000 emails/month       | $15 (~₦12,000)     |
| **Total**          |                          | **~₦38,000/month** |

---

## 🔒 Security Best Practices

1. **Never commit API keys** to version control
2. **Use different keys** for development/staging/production
3. **Implement rate limiting** on API endpoints
4. **Monitor API usage** and set up billing alerts
5. **Rotate keys periodically** (every 6 months)

---

## 📞 Support Contacts

- **Termii Support:** support@termii.com
- **VerifyMe Support:** support@verifyme.ng
- **Technical Issues:** [Create GitHub Issue](https://github.com/your-repo/issues)

---

## ✅ Next Steps

1. Start with **Termii SMS** (easiest to get)
2. Apply for **VerifyMe KYC** (takes 2-3 weeks)
3. Set up **SendGrid** for emails
4. Test all integrations in staging environment
5. Deploy to production with monitoring

**Need help?** Check the admin dashboard for real-time integration status and error logs.
