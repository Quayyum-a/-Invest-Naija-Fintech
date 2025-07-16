# Vercel Deployment Guide for InvestNaija

This guide will walk you through deploying your InvestNaija application to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A PostgreSQL database (recommended options below)
3. Your environment variables ready

## Recommended Database Options

### Option 1: Neon Database (Recommended)

- Visit https://neon.tech and create an account
- Create a new database project
- Copy the connection string from the dashboard
- Neon provides a serverless PostgreSQL database perfect for Vercel

### Option 2: Supabase

- Visit https://supabase.com and create an account
- Create a new project
- Go to Settings > Database and copy the connection string
- Supabase provides PostgreSQL with additional features

### Option 3: Vercel Postgres

- Available directly in your Vercel dashboard
- Perfect integration with Vercel deployments
- Automatic environment variable setup

## Step 1: Prepare Your Environment Variables

Create a `.env.local` file in your project root with these variables:

```bash
# Database (required)
POSTGRES_URL="your_postgres_connection_string"

# JWT (required)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"

# Payment Providers (optional but recommended)
PAYSTACK_SECRET_KEY="sk_test_your_paystack_secret_key"
PAYSTACK_PUBLIC_KEY="pk_test_your_paystack_public_key"

# Email Service (optional)
SENDGRID_API_KEY="SG.your_sendgrid_api_key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# App Configuration
NODE_ENV="production"
APP_URL="https://your-vercel-domain.vercel.app"
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Deploy your project:

   ```bash
   vercel
   ```

4. Follow the prompts and your app will be deployed!

### Option B: Deploy via GitHub Integration

1. Push your code to a GitHub repository
2. Go to your Vercel dashboard
3. Click "New Project"
4. Import your GitHub repository
5. Configure your environment variables in the Vercel dashboard
6. Deploy!

## Step 3: Configure Environment Variables in Vercel

1. Go to your project dashboard on Vercel
2. Navigate to Settings > Environment Variables
3. Add all the environment variables from your `.env.local` file
4. Make sure to set the correct environment (Production, Preview, Development)

## Step 4: Set Up Your Database

After deployment, your database needs to be initialized. You have two options:

### Option A: Automatic Migration (if supported)

The app will attempt to create tables automatically on first run.

### Option B: Manual Migration

Connect to your PostgreSQL database and run the migration scripts manually.

## Step 5: Verify Deployment

1. Visit your Vercel deployment URL
2. Check the health endpoint: `https://your-app.vercel.app/health`
3. Try registering a new user account
4. Check the logs in Vercel dashboard for any issues

## Common Issues and Solutions

### Database Connection Issues

- Verify your connection string is correct
- Ensure your database allows connections from Vercel IPs
- Check that the database exists and is accessible

### Environment Variable Issues

- Make sure all required environment variables are set
- Verify there are no typos in variable names
- Check that sensitive values are properly encoded

### Build Issues

- Ensure all dependencies are listed in package.json
- Check that TypeScript compilation succeeds
- Verify file imports use correct paths

## Domain Configuration

To use a custom domain:

1. Go to your project settings in Vercel
2. Navigate to Domains
3. Add your custom domain
4. Configure DNS records as instructed
5. Update your environment variables to reflect the new domain

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **JWT Secret**: Use a strong, unique JWT secret for production
3. **Database**: Use connection pooling and enable SSL
4. **CORS**: Configure CORS origins for your specific domain
5. **Rate Limiting**: Monitor and adjust rate limits based on usage

## Monitoring and Maintenance

1. **Logs**: Monitor function logs in Vercel dashboard
2. **Performance**: Use Vercel Analytics to track performance
3. **Database**: Monitor database connections and query performance
4. **Uptime**: Set up monitoring for your endpoints

## Support

For deployment issues:

1. Check Vercel documentation: https://vercel.com/docs
2. Review the function logs in your Vercel dashboard
3. Verify all environment variables are properly configured
4. Check database connectivity and permissions

Your InvestNaija application should now be successfully deployed on Vercel!
