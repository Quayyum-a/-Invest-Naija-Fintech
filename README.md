# InvestNaija - Complete Nigerian Fintech Platform

A comprehensive fintech platform built for the Nigerian market, offering banking, investments, social features, crypto trading, and business banking solutions.

![InvestNaija Banner](https://via.placeholder.com/800x200/2E7D32/FFFFFF?text=InvestNaija+-+Nigerian+Fintech+Platform)

## 🌟 Overview

InvestNaija is a full-stack financial technology platform designed specifically for Nigerian users, featuring modern web technologies, real-time capabilities, and comprehensive banking services.

## ✨ Key Features

### 🏦 **Core Banking**

- **Digital Wallet** - Secure wallet management with real-time balance updates
- **Money Transfer** - Bank-to-bank transfers and P2P payments
- **Transaction History** - Detailed transaction tracking and analytics
- **Multi-currency Support** - NGN primary with crypto support

### 💰 **Investment Platform**

- **Investment Products** - Treasury bills, mutual funds, fixed deposits
- **Portfolio Management** - Real-time portfolio tracking and performance analytics
- **Automated Investments** - Round-up savings and scheduled investments
- **Investment Analytics** - Detailed performance reports and projections

### 👥 **Social Banking**

- **Group Savings** - Collaborative savings goals with friends and family
- **Money Requests** - Send and receive money requests with reasons
- **Social Payments** - Gift money with messages and public/private options
- **Financial Challenges** - Community-driven financial goals and competitions

### ₿ **Cryptocurrency Trading**

- **Live Market Data** - Real-time crypto prices and market information
- **Portfolio Tracking** - Track crypto holdings and performance
- **Buy/Sell Interface** - Easy crypto trading with NGN conversion
- **Market Analytics** - Technical analysis and trading insights

### 🏢 **Business Banking**

- **Business Accounts** - Corporate account management
- **Bulk Payments** - Process multiple payments efficiently
- **Business Analytics** - Financial insights and reporting
- **Compliance Tools** - KYC and regulatory compliance features

### 📱 **Bill Payments & Services**

- **Airtime & Data** - Mobile top-up for all Nigerian networks
- **Electricity Bills** - Pay utility bills for major distributors
- **Cable TV** - DStv, GOtv, and other subscription payments
- **Educational** - School fees and examination payments

### 🔐 **Security & Compliance**

- **KYC Verification** - BVN and NIN integration
- **Two-Factor Authentication** - Enhanced account security
- **Fraud Detection** - Real-time transaction monitoring
- **Audit Trails** - Complete transaction logging for compliance

### 🔔 **Real-time Features**

- **Live Notifications** - WebSocket-powered instant notifications
- **Real-time Updates** - Live balance and transaction updates
- **Market Alerts** - Crypto and investment alerts
- **Social Updates** - Group activity notifications

### 🤖 **AI Integration**

- **Financial Advisor** - AI-powered financial advice and insights
- **Smart Categorization** - Automatic transaction categorization
- **Spending Analytics** - AI-driven spending pattern analysis
- **Investment Recommendations** - Personalized investment suggestions

## 🛠️ Technology Stack

### **Frontend**

- **Framework**: React 18 with TypeScript
- **Routing**: React Router 6 (SPA mode)
- **Styling**: TailwindCSS 3 with custom design system
- **UI Components**: Radix UI primitives
- **State Management**: React Query for server state
- **Icons**: Lucide React
- **Charts**: Victory.js and Recharts
- **Build Tool**: Vite 6

### **Backend**

- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: SQLite (development) / PostgreSQL (production ready)
- **Authentication**: JWT with secure session management
- **Real-time**: Socket.io for WebSocket connections
- **Validation**: Zod for runtime type checking
- **Security**: Comprehensive middleware stack

### **Development & Deployment**

- **Package Manager**: npm
- **Testing**: Vitest
- **Linting**: ESLint
- **Formatting**: Prettier
- **Deployment**: Docker ready with production builds
- **CI/CD**: GitHub Actions compatible

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm 7+

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/investnaija.git
cd investnaija

# Install dependencies
npm install

# Start development server
npm run dev
```

### First-time Setup

1. **Access the application** at `http://localhost:8080`
2. **Admin Access**: Login with `quayyumariyo@gmail.com` / `SuperAdmin123!`
3. **Create user account** via the registration page
4. **Explore features** through the comprehensive dashboard

## 📊 Project Structure

```
investnaija/
├── client/                    # React frontend application
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI component library (45+ components)
│   │   ├── AIFinancialAdvisor.tsx
│   │   ├── SocialBanking.tsx
│   │   ├── CryptoTicker.tsx
│   │   └── ...
│   ├── pages/                # Route-based page components
│   │   ├── Dashboard.tsx     # Main user dashboard
│   │   ├── Portfolio.tsx     # Investment portfolio
│   │   ├── Crypto.tsx        # Cryptocurrency trading
│   │   ├── SocialPage.tsx    # Social banking features
│   │   ├── BusinessBanking.tsx
│   │   └── ...
│   ├── contexts/             # React context providers
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utilities and API client
├── server/                   # Express.js backend
│   ├── routes/               # API route handlers
│   │   ├── auth.ts          # Authentication endpoints
│   │   ├── social.ts        # Social banking API
│   │   ├── crypto.ts        # Cryptocurrency endpoints
│   │   ├── payments.ts      # Payment processing
│   │   └── ...
│   ├── services/            # Business logic services
│   │   ├── notificationService.ts
│   │   ├── loanServices.ts
│   │   ├── cardManagement.ts
│   │   └── ...
│   ├── data/                # Database layer
│   │   ├── storage.ts       # Database functions
│   │   └── init.ts         # App initialization
│   ├── middleware/          # Express middleware
│   └── config/             # Configuration management
├── shared/                  # Shared TypeScript types
├── mobile/                  # React Native mobile app
└── docs/                   # Documentation
```

## 🏗️ Architecture Features

### **Database Schema**

- **Users & Authentication** - Secure user management with role-based access
- **Financial Accounts** - Wallets, bank accounts, and card management
- **Transactions** - Comprehensive transaction tracking with metadata
- **Social Features** - Groups, requests, payments, and challenges
- **Investments** - Portfolio tracking and performance analytics
- **Notifications** - Multi-channel notification system
- **Business Profiles** - Corporate account management
- **Crypto Holdings** - Cryptocurrency portfolio tracking

### **API Architecture**

- **RESTful Design** - Consistent API patterns
- **Authentication** - JWT-based with refresh tokens
- **Rate Limiting** - Protection against abuse
- **Error Handling** - Comprehensive error responses
- **Validation** - Request/response validation with Zod
- **Real-time Updates** - WebSocket integration

### **Security Features**

- **Authentication** - Secure login with session management
- **Authorization** - Role-based access control
- **Data Protection** - Input sanitization and validation
- **Rate Limiting** - API abuse prevention
- **CORS** - Cross-origin request protection
- **Headers** - Security headers implementation

## 📱 Mobile Application

The platform includes a React Native mobile application with:

- **Native Navigation** - Stack and tab navigation
- **Biometric Authentication** - Fingerprint and Face ID
- **Push Notifications** - Real-time mobile notifications
- **Offline Support** - Basic offline functionality
- **Native Integrations** - Camera, contacts, and device features

## 🔧 Development

### **Available Scripts**

```bash
# Development
npm run dev              # Start development server
npm run typecheck        # TypeScript validation
npm test                # Run test suite

# Building
npm run build           # Production build
npm run build:client    # Build frontend only
npm run build:server    # Build backend only

# Production
npm start              # Start production server
```

### **Configuration**

The application supports extensive configuration through environment variables:

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=your-secret-key

# External Services
PAYSTACK_SECRET_KEY=pk_test_...
SENDGRID_API_KEY=SG...
TERMII_API_KEY=TL...

# Feature Flags
ENABLE_CRYPTO=true
ENABLE_SOCIAL_BANKING=true
ENABLE_BUSINESS_FEATURES=true
```

## 🌍 Nigerian Market Focus

### **Localization**

- **Currency**: Primary NGN with crypto support
- **Banking Integration**: Nigerian bank support
- **Payment Providers**: Paystack and Flutterwave ready
- **Regulatory Compliance**: CBN guidelines adherence
- **Local Services**: Nigerian telco and utility providers

### **Supported Services**

- **Banks**: All major Nigerian banks
- **Mobile Networks**: MTN, Airtel, Glo, 9mobile
- **Utilities**: PHCN, AEDC, EKEDC, and more
- **Cable TV**: DStv, GOtv, StarTimes
- **Education**: WAEC, NECO, JAMB payments

## 🚀 Deployment

### **Docker Deployment**

```bash
# Build Docker image
docker build -t investnaija .

# Run container
docker run -p 8080:8080 investnaija
```

### **Environment Setup**

```bash
# Install dependencies
npm install

# Build application
npm run build

# Start production server
npm start
```

## 🔐 Security

- **Authentication**: JWT with secure session management
- **Authorization**: Role-based access control (user, admin, super_admin)
- **Data Protection**: Input validation and sanitization
- **API Security**: Rate limiting and CORS protection
- **Compliance**: Nigerian financial regulation compliance

## 📈 Performance

- **Frontend**: Lazy loading and code splitting
- **Backend**: Efficient database queries and caching
- **Real-time**: Optimized WebSocket connections
- **Mobile**: Native performance optimizations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See `/docs` folder for detailed guides
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: support@investnaija.com

## 🗺️ Roadmap

### **Q1 2025**

- [ ] Advanced AI financial advisory
- [ ] Enhanced crypto trading features
- [ ] Mobile app v2.0
- [ ] Advanced business banking

### **Q2 2025**

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Third-party integrations
- [ ] Enhanced security features

---

**Built with ❤️ for the Nigerian fintech ecosystem**

_InvestNaija - Empowering Financial Growth in Nigeria_
