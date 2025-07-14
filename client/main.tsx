import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy load heavy components
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Crypto = lazy(() => import("./pages/Crypto"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BusinessBanking = lazy(() => import("./pages/BusinessBanking"));
const SocialPage = lazy(() => import("./pages/SocialPage"));
const Investments = lazy(() => import("./pages/Investments"));
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const DatabaseViewer = lazy(() => import("./components/DatabaseViewer"));

const queryClient = new QueryClient();

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner text="Loading..." className="h-64" />}>
    {children}
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/admin-login"
                element={
                  <SuspenseWrapper>
                    <AdminLogin />
                  </SuspenseWrapper>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper>
                      <AdminDashboard />
                    </SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper>
                      <Onboarding />
                    </SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolio"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper>
                      <Portfolio />
                    </SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crypto"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper>
                      <Crypto />
                    </SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper>
                      <Admin />
                    </SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/business"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper>
                      <BusinessBanking />
                    </SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/social"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper>
                      <SocialPage />
                    </SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investments"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper>
                      <Investments />
                    </SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute>
                    <SuspenseWrapper>
                      <SuperAdmin />
                    </SuspenseWrapper>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/database"
                element={
                  <SuspenseWrapper>
                    <DatabaseViewer />
                  </SuspenseWrapper>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
