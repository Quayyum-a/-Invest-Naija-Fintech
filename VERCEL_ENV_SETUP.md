# Vercel Environment Variables Setup

To deploy InvestNaija to Vercel, you need to configure these environment variables in your Vercel dashboard:

## Required Environment Variables

### Database (PostgreSQL)

```
POSTGRES_URL=postgresql://username:password@hostname:port/database
```

OR

```
DATABASE_URL=postgresql://username:password@hostname:port/database
```

### Optional Service Integrations

#### Paystack (Payment Processing)

```
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx
```

#### Flutterwave (Alternative Payment)

```
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
```

#### Email Service (SendGrid)

```
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@investnaija.com
```

#### SMS Service (Termii)

```
TERMII_API_KEY=TLxxx
```

#### KYC Services

```
# VerifyMe
VERIFYME_API_KEY=xxx
VERIFYME_APP_ID=xxx

# Smile Identity
SMILE_API_KEY=xxx
SMILE_PARTNER_ID=xxx
```

## Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with its corresponding value
5. Make sure to select the appropriate environment (Production, Preview, Development)

## Database Setup

For production deployment, you'll need a PostgreSQL database. Recommended providers:

- **Vercel Postgres** (Recommended)
- **Neon** (Serverless PostgreSQL)
- **PlanetScale**
- **Railway**
- **Supabase**

## Deployment Commands

The build process will use these commands automatically:

- Install: `npm install`
- Build: `npm run vercel-build`

## Notes

- The application will work without external services but with limited functionality
- Database is required for user management and core features
- Payment processors are needed for financial transactions
- KYC services are required for user verification
