-- InvestNaija Production Database Schema (PostgreSQL)
-- Core Banking System for Nigerian Fintech

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with enhanced KYC fields
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    
    -- Nigerian identity verification
    bvn VARCHAR(11) UNIQUE,
    nin VARCHAR(11) UNIQUE,
    
    -- Address information
    address JSONB,
    state VARCHAR(50),
    local_government VARCHAR(100),
    
    -- KYC status and verification
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_progress', 'verified', 'rejected')),
    kyc_level INTEGER DEFAULT 1 CHECK (kyc_level BETWEEN 1 AND 3),
    verification_documents JSONB,
    
    -- Account status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'frozen', 'closed')),
    account_type VARCHAR(20) DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'corporate')),
    
    -- Security and preferences
    two_factor_enabled BOOLEAN DEFAULT false,
    biometric_enabled BOOLEAN DEFAULT false,
    notification_preferences JSONB,
    device_tokens JSONB,
    
    -- Metadata
    last_login TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexing for performance
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone ~* '^\+234[0-9]{10}$')
);

-- Bank accounts table (Core Banking System)
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(10) UNIQUE NOT NULL,
    account_name VARCHAR(200) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('savings', 'current', 'fixed_deposit', 'domiciliary')),
    currency VARCHAR(3) DEFAULT 'NGN',
    
    -- Balance and limits
    balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2) DEFAULT 0.00,
    daily_limit DECIMAL(15,2) DEFAULT 1000000.00,
    monthly_limit DECIMAL(15,2) DEFAULT 10000000.00,
    
    -- Account status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dormant', 'frozen', 'closed')),
    freeze_reason TEXT,
    
    -- Metadata
    opened_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_transaction TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Virtual and physical cards
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    
    -- Card details
    card_number VARCHAR(19) UNIQUE NOT NULL, -- Encrypted
    card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('virtual', 'physical')),
    card_brand VARCHAR(20) DEFAULT 'verve' CHECK (card_brand IN ('verve', 'mastercard', 'visa')),
    expiry_month INTEGER CHECK (expiry_month BETWEEN 1 AND 12),
    expiry_year INTEGER,
    cvv VARCHAR(4), -- Encrypted
    
    -- Card status and limits
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired', 'lost', 'stolen')),
    daily_limit DECIMAL(15,2) DEFAULT 500000.00,
    monthly_limit DECIMAL(15,2) DEFAULT 2000000.00,
    online_enabled BOOLEAN DEFAULT true,
    contactless_enabled BOOLEAN DEFAULT true,
    international_enabled BOOLEAN DEFAULT false,
    
    -- Physical card details
    delivery_address JSONB,
    delivery_status VARCHAR(20),
    delivery_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
    
    -- Transaction details
    transaction_type VARCHAR(30) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    description TEXT NOT NULL,
    reference VARCHAR(100) UNIQUE NOT NULL,
    
    -- Transaction parties
    sender_account VARCHAR(20),
    sender_name VARCHAR(200),
    sender_bank VARCHAR(100),
    recipient_account VARCHAR(20),
    recipient_name VARCHAR(200),
    recipient_bank VARCHAR(100),
    
    -- Status and processing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed')),
    channel VARCHAR(30) CHECK (channel IN ('web', 'mobile', 'ussd', 'pos', 'atm', 'api')),
    location JSONB,
    
    -- Fees and charges
    fee_amount DECIMAL(15,2) DEFAULT 0.00,
    vat_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount + fee_amount + vat_amount) STORED,
    
    -- Risk and fraud detection
    risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    fraud_flags JSONB,
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    
    -- External references
    external_reference VARCHAR(100),
    processor_reference VARCHAR(100),
    settlement_id VARCHAR(100),
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Loans and credit facilities
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    
    -- Loan details
    loan_type VARCHAR(30) NOT NULL CHECK (loan_type IN ('personal', 'business', 'overdraft', 'payday')),
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    tenor_months INTEGER NOT NULL,
    
    -- Calculated amounts
    monthly_payment DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    
    -- Status and approval
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disbursed', 'active', 'completed', 'defaulted', 'written_off')),
    credit_score INTEGER CHECK (credit_score BETWEEN 300 AND 850),
    approval_notes TEXT,
    approved_by UUID REFERENCES users(id),
    
    -- Repayment details
    next_payment_date DATE,
    payments_made INTEGER DEFAULT 0,
    late_payment_count INTEGER DEFAULT 0,
    
    -- Collateral and guarantors
    collateral JSONB,
    guarantors JSONB,
    
    -- Metadata
    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approval_date TIMESTAMP WITH TIME ZONE,
    disbursement_date TIMESTAMP WITH TIME ZONE,
    maturity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loan repayments
CREATE TABLE loan_repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    
    -- Payment details
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    amount_paid DECIMAL(15,2) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_amount DECIMAL(15,2) NOT NULL,
    penalty_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    payment_method VARCHAR(30),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investments and savings
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    
    -- Investment details
    investment_type VARCHAR(30) NOT NULL CHECK (investment_type IN ('mutual_fund', 'treasury_bills', 'fixed_deposit', 'stocks', 'bonds')),
    investment_name VARCHAR(200) NOT NULL,
    amount_invested DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    expected_return_rate DECIMAL(5,2),
    
    -- Status and maturity
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matured', 'liquidated', 'suspended')),
    maturity_date DATE,
    auto_rollover BOOLEAN DEFAULT false,
    
    -- Performance tracking
    total_returns DECIMAL(15,2) DEFAULT 0.00,
    dividends_earned DECIMAL(15,2) DEFAULT 0.00,
    last_valuation_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cryptocurrency holdings
CREATE TABLE crypto_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    
    -- Crypto details
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(100) NOT NULL,
    quantity DECIMAL(20,8) NOT NULL,
    average_buy_price DECIMAL(15,2) NOT NULL,
    current_price DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) GENERATED ALWAYS AS (quantity * current_price) STORED,
    
    -- Performance
    total_invested DECIMAL(15,2) NOT NULL,
    unrealized_pnl DECIMAL(15,2) GENERATED ALWAYS AS (current_value - total_invested) STORED,
    
    -- Metadata
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business accounts and corporate banking
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business details
    business_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(50) NOT NULL,
    rc_number VARCHAR(20) UNIQUE, -- CAC registration number
    tin VARCHAR(20) UNIQUE, -- Tax identification number
    industry VARCHAR(100),
    business_address JSONB,
    
    -- Registration and compliance
    cac_documents JSONB,
    tax_documents JSONB,
    business_license JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending',
    
    -- Banking preferences
    signatory_requirements INTEGER DEFAULT 1,
    authorized_signatories JSONB,
    transaction_approval_matrix JSONB,
    
    -- Metadata
    registration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('transaction', 'security', 'promotion', 'system', 'kyc', 'loan')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Delivery channels
    push_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    sms_sent BOOLEAN DEFAULT false,
    in_app_read BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Audit trail for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_bvn ON users(bvn);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);

CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_account_number ON bank_accounts(account_number);
CREATE INDEX idx_bank_accounts_status ON bank_accounts(status);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_reference ON transactions(reference);

CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_cards_account_id ON cards(account_id);
CREATE INDEX idx_cards_status ON cards(status);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_next_payment_date ON loans(next_payment_date);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(in_app_read);

-- Functions and triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Account number generation function
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS VARCHAR(10) AS $$
DECLARE
    new_account_number VARCHAR(10);
BEGIN
    LOOP
        new_account_number := '22' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_number = new_account_number);
    END LOOP;
    RETURN new_account_number;
END;
$$ LANGUAGE plpgsql;

-- Card number generation function (simplified for demo)
CREATE OR REPLACE FUNCTION generate_card_number(card_type VARCHAR)
RETURNS VARCHAR(19) AS $$
DECLARE
    new_card_number VARCHAR(19);
    prefix VARCHAR(6);
BEGIN
    -- Different prefixes for different card types
    prefix := CASE card_type
        WHEN 'verve' THEN '506099'
        WHEN 'mastercard' THEN '539983'
        WHEN 'visa' THEN '426382'
        ELSE '506099'
    END;
    
    LOOP
        new_card_number := prefix || LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM cards WHERE card_number = new_card_number);
    END LOOP;
    RETURN new_card_number;
END;
$$ LANGUAGE plpgsql;
