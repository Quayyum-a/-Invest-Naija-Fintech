# 🚀 Vercel Deployment Guide for InvestNaija

This guide will help you deploy your InvestNaija application to Vercel successfully.

## 📋 Prerequisites

Before deploying, ensure you have:

- A Vercel account (free tier works)
- A PostgreSQL database (recommended: Neon, Supabase, or Vercel Postgres)
- Your environment variables ready

## 🔧 Required Environment Variables

In your Vercel project settings, add these environment variables:

### Essential Variables (Required)

```
POSTGRES_URL=postgres://username:password@host:port/database
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
NODE_ENV=production
```

### Optional Variables

```
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_flutterwave_secret_key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_flutterwave_public_key
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
APP_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
```

## 📁 Project Structure for Vercel

Your project is already configured for Vercel with:

- ✅ `vercel.json` - Deployment configuration
- ✅ `api/` folder - Serverless functions
- ✅ PostgreSQL adapter - For Vercel databases
- ✅ Build optimizations

## 🚀 Deployment Steps

### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy!

### Option 2: Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login and Deploy**

   ```bash
   vercel login
   vercel
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add POSTGRES_URL
   vercel env add JWT_SECRET
   # Add other variables as needed
   ```

## 🗄️ Database Setup

### Option 1: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add as `POSTGRES_URL` in Vercel

### Option 2: Vercel Postgres

1. In your Vercel project dashboard
2. Go to Storage tab
3. Create a new Postgres database
4. Connection string is automatically added

### Option 3: Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Add as `POSTGRES_URL` in Vercel

## ✅ Verification Steps

After deployment, test these endpoints:

1. **Health Check**

   ```
   GET https://your-app.vercel.app/api/health
   ```

2. **API Ping**

   ```
   GET https://your-app.vercel.app/api/ping
   ```

3. **Frontend**
   ```
   https://your-app.vercel.app
   ```

## 🐛 Common Issues & Solutions

### Build Fails

- **Check TypeScript errors**: Run `npm run typecheck` locally
- **Missing dependencies**: Ensure all imports are correct
- **Environment variables**: Verify they're set in Vercel dashboard

### Database Connection Issues

- **Wrong connection string**: Double-check format
- **SSL required**: Most cloud PostgreSQL requires SSL
- **Firewall**: Ensure database accepts Vercel IP ranges

### Function Timeouts

- **Long queries**: Optimize database queries
- **Cold starts**: Consider Vercel Pro for better performance
- **Connection pooling**: Already implemented in the app

### CORS Issues

- **Set CORS_ORIGIN**: Add your Vercel URL
- **Multiple domains**: Use comma-separated values

## 📊 Performance Tips

1. **Database Optimization**

   - Use connection pooling (already implemented)
   - Add database indexes for frequent queries
   - Monitor query performance

2. **Function Optimization**
   - Functions are already optimized for Vercel
   - Database connections are properly managed
   - Environment-based configurations are in place

## 🔒 Security Checklist

- ✅ Strong JWT secret (32+ characters)
- ✅ Secure database credentials
- ✅ HTTPS enforced by Vercel
- ✅ Rate limiting implemented
- ✅ Input validation with Zod
- ✅ CORS properly configured

## 📞 Support

If you encounter issues:

1. Check Vercel function logs in the dashboard
2. Review the [Vercel documentation](https://vercel.com/docs)
3. Check our GitHub issues
4. Ensure all environment variables are correctly set

## 🎉 Success!

Once deployed, your InvestNaija app will be available at:

- **Frontend**: `https://your-app.vercel.app`
- **API**: `https://your-app.vercel.app/api/*`
- **Admin**: `https://your-app.vercel.app/admin`

Your app is now ready for production use! 🚀
