import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CreateInvoiceForm from "@/components/dashboard/CreateInvoiceForm";
import InvoiceDetailsModal from "@/components/invoices/InvoiceDetailsModal";

const Invoices = () => {
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }
      
      return data;
    },
  });

  const handleInvoiceCreated = () => {
    setCreateInvoiceDialogOpen(false);
  };

  const handleInvoiceClick = (invoice: any) => {
    setSelectedInvoice(invoice);
    setDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setDetailsModalOpen(false);
    setSelectedInvoice(null);
  };

  // Filter invoices based on search query
  const filteredInvoices = invoices?.filter(invoice => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const customerName = invoice.customer_name.toLowerCase();
    const issueDate = format(new Date(invoice.issue_date), 'MMM dd, yyyy').toLowerCase();
    
    return customerName.includes(query) || issueDate.includes(query);
  }) || [];

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <FileText className="mr-2 h-6 w-6" />
            <h1 className="text-3xl font-bold">Invoices</h1>
          </div>
          
          <Button 
            onClick={() => setCreateInvoiceDialogOpen(true)} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="mr-2 h-6 w-6" />
          <h1 className="text-3xl font-bold">Invoices</h1>
        </div>
        
        <Button 
          onClick={() => setCreateInvoiceDialogOpen(true)} 
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            All Invoices
          </CardTitle>
          <CardDescription>
            View and manage all your invoices. Click on any invoice to view details.
          </CardDescription>
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by customer name or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!invoices || invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="rounded-full bg-gray-100 p-6 inline-flex mb-4">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No invoices yet</h3>
              <p className="text-muted-foreground mb-4">
                Let's get started by creating your first invoice!
              </p>
              <Button 
                onClick={() => setCreateInvoiceDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Invoice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Discount Given</TableHead>
                    <TableHead>Amount Paid</TableHead>
                    <TableHead>Payment Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => {
                    const isPaid = invoice.status === 'paid' || invoice.amount_paid >= invoice.total;
                    const isHalfPaid = invoice.amount_paid > 0 && invoice.amount_paid < invoice.total;
                    
                    return (
                      <TableRow 
                        key={invoice.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleInvoiceClick(invoice)}
                      >
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>
                          {(() => {
                            try {
                              const date = new Date(invoice.issue_date);
                              return isNaN(date.getTime()) ? "Invalid Date" : format(date, "MMM dd, yyyy");
                            } catch (error) {
                              return "Invalid Date";
                            }
                          })()}
                        </TableCell>
                        <TableCell>₦{invoice.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={isPaid ? "default" : isHalfPaid ? "secondary" : "destructive"}>
                            {isPaid ? "Paid" : isHalfPaid ? "Partially Paid" : "Not Paid"}
                          </Badge>
                        </TableCell>
                        <TableCell>₦{invoice.discount_amount.toFixed(2)}</TableCell>
                        <TableCell>₦{invoice.amount_paid.toFixed(2)}</TableCell>
                        <TableCell>
                          {(() => {
                            try {
                              if (!invoice.due_date) return "N/A";
                              const date = new Date(invoice.due_date);
                              return isNaN(date.getTime()) ? "Invalid Date" : format(date, "MMM dd, yyyy");
                            } catch (error) {
                              return "Invalid Date";
                            }
                          })()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createInvoiceDialogOpen} onOpenChange={setCreateInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Plus className="mr-2 h-5 w-5" />
              Create New Invoice
            </DialogTitle>
          </DialogHeader>
          <CreateInvoiceForm onComplete={handleInvoiceCreated} />
        </DialogContent>
      </Dialog>

      <InvoiceDetailsModal 
        invoice={selectedInvoice}
        isOpen={detailsModalOpen}
        onClose={handleCloseDetailsModal}
      />
    </div>
  );
};

export default Invoices;

