
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { FileText, Calendar, User, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PaymentInvoiceModalProps {
  paymentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const PaymentInvoiceModal: React.FC<PaymentInvoiceModalProps> = ({ paymentId, isOpen, onClose }) => {
  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice-for-payment', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      
      // First get the payment to find the invoice_id
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('invoice_id')
        .eq('id', paymentId)
        .single();
        
      if (paymentError || !payment?.invoice_id) {
        console.error('Error fetching payment or no invoice linked:', paymentError);
        return null;
      }
      
      // Then get the invoice details
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', payment.invoice_id)
        .single();
        
      if (invoiceError) {
        console.error('Error fetching invoice:', invoiceError);
        throw invoiceError;
      }
      
      return invoiceData;
    },
    enabled: !!paymentId && isOpen,
  });

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading invoice details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!invoice) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>No Invoice Found</DialogTitle>
          </DialogHeader>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground">No invoice is linked to this payment.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isPaid = invoice.status === 'paid' || invoice.amount_paid >= invoice.total;
  const isHalfPaid = invoice.amount_paid > 0 && invoice.amount_paid < invoice.total;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice #{invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Customer</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Issue Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.issue_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.due_date ? format(new Date(invoice.due_date), "MMM dd, yyyy") : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant={isPaid ? "default" : isHalfPaid ? "secondary" : "destructive"}>
                      {isPaid ? "Paid" : isHalfPaid ? "Partially Paid" : "Not Paid"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Amount:</span>
                <span className="font-medium">₦{invoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Discount Given:</span>
                <span className="font-medium">₦{invoice.discount_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm">Amount Paid:</span>
                <span className="font-medium text-green-600">₦{invoice.amount_paid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Balance:</span>
                <span className="font-medium text-red-600">
                  ₦{(invoice.total - invoice.amount_paid).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notes (if any) */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentInvoiceModal;
