import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { apiService } from "@/lib/api";
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  Shield,
  CreditCard,
  Building,
  MessageSquare,
  Settings,
  Bell,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  AlertCircle,
  UserCheck,
  Zap,
} from "lucide-react";

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalVolume: number;
  monthlyGrowth: number;
  pendingKYC: number;
  flaggedTransactions: number;
  systemHealth: number;
  avgResponseTime: number;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  amount?: number;
  timestamp: string;
  status: "success" | "failed" | "pending";
  ipAddress: string;
  location: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: "technical" | "payment" | "account" | "investment" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
  lastUpdate: string;
  assignedTo?: string;
  description: string;
}

interface SystemAlert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  severity: "low" | "medium" | "high" | "critical";
}

export default function EnhancedAdmin() {
  const [activeTab, setActiveTab] = useState("overview");
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dialog states
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );

  useEffect(() => {
    loadAdminData();
    // Set up real-time updates
    const interval = setInterval(loadRealtimeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    try {
      // Load real admin metrics from API
      const metricsResponse = await apiService.getAdminStats();
      const adminMetrics: AdminMetrics = metricsResponse.success
        ? {
            totalUsers: metricsResponse.stats.totalUsers || 0,
            activeUsers: metricsResponse.stats.activeUsers || 0,
            totalVolume: metricsResponse.stats.totalVolume || 0,
            monthlyGrowth: metricsResponse.stats.monthlyGrowth || 0,
            pendingKYC: metricsResponse.stats.pendingKYC || 0,
            flaggedTransactions: metricsResponse.stats.flaggedTransactions || 0,
            systemHealth: metricsResponse.stats.systemHealth || 99.0,
            avgResponseTime: metricsResponse.stats.avgResponseTime || 150,
          }
        : {
            totalUsers: 0,
            activeUsers: 0,
            totalVolume: 0,
            monthlyGrowth: 0,
            pendingKYC: 0,
            flaggedTransactions: 0,
            systemHealth: 99.0,
            avgResponseTime: 150,
          };

      // Load real user activities from transactions
      const userActivities: UserActivity[] = [];
      try {
        const transactionsResponse = await apiService.getTransactions();
        if (transactionsResponse.success && transactionsResponse.transactions) {
          // Convert recent transactions to user activities
          const recentTransactions = transactionsResponse.transactions.slice(
            0,
            10,
          );
          recentTransactions.forEach((transaction: any, index: number) => {
            userActivities.push({
              id: transaction.id || `activity_${index}`,
              userId: transaction.userId || "unknown",
              userName:
                `${transaction.firstName || "User"} ${transaction.lastName || ""}`.trim() ||
                "Anonymous User",
              action:
                transaction.description || transaction.type || "Transaction",
              amount: transaction.amount || 0,
              timestamp: transaction.createdAt || new Date().toISOString(),
              status: transaction.status || "completed",
              ipAddress: "127.0.0.1", // Real IP would come from logs
              location: "Nigeria", // Real location would come from user data
            });
          });
        }
      } catch (error) {
        console.error("Failed to load real activities:", error);
      }

      // Mock support tickets
      const mockTickets: SupportTicket[] = [
        {
          id: "1",
          userId: "user_005",
          userName: "Blessing Nkem",
          subject: "Unable to complete investment",
          category: "investment",
          priority: "high",
          status: "open",
          createdAt: "2024-01-10T14:30:00Z",
          lastUpdate: "2024-01-10T14:30:00Z",
          description:
            "I'm trying to invest in Treasury Bills but the payment keeps failing. I've tried multiple times with different cards.",
        },
        {
          id: "2",
          userId: "user_006",
          userName: "Emeka Okonkwo",
          subject: "Account verification pending",
          category: "account",
          priority: "medium",
          status: "in_progress",
          createdAt: "2024-01-09T10:15:00Z",
          lastUpdate: "2024-01-10T09:20:00Z",
          assignedTo: "Support Agent 1",
          description:
            "My KYC verification has been pending for 3 days. I uploaded all required documents correctly.",
        },
        {
          id: "3",
          userId: "user_007",
          userName: "Fatima Aliyu",
          subject: "Transfer reversal request",
          category: "payment",
          priority: "urgent",
          status: "open",
          createdAt: "2024-01-10T16:45:00Z",
          lastUpdate: "2024-01-10T16:45:00Z",
          description:
            "I mistakenly sent money to the wrong account. Please help reverse the transaction.",
        },
      ];

      // Mock system alerts
      const mockAlerts: SystemAlert[] = [
        {
          id: "1",
          type: "warning",
          title: "High Transaction Volume",
          message:
            "Transaction volume is 150% higher than usual. Monitor system performance.",
          timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
          resolved: false,
          severity: "medium",
        },
        {
          id: "2",
          type: "error",
          title: "Payment Gateway Error",
          message: "Paystack API returning 5xx errors. Investigating issue.",
          timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
          resolved: true,
          severity: "high",
        },
        {
          id: "3",
          type: "info",
          title: "Scheduled Maintenance",
          message:
            "Database maintenance scheduled for tomorrow at 2:00 AM WAT.",
          timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
          resolved: false,
          severity: "low",
        },
      ];

      setMetrics(adminMetrics);
      setUserActivities(userActivities);
      setSupportTickets(mockTickets);
      setSystemAlerts(mockAlerts);
    } catch (error) {
      console.error("Failed to load admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeData = async () => {
    // Simulate real-time updates
    const newActivity: UserActivity = {
      id: Date.now().toString(),
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      userName: "Live User Activity",
      action: "Live Transaction",
      amount: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
      status: Math.random() > 0.1 ? "success" : "failed",
      ipAddress: "41.190.25.147",
      location: "Lagos, Nigeria",
    };

    setUserActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
  };

  const handleResolveAlert = (alertId: string) => {
    setSystemAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, resolved: true } : alert,
      ),
    );
    toast({
      title: "Alert Resolved",
      description: "System alert has been marked as resolved",
    });
  };

  const handleAssignTicket = (ticketId: string, agent: string) => {
    setSupportTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              assignedTo: agent,
              status: "in_progress",
              lastUpdate: new Date().toISOString(),
            }
          : ticket,
      ),
    );
    toast({
      title: "Ticket Assigned",
      description: `Ticket assigned to ${agent}`,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "resolved":
      case "active":
        return "bg-green-100 text-green-800";
      case "failed":
      case "urgent":
      case "error":
        return "bg-red-100 text-red-800";
      case "pending":
      case "open":
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
      case "info":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
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
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">
            Real-time monitoring and management console
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadAdminData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button className="bg-naira-green text-white">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* System Health Alerts */}
      {systemAlerts.filter((alert) => !alert.resolved).length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              System Alerts ({systemAlerts.filter((a) => !a.resolved).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemAlerts
                .filter((alert) => !alert.resolved)
                .slice(0, 3)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          alert.type === "error"
                            ? "bg-red-500"
                            : alert.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      ></div>
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Users
                  </p>
                  <p className="text-xl font-bold">{metrics.totalUsers}</p>
                  <p className="text-xs text-green-600">
                    {metrics.activeUsers} active
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
                  <p className="text-sm font-medium text-gray-500">
                    Total Volume
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(metrics.totalVolume)}
                  </p>
                  <p className="text-xs text-green-600">
                    +{metrics.monthlyGrowth}% this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Pending KYC
                  </p>
                  <p className="text-xl font-bold">{metrics.pendingKYC}</p>
                  <p className="text-xs text-gray-500">Requires review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    System Health
                  </p>
                  <p className="text-xl font-bold">{metrics.systemHealth}%</p>
                  <p className="text-xs text-gray-500">
                    {metrics.avgResponseTime}ms avg response
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-time Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {userActivities.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.status === "success"
                              ? "bg-green-500"
                              : activity.status === "failed"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        ></div>
                        <div>
                          <h4 className="font-medium text-sm">
                            {activity.userName}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {activity.action}
                            {activity.amount &&
                              ` • ${formatCurrency(activity.amount)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(activity.timestamp)} •{" "}
                            {activity.location}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <UserCheck className="w-6 h-6" />
                    <span className="text-sm">Review KYC</span>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {metrics?.pendingKYC}
                    </Badge>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <AlertTriangle className="w-6 h-6" />
                    <span className="text-sm">Flagged Transactions</span>
                    <Badge className="bg-red-100 text-red-800">
                      {metrics?.flaggedTransactions}
                    </Badge>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-sm">Support Tickets</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {supportTickets.filter((t) => t.status === "open").length}
                    </Badge>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4"
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span className="text-sm">Generate Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-semibold">Support Tickets</h3>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {supportTickets
              .filter((ticket) =>
                filterStatus === "all" ? true : ticket.status === filterStatus,
              )
              .filter((ticket) =>
                ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .map((ticket) => (
                <Card
                  key={ticket.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{ticket.subject}</h3>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>By: {ticket.userName}</span>
                          <span>Category: {ticket.category}</span>
                          <span>
                            Created: {formatTimeAgo(ticket.createdAt)}
                          </span>
                          {ticket.assignedTo && (
                            <span>Assigned to: {ticket.assignedTo}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {ticket.status === "open" && (
                          <Button
                            size="sm"
                            className="bg-naira-green text-white"
                            onClick={() =>
                              handleAssignTicket(ticket.id, "Support Agent 1")
                            }
                          >
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <h3 className="text-lg font-semibold">System Monitoring</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Server Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "45%" }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="font-semibold">67%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "67%" }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Database Connections
                    </span>
                    <span className="font-semibold">23/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: "23%" }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">API Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Requests/minute
                    </span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Avg Response Time
                    </span>
                    <span className="font-semibold">145ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-semibold text-green-600">0.02%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="font-semibold text-green-600">99.98%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Security Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Failed Login Attempts
                    </span>
                    <span className="font-semibold">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Blocked IP Addresses
                    </span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Fraud Alerts</span>
                    <span className="font-semibold text-yellow-600">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Security Score
                    </span>
                    <span className="font-semibold text-green-600">98.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>All System Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      alert.resolved ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          alert.type === "error"
                            ? "bg-red-500"
                            : alert.type === "warning"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      ></div>
                      <div>
                        <h4 className="font-medium">{alert.title}</h4>
                        <p className="text-sm text-gray-600">{alert.message}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className={getStatusColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(alert.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.resolved ? (
                        <Badge className="bg-green-100 text-green-800">
                          Resolved
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Ticket #{selectedTicket?.id} - {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                </div>
                <div>
                  <Label>Category</Label>
                  <p>{selectedTicket.category}</p>
                </div>
                <div>
                  <Label>Customer</Label>
                  <p>{selectedTicket.userName}</p>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1">
                  Add Comment
                </Button>
                <Button className="flex-1 bg-naira-green text-white">
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
