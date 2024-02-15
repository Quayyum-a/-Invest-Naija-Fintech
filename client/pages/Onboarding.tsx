import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Phone,
  CreditCard,
  Shield,
  CheckCircle,
  ArrowLeft,
  Camera,
  User,
  Upload,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Onboarding() {
  const { user } = useAuth();
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isVerified = user?.kycStatus === "verified";

  // Calculate progress based on actual verification status
  const calculateProgress = () => {
    let completed = 0;
    const total = 5;

    // Basic profile info (always completed if user is logged in)
    if (user) completed += 1;

    // Phone verification
    if (user?.phone) completed += 1;

    // Personal information (assume completed if user has first/last name)
    if (user?.firstName && user?.lastName) completed += 1;

    // BVN verification
    if (user?.bvn) completed += 1;

    // Document upload (assume completed if KYC is verified)
    if (isVerified) completed += 1;

    return Math.round((completed / total) * 100);
  };

  const handleDocumentUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a document to upload.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Document Uploaded",
      description:
        "Your ID document has been uploaded successfully. Verification in progress.",
    });
    setIsDocumentUploadOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleLinkBank = () => {
    toast({
      title: "Bank Linking",
      description: "Redirecting to secure bank verification portal...",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Account Setup</h1>
          <div className="w-9"></div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Setup Progress</span>
                <span className="font-medium">
                  {Math.round(calculateProgress() / 20)} of 5 steps
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-4">
          <Card
            className={
              isVerified
                ? "border-naira-green bg-naira-light/30"
                : "border-2 border-dashed border-gray-300"
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isVerified ? "bg-naira-green" : "bg-gray-200"}`}
                >
                  {isVerified ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Phone className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    Phone Verification
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isVerified
                      ? "OTP verified successfully"
                      : "Verify your phone number"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              isVerified
                ? "border-naira-green bg-naira-light/30"
                : "border-2 border-dashed border-gray-300"
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${isVerified ? "bg-naira-green" : "bg-gray-200"}`}
                >
                  {isVerified ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    Personal Information
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isVerified ? "Profile completed" : "Complete your profile"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={
              user?.bvn
                ? "border-naira-green bg-naira-light/30"
                : "border-2 border-dashed border-gray-300"
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.bvn ? "bg-naira-green" : "bg-gray-200"}`}
                >
                  {user?.bvn ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Shield className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    BVN Verification
                  </h3>
                  <p className="text-sm text-gray-500">
                    {user?.bvn ? "Verified with VerifyMe" : "Verify your BVN"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-naira-green">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Document Upload</h3>
                  <p className="text-sm text-gray-500">
                    Upload ID card and selfie
                  </p>
                </div>
                <Dialog
                  open={isDocumentUploadOpen}
                  onOpenChange={setIsDocumentUploadOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-naira-green text-white">
                      Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload ID Document</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Select Document Type</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" className="text-sm">
                            <FileText className="w-4 h-4 mr-2" />
                            NIN
                          </Button>
                          <Button variant="outline" className="text-sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Driver's License
                          </Button>
                          <Button variant="outline" className="text-sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Passport
                          </Button>
                          <Button variant="outline" className="text-sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Voter's Card
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="document">Upload Document</Label>
                        <Input
                          id="document"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileSelect}
                        />
                        {selectedFile && (
                          <p className="text-sm text-gray-600">
                            Selected: {selectedFile.name}
                          </p>
                        )}
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          Make sure your document is clear and all details are
                          visible.
                        </p>
                      </div>
                      <Button
                        onClick={handleDocumentUpload}
                        className="w-full bg-naira-green hover:bg-green-600 text-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-gray-200 cursor-pointer hover:border-naira-green transition-colors"
            onClick={handleLinkBank}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-700">
                      Link Bank Account
                    </h3>
                    <p className="text-sm text-gray-500">For withdrawals</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Link Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Step */}
        <Card className="bg-gradient-to-r from-naira-green to-green-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Complete KYC Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-100 mb-4">
              Upload a clear photo of your government-issued ID and take a
              selfie to complete your account verification.
            </p>
            <Button
              className="bg-white text-naira-green hover:bg-gray-50 w-full"
              onClick={() => setIsDocumentUploadOpen(true)}
            >
              Start Document Upload
            </Button>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Your Data is Safe
                </h3>
                <p className="text-sm text-blue-700">
                  We use bank-level security and comply with CBN regulations.
                  Your personal information is encrypted and never shared.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
