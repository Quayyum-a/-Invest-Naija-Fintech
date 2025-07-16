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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKYCRequirements = exports.retryKYCVerification = exports.uploadKYCDocuments = exports.verifyNIN = exports.verifyBVN = exports.getKYCStatus = void 0;
const zod_1 = require("zod");
const storage_1 = require("../data/storage");
const youverifyService_1 = require("../services/youverifyService");
const termiiService_1 = require("../services/termiiService");
// Validation schemas
const bvnVerificationSchema = zod_1.z.object({
    bvn: zod_1.z
        .string()
        .regex(/^\d{11}$/, "BVN must be exactly 11 digits")
        .refine((bvn) => bvn.length === 11, "BVN must be 11 digits"),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
});
const ninVerificationSchema = zod_1.z.object({
    nin: zod_1.z
        .string()
        .regex(/^\d{11}$/, "NIN must be exactly 11 digits")
        .refine((nin) => nin.length === 11, "NIN must be 11 digits"),
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z.string().optional(),
});
const kycDocumentSchema = zod_1.z.object({
    document_type: zod_1.z.enum(["id_card", "passport", "drivers_license"], {
        errorMap: () => ({ message: "Invalid document type" }),
    }),
    document_number: zod_1.z.string().min(1, "Document number is required"),
    document_image: zod_1.z.string().min(1, "Document image is required"), // Base64 or URL
    selfie_image: zod_1.z.string().min(1, "Selfie image is required"), // Base64 or URL
});
// Get KYC status
const getKYCStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const user = (0, storage_1.getUser)({ id: userId });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }
        // Calculate KYC completion percentage
        let completionPercentage = 0;
        const kycSteps = [];
        // Basic information (already required for signup)
        kycSteps.push({
            step: "basic_info",
            completed: true,
            title: "Basic Information",
            description: "Name, email, and phone number",
        });
        completionPercentage += 25;
        // BVN verification
        const bvnVerified = !!user.bvn;
        kycSteps.push({
            step: "bvn_verification",
            completed: bvnVerified,
            title: "BVN Verification",
            description: "Bank Verification Number verification",
        });
        if (bvnVerified)
            completionPercentage += 25;
        // NIN verification
        const ninVerified = !!user.nin;
        kycSteps.push({
            step: "nin_verification",
            completed: ninVerified,
            title: "NIN Verification",
            description: "National Identification Number verification",
        });
        if (ninVerified)
            completionPercentage += 25;
        // Document verification
        const documentsVerified = user.kycStatus === "verified";
        kycSteps.push({
            step: "document_verification",
            completed: documentsVerified,
            title: "Document Verification",
            description: "ID card, passport, or driver's license",
        });
        if (documentsVerified)
            completionPercentage += 25;
        // Determine next step
        let nextStep = null;
        if (!bvnVerified) {
            nextStep = "bvn_verification";
        }
        else if (!ninVerified) {
            nextStep = "nin_verification";
        }
        else if (!documentsVerified) {
            nextStep = "document_verification";
        }
        res.json({
            success: true,
            data: {
                kycStatus: user.kycStatus,
                completionPercentage,
                nextStep,
                steps: kycSteps,
                bvnVerified,
                ninVerified,
                documentsVerified,
                limits: {
                    current: {
                        daily_transaction: user.kycStatus === "verified" ? 1000000 : 50000,
                        wallet_balance: user.kycStatus === "verified" ? 10000000 : 50000,
                        investment_amount: user.kycStatus === "verified" ? 10000000 : 50000,
                    },
                    afterVerification: {
                        daily_transaction: 5000000,
                        wallet_balance: 50000000,
                        investment_amount: 50000000,
                    },
                },
            },
        });
    }
    catch (error) {
        console.error("Get KYC status error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get KYC status",
        });
    }
});
exports.getKYCStatus = getKYCStatus;
// Verify BVN
const verifyBVN = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = bvnVerificationSchema.parse(req.body);
        const { bvn, firstName, lastName, dateOfBirth } = validatedData;
        // Check if BVN is already verified
        if (req.user.bvn) {
            return res.status(400).json({
                success: false,
                error: "BVN already verified for this account",
            });
        }
        try {
            // Verify BVN with YouVerify or mock
            const verification = yield youverifyService_1.youVerifyService.verifyBVNSafe(bvn, {
                firstName: firstName || req.user.firstName,
                lastName: lastName || req.user.lastName,
                dateOfBirth,
            });
            if (verification.valid) {
                // Update user with BVN and verification data
                const updatedUser = (0, storage_1.updateUser)(userId, {
                    bvn,
                    kycStatus: req.user.kycStatus === "pending" ? "pending" : req.user.kycStatus,
                    metadata: Object.assign(Object.assign({}, req.user.metadata), { bvn_verification: {
                            verified_at: new Date().toISOString(),
                            verification_data: verification.data,
                            service: youverifyService_1.youVerifyService.isServiceEnabled()
                                ? "youverify"
                                : "mock",
                        } }),
                });
                // Create audit transaction
                (0, storage_1.createTransaction)({
                    userId,
                    type: "kyc",
                    amount: 0,
                    description: "BVN verification completed",
                    status: "completed",
                    metadata: {
                        kyc_type: "bvn",
                        bvn: bvn.replace(/(\d{3})\d{5}(\d{3})/, "$1*****$2"), // Mask BVN in logs
                        verification_service: youverifyService_1.youVerifyService.isServiceEnabled()
                            ? "youverify"
                            : "mock",
                    },
                });
                // Send SMS notification
                if (req.user.phone) {
                    try {
                        yield termiiService_1.termiiService.sendSMSSafe({
                            to: req.user.phone,
                            message: `InvestNaija: Your BVN has been successfully verified. You can now access higher transaction limits.`,
                        });
                    }
                    catch (smsError) {
                        console.error("SMS notification failed:", smsError);
                    }
                }
                res.json({
                    success: true,
                    data: {
                        bvn_verified: true,
                        verification_data: {
                            first_name: (_b = verification.data) === null || _b === void 0 ? void 0 : _b.firstName,
                            last_name: (_c = verification.data) === null || _c === void 0 ? void 0 : _c.lastName,
                            phone: (_d = verification.data) === null || _d === void 0 ? void 0 : _d.phoneNumber,
                            date_of_birth: (_e = verification.data) === null || _e === void 0 ? void 0 : _e.dateOfBirth,
                        },
                    },
                    user: Object.assign(Object.assign({}, updatedUser), { bvn: bvn.replace(/(\d{3})\d{5}(\d{3})/, "$1*****$2") }),
                    message: "BVN verified successfully",
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: verification.message || "BVN verification failed",
                });
            }
        }
        catch (verificationError) {
            console.error("BVN verification error:", verificationError);
            res.status(400).json({
                success: false,
                error: verificationError.message || "BVN verification failed",
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Verify BVN error:", error);
        res.status(500).json({
            success: false,
            error: "BVN verification failed",
        });
    }
});
exports.verifyBVN = verifyBVN;
// Verify NIN
const verifyNIN = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = ninVerificationSchema.parse(req.body);
        const { nin, firstName, lastName, dateOfBirth } = validatedData;
        // Check if NIN is already verified
        if (req.user.nin) {
            return res.status(400).json({
                success: false,
                error: "NIN already verified for this account",
            });
        }
        try {
            // Verify NIN with YouVerify or mock
            const verification = yield youverifyService_1.youVerifyService.verifyNINSafe(nin, {
                firstName: firstName || req.user.firstName,
                lastName: lastName || req.user.lastName,
                dateOfBirth,
            });
            if (verification.valid) {
                // Update user with NIN and verification data
                const updatedUser = (0, storage_1.updateUser)(userId, {
                    nin,
                    kycStatus: req.user.kycStatus === "pending" ? "pending" : req.user.kycStatus,
                    metadata: Object.assign(Object.assign({}, req.user.metadata), { nin_verification: {
                            verified_at: new Date().toISOString(),
                            verification_data: verification.data,
                            service: youverifyService_1.youVerifyService.isServiceEnabled()
                                ? "youverify"
                                : "mock",
                        } }),
                });
                // Create audit transaction
                (0, storage_1.createTransaction)({
                    userId,
                    type: "kyc",
                    amount: 0,
                    description: "NIN verification completed",
                    status: "completed",
                    metadata: {
                        kyc_type: "nin",
                        nin: nin.replace(/(\d{3})\d{5}(\d{3})/, "$1*****$2"), // Mask NIN in logs
                        verification_service: youverifyService_1.youVerifyService.isServiceEnabled()
                            ? "youverify"
                            : "mock",
                    },
                });
                // Send SMS notification
                if (req.user.phone) {
                    try {
                        yield termiiService_1.termiiService.sendSMSSafe({
                            to: req.user.phone,
                            message: `InvestNaija: Your NIN has been successfully verified. You're one step closer to full account verification.`,
                        });
                    }
                    catch (smsError) {
                        console.error("SMS notification failed:", smsError);
                    }
                }
                res.json({
                    success: true,
                    data: {
                        nin_verified: true,
                        verification_data: {
                            first_name: (_b = verification.data) === null || _b === void 0 ? void 0 : _b.firstName,
                            last_name: (_c = verification.data) === null || _c === void 0 ? void 0 : _c.lastName,
                            phone: (_d = verification.data) === null || _d === void 0 ? void 0 : _d.phoneNumber,
                            date_of_birth: (_e = verification.data) === null || _e === void 0 ? void 0 : _e.dateOfBirth,
                            gender: (_f = verification.data) === null || _f === void 0 ? void 0 : _f.gender,
                            state_of_origin: (_g = verification.data) === null || _g === void 0 ? void 0 : _g.stateOfOrigin,
                        },
                    },
                    user: Object.assign(Object.assign({}, updatedUser), { nin: nin.replace(/(\d{3})\d{5}(\d{3})/, "$1*****$2") }),
                    message: "NIN verified successfully",
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: verification.message || "NIN verification failed",
                });
            }
        }
        catch (verificationError) {
            console.error("NIN verification error:", verificationError);
            res.status(400).json({
                success: false,
                error: verificationError.message || "NIN verification failed",
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Verify NIN error:", error);
        res.status(500).json({
            success: false,
            error: "NIN verification failed",
        });
    }
});
exports.verifyNIN = verifyNIN;
// Upload KYC documents
const uploadKYCDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = kycDocumentSchema.parse(req.body);
        const { document_type, document_number, document_image, selfie_image } = validatedData;
        // Check if BVN and NIN are verified first
        if (!req.user.bvn || !req.user.nin) {
            return res.status(400).json({
                success: false,
                error: "Please verify your BVN and NIN before uploading documents",
            });
        }
        // Check if documents are already verified
        if (req.user.kycStatus === "verified") {
            return res.status(400).json({
                success: false,
                error: "Documents already verified for this account",
            });
        }
        try {
            // In a real implementation, you would:
            // 1. Upload images to cloud storage (Cloudinary, AWS S3)
            // 2. Use OCR to extract document details
            // 3. Perform document verification
            // 4. Use face matching to compare selfie with document photo
            // For now, simulate document processing
            yield new Promise((resolve) => setTimeout(resolve, 2000));
            // Update user KYC status to verified
            const updatedUser = (0, storage_1.updateUser)(userId, {
                kycStatus: "verified",
                metadata: Object.assign(Object.assign({}, req.user.metadata), { document_verification: {
                        document_type,
                        document_number: document_number.replace(/(\w{2})\w+(\w{3})/, "$1***$2"), // Mask document number
                        verified_at: new Date().toISOString(),
                        status: "verified",
                    } }),
            });
            // Create audit transaction
            (0, storage_1.createTransaction)({
                userId,
                type: "kyc",
                amount: 0,
                description: "Document verification completed",
                status: "completed",
                metadata: {
                    kyc_type: "documents",
                    document_type,
                    document_number: document_number.replace(/(\w{2})\w+(\w{3})/, "$1***$2"),
                },
            });
            // Send SMS notification
            if (req.user.phone) {
                try {
                    yield termiiService_1.termiiService.sendSMSSafe({
                        to: req.user.phone,
                        message: `InvestNaija: Congratulations! Your account has been fully verified. You now have access to all features and higher limits.`,
                    });
                }
                catch (smsError) {
                    console.error("SMS notification failed:", smsError);
                }
            }
            res.json({
                success: true,
                data: {
                    kyc_status: "verified",
                    document_verified: true,
                    verified_at: new Date().toISOString(),
                    new_limits: {
                        daily_transaction: 5000000,
                        wallet_balance: 50000000,
                        investment_amount: 50000000,
                    },
                },
                user: updatedUser,
                message: "Documents verified successfully! Your account is now fully verified.",
            });
        }
        catch (processingError) {
            console.error("Document processing error:", processingError);
            // Update KYC status to rejected
            (0, storage_1.updateUser)(userId, {
                kycStatus: "rejected",
                metadata: Object.assign(Object.assign({}, req.user.metadata), { document_verification: {
                        document_type,
                        rejected_at: new Date().toISOString(),
                        status: "rejected",
                        reason: "Document processing failed",
                    } }),
            });
            res.status(400).json({
                success: false,
                error: "Document verification failed. Please try uploading clearer images.",
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Upload KYC documents error:", error);
        res.status(500).json({
            success: false,
            error: "Document upload failed",
        });
    }
});
exports.uploadKYCDocuments = uploadKYCDocuments;
// Retry KYC verification
const retryKYCVerification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        // Check if KYC is rejected
        if (req.user.kycStatus !== "rejected") {
            return res.status(400).json({
                success: false,
                error: "KYC retry is only available for rejected applications",
            });
        }
        // Reset KYC status to pending
        const updatedUser = (0, storage_1.updateUser)(userId, {
            kycStatus: "pending",
            metadata: Object.assign(Object.assign({}, req.user.metadata), { kyc_retry: {
                    retried_at: new Date().toISOString(),
                    previous_status: "rejected",
                } }),
        });
        // Create audit transaction
        (0, storage_1.createTransaction)({
            userId,
            type: "kyc",
            amount: 0,
            description: "KYC verification retry initiated",
            status: "completed",
            metadata: {
                kyc_type: "retry",
                previous_status: "rejected",
            },
        });
        res.json({
            success: true,
            data: {
                kyc_status: "pending",
                message: "You can now retry your KYC verification process",
            },
            user: updatedUser,
            message: "KYC verification reset successfully. Please re-upload your documents.",
        });
    }
    catch (error) {
        console.error("Retry KYC verification error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to retry KYC verification",
        });
    }
});
exports.retryKYCVerification = retryKYCVerification;
// Get KYC requirements
const getKYCRequirements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requirements = {
            bvn: {
                title: "Bank Verification Number (BVN)",
                description: "Your 11-digit BVN for identity verification",
                required: true,
                format: "11 digits",
                example: "12345678901",
            },
            nin: {
                title: "National Identification Number (NIN)",
                description: "Your 11-digit NIN for identity verification",
                required: true,
                format: "11 digits",
                example: "12345678901",
            },
            documents: {
                title: "Identity Documents",
                description: "Government-issued ID and selfie photo",
                required: true,
                accepted_types: [
                    {
                        type: "id_card",
                        name: "National ID Card",
                        description: "Nigerian national identity card",
                    },
                    {
                        type: "passport",
                        name: "International Passport",
                        description: "Valid Nigerian passport",
                    },
                    {
                        type: "drivers_license",
                        name: "Driver's License",
                        description: "Valid Nigerian driver's license",
                    },
                ],
                requirements: [
                    "Clear, high-resolution image",
                    "All text must be readable",
                    "No blurry or distorted images",
                    "Photo must show all four corners",
                    "Selfie must clearly show your face",
                ],
            },
            benefits: {
                title: "Benefits of KYC Verification",
                items: [
                    "Increased transaction limits (up to ₦5M daily)",
                    "Higher wallet balance limits (up to ₦50M)",
                    "Access to premium investment products",
                    "Faster customer support",
                    "Enhanced security features",
                    "Compliance with regulatory requirements",
                ],
            },
            compliance: {
                title: "Regulatory Compliance",
                description: "KYC verification is required by the Central Bank of Nigeria (CBN) and ensures your account meets all regulatory standards for financial services.",
            },
        };
        res.json({
            success: true,
            data: requirements,
        });
    }
    catch (error) {
        console.error("Get KYC requirements error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to get KYC requirements",
        });
    }
});
exports.getKYCRequirements = getKYCRequirements;
