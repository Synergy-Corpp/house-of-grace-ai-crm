import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, PackagePlus, User, FilePlus, LayoutDashboard, ReceiptText, Users, Clock, TrendingUp, Award, FileText } from "lucide-react";
import AddStaffForm from "@/components/dashboard/AddStaffForm";
import AddProductForm from "@/components/dashboard/AddProductForm";
import ProductFormModal from "@/components/dashboard/ProductFormModal";
import RegisterCustomerForm from "@/components/dashboard/RegisterCustomerForm";
import CreateInvoiceForm from "@/components/dashboard/CreateInvoiceForm";
import AccountStatementModal from "@/components/dashboard/AccountStatementModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WeeklyOptionBar from "@/components/dashboard/WeeklyOptionBar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { logActivity } from "@/utils/activityLogger";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string;
  user_email: string;
  created_at: string;
  details?: any;
}

const Dashboard = () => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAccountStatementOpen, setIsAccountStatementOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch recent activity logs with better error handling - limit to 5 for recent actions
  const { data: recentActivityLogs = [], isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ['recent-activity-logs'],
    queryFn: async () => {
      console.log('Fetching recent activity logs...');
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Supabase error fetching activity logs:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        
        console.log('Fetched activity logs:', data);
        return data as ActivityLog[];
      } catch (networkError) {
        console.error('Network error fetching activity logs:', networkError);
        if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to database. Please check your internet connection and try again.');
        }
        throw networkError;
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
  });

  // Listen for real-time updates to activity logs and products
  useEffect(() => {
    console.log('Setting up real-time subscriptions...');
    
    const activityChannel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          console.log('New activity log received:', payload);
          queryClient.invalidateQueries({ queryKey: ['recent-activity-logs'] });
        }
      )
      .subscribe();

    const productsChannel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Product change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    const customersChannel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        (payload) => {
          console.log('Customer change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['customers-count'] });
        }
      )
      .subscribe();

    const staffChannel = supabase
      .channel('staff-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff'
        },
        (payload) => {
          console.log('Staff change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['staff-count'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions...');
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(staffChannel);
    };
  }, [queryClient]);

  // Fetch products for analytics
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');
        if (error) throw new Error(`Database error: ${error.message}`);
        return data;
      } catch (networkError) {
        if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to database');
        }
        throw networkError;
      }
    },
    retry: 2,
    staleTime: 60000,
  });

  // Fetch customers count
  const { data: customersCount } = useQuery({
    queryKey: ['customers-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true });
        if (error) throw new Error(`Database error: ${error.message}`);
        return count || 0;
      } catch (networkError) {
        if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
          return 0; // Return fallback value for count
        }
        throw networkError;
      }
    },
    retry: 2,
    staleTime: 60000,
  });

  // Fetch staff count
  const { data: staffCount } = useQuery({
    queryKey: ['staff-count'],
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from('staff')
          .select('*', { count: 'exact', head: true });
        if (error) throw new Error(`Database error: ${error.message}`);
        return count || 0;
      } catch (networkError) {
        if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
          return 0; // Return fallback value for count
        }
        throw networkError;
      }
    },
    retry: 2,
    staleTime: 60000,
  });

  // Fetch recent invoices
  const { data: recentInvoices } = useQuery({
    queryKey: ['recent-invoices'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) throw new Error(`Database error: ${error.message}`);
        return data;
      } catch (networkError) {
        if (networkError instanceof TypeError && networkError.message.includes('Failed to fetch')) {
          return []; // Return empty array as fallback
        }
        throw networkError;
      }
    },
    retry: 2,
    staleTime: 60000,
  });

  const closeDialog = () => setActiveDialog(null);

  // Handler for adding recent actions
  const handleActionComplete = async (type: string, message: string, entityType?: string, entityName?: string) => {
    console.log('Action completed:', { type, message, entityType, entityName });
    
    if (user && entityType && entityName) {
      try {
        await logActivity({
          action: 'create',
          entityType,
          entityName,
          userEmail: user.email || 'Unknown'
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['recent-activity-logs'] });
        
        if (entityType === 'product') {
          queryClient.invalidateQueries({ queryKey: ['products'] });
        } else if (entityType === 'staff') {
          queryClient.invalidateQueries({ queryKey: ['staff-count'] });
        } else if (entityType === 'customer') {
          queryClient.invalidateQueries({ queryKey: ['customers-count'] });
        } else if (entityType === 'invoice') {
          queryClient.invalidateQueries({ queryKey: ['recent-invoices'] });
        }
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
    }
    closeDialog();
  };

  // Format relative time (e.g. "2 minutes ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minute${Math.floor(diffInSeconds / 60) > 1 ? 's' : ''} ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour${Math.floor(diffInSeconds / 3600) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInSeconds / 86400)} day${Math.floor(diffInSeconds / 86400) > 1 ? 's' : ''} ago`;
  };

  const getActionIcon = (action: string, entityType: string) => {
    if (action === "login" || action === "logout") return <User className="h-4 w-4" />;
    if (action === "create") {
      switch (entityType) {
        case "product": return <PackagePlus className="h-4 w-4" />;
        case "staff": return <UserPlus className="h-4 w-4" />;
        case "customer": return <Users className="h-4 w-4" />;
        case "invoice": return <ReceiptText className="h-4 w-4" />;
        default: return <FilePlus className="h-4 w-4" />;
      }
    }
    return <Clock className="h-4 w-4" />;
  };

  // Calculate most valuable product
  const mostValuableProduct = products?.reduce((max, product) => {
    const currentValue = (product.cost || 0) * (product.quantity || 0);
    const maxValue = (max?.cost || 0) * (max?.quantity || 0);
    return currentValue > maxValue ? product : max;
  }, products[0]);

  // Calculate most profitable product (highest profit margin)
  const mostProfitableProduct = products?.reduce((max, product) => {
    const currentMargin = ((product.price || 0) - (product.cost || 0)) / (product.cost || 1);
    const maxMargin = ((max?.price || 0) - (max?.cost || 0)) / (max?.cost || 1);
    return currentMargin > maxMargin ? product : max;
  }, products[0]);

  return (
    <div className="py-4 px-2 sm:py-8 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center">
          <LayoutDashboard className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setIsAccountStatementOpen(true)}
            variant="outline"
            className="flex items-center space-x-2 border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-black text-sm sm:text-base"
          >
            <FileText className="h-4 w-4" />
            <span>Account Statement</span>
          </Button>
        </div>
      </div>

      {/* Weekly Option Bar */}
      <div className="mb-6 sm:mb-10">
        <WeeklyOptionBar onSelectDay={setSelectedDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10">
        {/* Quick Actions Section */}
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-2 sm:p-3">
                <Button 
                  onClick={() => setActiveDialog("invoice")} 
                  variant="ghost" 
                  className="w-full h-full flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 hover:bg-blue-100/50"
                >
                  <div className="rounded-full bg-blue-500/20 p-1.5 sm:p-2">
                    <ReceiptText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-blue-700">Create Invoice</span>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-2 sm:p-3">
                <Button 
                  onClick={() => setActiveDialog("customer")} 
                  variant="ghost" 
                  className="w-full h-full flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 hover:bg-green-100/50"
                >
                  <div className="rounded-full bg-green-500/20 p-1.5 sm:p-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-green-700">Register Customer</span>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
              <CardContent className="p-2 sm:p-3">
                <Button 
                  onClick={() => setActiveDialog("product")} 
                  variant="ghost" 
                  className="w-full h-full flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5"
                >
                  <div className="rounded-full bg-emerald-100 p-1.5 sm:p-2">
                    <PackagePlus className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-medium text-emerald-800">New Product</span>
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="p-2 sm:p-3">
                <Button 
                  onClick={() => setActiveDialog("staff")} 
                  variant="ghost" 
                  className="w-full h-full flex flex-col items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5"
                >
                  <div className="rounded-full bg-purple-100 p-1.5 sm:p-2">
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-purple-800">Add Staff</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Recent Actions Section - Enhanced with better error handling */}
        <section className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-500" />
                <CardTitle className="text-lg sm:text-xl">Recent Actions</CardTitle>
              </div>
              <CardDescription className="text-sm">Latest 5 activities in your store</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-brand-gold mx-auto mb-4"></div>
                  <p className="text-sm text-gray-500">Loading recent actions...</p>
                </div>
              ) : logsError ? (
                <div className="text-center py-8 sm:py-12 text-red-500">
                  <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-red-300 mb-3" />
                  <p className="text-base sm:text-lg font-medium">Connection Error</p>
                  <p className="text-sm text-red-400 mt-1 max-w-md mx-auto">
                    {logsError.message || 'Unable to load recent activities. Please check your connection and try again.'}
                  </p>
                  <Button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['recent-activity-logs'] })}
                    variant="outline"
                    className="mt-3 text-sm"
                  >
                    Try Again
                  </Button>
                </div>
              ) : recentActivityLogs.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-base sm:text-lg font-medium">No recent activities</p>
                  <p className="text-sm text-gray-500 mt-1">Actions you perform will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-2">
                  {recentActivityLogs.map((log) => (
                    <div key={log.id} className="flex items-start border-b border-gray-100 last:border-0 pb-2 sm:pb-3 last:pb-0">
                      <div className="mr-3 mt-0.5">
                        <div className="rounded-full bg-brand-gold/20 p-1 sm:p-1.5">
                          {getActionIcon(log.action, log.entity_type)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)} {log.entity_type}: {log.entity_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          by {log.user_email} • {formatRelativeTime(new Date(log.created_at))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Most Valuable and Profitable Products Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-brand-gold" />
              <CardTitle className="text-lg sm:text-xl">Most Valuable Product</CardTitle>
            </div>
            <CardDescription className="text-sm">Product with highest inventory value</CardDescription>
          </CardHeader>
          <CardContent>
            {mostValuableProduct ? (
              <div className="text-center py-4 sm:py-6">
                <div className="rounded-full bg-brand-gold/20 p-3 sm:p-4 inline-flex mb-3 sm:mb-4">
                  <Award className="h-6 w-6 sm:h-8 sm:w-8 text-brand-gold" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1 truncate">{mostValuableProduct.name}</h3>
                <p className="text-muted-foreground mb-2 text-sm sm:text-base">
                  Value: ₦{((mostValuableProduct.cost || 0) * (mostValuableProduct.quantity || 0)).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {mostValuableProduct.quantity} units × ₦{(mostValuableProduct.cost || 0).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6">
                <div className="rounded-full bg-brand-gold/20 p-3 sm:p-4 inline-flex mb-3 sm:mb-4">
                  <Award className="h-6 w-6 sm:h-8 sm:w-8 text-brand-gold" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1">No products yet</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Add products to see which is most valuable
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-emerald-500" />
              <CardTitle className="text-lg sm:text-xl">Most Profitable Product</CardTitle>
            </div>
            <CardDescription className="text-sm">Product with highest profit margin</CardDescription>
          </CardHeader>
          <CardContent>
            {mostProfitableProduct ? (
              <div className="text-center py-4 sm:py-6">
                <div className="rounded-full bg-emerald-100 p-3 sm:p-4 inline-flex mb-3 sm:mb-4">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1 truncate">{mostProfitableProduct.name}</h3>
                <p className="text-muted-foreground mb-2 text-sm sm:text-base">
                  Margin: ₦{((mostProfitableProduct.price || 0) - (mostProfitableProduct.cost || 0)).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {(((mostProfitableProduct.price || 0) - (mostProfitableProduct.cost || 0)) / (mostProfitableProduct.cost || 1) * 100).toFixed(1)}% profit margin
                </p>
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6">
                <div className="rounded-full bg-emerald-100 p-3 sm:p-4 inline-flex mb-3 sm:mb-4">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1">No products yet</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Add products to see which is most profitable
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview - Moved to bottom */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <PackagePlus className="h-6 w-6 sm:h-8 sm:w-8 text-brand-gold" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold truncate">{products?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-brand-yellow" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-lg sm:text-2xl font-bold truncate">{customersCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Staff Members</p>
                <p className="text-lg sm:text-2xl font-bold truncate">{staffCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <ReceiptText className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Recent Invoices</p>
                <p className="text-lg sm:text-2xl font-bold truncate">{recentInvoices?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={activeDialog === "invoice"} onOpenChange={() => activeDialog === "invoice" && closeDialog()}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <ReceiptText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Create Invoice
            </DialogTitle>
          </DialogHeader>
          <CreateInvoiceForm 
            onComplete={() => handleActionComplete("invoice", "Invoice created successfully", "invoice", "New Invoice")}
            onClose={closeDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "customer"} onOpenChange={() => activeDialog === "customer" && closeDialog()}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Register Customer
            </DialogTitle>
          </DialogHeader>
          <RegisterCustomerForm 
            onComplete={() => handleActionComplete("customer", "Customer registered successfully", "customer", "New Customer")}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "product"} onOpenChange={() => activeDialog === "product" && closeDialog()}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <PackagePlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              New Product
            </DialogTitle>
          </DialogHeader>
          <ProductFormModal 
            onClose={closeDialog} 
            onComplete={(productName) => handleActionComplete("product", `Product "${productName}" added successfully`, "product", productName)} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "staff"} onOpenChange={() => activeDialog === "staff" && closeDialog()}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg sm:text-xl">
              <UserPlus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Add Staff
            </DialogTitle>
          </DialogHeader>
          <AddStaffForm 
            onComplete={() => handleActionComplete("staff", "Staff member added successfully", "staff", "New Staff Member")}
          />
        </DialogContent>
      </Dialog>

      {/* Account Statement Modal */}
      <AccountStatementModal 
        isOpen={isAccountStatementOpen}
        onClose={() => setIsAccountStatementOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
