import React, { useState, useEffect } from "react";
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
  Building2,
  Users,
  CreditCard,
  Plus,
  Settings,
  TrendingUp,
  DollarSign,
  Calendar,
  Shield,
} from "lucide-react";

interface BusinessAccount {
  id: string;
  name: string;
  industry: string;
  accountNumber: string;
  balance: number;
  employeeCount: number;
  monthlyVolume: number;
  status: "active" | "pending" | "suspended";
  createdAt: string;
  tier: "starter" | "growth" | "enterprise";
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: "active" | "pending" | "suspended";
  lastLogin?: string;
}

export default function BusinessAccounts() {
  const [accounts, setAccounts] = useState<BusinessAccount[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] =
    useState<BusinessAccount | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);

  // Form states
  const [newAccount, setNewAccount] = useState({
    name: "",
    industry: "",
    description: "",
    expectedVolume: "",
  });

  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    role: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      // Simulate API calls
      const mockAccounts: BusinessAccount[] = [
        {
          id: "1",
          name: "TechCorp Nigeria Ltd",
          industry: "Technology",
          accountNumber: "3019283847",
          balance: 25680000,
          employeeCount: 45,
          monthlyVolume: 120000000,
          status: "active",
          createdAt: "2024-01-15",
          tier: "growth",
        },
        {
          id: "2",
          name: "Lagos Trading Co",
          industry: "Retail",
          accountNumber: "3019284925",
          balance: 8750000,
          employeeCount: 12,
          monthlyVolume: 45000000,
          status: "active",
          createdAt: "2024-02-20",
          tier: "starter",
        },
      ];

      const mockEmployees: Employee[] = [
        {
          id: "1",
          name: "Adebayo Johnson",
          email: "adebayo@techcorp.ng",
          role: "Finance Manager",
          permissions: [
            "view_transactions",
            "approve_payments",
            "manage_accounts",
          ],
          status: "active",
          lastLogin: "2024-01-10",
        },
        {
          id: "2",
          name: "Ngozi Okafor",
          email: "ngozi@techcorp.ng",
          role: "Accountant",
          permissions: ["view_transactions", "create_payments"],
          status: "active",
          lastLogin: "2024-01-09",
        },
      ];

      setAccounts(mockAccounts);
      setEmployees(mockEmployees);
    } catch (error) {
      console.error("Failed to load business data:", error);
      toast({
        title: "Error",
        description: "Failed to load business accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.name || !newAccount.industry) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const account: BusinessAccount = {
        id: Date.now().toString(),
        name: newAccount.name,
        industry: newAccount.industry,
        accountNumber: `301${Math.floor(Math.random() * 10000000)}`,
        balance: 0,
        employeeCount: 1,
        monthlyVolume: 0,
        status: "pending",
        createdAt: new Date().toISOString().split("T")[0],
        tier: "starter",
      };

      setAccounts([...accounts, account]);
      setNewAccount({
        name: "",
        industry: "",
        description: "",
        expectedVolume: "",
      });
      setShowCreateDialog(false);

      toast({
        title: "Success",
        description:
          "Business account created successfully. Verification pending.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create business account",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "starter":
        return "bg-blue-100 text-blue-800";
      case "growth":
        return "bg-green-100 text-green-800";
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Business Accounts
          </h2>
          <p className="text-gray-600">
            Manage your business banking and team access
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog
            open={showEmployeeDialog}
            onOpenChange={setShowEmployeeDialog}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Full Name *</Label>
                  <Input
                    id="employeeName"
                    value={newEmployee.name}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, name: e.target.value })
                    }
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeEmail">Email Address *</Label>
                  <Input
                    id="employeeEmail"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, email: e.target.value })
                    }
                    placeholder="employee@company.com"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEmployeeDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button className="flex-1 bg-naira-green text-white">
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-naira-green text-white flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Business Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Business Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={newAccount.name}
                    onChange={(e) =>
                      setNewAccount({ ...newAccount, name: e.target.value })
                    }
                    placeholder="Enter business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select
                    value={newAccount.industry}
                    onValueChange={(value) =>
                      setNewAccount({ ...newAccount, industry: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Manufacturing">
                        Manufacturing
                      </SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                    </SelectContent>
                  </Select>
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
                    onClick={handleCreateAccount}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((account) => (
          <Card key={account.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-naira-light rounded-lg">
                    <Building2 className="w-6 h-6 text-naira-green" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <p className="text-sm text-gray-600">{account.industry}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getTierColor(account.tier)}>
                    {account.tier}
                  </Badge>
                  <Badge className={getStatusColor(account.status)}>
                    {account.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Account Number
                  </p>
                  <p className="text-lg font-mono">{account.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Balance</p>
                  <p className="text-lg font-semibold text-naira-green">
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    Employees
                  </div>
                  <p className="text-lg font-semibold">
                    {account.employeeCount}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <TrendingUp className="w-4 h-4" />
                    Monthly Vol.
                  </div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(account.monthlyVolume)}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    Created
                  </div>
                  <p className="text-sm font-semibold">
                    {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedAccount(account)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
                <Button size="sm" className="flex-1 bg-naira-green text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Transactions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
