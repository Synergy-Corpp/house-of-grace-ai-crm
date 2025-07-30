
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Receipts from "./pages/Receipts";
import Payments from "./pages/Payments";
import Invoices from "./pages/Invoices";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import StaffManagement from "./pages/StaffManagement";
import StaffRoles from "./pages/StaffRoles";
import ActivityLogs from "./pages/ActivityLogs";
import AIInsights from "./pages/AIInsights";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="inventory" element={<Index />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="receipts" element={<Receipts />} />
              <Route path="orders" element={<Orders />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="payments" element={<Payments />} />
              <Route path="customers" element={<StaffManagement />} />
              <Route path="staff" element={<StaffRoles />} />
              <Route path="manage-staff" element={<StaffRoles />} />
              <Route path="roles" element={<StaffRoles />} />
              <Route path="logs" element={<ActivityLogs />} />
              <Route path="ai-insights" element={<AIInsights />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
