import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Eye,
  UserCheck,
  UserX,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../lib/api";

export default function Admin() {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to new admin portal
    if (user && (user.role === "admin" || user.role === "super_admin")) {
      window.location.href = "/admin-dashboard";
      return;
    }

    // Check if user is admin (legacy check)
    if (
      !user?.email?.endsWith("@admin.com") &&
      !user?.email?.endsWith("@investnaija.com") &&
      user?.role !== "admin" &&
      user?.role !== "super_admin"
    ) {
      toast({
        title: "Access Denied",
        description:
          "You don't have admin privileges. Please use the admin portal.",
        variant: "destructive",
      });
      return;
    }

    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const [statsResponse, usersResponse] = await Promise.all([
        apiService.getAdminStats(),
        apiService.getAllUsers(),
      ]);

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }

      if (usersResponse.success) {
        setUsers(usersResponse.users);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Admin data export is being prepared for download.",
    });
  };

  const handleUserAction = (userName: string, action: string) => {
    toast({
      title: `User ${action}`,
      description: `${action} action performed for ${userName}.`,
    });
  };

  const handleKYCAction = async (
    userId: string,
    userName: string,
    action: "verified" | "rejected",
  ) => {
    try {
      await apiService.updateUserKYC(userId, action);
      toast({
        title: `KYC ${action === "verified" ? "Approved" : "Rejected"}`,
        description: `KYC verification ${action} for ${userName}.`,
      });
      fetchAdminData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update KYC status for ${userName}`,
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (
    !user?.email?.endsWith("@admin.com") &&
    !user?.email?.endsWith("@investnaija.com") &&
    user?.role !== "admin" &&
    user?.role !== "super_admin"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have admin privileges to access this page.
            </p>
            <Link to="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-naira-green rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">₦</span>
          </div>
          <div className="animate-spin w-6 h-6 border-2 border-naira-green border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-naira-green to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">₦</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                InvestNaija Management Portal
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Link to="/dashboard">
              <Button size="sm" className="bg-naira-green text-white">
                User View
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout} title="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.totalUsers || 0}
                  </p>
                  <p className="text-sm text-green-600">
                    +{Math.floor((stats?.totalUsers || 0) * 0.125)} this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total AUM</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNaira(stats?.totalAUM || 0)}
                  </p>
                  <p className="text-sm text-green-600">+8.3% this month</p>
                </div>
                <div className="w-12 h-12 bg-naira-light rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-naira-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Investments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.activeInvestments || 0}
                  </p>
                  <p className="text-sm text-green-600">+15.7% this month</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending KYC</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.pendingKYC || 0}
                  </p>
                  <p className="text-sm text-orange-600">Requires attention</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-1/2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="kyc">KYC Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search users..."
                        className="pl-10 w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toast({
                          title: "Filter",
                          description:
                            "Advanced filtering options coming soon!",
                        })
                      }
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* User List */}
                  <div className="border rounded-lg divide-y">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <div
                          key={user.id || index}
                          className="p-4 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {user.firstName?.charAt(0)?.toUpperCase()}
                                {user.lastName?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {user.phone || "No phone"}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={
                                    user.status === "active"
                                      ? "default"
                                      : "destructive"
                                  }
                                  className={
                                    user.status === "active"
                                      ? "bg-green-100 text-green-800"
                                      : ""
                                  }
                                >
                                  {user.status || "active"}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    user.kycStatus === "verified"
                                      ? "border-green-200 text-green-700"
                                      : user.kycStatus === "pending"
                                        ? "border-orange-200 text-orange-700"
                                        : "border-red-200 text-red-700"
                                  }
                                >
                                  {user.kycStatus || "pending"}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleUserAction(
                                  user.firstName + " " + user.lastName,
                                  "View Details",
                                )
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <Users className="w-8 h-8 mx-auto mb-2" />
                        <p>No users found</p>
                        {searchTerm && (
                          <p className="text-xs">Try adjusting your search</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>KYC Verification Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.filter((user) => user.kycStatus === "pending").length >
                  0 ? (
                    users
                      .filter((user) => user.kycStatus === "pending")
                      .map((user, index) => (
                        <div
                          key={user.id || index}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Submitted{" "}
                                {new Date(user.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-orange-300 text-orange-700"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              Pending Review
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">
                                Documents:
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {user.bvn ? "BVN" : "No BVN"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {user.nin ? "NIN" : "No NIN"}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toast({
                                    title: "Review",
                                    description: `Reviewing ${user.firstName}'s documents.`,
                                  })
                                }
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 text-white"
                                onClick={() =>
                                  handleKYCAction(
                                    user.id,
                                    user.firstName + " " + user.lastName,
                                    "verified",
                                  )
                                }
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  handleKYCAction(
                                    user.id,
                                    user.firstName + " " + user.lastName,
                                    "rejected",
                                  )
                                }
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <h3 className="text-lg font-medium mb-2">
                        All caught up!
                      </h3>
                      <p>No pending KYC verifications at the moment</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
