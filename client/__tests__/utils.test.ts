import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("Utility Functions", () => {
  describe("cn (className utility)", () => {
    it("should merge class names correctly", () => {
      const result = cn("base-class", "additional-class");
      expect(result).toContain("base-class");
      expect(result).toContain("additional-class");
    });

    it("should handle conditional classes", () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn(
        "base-class",
        {
          "active-class": isActive,
          "disabled-class": isDisabled,
        },
        "final-class",
      );

      expect(result).toContain("base-class");
      expect(result).toContain("active-class");
      expect(result).not.toContain("disabled-class");
      expect(result).toContain("final-class");
    });

    it("should handle undefined and null values", () => {
      const result = cn("base-class", undefined, null, "valid-class");
      expect(result).toContain("base-class");
      expect(result).toContain("valid-class");
    });

    it("should resolve Tailwind conflicts", () => {
      const result = cn("px-2 px-4"); // px-4 should override px-2
      expect(result).toContain("px-4");
      expect(result).not.toContain("px-2");
    });
  });

  describe("Currency Formatting", () => {
    it("should format Nigerian Naira correctly", () => {
      const amount = 1234567.89;
      const formatted = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(amount);

      expect(formatted).toContain("1,234,567.89");
    });

    it("should format numbers with commas", () => {
      const amount = 1000000;
      const formatted = amount.toLocaleString();
      expect(formatted).toBe("1,000,000");
    });
  });

  describe("Phone Number Validation", () => {
    const validateNigerianPhone = (phone: string): boolean => {
      const nigerianPhoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
      return nigerianPhoneRegex.test(phone);
    };

    it("should validate Nigerian phone numbers", () => {
      const validNumbers = [
        "08012345678",
        "07012345678",
        "09012345678",
        "+2348012345678",
        "2348012345678",
      ];

      validNumbers.forEach((number) => {
        expect(validateNigerianPhone(number)).toBe(true);
      });
    });

    it("should reject invalid phone numbers", () => {
      const invalidNumbers = [
        "1234567890", // Wrong format
        "08012345", // Too short
        "080123456789", // Too long
        "06012345678", // Wrong prefix
        "abc1234567", // Contains letters
      ];

      invalidNumbers.forEach((number) => {
        expect(validateNigerianPhone(number)).toBe(false);
      });
    });
  });

  describe("Email Validation", () => {
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it("should validate email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user@domain.co.uk",
        "first.last@company.org",
        "user+tag@domain.com",
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user@domain",
        "user..double@domain.com",
        "user@domain..com",
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe("Amount Validation", () => {
    const validateAmount = (
      amount: number,
      min: number = 0,
      max: number = Infinity,
    ): boolean => {
      return amount >= min && amount <= max && !isNaN(amount);
    };

    it("should validate amounts within range", () => {
      expect(validateAmount(100, 50, 1000)).toBe(true);
      expect(validateAmount(500, 100, 1000)).toBe(true);
      expect(validateAmount(1000, 100, 1000)).toBe(true);
    });

    it("should reject amounts outside range", () => {
      expect(validateAmount(50, 100, 1000)).toBe(false);
      expect(validateAmount(1500, 100, 1000)).toBe(false);
      expect(validateAmount(-100, 0)).toBe(false);
    });

    it("should reject invalid numbers", () => {
      expect(validateAmount(NaN)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
      expect(validateAmount(-Infinity)).toBe(false);
    });
  });

  describe("Date Utilities", () => {
    const formatDate = (date: Date | string): string => {
      const d = new Date(date);
      return d.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatDateTime = (date: Date | string): string => {
      const d = new Date(date);
      return d.toLocaleString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    it("should format dates correctly", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const formatted = formatDate(date);
      expect(formatted).toContain("January");
      expect(formatted).toContain("15");
      expect(formatted).toContain("2024");
    });

    it("should format date-time correctly", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const formatted = formatDateTime(date);
      expect(formatted).toContain("Jan");
      expect(formatted).toContain("15");
      expect(formatted).toContain("2024");
    });
  });

  describe("Transaction Type Formatting", () => {
    const formatTransactionType = (type: string): string => {
      return type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    it("should format transaction types", () => {
      expect(formatTransactionType("bill_payment")).toBe("Bill Payment");
      expect(formatTransactionType("crypto_buy")).toBe("Crypto Buy");
      expect(formatTransactionType("social_payment")).toBe("Social Payment");
      expect(formatTransactionType("transfer")).toBe("Transfer");
    });
  });

  describe("Error Message Handling", () => {
    const getErrorMessage = (error: any): string => {
      if (typeof error === "string") return error;
      if (error?.message) return error.message;
      if (error?.error) return error.error;
      return "An unexpected error occurred";
    };

    it("should extract error messages correctly", () => {
      expect(getErrorMessage("Simple error")).toBe("Simple error");
      expect(getErrorMessage({ message: "Error object" })).toBe("Error object");
      expect(getErrorMessage({ error: "API error" })).toBe("API error");
      expect(getErrorMessage({})).toBe("An unexpected error occurred");
      expect(getErrorMessage(null)).toBe("An unexpected error occurred");
    });
  });

  describe("Network Type Formatting", () => {
    const formatNetworkName = (network: string): string => {
      const networkNames: Record<string, string> = {
        mtn: "MTN",
        glo: "Glo",
        airtel: "Airtel",
        "9mobile": "9mobile",
      };
      return networkNames[network.toLowerCase()] || network.toUpperCase();
    };

    it("should format network names correctly", () => {
      expect(formatNetworkName("mtn")).toBe("MTN");
      expect(formatNetworkName("glo")).toBe("Glo");
      expect(formatNetworkName("airtel")).toBe("Airtel");
      expect(formatNetworkName("9mobile")).toBe("9mobile");
      expect(formatNetworkName("unknown")).toBe("UNKNOWN");
    });
  });

  describe("Crypto Price Formatting", () => {
    const formatCryptoPrice = (
      price: number,
      currency: string = "USD",
    ): string => {
      const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: price < 1 ? 6 : 2,
        maximumFractionDigits: price < 1 ? 6 : 2,
      });
      return formatter.format(price);
    };

    it("should format crypto prices correctly", () => {
      expect(formatCryptoPrice(50000)).toContain("50,000.00");
      expect(formatCryptoPrice(0.000123)).toContain("0.000123");
      expect(formatCryptoPrice(1.5)).toContain("1.50");
    });
  });

  describe("Percentage Formatting", () => {
    const formatPercentage = (value: number, decimals: number = 2): string => {
      return `${value > 0 ? "+" : ""}${value.toFixed(decimals)}%`;
    };

    it("should format percentages correctly", () => {
      expect(formatPercentage(5.67)).toBe("+5.67%");
      expect(formatPercentage(-3.45)).toBe("-3.45%");
      expect(formatPercentage(0)).toBe("0.00%");
      expect(formatPercentage(15.123, 1)).toBe("+15.1%");
    });
  });

  describe("Text Truncation", () => {
    const truncateText = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + "...";
    };

    it("should truncate long text", () => {
      const longText = "This is a very long text that should be truncated";
      expect(truncateText(longText, 20)).toBe("This is a very lo...");
      expect(truncateText("Short", 20)).toBe("Short");
    });
  });
});
