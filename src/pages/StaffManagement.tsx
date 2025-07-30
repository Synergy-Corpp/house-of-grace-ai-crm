import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, User, FileText, Package, Receipt, MoreHorizontal, UserPlus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AddStaffForm from "@/components/dashboard/AddStaffForm";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/utils/activityLogger";
import { useAuth } from "@/hooks/useAuth";

const EmptyState = ({ type }: { type: string }) => {
  // Determine the icon and message based on the type
  let icon, title, description, buttonText;
  
  switch (type) {
    case "customers":
      icon = <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />;
      title = "No customers yet";
      description = "Start by adding your first customer";
      buttonText = "Add Customer";
      break;
    case "invoices":
      icon = <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />;
      title = "No invoices yet";
      description = "Create your first invoice to get started";
      buttonText = "Create Invoice";
      break;
    case "receipts":
      icon = <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />;
      title = "No receipts yet";
      description = "Receipts will appear here once created";
      buttonText = "Create Receipt";
      break;
    case "staff":
      icon = <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />;
      title = "No staff members yet";
      description = "Add staff members to help manage your store";
      buttonText = "Add Staff";
      break;
    default:
      icon = <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />;
      title = "No data available";
      description = "Nothing to display yet";
      buttonText = "Add New";
  }
  
  return (
    <div className="text-center py-20">
      {icon}
      <h3 className="text-xl font-medium mb-1">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
    </div>
  );
};

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  created_at: string;
  last_login?: string;
  status?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  total: number;
  status: string;
}

const StaffManagement = () => {
  const [addStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Determine the current section based on the path
  const path = location.pathname.split('/').pop() || '';
  let pageTitle, icon, emptyType;
  
  switch (path) {
    case 'customers':
      pageTitle = "Customers";
      icon = <Users className="mr-2 h-6 w-6" />;
      emptyType = "customers";
      break;
    case 'invoices':
      pageTitle = "Invoices";
      icon = <FileText className="mr-2 h-6 w-6" />;
      emptyType = "invoices";
      break;
    case 'receipts':
      pageTitle = "Receipts";
      icon = <Receipt className="mr-2 h-6 w-6" />;
      emptyType = "receipts";
      break;
    case 'staff':
      pageTitle = "Staff Management";
      icon = <Users className="mr-2 h-6 w-6" />;
      emptyType = "staff";
      break;
    default:
      pageTitle = "Management";
      icon = <Package className="mr-2 h-6 w-6" />;
      emptyType = "default";
  }

  // Fetch data based on current section
  const { data, isLoading } = useQuery({
    queryKey: [path],
    queryFn: async () => {
      let query;
      
      if (path === 'staff' || path === 'manage-staff') {
        const { data, error } = await supabase
          .from('staff')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data as StaffMember[];
      } 
      else if (path === 'customers') {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data as Customer[];
      }
      else if (path === 'invoices') {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data as Invoice[];
      }
      else if (path === 'receipts') {
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data;
      }
      
      return [];
    },
  });

  // Delete mutations for different entities
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffMember: { id: string; name: string }) => {
      const { error } = await supabase.from('staff').delete().eq('id', staffMember.id);
      if (error) throw error;
      return staffMember;
    },
    onSuccess: async (deletedStaff) => {
      toast({ title: "Success", description: "Staff member deleted successfully" });
      
      // Log the deletion activity
      if (user) {
        try {
          await logActivity({
            action: 'delete',
            entityType: 'staff',
            entityName: deletedStaff.name,
            userEmail: user.email,
            entityId: deletedStaff.id,
            details: {
              name: deletedStaff.name
            }
          });
        } catch (error) {
          console.error('Error logging staff deletion activity:', error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: [path] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete staff member", variant: "destructive" });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customer: { id: string; name: string }) => {
      const { error } = await supabase.from('customers').delete().eq('id', customer.id);
      if (error) throw error;
      return customer;
    },
    onSuccess: async (deletedCustomer) => {
      toast({ title: "Success", description: "Customer deleted successfully" });
      
      // Log the deletion activity
      if (user) {
        try {
          await logActivity({
            action: 'delete',
            entityType: 'customer',
            entityName: deletedCustomer.name,
            userEmail: user.email,
            entityId: deletedCustomer.id,
            details: {
              name: deletedCustomer.name
            }
          });
        } catch (error) {
          console.error('Error logging customer deletion activity:', error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: [path] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete customer", variant: "destructive" });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoice: { id: string; invoice_number: string }) => {
      const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
      if (error) throw error;
      return invoice;
    },
    onSuccess: async (deletedInvoice) => {
      toast({ title: "Success", description: "Invoice deleted successfully" });
      
      // Log the deletion activity
      if (user) {
        try {
          await logActivity({
            action: 'delete',
            entityType: 'invoice',
            entityName: `Invoice ${deletedInvoice.invoice_number}`,
            userEmail: user.email,
            entityId: deletedInvoice.id,
            details: {
              invoiceNumber: deletedInvoice.invoice_number
            }
          });
        } catch (error) {
          console.error('Error logging invoice deletion activity:', error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: [path] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete invoice", variant: "destructive" });
    },
  });

  const deleteReceiptMutation = useMutation({
    mutationFn: async (receipt: { id: string; receipt_number: string }) => {
      const { error } = await supabase.from('receipts').delete().eq('id', receipt.id);
      if (error) throw error;
      return receipt;
    },
    onSuccess: async (deletedReceipt) => {
      toast({ title: "Success", description: "Receipt deleted successfully" });
      
      // Log the deletion activity
      if (user) {
        try {
          await logActivity({
            action: 'delete',
            entityType: 'receipt',
            entityName: `Receipt ${deletedReceipt.receipt_number}`,
            userEmail: user.email,
            entityId: deletedReceipt.id,
            details: {
              receiptNumber: deletedReceipt.receipt_number
            }
          });
        } catch (error) {
          console.error('Error logging receipt deletion activity:', error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: [path] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete receipt", variant: "destructive" });
    },
  });
  
  const handleStaffAdded = async () => {
    setAddStaffDialogOpen(false);
    // Immediately invalidate and refetch the current data
    await queryClient.invalidateQueries({ queryKey: [path] });
    toast({
      title: "Success",
      description: "Staff member added successfully",
    });
  };

  const handleDelete = (item: any, type: string) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      switch (type) {
        case 'staff':
          deleteStaffMutation.mutate({ id: item.id, name: item.name });
          break;
        case 'customer':
          deleteCustomerMutation.mutate({ id: item.id, name: item.name });
          break;
        case 'invoice':
          deleteInvoiceMutation.mutate({ id: item.id, invoice_number: item.invoice_number });
          break;
        case 'receipt':
          deleteReceiptMutation.mutate({ id: item.id, receipt_number: item.receipt_number });
          break;
      }
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading data...</p>
        </div>
      );
    }
    
    if (!data || data.length === 0) {
      return <EmptyState type={emptyType} />;
    }
    
    if (path === 'staff' || path === 'manage-staff') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data as StaffMember[]).map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium">{staff.name}</TableCell>
                <TableCell>{staff.email}</TableCell>
                <TableCell>{staff.position || 'N/A'}</TableCell>
                <TableCell>{staff.phone}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </TableCell>
                <TableCell>{staff.last_login ? format(new Date(staff.last_login), 'MMM dd, yyyy') : 'Never'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Role
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDelete(staff, 'staff')}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Staff
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    
    if (path === 'customers') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data as Customer[]).map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.email}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.address}</TableCell>
                <TableCell>{format(new Date(customer.created_at), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(customer, 'customer')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    
    if (path === 'invoices') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data as Invoice[]).map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.customer_name}</TableCell>
                <TableCell>{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                <TableCell>₦{invoice.total.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(invoice, 'invoice')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    
    if (path === 'receipts') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((receipt: any) => (
              <TableRow key={receipt.id}>
                <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                <TableCell>{receipt.customer_name || 'N/A'}</TableCell>
                <TableCell>₦{receipt.total.toLocaleString()}</TableCell>
                <TableCell>{receipt.payment_method || 'N/A'}</TableCell>
                <TableCell>{format(new Date(receipt.created_at), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(receipt, 'receipt')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    
    // Default fallback
    return (
      <div className="text-center py-12">
        <p>No content available for this section.</p>
      </div>
    );
  };
  
  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {icon}
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
        </div>
        
        {/* Only show add button for staff section */}
        {(path === 'staff' || path === 'manage-staff') && (
          <Button onClick={() => setAddStaffDialogOpen(true)} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Staff
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{pageTitle} List</CardTitle>
          <CardDescription>
            Manage all your {pageTitle.toLowerCase()} in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
      
      {/* Add Staff Dialog */}
      <Dialog open={addStaffDialogOpen} onOpenChange={setAddStaffDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <UserPlus className="mr-2 h-5 w-5" />
              Add Staff
            </DialogTitle>
          </DialogHeader>
          <AddStaffForm onComplete={handleStaffAdded} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;
