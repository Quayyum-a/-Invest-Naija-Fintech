import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  User,
  CreditCard,
  FileText,
} from "lucide-react";

interface KYCVerificationProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
}

export default function KYCVerification({
  user,
  isOpen,
  onClose,
  onVerificationComplete,
}: KYCVerificationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    bvn: false,
    nin: false,
    phone: false,
    bank: false,
  });

  const steps = [
    {
      id: 1,
      title: "Personal Information",
      description: "Verify your BVN (Bank Verification Number)",
      icon: User,
    },
    {
      id: 2,
      title: "National Identity",
      description: "Verify your NIN (National Identification Number)",
      icon: Shield,
    },
    {
      id: 3,
      title: "Bank Account",
      description: "Link your Nigerian bank account",
      icon: CreditCard,
    },
    {
      id: 4,
      title: "Phone Verification",
      description: "Confirm your phone number with OTP",
      icon: FileText,
    },
  ];

  const handleBVNVerification = async () => {
    if (!bvn || bvn.length !== 11) {
      toast({
        title: "Invalid BVN",
        description: "BVN must be exactly 11 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate BVN verification process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setVerificationStatus((prev) => ({ ...prev, bvn: true }));
      toast({
        title: "BVN Verified!",
        description: "Your BVN has been successfully verified.",
      });
      setCurrentStep(2);
    } catch (error) {
      toast({
        title: "BVN Verification Failed",
        description: "Please check your BVN and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNINVerification = async () => {
    if (!nin || nin.length !== 11) {
      toast({
        title: "Invalid NIN",
        description: "NIN must be exactly 11 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate NIN verification process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setVerificationStatus((prev) => ({ ...prev, nin: true }));
      toast({
        title: "NIN Verified!",
        description: "Your NIN has been successfully verified.",
      });
      setCurrentStep(3);
    } catch (error) {
      toast({
        title: "NIN Verification Failed",
        description: "Please check your NIN and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBankVerification = async () => {
    if (!accountNumber || !selectedBank || accountNumber.length !== 10) {
      toast({
        title: "Missing Information",
        description:
          "Please provide a valid 10-digit account number and select a bank",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate bank account verification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setVerificationStatus((prev) => ({ ...prev, bank: true }));
      toast({
        title: "Bank Account Verified!",
        description: "Your bank account has been successfully verified.",
      });
      setCurrentStep(4);
    } catch (error) {
      toast({
        title: "Account Verification Failed",
        description: "Please check your account details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerification = async () => {
    if (!phoneNumber || !phoneNumber.startsWith("+234")) {
      toast({
        title: "Invalid Phone Number",
        description: "Please provide a valid Nigerian phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate phone verification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setVerificationStatus((prev) => ({ ...prev, phone: true }));
      toast({
        title: "Verification Complete!",
        description:
          "Your KYC verification is now complete. You can now access all features.",
      });
      onVerificationComplete();
      onClose();
    } catch (error) {
      toast({
        title: "Phone Verification Failed",
        description: "Failed to verify phone number",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
              <Input
                id="bvn"
                placeholder="Enter your 11-digit BVN"
                value={bvn}
                onChange={(e) =>
                  setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                maxLength={11}
              />
              <p className="text-sm text-gray-500">
                Your BVN is required for identity verification and regulatory
                compliance.
              </p>
            </div>
            <Button
              onClick={handleBVNVerification}
              className="w-full"
              disabled={loading || bvn.length !== 11}
            >
              {loading ? "Verifying..." : "Verify BVN"}
            </Button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nin">National Identification Number (NIN)</Label>
              <Input
                id="nin"
                placeholder="Enter your 11-digit NIN"
                value={nin}
                onChange={(e) =>
                  setNin(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                maxLength={11}
              />
              <p className="text-sm text-gray-500">
                Your NIN helps us confirm your identity as required by Nigerian
                law.
              </p>
            </div>
            <Button
              onClick={handleNINVerification}
              className="w-full"
              disabled={loading || nin.length !== 11}
            >
              {loading ? "Verifying..." : "Verify NIN"}
            </Button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Bank Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Enter your 10-digit account number"
                value={accountNumber}
                onChange={(e) =>
                  setAccountNumber(
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankCode">Select Bank</Label>
              <select
                id="bankCode"
                className="w-full p-2 border rounded-md"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
              >
                <option value="">Select your bank</option>
                <option value="044">Access Bank</option>
                <option value="011">First Bank of Nigeria</option>
                <option value="058">Guaranty Trust Bank</option>
                <option value="214">First City Monument Bank</option>
                <option value="070">Fidelity Bank</option>
                <option value="057">Zenith Bank</option>
                <option value="033">United Bank for Africa</option>
                <option value="232">Sterling Bank</option>
                <option value="039">Stanbic IBTC Bank</option>
                <option value="035">Wema Bank</option>
              </select>
            </div>
            <Button
              onClick={handleBankVerification}
              className="w-full"
              disabled={loading || accountNumber.length !== 10 || !selectedBank}
            >
              {loading ? "Verifying..." : "Verify Account"}
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+234XXXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                We'll send an OTP to this number for final verification.
              </p>
            </div>
            <Button
              onClick={handlePhoneVerification}
              className="w-full"
              disabled={loading || !phoneNumber.startsWith("+234")}
            >
              {loading ? "Sending OTP..." : "Complete Verification"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            KYC Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex justify-between">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center space-y-1 ${
                  currentStep >= step.id ? "text-green-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep >= step.id ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  {verificationStatus[
                    Object.keys(verificationStatus)[
                      step.id - 1
                    ] as keyof typeof verificationStatus
                  ] ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs text-center">{step.title}</span>
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {steps[currentStep - 1]?.title}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {steps[currentStep - 1]?.description}
              </p>
            </CardHeader>
            <CardContent>{getStepContent()}</CardContent>
          </Card>

          {/* Verification Status */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(verificationStatus).map(([key, verified]) => (
              <Badge
                key={key}
                variant={verified ? "default" : "secondary"}
                className="justify-center"
              >
                {verified ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {key.toUpperCase()} {verified ? "Verified" : "Pending"}
              </Badge>
            ))}
          </div>

          <div className="text-sm text-gray-500 p-3 bg-blue-50 rounded-lg">
            <strong>Why do we need this?</strong>
            <br />
            Nigerian law requires financial institutions to verify customer
            identities. This helps protect your account and ensures compliance
            with CBN regulations.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
