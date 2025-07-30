
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, X } from "lucide-react";

interface ReceiptPreviewModalProps {
  receipt: any;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({ 
  receipt, 
  isOpen, 
  onClose, 
  onDownload 
}) => {
  const [isPaid, setIsPaid] = useState(true);

  if (!receipt) return null;

  const handleDownloadPDF = () => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt ${receipt.receipt_number}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .receipt-container { 
              max-width: 600px; 
              margin: 0 auto; 
              border: 1px solid #ddd;
              padding: 20px;
            }
            .header { 
              text-center; 
              margin-bottom: 30px; 
            }
            .logo { 
              width: 60px; 
              height: 60px; 
              background: #fbbf24; 
              border-radius: 50%; 
              display: inline-flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 24px; 
              font-weight: bold; 
              color: black; 
              margin-bottom: 10px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin: 10px 0; 
            }
            .payment-status { 
              text-align: center; 
              margin: 20px 0; 
            }
            .status-badge { 
              display: inline-block; 
              padding: 8px 16px; 
              border-radius: 20px; 
              font-weight: bold; 
              font-size: 14px;
            }
            .paid { 
              background: #dcfce7; 
              color: #166534; 
            }
            .not-paid { 
              background: #fee2e2; 
              color: #991b1b; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0; 
            }
            th, td { 
              border-bottom: 1px solid #ddd; 
              padding: 10px; 
              text-align: left; 
            }
            th { 
              font-weight: bold; 
              border-bottom: 2px solid #333; 
            }
            .totals { 
              margin-top: 20px; 
              border-top: 2px solid #333; 
              padding-top: 10px; 
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 5px 0; 
            }
            .final-total { 
              font-size: 18px; 
              font-weight: bold; 
              border-top: 1px solid #333; 
              padding-top: 10px; 
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              color: #666; 
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="logo">HG</div>
              <div class="company-name">HG INVENTORY</div>
              <p>Official Receipt</p>
              <p>Receipt #${receipt.receipt_number}</p>
              <p>Date: ${new Date(receipt.created_at).toLocaleDateString()}</p>
            </div>

            <div class="payment-status">
              <span class="status-badge ${isPaid ? 'paid' : 'not-paid'}">
                ${isPaid ? 'Paid' : 'Not Paid'}
              </span>
            </div>

            <div style="margin: 20px 0;">
              <h3>Customer Information:</h3>
              <p>Name: ${receipt.customer_name}</p>
              ${receipt.customer?.phone ? `<p>Phone: ${receipt.customer.phone}</p>` : ''}
            </div>

            <h3>Items:</h3>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Unit Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${receipt.receipt_items?.map((item: any) => `
                  <tr>
                    <td>${item.product_name}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">₦${item.unit_price.toFixed(2)}</td>
                    <td style="text-align: right;">₦${item.total.toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>₦${receipt.subtotal.toFixed(2)}</span>
              </div>
              ${receipt.discount_amount > 0 ? `
                <div class="total-row" style="color: #dc2626;">
                  <span>Discount:</span>
                  <span>-₦${receipt.discount_amount.toFixed(2)}</span>
                </div>
              ` : ''}
              ${receipt.tax_amount > 0 ? `
                <div class="total-row">
                  <span>Tax:</span>
                  <span>+₦${receipt.tax_amount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row final-total">
                <span>Total:</span>
                <span>₦${receipt.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>© ${new Date().getFullYear()} HG Inventory</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Receipt Preview
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {/* Payment Status Control */}
        <div className="flex items-center space-x-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <Checkbox 
            id="payment-status" 
            checked={isPaid}
            onCheckedChange={(checked) => setIsPaid(checked as boolean)}
          />
          <label htmlFor="payment-status" className="text-sm font-medium cursor-pointer">
            Mark as Paid
          </label>
        </div>
        
        <div className="bg-white p-8 border rounded-lg relative">
          {/* HG Logo in top right */}
          <div className="absolute top-4 right-4">
            <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-black">HG</span>
            </div>
          </div>
          
          {/* Receipt Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">HG INVENTORY</h1>
            <p className="text-gray-600">Official Receipt</p>
            <p className="text-sm text-gray-500 mt-2">Receipt #{receipt.receipt_number}</p>
            <p className="text-sm text-gray-500">Date: {new Date(receipt.created_at).toLocaleDateString()}</p>
          </div>

          {/* Payment Status */}
          <div className="mb-6 text-center">
            <Badge 
              className={`text-sm font-semibold px-3 py-1 ${
                isPaid 
                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                  : "bg-red-100 text-red-800 hover:bg-red-100"
              }`}
            >
              {isPaid ? "Paid" : "Not Paid"}
            </Badge>
          </div>

          {/* Customer Information */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Customer Information:</h3>
            <p className="text-gray-700 mb-1">Name: {receipt.customer_name}</p>
            {receipt.customer?.phone && (
              <p className="text-gray-700">Phone: {receipt.customer.phone}</p>
            )}
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Items:</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2">Item</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Unit Price</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.receipt_items?.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2">{item.product_name}</td>
                    <td className="text-center py-2">{item.quantity}</td>
                    <td className="text-right py-2">₦{item.unit_price.toFixed(2)}</td>
                    <td className="text-right py-2">₦{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span>₦{receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.discount_amount > 0 && (
              <div className="flex justify-between mb-2 text-red-600">
                <span>Discount:</span>
                <span>-₦{receipt.discount_amount.toFixed(2)}</span>
              </div>
            )}
            {receipt.tax_amount > 0 && (
              <div className="flex justify-between mb-2">
                <span>Tax:</span>
                <span>+₦{receipt.tax_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
              <span>Total:</span>
              <span>₦{receipt.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-600">
            <p className="text-sm">Thank you for your business!</p>
            <p className="text-xs mt-2">© {new Date().getFullYear()} HG Inventory</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreviewModal;
