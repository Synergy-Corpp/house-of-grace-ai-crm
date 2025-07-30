
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import PaymentInvoiceModal from "@/components/payments/PaymentInvoiceModal";

interface Payment {
  id: string;
  payment_number: string;
  customer_name: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  confirmed_by: string | null;
  status: string;
  created_at: string;
}

const Payments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      return data as Payment[];
    },
  });

  const handlePaymentClick = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setInvoiceModalOpen(true);
  };

  const handleCloseModal = () => {
    setInvoiceModalOpen(false);
    setSelectedPaymentId(null);
  };

  // Filter payments based on search query
  const filteredPayments = payments?.filter(payment => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const customerName = payment.customer_name.toLowerCase();
    const paymentDate = format(new Date(payment.payment_date), 'MMM dd, yyyy').toLowerCase();
    
    return customerName.includes(query) || paymentDate.includes(query);
  }) || [];

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center mb-6">
          <CreditCard className="mr-2 h-6 w-6" />
          <h1 className="text-3xl font-bold">Payments</h1>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="py-8">
        <div className="flex items-center mb-6">
          <CreditCard className="mr-2 h-6 w-6" />
          <h1 className="text-3xl font-bold">Payments</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              View all processed payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Confirmed By</TableHead>
                  <TableHead>Mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No results.</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page 1 of 0
              </span>
              
              <Button variant="outline" size="sm" disabled>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center mb-6">
        <CreditCard className="mr-2 h-6 w-6" />
        <h1 className="text-3xl font-bold">Payments</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View all processed payments. Click on any payment to see its linked invoice.
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Confirmed By</TableHead>
                <TableHead>Mode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow 
                  key={payment.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handlePaymentClick(payment.id)}
                >
                  <TableCell className="font-medium">{payment.payment_number}</TableCell>
                  <TableCell>{payment.customer_name}</TableCell>
                  <TableCell>{format(new Date(payment.payment_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>₦{payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{payment.confirmed_by || 'System'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {payment.payment_method}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>
            
            <span className="text-sm text-muted-foreground">
              Page 1 of {Math.ceil(filteredPayments.length / 10)}
            </span>
            
            <Button variant="outline" size="sm" disabled>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaymentInvoiceModal 
        paymentId={selectedPaymentId}
        isOpen={invoiceModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Payments;
