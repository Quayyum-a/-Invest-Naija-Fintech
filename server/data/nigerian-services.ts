/**
 * Nigerian Financial Services Data
 * Comprehensive data for telecom, bills, and transfer services
 */

export interface NigerianNetwork {
  id: string;
  name: string;
  code: string;
  dataPlans: DataPlan[];
  airtimeMinMax: { min: number; max: number };
  logo?: string;
  color: string;
}

export interface DataPlan {
  id: string;
  name: string;
  size: string;
  validity: string;
  price: number;
  bonus?: string;
}

export interface BillProvider {
  id: string;
  name: string;
  category: string;
  logo?: string;
  fields: BillField[];
  minAmount?: number;
  maxAmount?: number;
}

export interface BillField {
  name: string;
  label: string;
  type: "text" | "number" | "select";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface TransferBank {
  id: string;
  name: string;
  code: string;
  logo?: string;
  transferFee: number;
  processingTime: string; // in minutes
  maxDailyLimit: number;
  isInstant: boolean;
}

// Nigerian Mobile Networks
export const nigerianNetworks: NigerianNetwork[] = [
  {
    id: "mtn",
    name: "MTN Nigeria",
    code: "MTN",
    color: "#FFD700",
    airtimeMinMax: { min: 50, max: 50000 },
    dataPlans: [
      {
        id: "mtn_1gb_30",
        name: "1GB - 30 Days",
        size: "1GB",
        validity: "30 days",
        price: 350,
      },
      {
        id: "mtn_2gb_30",
        name: "2GB - 30 Days",
        size: "2GB",
        validity: "30 days",
        price: 700,
      },
      {
        id: "mtn_3gb_30",
        name: "3GB - 30 Days",
        size: "3GB",
        validity: "30 days",
        price: 1050,
      },
      {
        id: "mtn_5gb_30",
        name: "5GB - 30 Days",
        size: "5GB",
        validity: "30 days",
        price: 1750,
      },
      {
        id: "mtn_10gb_30",
        name: "10GB - 30 Days",
        size: "10GB",
        validity: "30 days",
        price: 3500,
      },
      {
        id: "mtn_15gb_30",
        name: "15GB - 30 Days",
        size: "15GB",
        validity: "30 days",
        price: 5250,
      },
      {
        id: "mtn_20gb_30",
        name: "20GB - 30 Days",
        size: "20GB",
        validity: "30 days",
        price: 7000,
      },
      {
        id: "mtn_100mb_7",
        name: "100MB - 7 Days",
        size: "100MB",
        validity: "7 days",
        price: 100,
      },
      {
        id: "mtn_500mb_14",
        name: "500MB - 14 Days",
        size: "500MB",
        validity: "14 days",
        price: 250,
      },
      {
        id: "mtn_1gb_1",
        name: "1GB - 1 Day",
        size: "1GB",
        validity: "1 day",
        price: 200,
      },
    ],
  },
  {
    id: "glo",
    name: "Glo Nigeria",
    code: "GLO",
    color: "#00A651",
    airtimeMinMax: { min: 50, max: 50000 },
    dataPlans: [
      {
        id: "glo_1gb_30",
        name: "1GB - 30 Days",
        size: "1GB",
        validity: "30 days",
        price: 350,
      },
      {
        id: "glo_2gb_30",
        name: "2GB - 30 Days",
        size: "2GB",
        validity: "30 days",
        price: 700,
      },
      {
        id: "glo_3gb_30",
        name: "3GB - 30 Days",
        size: "3GB",
        validity: "30 days",
        price: 1050,
      },
      {
        id: "glo_5gb_30",
        name: "5GB - 30 Days",
        size: "5GB",
        validity: "30 days",
        price: 1750,
      },
      {
        id: "glo_10gb_30",
        name: "10GB - 30 Days",
        size: "10GB",
        validity: "30 days",
        price: 3500,
      },
      {
        id: "glo_200mb_14",
        name: "200MB - 14 Days",
        size: "200MB",
        validity: "14 days",
        price: 200,
      },
      {
        id: "glo_500mb_30",
        name: "500MB - 30 Days",
        size: "500MB",
        validity: "30 days",
        price: 300,
      },
      {
        id: "glo_1gb_5",
        name: "1GB - 5 Days",
        size: "1GB",
        validity: "5 days",
        price: 250,
      },
    ],
  },
  {
    id: "airtel",
    name: "Airtel Nigeria",
    code: "AIRTEL",
    color: "#E60012",
    airtimeMinMax: { min: 50, max: 50000 },
    dataPlans: [
      {
        id: "airtel_1gb_30",
        name: "1GB - 30 Days",
        size: "1GB",
        validity: "30 days",
        price: 350,
      },
      {
        id: "airtel_2gb_30",
        name: "2GB - 30 Days",
        size: "2GB",
        validity: "30 days",
        price: 700,
      },
      {
        id: "airtel_3gb_30",
        name: "3GB - 30 Days",
        size: "3GB",
        validity: "30 days",
        price: 1050,
      },
      {
        id: "airtel_5gb_30",
        name: "5GB - 30 Days",
        size: "5GB",
        validity: "30 days",
        price: 1750,
      },
      {
        id: "airtel_10gb_30",
        name: "10GB - 30 Days",
        size: "10GB",
        validity: "30 days",
        price: 3500,
      },
      {
        id: "airtel_100mb_3",
        name: "100MB - 3 Days",
        size: "100MB",
        validity: "3 days",
        price: 100,
      },
      {
        id: "airtel_300mb_7",
        name: "300MB - 7 Days",
        size: "300MB",
        validity: "7 days",
        price: 200,
      },
      {
        id: "airtel_500mb_30",
        name: "500MB - 30 Days",
        size: "500MB",
        validity: "30 days",
        price: 300,
      },
    ],
  },
  {
    id: "9mobile",
    name: "9mobile Nigeria",
    code: "9MOBILE",
    color: "#00AA4B",
    airtimeMinMax: { min: 50, max: 50000 },
    dataPlans: [
      {
        id: "9mobile_1gb_30",
        name: "1GB - 30 Days",
        size: "1GB",
        validity: "30 days",
        price: 350,
      },
      {
        id: "9mobile_2gb_30",
        name: "2GB - 30 Days",
        size: "2GB",
        validity: "30 days",
        price: 700,
      },
      {
        id: "9mobile_3gb_30",
        name: "3GB - 30 Days",
        size: "3GB",
        validity: "30 days",
        price: 1050,
      },
      {
        id: "9mobile_5gb_30",
        name: "5GB - 30 Days",
        size: "5GB",
        validity: "30 days",
        price: 1750,
      },
      {
        id: "9mobile_500mb_30",
        name: "500MB - 30 Days",
        size: "500MB",
        validity: "30 days",
        price: 300,
      },
      {
        id: "9mobile_1gb_7",
        name: "1GB - 7 Days",
        size: "1GB",
        validity: "7 days",
        price: 250,
      },
      {
        id: "9mobile_2gb_7",
        name: "2GB - 7 Days",
        size: "2GB",
        validity: "7 days",
        price: 500,
      },
    ],
  },
];

// Bill Payment Providers
export const billProviders: BillProvider[] = [
  // Electricity Bills
  {
    id: "aedc",
    name: "Abuja Electricity Distribution Company (AEDC)",
    category: "electricity",
    minAmount: 500,
    maxAmount: 500000,
    fields: [
      {
        name: "meterNumber",
        label: "Meter Number",
        type: "text",
        required: true,
        placeholder: "Enter meter number",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "Enter amount",
      },
      {
        name: "customerName",
        label: "Customer Name",
        type: "text",
        required: false,
        placeholder: "Customer name (optional)",
      },
    ],
  },
  {
    id: "ekedc",
    name: "Eko Electricity Distribution Company (EKEDC)",
    category: "electricity",
    minAmount: 500,
    maxAmount: 500000,
    fields: [
      {
        name: "meterNumber",
        label: "Meter Number",
        type: "text",
        required: true,
        placeholder: "Enter meter number",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "Enter amount",
      },
    ],
  },
  {
    id: "ikedc",
    name: "Ikeja Electric Payment (IKEDC)",
    category: "electricity",
    minAmount: 500,
    maxAmount: 500000,
    fields: [
      {
        name: "meterNumber",
        label: "Meter Number",
        type: "text",
        required: true,
        placeholder: "Enter meter number",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "Enter amount",
      },
    ],
  },
  {
    id: "kedco",
    name: "Kano Electricity Distribution Company (KEDCO)",
    category: "electricity",
    minAmount: 500,
    maxAmount: 500000,
    fields: [
      {
        name: "meterNumber",
        label: "Meter Number",
        type: "text",
        required: true,
        placeholder: "Enter meter number",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "Enter amount",
      },
    ],
  },

  // Cable TV
  {
    id: "dstv",
    name: "DStv",
    category: "tv",
    fields: [
      {
        name: "smartCardNumber",
        label: "Smart Card Number",
        type: "text",
        required: true,
        placeholder: "Enter smart card number",
      },
      {
        name: "package",
        label: "Package",
        type: "select",
        required: true,
        options: [
          "DStv Padi - ₦2,500",
          "DStv Yanga - ₦2,950",
          "DStv Confam - ₦5,300",
          "DStv Compact - ₦9,000",
          "DStv Compact Plus - ₦14,250",
          "DStv Premium - ₦21,000",
        ],
      },
    ],
  },
  {
    id: "gotv",
    name: "GOtv",
    category: "tv",
    fields: [
      {
        name: "smartCardNumber",
        label: "Smart Card Number",
        type: "text",
        required: true,
        placeholder: "Enter smart card number",
      },
      {
        name: "package",
        label: "Package",
        type: "select",
        required: true,
        options: [
          "GOtv Smallie - ₦900",
          "GOtv Jinja - ₦1,900",
          "GOtv Jolli - ₦2,800",
          "GOtv Max - ₦4,150",
          "GOtv Supa - ₦5,500",
        ],
      },
    ],
  },
  {
    id: "startimes",
    name: "Startimes",
    category: "tv",
    fields: [
      {
        name: "smartCardNumber",
        label: "Smart Card Number",
        type: "text",
        required: true,
        placeholder: "Enter smart card number",
      },
      {
        name: "package",
        label: "Package",
        type: "select",
        required: true,
        options: [
          "Nova - ₦900",
          "Basic - ₦1,700",
          "Smart - ₦2,600",
          "Classic - ₦2,750",
          "Super - ₦4,900",
        ],
      },
    ],
  },

  // Internet
  {
    id: "smile",
    name: "Smile Communications",
    category: "internet",
    minAmount: 500,
    maxAmount: 50000,
    fields: [
      {
        name: "accountId",
        label: "Account ID",
        type: "text",
        required: true,
        placeholder: "Enter account ID",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "Enter amount",
      },
    ],
  },
  {
    id: "spectranet",
    name: "Spectranet",
    category: "internet",
    minAmount: 1000,
    maxAmount: 100000,
    fields: [
      {
        name: "accountId",
        label: "Account ID",
        type: "text",
        required: true,
        placeholder: "Enter account ID",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "Enter amount",
      },
    ],
  },

  // Education
  {
    id: "waec",
    name: "WAEC Result Checker",
    category: "education",
    fields: [
      {
        name: "examNumber",
        label: "Examination Number",
        type: "text",
        required: true,
        placeholder: "Enter exam number",
      },
      {
        name: "examYear",
        label: "Examination Year",
        type: "text",
        required: true,
        placeholder: "Enter exam year",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "₦2,500",
      },
    ],
  },
  {
    id: "jamb",
    name: "JAMB ePIN",
    category: "education",
    fields: [
      {
        name: "profileCode",
        label: "Profile Code",
        type: "text",
        required: true,
        placeholder: "Enter profile code",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        placeholder: "₦3,500",
      },
    ],
  },
];

// Transfer Banks (All Nigerian Banks)
export const transferBanks: TransferBank[] = [
  {
    id: "access",
    name: "Access Bank",
    code: "044",
    transferFee: 10,
    processingTime: "2",
    maxDailyLimit: 5000000,
    isInstant: true,
  },
  {
    id: "gtbank",
    name: "Guaranty Trust Bank",
    code: "058",
    transferFee: 10,
    processingTime: "1",
    maxDailyLimit: 5000000,
    isInstant: true,
  },
  {
    id: "zenith",
    name: "Zenith Bank",
    code: "057",
    transferFee: 10,
    processingTime: "2",
    maxDailyLimit: 5000000,
    isInstant: true,
  },
  {
    id: "uba",
    name: "United Bank for Africa",
    code: "033",
    transferFee: 10,
    processingTime: "3",
    maxDailyLimit: 3000000,
    isInstant: true,
  },
  {
    id: "firstbank",
    name: "First Bank of Nigeria",
    code: "011",
    transferFee: 10,
    processingTime: "3",
    maxDailyLimit: 3000000,
    isInstant: true,
  },
  {
    id: "fcmb",
    name: "First City Monument Bank",
    code: "214",
    transferFee: 10,
    processingTime: "2",
    maxDailyLimit: 2000000,
    isInstant: true,
  },
  {
    id: "fidelity",
    name: "Fidelity Bank",
    code: "070",
    transferFee: 10,
    processingTime: "3",
    maxDailyLimit: 2000000,
    isInstant: true,
  },
  {
    id: "union",
    name: "Union Bank of Nigeria",
    code: "032",
    transferFee: 10,
    processingTime: "5",
    maxDailyLimit: 2000000,
    isInstant: true,
  },
  {
    id: "sterling",
    name: "Sterling Bank",
    code: "232",
    transferFee: 10,
    processingTime: "3",
    maxDailyLimit: 2000000,
    isInstant: true,
  },
  {
    id: "stanbic",
    name: "Stanbic IBTC Bank",
    code: "039",
    transferFee: 10,
    processingTime: "2",
    maxDailyLimit: 5000000,
    isInstant: true,
  },
  {
    id: "polaris",
    name: "Polaris Bank",
    code: "076",
    transferFee: 10,
    processingTime: "3",
    maxDailyLimit: 1000000,
    isInstant: true,
  },
  {
    id: "wema",
    name: "Wema Bank",
    code: "035",
    transferFee: 10,
    processingTime: "3",
    maxDailyLimit: 1000000,
    isInstant: true,
  },
  {
    id: "keystone",
    name: "Keystone Bank",
    code: "082",
    transferFee: 10,
    processingTime: "5",
    maxDailyLimit: 1000000,
    isInstant: false,
  },
  {
    id: "unity",
    name: "Unity Bank",
    code: "215",
    transferFee: 10,
    processingTime: "5",
    maxDailyLimit: 500000,
    isInstant: false,
  },
  {
    id: "heritage",
    name: "Heritage Bank",
    code: "030",
    transferFee: 15,
    processingTime: "5",
    maxDailyLimit: 1000000,
    isInstant: false,
  },
  {
    id: "ecobank",
    name: "Ecobank Nigeria",
    code: "050",
    transferFee: 15,
    processingTime: "3",
    maxDailyLimit: 2000000,
    isInstant: true,
  },
  {
    id: "citibank",
    name: "Citibank Nigeria",
    code: "023",
    transferFee: 25,
    processingTime: "10",
    maxDailyLimit: 10000000,
    isInstant: false,
  },
  {
    id: "standard",
    name: "Standard Chartered Bank",
    code: "068",
    transferFee: 25,
    processingTime: "10",
    maxDailyLimit: 10000000,
    isInstant: false,
  },
  {
    id: "providus",
    name: "Providus Bank",
    code: "101",
    transferFee: 10,
    processingTime: "2",
    maxDailyLimit: 1000000,
    isInstant: true,
  },
  {
    id: "kuda",
    name: "Kuda Bank",
    code: "090267",
    transferFee: 0,
    processingTime: "1",
    maxDailyLimit: 2000000,
    isInstant: true,
  },
  {
    id: "opay",
    name: "OPay Digital Services",
    code: "999992",
    transferFee: 0,
    processingTime: "1",
    maxDailyLimit: 500000,
    isInstant: true,
  },
  {
    id: "palmpay",
    name: "PalmPay",
    code: "999991",
    transferFee: 0,
    processingTime: "1",
    maxDailyLimit: 500000,
    isInstant: true,
  },
  {
    id: "moniepoint",
    name: "Moniepoint MFB",
    code: "090405",
    transferFee: 10,
    processingTime: "2",
    maxDailyLimit: 1000000,
    isInstant: true,
  },
  {
    id: "rubies",
    name: "Rubies MFB",
    code: "090175",
    transferFee: 10,
    processingTime: "3",
    maxDailyLimit: 500000,
    isInstant: true,
  },
];

// Service Categories
export const serviceCategories = [
  { id: "telecom", name: "Telecom", icon: "smartphone" },
  { id: "electricity", name: "Electricity", icon: "zap" },
  { id: "tv", name: "Cable TV", icon: "tv" },
  { id: "internet", name: "Internet", icon: "wifi" },
  { id: "education", name: "Education", icon: "book" },
  { id: "government", name: "Government", icon: "building" },
  { id: "insurance", name: "Insurance", icon: "shield" },
  { id: "transportation", name: "Transportation", icon: "car" },
];

// Quick service fees (standard across Nigeria)
export const serviceFees = {
  airtime: { fee: 0, feeType: "fixed" as const }, // No fee for airtime
  data: { fee: 0, feeType: "fixed" as const }, // No fee for data
  transfer: { fee: 10, feeType: "fixed" as const }, // ₦10 for bank transfers
  billPayment: { fee: 25, feeType: "fixed" as const }, // ₦25 for bill payments
  electricity: { fee: 50, feeType: "fixed" as const }, // ₦50 for electricity bills
  tv: { fee: 25, feeType: "fixed" as const }, // ₦25 for cable TV
  education: { fee: 100, feeType: "fixed" as const }, // ₦100 for education services
};
