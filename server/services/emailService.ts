import nodemailer from "nodemailer";

// Free Gmail SMTP service (no API key required, just app password)
class EmailService {
  private transporter: any;

  constructor() {
    // Configure Gmail SMTP (free tier)
    this.transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // App-specific password
      },
    });

    // Fallback: Console logging if no Gmail credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn(
        "Gmail credentials not found. Email will be logged to console.",
      );
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<boolean> {
    try {
      // If Gmail credentials are available, send real email
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        const info = await this.transporter.sendMail({
          from: `"InvestNaija" <${process.env.GMAIL_USER}>`,
          to,
          subject,
          text: text || this.htmlToText(html),
          html,
        });

        console.log("Email sent successfully:", info.messageId);
        return true;
      } else {
        // Fallback: Log email to console
        console.log("=== EMAIL (Development Mode) ===");
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${text || this.htmlToText(html)}`);
        console.log("================================");
        return true;
      }
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  }

  // Welcome email for new users
  async sendWelcomeEmail(
    userEmail: string,
    userName: string,
  ): Promise<boolean> {
    const subject = "Welcome to InvestNaija!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to InvestNaija!</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2 style="color: #059669;">Hello ${userName},</h2>
          <p>Thank you for joining InvestNaija, Nigeria's premier investment platform.</p>
          <p>You can now:</p>
          <ul>
            <li>Invest in money market funds and treasury bills</li>
            <li>Enable round-up savings on purchases</li>
            <li>Track your investment performance</li>
            <li>Pay bills and buy airtime</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || "http://localhost:8080"}/dashboard" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Start Investing
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Best regards,<br>
            The InvestNaija Team
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // Transaction notification email
  async sendTransactionNotification(
    userEmail: string,
    userName: string,
    transaction: {
      type: string;
      amount: number;
      status: string;
      description: string;
    },
  ): Promise<boolean> {
    const subject = `Transaction ${transaction.status}: ₦${transaction.amount.toLocaleString()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f3f4f6; padding: 20px; text-align: center;">
          <h1 style="color: #059669; margin: 0;">Transaction Notification</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>Your ${transaction.type} transaction has been <strong>${transaction.status}</strong>.</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%;">
              <tr>
                <td><strong>Type:</strong></td>
                <td>${transaction.type}</td>
              </tr>
              <tr>
                <td><strong>Amount:</strong></td>
                <td>₦${transaction.amount.toLocaleString()}</td>
              </tr>
              <tr>
                <td><strong>Status:</strong></td>
                <td style="color: ${transaction.status === "completed" ? "#059669" : "#dc2626"};">
                  ${transaction.status.toUpperCase()}
                </td>
              </tr>
              <tr>
                <td><strong>Description:</strong></td>
                <td>${transaction.description}</td>
              </tr>
            </table>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // OTP email for verification
  async sendOTPEmail(userEmail: string, otp: string): Promise<boolean> {
    const subject = "Your InvestNaija Verification Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f3f4f6; padding: 20px; text-align: center;">
          <h1 style="color: #059669; margin: 0;">Verification Code</h1>
        </div>
        <div style="padding: 20px; text-align: center;">
          <h2>Your verification code is:</h2>
          <div style="background: #059669; color: white; font-size: 32px; font-weight: bold; 
                      padding: 20px; border-radius: 8px; margin: 20px 0; letter-spacing: 8px;">
            ${otp}
          </div>
          <p>This code expires in 10 minutes.</p>
          <p style="color: #dc2626; font-size: 14px;">
            Do not share this code with anyone.
          </p>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // KYC status notification
  async sendKYCNotification(
    userEmail: string,
    userName: string,
    status: "approved" | "rejected" | "pending",
    reason?: string,
  ): Promise<boolean> {
    const subject = `KYC Verification ${status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Under Review"}`;
    const statusColor =
      status === "approved"
        ? "#059669"
        : status === "rejected"
          ? "#dc2626"
          : "#f59e0b";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${statusColor}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">KYC Verification Update</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Hello ${userName},</h2>
          <p>Your KYC verification status has been updated:</p>
          
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="color: ${statusColor}; margin: 0;">
              ${status.toUpperCase()}
            </h3>
          </div>

          ${
            status === "approved"
              ? `
            <p>Congratulations! Your identity has been verified. You now have access to all InvestNaija features including higher transaction limits.</p>
          `
              : status === "rejected"
                ? `
            <p>Unfortunately, we were unable to verify your identity at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>Please resubmit your documents or contact support for assistance.</p>
          `
                : `
            <p>Your KYC documents are currently under review. We'll notify you once the verification is complete.</p>
          `
          }

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || "http://localhost:8080"}/dashboard" 
               style="background: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // Helper method to convert HTML to plain text
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();
  }
}

export const emailService = new EmailService();
