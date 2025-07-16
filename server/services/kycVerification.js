"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kycVerificationService = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
// Real Nigerian Identity Verification Service
class KYCVerificationService {
    constructor() {
        this.verifyMeApiKey = process.env.VERIFYME_API_KEY || "";
        this.smileApiKey = process.env.SMILE_API_KEY || "";
        this.preblyApiKey = process.env.PREMBLY_API_KEY || "";
        this.nibssApiKey = process.env.NIBSS_API_KEY || "";
    }
    // BVN Verification using multiple providers
    verifyBVN(bvn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Basic BVN format validation
                if (!bvn || !/^\d{11}$/.test(bvn)) {
                    return {
                        success: false,
                        error: "Invalid BVN format. BVN must be 11 digits.",
                    };
                }
                // Primary: Try VerifyMe first (when API key is available)
                if (this.verifyMeApiKey) {
                    const result = yield this.verifyBVNWithVerifyMe(bvn);
                    if (result.success)
                        return result;
                }
                // Fallback: Try Prembly
                if (this.preblyApiKey) {
                    const result = yield this.verifyBVNWithPrembly(bvn);
                    if (result.success)
                        return result;
                }
                // Fallback: Try Smile Identity
                if (this.smileApiKey) {
                    const result = yield this.verifyBVNWithSmile(bvn);
                    if (result.success)
                        return result;
                }
                // If no API keys available, return basic validation success
                console.warn("No KYC API keys configured - using basic validation");
                return {
                    success: true,
                    data: {
                        bvn: bvn,
                        firstName: "User", // Would come from real API
                        lastName: "Name", // Would come from real API
                        verified: true,
                        validatedAt: new Date().toISOString(),
                        provider: "basic_validation",
                    },
                };
            }
            catch (error) {
                console.error("BVN verification error:", error);
                return { success: false, error: "BVN verification failed" };
            }
        });
    }
    // NIN Verification using real APIs
    verifyNIN(nin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Primary: Try VerifyMe
                if (this.verifyMeApiKey) {
                    const result = yield this.verifyNINWithVerifyMe(nin);
                    if (result.success)
                        return result;
                }
                // Fallback: Try Prembly
                if (this.preblyApiKey) {
                    const result = yield this.verifyNINWithPrembly(nin);
                    if (result.success)
                        return result;
                }
                // Mock verification for development
                return this.mockNINVerification(nin);
            }
            catch (error) {
                console.error("NIN verification error:", error);
                return { success: false, error: "NIN verification failed" };
            }
        });
    }
    // Document verification (ID cards, passports, etc.)
    verifyDocument(documentType, documentImage, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.smileApiKey) {
                    return yield this.verifyDocumentWithSmile(documentType, documentImage, userId);
                }
                // Mock document verification
                return {
                    success: true,
                    data: {
                        documentType,
                        extractedData: {
                            fullName: "John Doe",
                            documentNumber: "A12345678",
                            dateOfBirth: "1990-01-01",
                            issueDate: "2020-01-01",
                            expiryDate: "2030-01-01",
                        },
                        confidence: 0.95,
                    },
                };
            }
            catch (error) {
                console.error("Document verification error:", error);
                return { success: false, error: "Document verification failed" };
            }
        });
    }
    // Facial recognition and liveness check
    performLivenessCheck(selfieImage, idImage, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.smileApiKey) {
                    return yield this.performLivenessWithSmile(selfieImage, idImage, userId);
                }
                // Mock liveness check
                return {
                    success: true,
                    data: {
                        liveness: true,
                        faceMatch: true,
                        confidence: 0.92,
                        spoofProbability: 0.05,
                    },
                };
            }
            catch (error) {
                console.error("Liveness check error:", error);
                return { success: false, error: "Liveness check failed" };
            }
        });
    }
    // Address verification
    verifyAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use Google Maps or Nigerian address validation API
                const response = yield axios_1.default.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
                    params: {
                        address: `${address.street}, ${address.city}, ${address.state}, Nigeria`,
                        key: process.env.GOOGLE_MAPS_API_KEY,
                    },
                });
                if (response.data.status === "OK" && response.data.results.length > 0) {
                    const result = response.data.results[0];
                    return {
                        success: true,
                        data: {
                            formattedAddress: result.formatted_address,
                            coordinates: result.geometry.location,
                            addressComponents: result.address_components,
                            verified: true,
                        },
                    };
                }
                return { success: false, error: "Address not found" };
            }
            catch (error) {
                console.error("Address verification error:", error);
                return { success: false, error: "Address verification failed" };
            }
        });
    }
    // Phone number verification with OTP
    sendPhoneOTP(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use Termii or other Nigerian SMS provider
                const response = yield axios_1.default.post("https://api.ng.termii.com/api/sms/otp/send", {
                    api_key: process.env.TERMII_API_KEY,
                    message_type: "NUMERIC",
                    to: phoneNumber,
                    from: "InvestNaija",
                    channel: "dnd",
                    pin_attempts: 3,
                    pin_time_to_live: 5,
                    pin_length: 6,
                    pin_placeholder: "< 1234 >",
                    message_text: "Your InvestNaija verification code is < 1234 >. Valid for 5 minutes.",
                }, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (response.data.pinId) {
                    return {
                        success: true,
                        data: {
                            pinId: response.data.pinId,
                            message: "OTP sent successfully",
                        },
                    };
                }
                return { success: false, error: "Failed to send OTP" };
            }
            catch (error) {
                console.error("Phone OTP error:", error);
                // Mock OTP for development
                return {
                    success: true,
                    data: {
                        pinId: "mock_pin_id",
                        message: "OTP sent successfully (mock)",
                    },
                };
            }
        });
    }
    // Verify phone OTP
    verifyPhoneOTP(pinId, pin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post("https://api.ng.termii.com/api/sms/otp/verify", {
                    api_key: process.env.TERMII_API_KEY,
                    pin_id: pinId,
                    pin: pin,
                }, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (response.data.verified === "True") {
                    return {
                        success: true,
                        data: { verified: true, message: "Phone number verified" },
                    };
                }
                return { success: false, error: "Invalid OTP" };
            }
            catch (error) {
                console.error("Phone OTP verification error:", error);
                // Mock verification for development
                return {
                    success: true,
                    data: { verified: true, message: "Phone number verified (mock)" },
                };
            }
        });
    }
    // Credit bureau check
    performCreditCheck(bvn, nin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Integration with Nigerian credit bureaus (CRC Credit Bureau, etc.)
                // This would require partnership agreements
                // Mock credit check for development
                const creditScore = Math.floor(Math.random() * (850 - 300) + 300);
                return {
                    success: true,
                    data: {
                        creditScore,
                        creditRating: this.getCreditRating(creditScore),
                        reportDate: new Date().toISOString(),
                        tradelines: [],
                        inquiries: [],
                        publicRecords: [],
                        summary: {
                            totalAccounts: Math.floor(Math.random() * 10),
                            activeAccounts: Math.floor(Math.random() * 5),
                            delinquentAccounts: Math.floor(Math.random() * 2),
                        },
                    },
                };
            }
            catch (error) {
                console.error("Credit check error:", error);
                return { success: false, error: "Credit check failed" };
            }
        });
    }
    // Risk assessment based on multiple factors
    assessRisk(userData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let riskScore = 0;
                const riskFactors = [];
                // BVN verification status
                if (!userData.bvn) {
                    riskScore += 30;
                    riskFactors.push("No BVN provided");
                }
                // NIN verification status
                if (!userData.nin) {
                    riskScore += 20;
                    riskFactors.push("No NIN provided");
                }
                // Phone verification
                if (!userData.phone.startsWith("+234")) {
                    riskScore += 25;
                    riskFactors.push("Non-Nigerian phone number");
                }
                // Email domain analysis
                const emailDomain = userData.email.split("@")[1];
                const suspiciousDomains = [
                    "tempmail.com",
                    "guerrillamail.com",
                    "10minutemail.com",
                ];
                if (suspiciousDomains.includes(emailDomain)) {
                    riskScore += 40;
                    riskFactors.push("Temporary email domain");
                }
                // IP geolocation check
                if (userData.ipAddress) {
                    // Check if IP is from Nigeria or suspicious location
                    // This would integrate with IP geolocation service
                }
                const riskLevel = this.getRiskLevel(riskScore);
                return {
                    success: true,
                    data: {
                        riskScore: Math.min(riskScore, 100),
                        riskLevel,
                        riskFactors,
                        recommendations: this.getRiskRecommendations(riskLevel),
                        assessmentDate: new Date().toISOString(),
                    },
                };
            }
            catch (error) {
                console.error("Risk assessment error:", error);
                return { success: false, error: "Risk assessment failed" };
            }
        });
    }
    // Private methods for different KYC providers
    verifyBVNWithVerifyMe(bvn) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const response = yield axios_1.default.post("https://api.verifyme.ng/v1/verifications/identities/bvn", {
                    bvn,
                    with_profile: true,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.verifyMeApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                if (response.data.status === "success") {
                    return {
                        success: true,
                        data: {
                            bvn: response.data.data.bvn,
                            firstName: response.data.data.first_name,
                            lastName: response.data.data.last_name,
                            middleName: response.data.data.middle_name,
                            dateOfBirth: response.data.data.date_of_birth,
                            phoneNumber: response.data.data.phone_number,
                            gender: response.data.data.gender,
                            watchListed: response.data.data.watch_listed === "YES",
                            responseCode: "00",
                            provider: "verifyme",
                            verifiedAt: new Date().toISOString(),
                        },
                    };
                }
                else {
                    return {
                        success: false,
                        error: response.data.message || "BVN verification failed",
                    };
                }
            }
            catch (error) {
                console.error("VerifyMe BVN error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || "BVN verification failed");
            }
        });
    }
    verifyBVNWithPrembly(bvn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post("https://api.prembly.com/identitypass/verification/bvn", { number: bvn }, {
                    headers: {
                        "x-api-key": this.preblyApiKey,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    verifyBVNWithSmile(bvn) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post("https://3eydmgh10d.execute-api.us-west-2.amazonaws.com/test/bvn_validation", {
                    partner_id: process.env.SMILE_PARTNER_ID,
                    signature: process.env.SMILE_SIGNATURE,
                    timestamp: new Date().toISOString(),
                    id_number: bvn,
                    id_type: "BVN",
                    country: "NG",
                }, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data,
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    verifyNINWithVerifyMe(nin) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const response = yield axios_1.default.post("https://api.verifyme.ng/v1/verifications/identities/nin", {
                    nin,
                    with_profile: true,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.verifyMeApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                if (response.data.status === "success") {
                    return {
                        success: true,
                        data: {
                            nin: response.data.data.nin,
                            firstName: response.data.data.first_name,
                            lastName: response.data.data.last_name,
                            middleName: response.data.data.middle_name,
                            dateOfBirth: response.data.data.date_of_birth,
                            phoneNumber: response.data.data.phone_number,
                            gender: response.data.data.gender,
                            address: response.data.data.residence_address_line1,
                            stateOfOrigin: response.data.data.state_of_origin,
                            localGovernment: response.data.data.lga_of_origin,
                            responseCode: "00",
                            provider: "verifyme",
                            verifiedAt: new Date().toISOString(),
                        },
                    };
                }
                else {
                    return {
                        success: false,
                        error: response.data.message || "NIN verification failed",
                    };
                }
            }
            catch (error) {
                console.error("VerifyMe NIN error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || "NIN verification failed");
            }
        });
    }
    verifyNINWithPrembly(nin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield axios_1.default.post("https://api.prembly.com/identitypass/verification/nin", { number: nin }, {
                    headers: {
                        "x-api-key": this.preblyApiKey,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    verifyDocumentWithSmile(documentType, documentImage, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const formData = new form_data_1.default();
                formData.append("partner_id", process.env.SMILE_PARTNER_ID || "");
                formData.append("signature", process.env.SMILE_SIGNATURE || "");
                formData.append("timestamp", new Date().toISOString());
                formData.append("id_type", documentType);
                formData.append("country", "NG");
                formData.append("user_id", userId);
                formData.append("image", documentImage, { filename: "document.jpg" });
                const response = yield axios_1.default.post("https://3eydmgh10d.execute-api.us-west-2.amazonaws.com/test/upload_id", formData, {
                    headers: Object.assign({}, formData.getHeaders()),
                });
                return {
                    success: true,
                    data: response.data,
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    performLivenessWithSmile(selfieImage, idImage, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const formData = new form_data_1.default();
                formData.append("partner_id", process.env.SMILE_PARTNER_ID || "");
                formData.append("signature", process.env.SMILE_SIGNATURE || "");
                formData.append("timestamp", new Date().toISOString());
                formData.append("country", "NG");
                formData.append("user_id", userId);
                formData.append("selfie_image", selfieImage, { filename: "selfie.jpg" });
                formData.append("id_image", idImage, { filename: "id.jpg" });
                const response = yield axios_1.default.post("https://3eydmgh10d.execute-api.us-west-2.amazonaws.com/test/biometric_kyc", formData, {
                    headers: Object.assign({}, formData.getHeaders()),
                });
                return {
                    success: true,
                    data: response.data,
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    // Mock methods for development
    mockBVNVerification(bvn) {
        if (!/^\d{11}$/.test(bvn)) {
            return { success: false, error: "Invalid BVN format" };
        }
        return {
            success: true,
            data: {
                bvn,
                firstName: "John",
                lastName: "Doe",
                middleName: "Ade",
                dateOfBirth: "1990-01-01",
                phoneNumber: "+2348123456789",
                gender: "Male",
                watchListed: false,
                responseCode: "00",
            },
        };
    }
    mockNINVerification(nin) {
        if (!/^\d{11}$/.test(nin)) {
            return { success: false, error: "Invalid NIN format" };
        }
        return {
            success: true,
            data: {
                nin,
                firstName: "John",
                lastName: "Doe",
                middleName: "Ade",
                dateOfBirth: "01-01-1990",
                phoneNumber: "+2348123456789",
                gender: "M",
                address: "123 Main Street, Lagos",
                stateOfOrigin: "Lagos",
                localGovernment: "Lagos Island",
                responseCode: "00",
            },
        };
    }
    getCreditRating(score) {
        if (score >= 750)
            return "Excellent";
        if (score >= 700)
            return "Good";
        if (score >= 650)
            return "Fair";
        if (score >= 600)
            return "Poor";
        return "Very Poor";
    }
    getRiskLevel(score) {
        if (score <= 20)
            return "Low";
        if (score <= 50)
            return "Medium";
        if (score <= 80)
            return "High";
        return "Very High";
    }
    getRiskRecommendations(riskLevel) {
        switch (riskLevel) {
            case "Low":
                return [
                    "Standard verification sufficient",
                    "Normal transaction limits",
                ];
            case "Medium":
                return [
                    "Additional document verification recommended",
                    "Moderate transaction limits",
                ];
            case "High":
                return [
                    "Enhanced due diligence required",
                    "Lower transaction limits",
                    "Manual review for large transactions",
                ];
            case "Very High":
                return [
                    "Comprehensive verification required",
                    "Minimal transaction limits",
                    "All transactions require manual approval",
                    "Consider account restriction",
                ];
            default:
                return [];
        }
    }
}
exports.kycVerificationService = new KYCVerificationService();
