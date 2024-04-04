import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Shield, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const { user, login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Redirect if already logged in as admin
  if (user && (user.role === "admin" || user.role === "super_admin")) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // Redirect regular users to normal dashboard
  if (user && user.role === "user") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const response = await login(formData.email, formData.password);

      if (response.success && response.user) {
        // Check if user has admin privileges
        if (
          response.user.role === "admin" ||
          response.user.role === "super_admin"
        ) {
          toast({
            title: "Admin Login Successful",
            description: `Welcome back, ${response.user.firstName}`,
          });
        } else {
          setLoginError("Access denied. Admin privileges required.");
          return;
        }
      } else {
        setLoginError(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (loginError) setLoginError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Portal
          </h1>
          <p className="text-gray-600">
            Secure access to InvestNaija administration
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">
              Administrator Login
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {loginError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{loginError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@investnaija.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your admin password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 py-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading || !formData.email || !formData.password}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In to Admin Portal
                  </div>
                )}
              </Button>

              <div className="text-center pt-4">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                >
                  ← Back to User Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This is a secure admin portal. All activities are logged and
            monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
