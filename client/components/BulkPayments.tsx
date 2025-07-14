import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Upload,
  Download,
  Send,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Eye,
  Trash2,
} from "lucide-react";

interface BulkPayment {
  id: string;
  name: string;
  totalAmount: number;
  recipientCount: number;
  status: "draft" | "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  processedAt?: string;
  description: string;
  type: "salary" | "vendor" | "bonus" | "refund" | "other";
}

interface PaymentRecipient {
  id: string;
  name: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  amount: number;
  narration: string;
  status: "pending" | "successful" | "failed";
  reference?: string;
  errorMessage?: string;
}

export default function BulkPayments() {
  const [bulkPayments, setBulkPayments] = useState<BulkPayment[]>([]);
  const [recipients, setRecipients] = useState<PaymentRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRecipientsDialog, setShowRecipientsDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<BulkPayment | null>(
    null,
  );

  // Form states
  const [newPayment, setNewPayment] = useState({
    name: "",
    description: "",
    type: "salary" as const,
  });

  const [newRecipient, setNewRecipient] = useState({
    name: "",
    accountNumber: "",
    bankCode: "",
    bankName: "",
    amount: "",
    narration: "",
  });

  React.useEffect(() => {
    loadBulkPayments();
  }, []);

  const loadBulkPayments = async () => {
    setLoading(true);
    try {
      // Fetch real bulk payments from API
      const response = await fetch("/api/bulk-payments", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setBulkPayments(result.data || []);
      } else {
        // Fallback to empty array if no data
        setBulkPayments([]);
      }
    } catch (error) {
      console.error("Failed to load bulk payments:", error);
      toast({
        title: "Error",
        description: "Failed to load bulk payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    if (!newPayment.name || !newPayment.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const payment: BulkPayment = {
        id: Date.now().toString(),
        name: newPayment.name,
        totalAmount: 0,
        recipientCount: 0,
        status: "draft",
        createdAt: new Date().toISOString().split("T")[0],
        description: newPayment.description,
        type: newPayment.type,
      };

      setBulkPayments([payment, ...bulkPayments]);
      setNewPayment({ name: "", description: "", type: "salary" });
      setShowCreateDialog(false);

      toast({
        title: "Success",
        description: "Bulk payment created. Add recipients to continue.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bulk payment",
        variant: "destructive",
      });
    }
  };

  const handleAddRecipient = () => {
    if (
      !newRecipient.name ||
      !newRecipient.accountNumber ||
      !newRecipient.amount
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const recipient: PaymentRecipient = {
      id: Date.now().toString(),
      name: newRecipient.name,
      accountNumber: newRecipient.accountNumber,
      bankCode: newRecipient.bankCode || "044",
      bankName: newRecipient.bankName || "Access Bank",
      amount: parseFloat(newRecipient.amount),
      narration: newRecipient.narration || "Payment",
      status: "pending",
    };

    setRecipients([...recipients, recipient]);
    setNewRecipient({
      name: "",
      accountNumber: "",
      bankCode: "",
      bankName: "",
      amount: "",
      narration: "",
    });

    toast({
      title: "Success",
      description: "Recipient added successfully",
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      try {
        // Parse actual CSV file
        const text = await file.text();
        const lines = text.split("\n").filter((line) => line.trim());

        if (lines.length < 2) {
          toast({
            title: "Error",
            description:
              "CSV file must contain headers and at least one data row",
            variant: "destructive",
          });
          return;
        }

        const parsedRecipients: PaymentRecipient[] = [];

        // Parse each line (skip header)
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i]
            .split(",")
            .map((v) => v.trim().replace(/"/g, ""));

          if (
            values.length >= 4 &&
            values[0] &&
            values[1] &&
            values[2] &&
            values[3]
          ) {
            parsedRecipients.push({
              id: `csv-${Date.now()}-${i}`,
              name: values[0],
              accountNumber: values[1],
              bankCode: values[2],
              bankName: getBankName(values[2]),
              amount: parseFloat(values[3]) || 0,
              narration: values[4] || "Bulk Payment",
              status: "pending",
            });
          }
        }

        if (parsedRecipients.length > 0) {
          setRecipients([...recipients, ...parsedRecipients]);
          toast({
            title: "Success",
            description: `${parsedRecipients.length} recipients imported from CSV`,
          });
        } else {
          toast({
            title: "Error",
            description: "No valid recipients found in CSV file",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Please select a valid CSV file",
        variant: "destructive",
      });
    }
  };

  // Helper function to get bank name from code
  const getBankName = (code: string): string => {
    const bankCodes: Record<string, string> = {
      "044": "Access Bank",
      "058": "GTBank",
      "033": "United Bank for Africa",
      "030": "Heritage Bank",
      "011": "First Bank",
      "221": "Stanbic IBTC Bank",
      "214": "First City Monument Bank",
    };
    return bankCodes[code] || "Unknown Bank";
  };

  const downloadTemplate = () => {
    const csvContent = `Name,Account Number,Bank Code,Amount,Narration
John Doe,1234567890,044,150000,Salary Payment
Jane Smith,0987654321,058,200000,Salary Payment`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_payment_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const processBulkPayment = async (paymentId: string) => {
    try {
      const payment = bulkPayments.find((p) => p.id === paymentId);
      if (!payment) return;

      // Update status to processing
      setBulkPayments(
        bulkPayments.map((p) =>
          p.id === paymentId ? { ...p, status: "processing" } : p,
        ),
      );

      // Simulate processing delay
      setTimeout(() => {
        setBulkPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  status: "completed",
                  processedAt: new Date().toISOString().split("T")[0],
                }
              : p,
          ),
        );

        toast({
          title: "Success",
          description: "Bulk payment processed successfully",
        });
      }, 3000);

      toast({
        title: "Processing",
        description: "Bulk payment is being processed...",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process bulk payment",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bulk Payments</h2>
          <p className="text-gray-600">
            Manage salary, vendor, and bulk payment processing
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-naira-green text-white">
                <Send className="w-4 h-4 mr-2" />
                New Bulk Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Bulk Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentName">Payment Name *</Label>
                  <Input
                    id="paymentName"
                    value={newPayment.name}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, name: e.target.value })
                    }
                    placeholder="e.g., January 2024 Salary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentType">Type</Label>
                  <Select
                    value={newPayment.type}
                    onValueChange={(value: any) =>
                      setNewPayment({ ...newPayment, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="vendor">Vendor Payment</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDescription">Description</Label>
                  <Textarea
                    id="paymentDescription"
                    value={newPayment.description}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        description: e.target.value,
                      })
                    }
                    placeholder="Brief description of this payment batch"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-naira-green text-white"
                    onClick={handleCreatePayment}
                  >
                    Create Payment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Payments
                </p>
                <p className="text-xl font-bold">{bulkPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-xl font-bold">
                  {bulkPayments.filter((p) => p.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-xl font-bold">
                  {
                    bulkPayments.filter(
                      (p) => p.status === "pending" || p.status === "draft",
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-naira-light rounded-lg">
                <DollarSign className="w-5 h-5 text-naira-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-lg font-bold">
                  {formatCurrency(
                    bulkPayments
                      .filter((p) => p.status === "completed")
                      .reduce((sum, p) => sum + p.totalAmount, 0),
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {bulkPayments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-naira-light rounded-lg">
                    {getStatusIcon(payment.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{payment.name}</h3>
                    <p className="text-gray-600">{payment.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>
                        {payment.recipientCount} recipients •{" "}
                        {formatCurrency(payment.totalAmount)}
                      </span>
                      <span>
                        Created{" "}
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </span>
                      {payment.processedAt && (
                        <span>
                          Processed{" "}
                          {new Date(payment.processedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                  <Badge variant="outline">{payment.type}</Badge>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPayment(payment);
                        setShowRecipientsDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {payment.status === "draft" && (
                      <Button
                        size="sm"
                        className="bg-naira-green text-white"
                        onClick={() => processBulkPayment(payment.id)}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Process
                      </Button>
                    )}

                    {(payment.status === "draft" ||
                      payment.status === "failed") && (
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recipients Dialog */}
      <Dialog
        open={showRecipientsDialog}
        onOpenChange={setShowRecipientsDialog}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPayment?.name} - Recipients ({recipients.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {recipients.map((recipient) => (
              <div
                key={recipient.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{recipient.name}</h4>
                  <p className="text-sm text-gray-600">
                    {recipient.accountNumber} • {recipient.bankName}
                  </p>
                  <p className="text-sm text-gray-500">{recipient.narration}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatCurrency(recipient.amount)}
                  </p>
                  <Badge className={getStatusColor(recipient.status)}>
                    {recipient.status}
                  </Badge>
                </div>
              </div>
            ))}

            {recipients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recipients added yet</p>
              </div>
            )}
          </div>

          {totalAmount > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-naira-green">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
