import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { FileText, Calendar, User, CreditCard } from "lucide-react";

interface InvoiceDetailsModalProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to safely format dates
const safeFormatDate = (dateValue: any, fallback: string = "N/A"): string => {
  if (!dateValue) return fallback;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return format(date, "MMM dd, yyyy");
  } catch (error) {
    console.error('Error formatting date:', error, 'Value:', dateValue);
    return fallback;
  }
};
const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ invoice, isOpen, onClose }) => {
  if (!invoice) return null;

  const isPaid = invoice.status === 'paid' || invoice.amount_paid >= invoice.total;
  const isHalfPaid = invoice.amount_paid > 0 && invoice.amount_paid < invoice.total;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice #{invoice.invoiceNumber}
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
                    <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Issue Date</p>
                    <p className="text-sm text-muted-foreground">
                      {safeFormatDate(invoice.issue_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm text-muted-foreground">
                      {safeFormatDate(invoice.due_date)}
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
                <span className="font-medium">₦{(invoice.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Discount Given:</span>
                <span className="font-medium">₦{(invoice.discount_amount || 0).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm">Amount Paid:</span>
                <span className="font-medium text-green-600">₦{(invoice.amount_paid || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Balance:</span>
                <span className="font-medium text-red-600">
                  ₦{((invoice.total || 0) - (invoice.amount_paid || 0)).toFixed(2)}
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

export default InvoiceDetailsModal;

