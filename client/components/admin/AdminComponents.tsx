import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ArrowUpDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";

// Transaction Management Component
export const TransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/admin/transactions?status=${filter}&search=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const result = await response.json();

      if (result.success) {
        setTransactions(result.data || []);
      } else {
        // Show sample data for demonstration
        setTransactions([
          {
            id: "TXN001",
            userId: "user123",
            userEmail: "john@example.com",
            type: "deposit",
            amount: 50000,
            status: "completed",
            createdAt: "2024-01-15T10:30:00Z",
            description: "Wallet funding via Paystack",
          },
          {
            id: "TXN002",
            userId: "user456",
            userEmail: "jane@example.com",
            type: "transfer",
            amount: 25000,
            status: "pending",
            createdAt: "2024-01-15T11:15:00Z",
            description: "Transfer to recipient",
          },
          {
            id: "TXN003",
            userId: "user789",
            userEmail: "bob@example.com",
            type: "withdrawal",
            amount: 100000,
            status: "failed",
            createdAt: "2024-01-15T12:00:00Z",
            description: "Bank withdrawal",
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge className={config?.color || "bg-gray-100 text-gray-800"}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading transactions...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono">{txn.id}</TableCell>
                    <TableCell>{txn.userEmail}</TableCell>
                    <TableCell className="capitalize">{txn.type}</TableCell>
                    <TableCell>{formatCurrency(txn.amount)}</TableCell>
                    <TableCell>{getStatusBadge(txn.status)}</TableCell>
                    <TableCell>
                      {new Date(txn.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Investment Management Component
export const InvestmentManagement: React.FC = () => {
  const [investments, setInvestments] = useState<any[]>([]);

  useEffect(() => {
    // Load investment data
    setInvestments([
      {
        id: "INV001",
        userId: "user123",
        userEmail: "john@example.com",
        productName: "91-Day Treasury Bills",
        amount: 100000,
        currentValue: 103500,
        returns: 3500,
        status: "active",
        maturityDate: "2024-04-15",
      },
      {
        id: "INV002",
        userId: "user456",
        userEmail: "jane@example.com",
        productName: "Money Market Fund",
        amount: 250000,
        currentValue: 267500,
        returns: 17500,
        status: "active",
        maturityDate: "Flexible",
      },
    ]);
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* Investment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Investments</p>
                <p className="text-2xl font-bold">₦2.1M</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Returns</p>
                <p className="text-2xl font-bold">₦157K</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Investors</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investment ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead>Returns</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Maturity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono">{inv.id}</TableCell>
                  <TableCell>{inv.userEmail}</TableCell>
                  <TableCell>{inv.productName}</TableCell>
                  <TableCell>{formatCurrency(inv.amount)}</TableCell>
                  <TableCell>{formatCurrency(inv.currentValue)}</TableCell>
                  <TableCell className="text-green-600">
                    +{formatCurrency(inv.returns)}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      {inv.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{inv.maturityDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// System Administration Component
export const SystemAdministration: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState({
    database: "healthy",
    api: "healthy",
    payments: "warning",
    notifications: "healthy",
  });

  const getHealthStatus = (status: string) => {
    const statusConfig = {
      healthy: { color: "text-green-600", bg: "bg-green-100" },
      warning: { color: "text-yellow-600", bg: "bg-yellow-100" },
      error: { color: "text-red-600", bg: "bg-red-100" },
    };
    return statusConfig[status as keyof typeof statusConfig];
  };

  return (
    <div className="space-y-6">
      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(systemHealth).map(([service, status]) => {
              const statusStyle = getHealthStatus(status);
              return (
                <div
                  key={service}
                  className={`p-4 rounded-lg ${statusStyle.bg}`}
                >
                  <h3 className="font-semibold capitalize">{service}</h3>
                  <p className={`text-sm ${statusStyle.color}`}>
                    {status.toUpperCase()}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction_limit">
                Daily Transaction Limit (₦)
              </Label>
              <Input
                id="transaction_limit"
                type="number"
                defaultValue="500000"
              />
            </div>
            <div>
              <Label htmlFor="withdrawal_limit">
                Daily Withdrawal Limit (₦)
              </Label>
              <Input
                id="withdrawal_limit"
                type="number"
                defaultValue="100000"
              />
            </div>
            <div>
              <Label htmlFor="investment_min">Minimum Investment (₦)</Label>
              <Input id="investment_min" type="number" defaultValue="1000" />
            </div>
            <div>
              <Label htmlFor="kyc_limit">KYC Required Above (₦)</Label>
              <Input id="kyc_limit" type="number" defaultValue="50000" />
            </div>
          </div>
          <Button>Save Configuration</Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Reports & Analytics Component
export const ReportsAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState("7days");

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Financial Reports</h3>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₦2.4M</p>
              <p className="text-xs text-gray-500">+12% from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-blue-600">3,247</p>
              <p className="text-xs text-gray-500">+8% from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-purple-600">15,632</p>
              <p className="text-xs text-gray-500">+15% from last period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">98.7%</p>
              <p className="text-xs text-gray-500">+0.3% from last period</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Transaction Summary Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              User Activity Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Investment Performance Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Revenue Analysis Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">New user registrations</span>
                <Badge>+47 today</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed transactions</span>
                <Badge>+1,234 today</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Investment purchases</span>
                <Badge>+89 today</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bill payments</span>
                <Badge>+567 today</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
