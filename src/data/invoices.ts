
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  total: number;
  isPaid: boolean;
  discountAmount: number;
  amountPaid: number;
}

// Shared invoice store - in a real app, this would be managed by a state management library or backend
export const invoices: Invoice[] = [];
