
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt, Plus, Download, Eye } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import CreateReceiptForm from "@/components/dashboard/CreateReceiptForm";
import ReceiptsList from "@/components/receipts/ReceiptsList";
import ReceiptPreviewModal from "@/components/receipts/ReceiptPreviewModal";

const Receipts = () => {
  const [createReceiptDialogOpen, setCreateReceiptDialogOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);
  const queryClient = useQueryClient();

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          customer:customers(phone),
          receipt_items (
            id,
            product_name,
            quantity,
            unit_price,
            total
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleReceiptCreated = () => {
    setCreateReceiptDialogOpen(false);
    // Invalidate and refetch receipts
    queryClient.invalidateQueries({ queryKey: ['receipts'] });
  };

  const handleDownloadReceipt = (receipt) => {
    // Create a simple receipt format for download
    const receiptContent = `
TECHELITE INVENTORY
Receipt #${receipt.receipt_number}
Date: ${new Date(receipt.created_at).toLocaleDateString()}

Customer: ${receipt.customer_name}

ITEMS:
${receipt.receipt_items.map(item => 
  `${item.product_name} x${item.quantity} @ ₦${item.unit_price} = ₦${item.total}`
).join('\n')}

Subtotal: ₦${receipt.subtotal}
Discount: -₦${receipt.discount_amount}
Tax: +₦${receipt.tax_amount}
TOTAL: ₦${receipt.total}

Thank you for your business!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receipt_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Receipt className="mr-2 h-6 w-6" />
          <h1 className="text-2xl sm:text-3xl font-bold">Receipts</h1>
        </div>
        
        <Button onClick={() => setCreateReceiptDialogOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          New Receipt
        </Button>
      </div>

      {receipts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="mr-2 h-5 w-5" />
              All Receipts
            </CardTitle>
            <CardDescription>
              View and manage all receipts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="rounded-full bg-gray-100 p-6 inline-flex mb-4">
                <Receipt className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No receipts yet</h3>
              <p className="text-muted-foreground">
                Create your first receipt to get started!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ReceiptsList 
          receipts={receipts}
          isLoading={isLoading}
          onDownload={handleDownloadReceipt}
          onPreview={setPreviewReceipt}
        />
      )}

      <Dialog open={createReceiptDialogOpen} onOpenChange={setCreateReceiptDialogOpen}>
        <DialogContent className="max-w-4xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Plus className="mr-2 h-5 w-5" />
              Create New Receipt
            </DialogTitle>
          </DialogHeader>
          <CreateReceiptForm onComplete={handleReceiptCreated} />
        </DialogContent>
      </Dialog>

      {previewReceipt && (
        <ReceiptPreviewModal
          receipt={previewReceipt}
          isOpen={!!previewReceipt}
          onClose={() => setPreviewReceipt(null)}
          onDownload={() => handleDownloadReceipt(previewReceipt)}
        />
      )}
    </div>
  );
};

export default Receipts;
