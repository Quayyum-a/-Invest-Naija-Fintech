import { ErrorResponse } from "@shared/api";
import { updateUserAsync as updateUser, getUserByIdAsync as getUserById } from "../data/storage";

export const submitKYCDocuments: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { bvn, nin, documentType, documentNumber } = req.body;

    if (!bvn && !nin) {
      return res.status(400).json({
        success: false,
        error: "Either BVN or NIN is required",
      } as ErrorResponse);
    }

    // Simulate BVN/NIN validation
    // In a real app, this would integrate with VerifyMe or Smile Identity APIs
    const isValidBVN = bvn && bvn.length === 11 && /^\d+$/.test(bvn);
    const isValidNIN = nin && nin.length === 11 && /^\d+$/.test(nin);

    if (bvn && !isValidBVN) {
      return res.status(400).json({
        success: false,
        error: "Invalid BVN format",
      } as ErrorResponse);
    }

    if (nin && !isValidNIN) {
      return res.status(400).json({
        success: false,
        error: "Invalid NIN format",
      } as ErrorResponse);
    }

    // Update user with KYC information
    const updatedUser = await updateUser(userId, {
      bvn: bvn || undefined,
      nin: nin || undefined,
      kycStatus: "pending", // Will be reviewed by admin
    });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      } as ErrorResponse);
    }

    res.json({
      success: true,
      user: updatedUser,
      message:
        "KYC documents submitted successfully. Verification in progress.",
    });
  } catch (error) {
    console.error("Submit KYC error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const getKYCStatus: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      } as ErrorResponse);
    }

    res.json({
      success: true,
      kyc: {
        status: user.kycStatus,
        bvnProvided: !!user.bvn,
        ninProvided: !!user.nin,
        canInvest: user.kycStatus === "verified",
        maxInvestmentLimit: user.kycStatus === "verified" ? 1000000 : 50000,
      },
    });
  } catch (error) {
    console.error("Get KYC status error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const uploadKYCDocument: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    // In a real app, this would handle file uploads to cloud storage
    // For now, we'll simulate the upload process
    const { documentType, fileName } = req.body;

    if (!documentType || !fileName) {
      return res.status(400).json({
        success: false,
        error: "Document type and file name are required",
      } as ErrorResponse);
    }

    // Simulate successful upload
    const uploadResult = {
      documentType,
      fileName,
      uploadedAt: new Date().toISOString(),
      status: "uploaded",
      documentId: `doc_${Date.now()}`,
    };

    res.json({
      success: true,
      upload: uploadResult,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Upload KYC document error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};
