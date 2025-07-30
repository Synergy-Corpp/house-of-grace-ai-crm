
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Download, Eye } from "lucide-react";

interface ReceiptsListProps {
  receipts: any[];
  isLoading: boolean;
  onDownload: (receipt: any) => void;
  onPreview: (receipt: any) => void;
}

const ReceiptsList: React.FC<ReceiptsListProps> = ({ receipts, isLoading, onDownload, onPreview }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">Loading receipts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Receipt className="mr-2 h-5 w-5" />
          All Receipts ({receipts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                  <TableCell>{receipt.customer_name}</TableCell>
                  <TableCell>{new Date(receipt.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>₦{receipt.total.toFixed(2)}</TableCell>
                  <TableCell>{receipt.receipt_items?.length || 0} items</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPreview(receipt)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(receipt)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReceiptsList;
