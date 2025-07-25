import DatabaseManager from "../database/connection";
import { kycVerificationService } from "./kycVerification";
import { fraudDetectionService } from "./fraudDetection";

interface LoanApplication {
  userId: string;
  accountId: string;
  loanType: "personal" | "business" | "overdraft" | "payday";
  requestedAmount: number;
  purpose: string;
  employmentInfo?: any;
  businessInfo?: any;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingDebts: number;
  collateral?: any;
  guarantors?: any[];
}

interface CreditAssessment {
  creditScore: number;
  creditRating: string;
  maxLoanAmount: number;
  recommendedInterestRate: number;
  riskCategory: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  approvalProbability: number;
  conditions: string[];
}

class LoanService {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  // Apply for a loan
  async applyForLoan(application: LoanApplication): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // 1. Validate user eligibility
      const eligibilityCheck = await this.checkEligibility(application.userId);
      if (!eligibilityCheck.eligible) {
        return {
          success: false,
          error: eligibilityCheck.reason,
        };
      }

      // 2. Perform credit assessment
      const creditAssessment = await this.assessCreditworthiness(application);

      // 3. Calculate loan terms
      const loanTerms = await this.calculateLoanTerms(
        application,
        creditAssessment,
      );

      // 4. Store loan application
      const loanResult = await this.db.query(
        `INSERT INTO loans (
          user_id, account_id, loan_type, principal_amount, interest_rate,
          tenor_months, monthly_payment, total_amount, outstanding_balance,
          status, credit_score, application_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING id`,
        [
          application.userId,
          application.accountId,
          application.loanType,
          application.requestedAmount,
          loanTerms.interestRate,
          loanTerms.tenorMonths,
          loanTerms.monthlyPayment,
          loanTerms.totalAmount,
          application.requestedAmount,
          "pending",
          creditAssessment.creditScore,
        ],
      );

      const loanId = loanResult.rows[0].id;

      // 5. Store application details
      await this.db.query(
        `INSERT INTO loan_applications (
          loan_id, purpose, monthly_income, monthly_expenses,
          existing_debts, employment_info, business_info,
          collateral, guarantors, credit_assessment
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          loanId,
          application.purpose,
          application.monthlyIncome,
          application.monthlyExpenses,
          application.existingDebts,
          JSON.stringify(application.employmentInfo),
          JSON.stringify(application.businessInfo),
          JSON.stringify(application.collateral),
          JSON.stringify(application.guarantors),
          JSON.stringify(creditAssessment),
        ],
      );

      // 6. Auto-approve low-risk applications
      if (
        creditAssessment.approvalProbability > 80 &&
        creditAssessment.riskCategory === "LOW"
      ) {
        await this.approveLoan(loanId, "SYSTEM_AUTO_APPROVAL");
      }

      return {
        success: true,
        data: {
          loanId,
          applicationStatus: "pending",
          creditAssessment,
          loanTerms,
          estimatedProcessingTime: "24-48 hours",
        },
      };
    } catch (error) {
      console.error("Loan application error:", error);
      return {
        success: false,
        error: "Failed to process loan application",
      };
    }
  }

  // Assess creditworthiness
  async assessCreditworthiness(
    application: LoanApplication,
  ): Promise<CreditAssessment> {
    try {
      let creditScore = 600; // Base score
      const conditions: string[] = [];

      // 1. KYC and account verification
      const user = await this.db.query(
        "SELECT kyc_status, created_at, status FROM users WHERE id = $1",
        [application.userId],
      );

      if (user.rows[0]?.kyc_status === "verified") {
        creditScore += 50;
      } else {
        creditScore -= 100;
        conditions.push("Complete KYC verification required");
      }

      // 2. Account age and activity
      const accountAge =
        (Date.now() - new Date(user.rows[0]?.created_at).getTime()) /
        (1000 * 60 * 60 * 24);

      if (accountAge > 365) {
        creditScore += 40;
      } else if (accountAge > 180) {
        creditScore += 20;
      } else if (accountAge > 90) {
        creditScore += 10;
      } else {
        creditScore -= 50;
        conditions.push("Account too new (minimum 90 days required)");
      }

      // 3. Transaction history analysis
      const transactionHistory = await this.analyzeTransactionHistory(
        application.userId,
      );
      creditScore += transactionHistory.score;
      conditions.push(...transactionHistory.conditions);

      // 4. Income and debt-to-income ratio
      const dtiRatio =
        application.existingDebts / application.monthlyIncome || 0;

      if (dtiRatio < 0.3) {
        creditScore += 60;
      } else if (dtiRatio < 0.4) {
        creditScore += 30;
      } else if (dtiRatio < 0.5) {
        creditScore += 10;
      } else {
        creditScore -= 80;
        conditions.push("High debt-to-income ratio");
      }

      // 5. Loan amount vs income ratio
      const loanToIncomeRatio =
        application.requestedAmount / (application.monthlyIncome * 12) || 0;

      if (loanToIncomeRatio > 3) {
        creditScore -= 100;
        conditions.push("Loan amount too high relative to income");
      } else if (loanToIncomeRatio > 2) {
        creditScore -= 50;
      } else if (loanToIncomeRatio < 1) {
        creditScore += 30;
      }

      // 6. Employment/business stability
      if (application.employmentInfo?.employmentType === "permanent") {
        creditScore += 40;
      } else if (application.employmentInfo?.employmentType === "contract") {
        creditScore += 20;
      } else if (application.businessInfo?.businessAge > 24) {
        creditScore += 30;
      }

      // 7. Collateral and guarantors
      if (application.collateral && application.collateral.value > 0) {
        creditScore += 50;
      }

      if (application.guarantors && application.guarantors.length > 0) {
        creditScore += 30;
      }

      // 8. Previous loan history (if any)
      const loanHistory = await this.analyzeLoanHistory(application.userId);
      creditScore += loanHistory.score;
      conditions.push(...loanHistory.conditions);

      // Ensure score is within valid range
      creditScore = Math.max(300, Math.min(850, creditScore));

      const creditRating = this.getCreditRating(creditScore);
      const riskCategory = this.getRiskCategory(creditScore);
      const maxLoanAmount = this.calculateMaxLoanAmount(
        application,
        creditScore,
      );
      const recommendedInterestRate = this.getInterestRate(
        application.loanType,
        creditScore,
      );
      const approvalProbability = this.calculateApprovalProbability(
        creditScore,
        conditions,
      );

      return {
        creditScore,
        creditRating,
        maxLoanAmount,
        recommendedInterestRate,
        riskCategory,
        approvalProbability,
        conditions,
      };
    } catch (error) {
      console.error("Credit assessment error:", error);
      return {
        creditScore: 400,
        creditRating: "Poor",
        maxLoanAmount: 0,
        recommendedInterestRate: 30,
        riskCategory: "VERY_HIGH",
        approvalProbability: 10,
        conditions: ["Unable to complete credit assessment"],
      };
    }
  }

  // Approve loan
  async approveLoan(
    loanId: string,
    approvedBy: string,
    notes?: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await this.db.transaction(async (client) => {
        // Update loan status
        const loanResult = await client.query(
          `UPDATE loans 
           SET status = 'approved', approved_by = $1, approval_date = NOW(),
               approval_notes = $2
           WHERE id = $3 AND status = 'pending'
           RETURNING *`,
          [approvedBy, notes, loanId],
        );

        if (loanResult.rows.length === 0) {
          throw new Error("Loan not found or already processed");
        }

        const loan = loanResult.rows[0];

        // Set next payment date (1 month from approval)
        const nextPaymentDate = new Date();
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

        await client.query(
          "UPDATE loans SET next_payment_date = $1 WHERE id = $2",
          [nextPaymentDate.toISOString().split("T")[0], loanId],
        );

        // Create approval notification
        await client.query(
          `INSERT INTO notifications (
            user_id, title, message, type, priority
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            loan.user_id,
            "Loan Approved!",
            `Your ${loan.loan_type} loan of ₦${loan.principal_amount.toLocaleString()} has been approved. Funds will be disbursed shortly.`,
            "loan",
            "high",
          ],
        );

        return {
          success: true,
          data: {
            loanId,
            status: "approved",
            disbursementTime: "Within 24 hours",
            firstPaymentDate: nextPaymentDate.toISOString().split("T")[0],
          },
        };
      });
    } catch (error) {
      console.error("Loan approval error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to approve loan",
      };
    }
  }

  // Disburse loan funds
  async disburseLoan(loanId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      return await this.db.transaction(async (client) => {
        // Get loan details
        const loanResult = await client.query(
          "SELECT * FROM loans WHERE id = $1 AND status = 'approved'",
          [loanId],
        );

        if (loanResult.rows.length === 0) {
          throw new Error("Loan not found or not approved");
        }

        const loan = loanResult.rows[0];

        // Credit user's account
        await client.query(
          "UPDATE bank_accounts SET balance = balance + $1 WHERE id = $2",
          [loan.principal_amount, loan.account_id],
        );

        // Update loan status
        await client.query(
          `UPDATE loans 
           SET status = 'disbursed', disbursement_date = NOW()
           WHERE id = $1`,
          [loanId],
        );

        // Create transaction record
        const transactionResult = await client.query(
          `INSERT INTO transactions (
            user_id, account_id, transaction_type, amount, description,
            reference, status, channel, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id`,
          [
            loan.user_id,
            loan.account_id,
            "loan_disbursement",
            loan.principal_amount,
            `${loan.loan_type} loan disbursement`,
            `loan_${loanId}_disbursement`,
            "completed",
            "system",
            JSON.stringify({
              loanId,
              loanType: loan.loan_type,
              tenorMonths: loan.tenor_months,
              interestRate: loan.interest_rate,
            }),
          ],
        );

        // Create disbursement notification
        await client.query(
          `INSERT INTO notifications (
            user_id, title, message, type, priority
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            loan.user_id,
            "Loan Disbursed",
            `₦${loan.principal_amount.toLocaleString()} has been credited to your account. First payment is due on ${loan.next_payment_date}.`,
            "loan",
            "normal",
          ],
        );

        return {
          success: true,
          data: {
            loanId,
            amount: loan.principal_amount,
            transactionId: transactionResult.rows[0].id,
            status: "disbursed",
            firstPaymentDate: loan.next_payment_date,
          },
        };
      });
    } catch (error) {
      console.error("Loan disbursement error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to disburse loan",
      };
    }
  }

  // Process loan repayment
  async processRepayment(
    loanId: string,
    amount: number,
    paymentMethod: string = "account_debit",
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await this.db.transaction(async (client) => {
        // Get loan details
        const loanResult = await client.query(
          "SELECT * FROM loans WHERE id = $1 AND status IN ('disbursed', 'active')",
          [loanId],
        );

        if (loanResult.rows.length === 0) {
          throw new Error("Loan not found or not active");
        }

        const loan = loanResult.rows[0];

        // Check if payment amount is valid
        if (amount <= 0 || amount > loan.outstanding_balance) {
          throw new Error("Invalid payment amount");
        }

        // Check account balance for debit
        if (paymentMethod === "account_debit") {
          const accountResult = await client.query(
            "SELECT balance FROM bank_accounts WHERE id = $1",
            [loan.account_id],
          );

          if (accountResult.rows[0]?.balance < amount) {
            throw new Error("Insufficient account balance");
          }

          // Debit account
          await client.query(
            "UPDATE bank_accounts SET balance = balance - $1 WHERE id = $2",
            [amount, loan.account_id],
          );
        }

        // Calculate interest and principal portions
        const monthlyInterestRate = loan.interest_rate / 100 / 12;
        const interestAmount = loan.outstanding_balance * monthlyInterestRate;
        const principalAmount = Math.max(0, amount - interestAmount);

        // Update loan balance
        const newBalance = loan.outstanding_balance - principalAmount;
        const newStatus = newBalance <= 0 ? "completed" : "active";
        const paymentsCreated = loan.payments_made + 1;

        await client.query(
          `UPDATE loans 
           SET outstanding_balance = $1, status = $2, payments_made = $3,
               next_payment_date = CASE 
                 WHEN $1 <= 0 THEN NULL 
                 ELSE (next_payment_date + INTERVAL '1 month')::date 
               END
           WHERE id = $4`,
          [newBalance, newStatus, paymentsCreated, loanId],
        );

        // Record repayment
        const repaymentResult = await client.query(
          `INSERT INTO loan_repayments (
            loan_id, amount_paid, principal_amount, interest_amount,
            status, payment_method
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id`,
          [
            loanId,
            amount,
            principalAmount,
            interestAmount,
            "completed",
            paymentMethod,
          ],
        );

        // Create transaction record
        await client.query(
          `INSERT INTO transactions (
            user_id, account_id, transaction_type, amount, description,
            reference, status, channel, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            loan.user_id,
            loan.account_id,
            "loan_repayment",
            amount,
            `Loan repayment - ${loan.loan_type}`,
            `loan_${loanId}_payment_${paymentsCreated}`,
            "completed",
            paymentMethod === "account_debit" ? "web" : "external",
            JSON.stringify({
              loanId,
              repaymentId: repaymentResult.rows[0].id,
              principalAmount,
              interestAmount,
              remainingBalance: newBalance,
            }),
          ],
        );

        // Create notification
        const message =
          newBalance <= 0
            ? "Congratulations! Your loan has been fully paid off."
            : `Payment of ₦${amount.toLocaleString()} received. Remaining balance: ₦${newBalance.toLocaleString()}`;

        await client.query(
          `INSERT INTO notifications (
            user_id, title, message, type, priority
          ) VALUES ($1, $2, $3, $4, $5)`,
          [loan.user_id, "Payment Received", message, "loan", "normal"],
        );

        return {
          success: true,
          data: {
            loanId,
            paymentAmount: amount,
            principalAmount,
            interestAmount,
            remainingBalance: newBalance,
            loanStatus: newStatus,
            repaymentId: repaymentResult.rows[0].id,
          },
        };
      });
    } catch (error) {
      console.error("Loan repayment error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process repayment",
      };
    }
  }

  // Get user's loans
  async getUserLoans(userId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const result = await this.db.query(
        `SELECT l.*, ba.account_number, ba.account_name
         FROM loans l
         JOIN bank_accounts ba ON l.account_id = ba.id
         WHERE l.user_id = $1
         ORDER BY l.created_at DESC`,
        [userId],
      );

      const loans = result.rows.map((loan) => ({
        id: loan.id,
        accountNumber: loan.account_number,
        accountName: loan.account_name,
        loanType: loan.loan_type,
        principalAmount: parseFloat(loan.principal_amount),
        interestRate: parseFloat(loan.interest_rate),
        tenorMonths: loan.tenor_months,
        monthlyPayment: parseFloat(loan.monthly_payment),
        totalAmount: parseFloat(loan.total_amount),
        outstandingBalance: parseFloat(loan.outstanding_balance),
        status: loan.status,
        nextPaymentDate: loan.next_payment_date,
        paymentsMade: loan.payments_made,
        applicationDate: loan.application_date,
        approvalDate: loan.approval_date,
        disbursementDate: loan.disbursement_date,
        maturityDate: loan.maturity_date,
      }));

      return { success: true, data: loans };
    } catch (error) {
      console.error("Get user loans error:", error);
      return { success: false, error: "Failed to retrieve loans" };
    }
  }

  // Private helper methods

  private async checkEligibility(userId: string): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    try {
      // Check user status and KYC
      const user = await this.db.query(
        "SELECT kyc_status, status, created_at FROM users WHERE id = $1",
        [userId],
      );

      if (user.rows.length === 0) {
        return { eligible: false, reason: "User not found" };
      }

      const userData = user.rows[0];

      if (userData.status !== "active") {
        return { eligible: false, reason: "Account is not active" };
      }

      if (userData.kyc_status !== "verified") {
        return { eligible: false, reason: "KYC verification required" };
      }

      // Check account age (minimum 90 days)
      const accountAge =
        (Date.now() - new Date(userData.created_at).getTime()) /
        (1000 * 60 * 60 * 24);

      if (accountAge < 90) {
        return {
          eligible: false,
          reason: "Account must be at least 90 days old",
        };
      }

      // Check for existing active loans
      const activeLoans = await this.db.query(
        "SELECT COUNT(*) as count FROM loans WHERE user_id = $1 AND status IN ('disbursed', 'active')",
        [userId],
      );

      if (activeLoans.rows[0].count >= 3) {
        return {
          eligible: false,
          reason: "Maximum number of active loans reached",
        };
      }

      return { eligible: true };
    } catch (error) {
      console.error("Eligibility check error:", error);
      return { eligible: false, reason: "Unable to verify eligibility" };
    }
  }

  private async calculateLoanTerms(
    application: LoanApplication,
    assessment: CreditAssessment,
  ) {
    // Default tenor based on loan type
    const defaultTenors = {
      personal: 12,
      business: 24,
      overdraft: 6,
      payday: 1,
    };

    const tenorMonths = defaultTenors[application.loanType];
    const principal = Math.min(
      application.requestedAmount,
      assessment.maxLoanAmount,
    );
    const monthlyRate = assessment.recommendedInterestRate / 100 / 12;

    // Calculate monthly payment using loan formula
    const monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenorMonths)) /
      (Math.pow(1 + monthlyRate, tenorMonths) - 1);

    const totalAmount = monthlyPayment * tenorMonths;

    return {
      principalAmount: principal,
      interestRate: assessment.recommendedInterestRate,
      tenorMonths,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalInterest: Math.round((totalAmount - principal) * 100) / 100,
    };
  }

  private async analyzeTransactionHistory(userId: string): Promise<{
    score: number;
    conditions: string[];
  }> {
    let score = 0;
    const conditions: string[] = [];

    try {
      // Get transaction statistics
      const stats = await this.db.query(
        `SELECT 
           COUNT(*) as transaction_count,
           AVG(amount) as avg_amount,
           SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_inflow,
           SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_outflow
         FROM transactions 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '6 months'`,
        [userId],
      );

      const transactionData = stats.rows[0];

      // Transaction volume scoring
      if (transactionData.transaction_count > 100) {
        score += 40;
      } else if (transactionData.transaction_count > 50) {
        score += 20;
      } else if (transactionData.transaction_count < 10) {
        score -= 30;
        conditions.push("Low transaction activity");
      }

      // Cash flow scoring
      const inflowOutflowRatio =
        transactionData.total_inflow / (transactionData.total_outflow || 1);

      if (inflowOutflowRatio > 1.2) {
        score += 30;
      } else if (inflowOutflowRatio < 0.8) {
        score -= 40;
        conditions.push("Negative cash flow pattern");
      }

      return { score, conditions };
    } catch (error) {
      return {
        score: -20,
        conditions: ["Unable to analyze transaction history"],
      };
    }
  }

  private async analyzeLoanHistory(userId: string): Promise<{
    score: number;
    conditions: string[];
  }> {
    let score = 0;
    const conditions: string[] = [];

    try {
      const loanHistory = await this.db.query(
        `SELECT status, late_payment_count, payments_made, tenor_months
         FROM loans 
         WHERE user_id = $1 AND status IN ('completed', 'defaulted', 'written_off')`,
        [userId],
      );

      for (const loan of loanHistory.rows) {
        if (loan.status === "completed") {
          score += 50;
          if (loan.late_payment_count === 0) {
            score += 20; // Perfect payment history
          } else if (loan.late_payment_count <= 2) {
            score += 5; // Minor late payments
          }
        } else if (loan.status === "defaulted") {
          score -= 100;
          conditions.push("Previous loan default history");
        } else if (loan.status === "written_off") {
          score -= 150;
          conditions.push("Previous loan written off");
        }
      }

      return { score, conditions };
    } catch (error) {
      return { score: 0, conditions: [] };
    }
  }

  private getCreditRating(score: number): string {
    if (score >= 750) return "Excellent";
    if (score >= 700) return "Good";
    if (score >= 650) return "Fair";
    if (score >= 600) return "Poor";
    return "Very Poor";
  }

  private getRiskCategory(
    score: number,
  ): "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" {
    if (score >= 700) return "LOW";
    if (score >= 650) return "MEDIUM";
    if (score >= 550) return "HIGH";
    return "VERY_HIGH";
  }

  private calculateMaxLoanAmount(
    application: LoanApplication,
    creditScore: number,
  ): number {
    // Base calculation: 3x monthly income for good credit
    let maxAmount = application.monthlyIncome * 3;

    // Adjust based on credit score
    if (creditScore >= 750) {
      maxAmount *= 2;
    } else if (creditScore >= 700) {
      maxAmount *= 1.5;
    } else if (creditScore >= 650) {
      maxAmount *= 1.2;
    } else if (creditScore < 550) {
      maxAmount *= 0.5;
    }

    // Cap based on loan type
    const typeCaps = {
      personal: 5000000, // 5M NGN
      business: 50000000, // 50M NGN
      overdraft: 2000000, // 2M NGN
      payday: 500000, // 500K NGN
    };

    return Math.min(maxAmount, typeCaps[application.loanType]);
  }

  private getInterestRate(loanType: string, creditScore: number): number {
    // Base rates by loan type
    const baseRates = {
      personal: 24,
      business: 20,
      overdraft: 28,
      payday: 36,
    };

    let rate = baseRates[loanType as keyof typeof baseRates] || 25;

    // Adjust based on credit score
    if (creditScore >= 750) {
      rate -= 8;
    } else if (creditScore >= 700) {
      rate -= 5;
    } else if (creditScore >= 650) {
      rate -= 2;
    } else if (creditScore < 550) {
      rate += 10;
    }

    return Math.max(12, Math.min(42, rate)); // Cap between 12% and 42%
  }

  private calculateApprovalProbability(
    creditScore: number,
    conditions: string[],
  ): number {
    let probability = 50; // Base 50%

    // Credit score impact
    if (creditScore >= 750) {
      probability += 40;
    } else if (creditScore >= 700) {
      probability += 30;
    } else if (creditScore >= 650) {
      probability += 15;
    } else if (creditScore >= 600) {
      probability += 5;
    } else {
      probability -= 30;
    }

    // Negative conditions impact
    probability -= conditions.length * 10;

    return Math.max(5, Math.min(95, probability));
  }
}

export const loanService = new LoanService();
