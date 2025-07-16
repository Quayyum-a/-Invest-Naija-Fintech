# Vercel Deployment Guide

This guide explains how to deploy the InvestNaija application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. The Vercel CLI installed: `npm install -g vercel`

## Quick Deployment

### Option 1: Deploy via Vercel CLI

1. **Login to Vercel**:

   ```bash
   vercel login
   ```

2. **Deploy the project**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**
2. **Connect your GitHub repository to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

## Environment Variables

Set up the following environment variables in your Vercel dashboard:

### Required for Production

```
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-chars
ENCRYPTION_KEY=your-super-secure-encryption-key-at-least-32-chars
```

### Payment Providers (Recommended)

```
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret

FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE-your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_LIVE-your_flutterwave_secret_key
FLUTTERWAVE_WEBHOOK_SECRET=your_flutterwave_webhook_secret
```

### Optional Services

See `.env.example` for a complete list of optional environment variables.

## Configuration Files

The following files are configured for Vercel deployment:

- **`vercel.json`**: Main Vercel configuration
- **`api/index.ts`**: Serverless function entry point
- **`package.json`**: Contains `vercel-build` script

## Build Process

1. **Frontend Build**: `npm run build:client` creates the static files in `dist/spa/`
2. **API Functions**: Serverless functions are deployed from the `api/` directory
3. **Routing**: All API calls go to `/api/*` and frontend routes are handled by React Router

## Database

By default, the application uses SQLite which works well for development and small-scale production. For larger deployments, consider:

1. **PostgreSQL on Vercel**: Use Vercel Postgres
2. **External Database**: Set `DATABASE_URL` environment variable

## Post-Deployment Setup

1. **Admin Account**: The application automatically creates a super admin account:

   - Email: `admin@investnaija.com`
   - Default password: Check server logs or reset via admin interface

2. **Payment Provider Setup**: Configure your Paystack/Flutterwave webhooks to point to:
   - Paystack: `https://your-domain.vercel.app/api/webhooks/paystack`
   - Flutterwave: `https://your-domain.vercel.app/api/webhooks/flutterwave`

## Custom Domain

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update your DNS settings as instructed

## Monitoring and Debugging

- **Logs**: View function logs in the Vercel dashboard
- **Analytics**: Enable Vercel Analytics for performance monitoring
- **Sentry**: Set `SENTRY_DSN` environment variable for error tracking

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all dependencies are listed in `package.json`
2. **API Errors**: Verify environment variables are set correctly
3. **Database Issues**: Ensure the database file is being created properly

### Getting Help

- Check the Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Review deployment logs in the Vercel dashboard
- Contact support if issues persist

## Security Considerations

1. **Environment Variables**: Never commit secrets to your repository
2. **JWT Secrets**: Use strong, unique secrets for production
3. **Database**: Consider using encrypted database solutions for sensitive data
4. **HTTPS**: Vercel provides HTTPS by default, ensure all external services use HTTPS

## Performance Optimization

1. **Edge Functions**: Consider moving some API logic to Vercel Edge Functions
2. **Caching**: Implement Redis caching for better performance
3. **CDN**: Vercel's global CDN will cache your static assets automatically
