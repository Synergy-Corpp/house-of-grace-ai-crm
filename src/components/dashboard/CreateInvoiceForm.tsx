import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { CalendarIcon, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { invoices } from "@/data/invoices";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  invoiceNumber: z.string().min(1, { message: "Invoice number is required." }),
  customer: z.string().min(1, { message: "Please select a customer." }),
  notes: z.string().optional(),
  issueDate: z.date(),
  dueDate: z.date(),
  discount: z.number().min(0).max(100).default(0),
  paymentStatus: z.enum(["paid", "not_paid", "half_paid"]).default("not_paid"),
});

type FormValues = z.infer<typeof formSchema>;

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
  quantity: number;
}

interface InvoiceItem {
  id: string;
  product: string;
  cost: number;
  quantity: number;
  price: number;
  total: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  date: Date;
}

interface CreateInvoiceFormProps {
  onComplete?: () => void;
  onClose?: () => void;
}

const CreateInvoiceForm: React.FC<CreateInvoiceFormProps> = ({ onComplete, onClose }) => {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [showHalfPaymentModal, setShowHalfPaymentModal] = useState(false);
  const [halfPaymentAmount, setHalfPaymentAmount] = useState<number>(0);
  const [halfPaymentMethod, setHalfPaymentMethod] = useState<string>("cash");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: `#00033`,
      customer: "",
      notes: "",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      discount: 0,
      paymentStatus: "not_paid",
    },
  });

  // Load customers from database
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error loading customers:', error);
          toast.error('Failed to load customers');
        } else {
          setCustomers(data || []);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        toast.error('Failed to load customers');
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  // Load products from database
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');
        
        if (error) {
          console.error('Error loading products:', error);
          toast.error('Failed to load products');
        } else {
          setProducts(data || []);
        }
      } catch (error) {
        console.error('Error loading products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const addItem = () => {
    if (!selectedProduct) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    
    const newItem: InvoiceItem = {
      id: `item-${items.length + 1}`,
      product: product.name,
      cost: product.cost,
      quantity,
      price: product.price,
      total: product.price * quantity,
    };
    
    setItems([...items, newItem]);
    setSelectedProduct("");
    setQuantity(1);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addPayment = () => {
    if (paymentAmount <= 0) return;
    
    const newPayment: Payment = {
      id: `payment-${payments.length + 1}`,
      amount: paymentAmount,
      method: paymentMethod,
      date: new Date(),
    };
    
    setPayments([...payments, newPayment]);
    setPaymentAmount(0);
    toast.success(`Payment of ₦${paymentAmount.toFixed(2)} added successfully!`);
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(payment => payment.id !== id));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateDiscountAmount = () => {
    return (calculateSubtotal() * discountPercentage) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const calculateTotalPayments = () => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  const calculateOutstanding = () => {
    return calculateTotal() - calculateTotalPayments();
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addOutstanding = () => {
    const outstanding = calculateOutstanding();
    if (outstanding <= 0) return;
    
    const newPayment: Payment = {
      id: `payment-${payments.length + 1}`,
      amount: outstanding,
      method: paymentMethod,
      date: new Date(),
    };
    
    setPayments([...payments, newPayment]);
    toast.success(`Outstanding amount of ₦${outstanding.toFixed(2)} added as payment!`);
  };

  const savePaymentsToDatabase = async (invoiceId: string, customerId: string, customerName: string) => {
    try {
      for (const payment of payments) {
        const { error } = await supabase
          .from('payments')
          .insert({
            invoice_id: invoiceId,
            customer_id: customerId,
            customer_name: customerName,
            amount: payment.amount,
            payment_method: payment.method,
            payment_date: payment.date.toISOString().split('T')[0],
            payment_number: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: 'completed'
          });

        if (error) {
          console.error('Error saving payment:', error);
          toast.error(`Failed to save payment: ${payment.amount}`);
        }
      }
    } catch (error) {
      console.error('Error saving payments:', error);
      toast.error('Failed to save payments to database');
    }
  };

  const handlePaymentStatusChange = (status: string) => {
    if (status === "paid") {
      // Clear existing payments and add full payment
      setPayments([]);
      const total = calculateTotal();
      if (total > 0) {
        const fullPayment: Payment = {
          id: `payment-1`,
          amount: total,
          method: "cash",
          date: new Date(),
        };
        setPayments([fullPayment]);
      }
    } else if (status === "half_paid") {
      setShowHalfPaymentModal(true);
    } else {
      // Not paid - clear all payments
      setPayments([]);
    }
  };

  const handleHalfPaymentSubmit = () => {
    if (halfPaymentAmount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const total = calculateTotal();
    if (halfPaymentAmount >= total) {
      toast.error("Payment amount cannot be greater than or equal to total");
      return;
    }

    // Clear existing payments and add half payment
    setPayments([]);
    const halfPayment: Payment = {
      id: `payment-1`,
      amount: halfPaymentAmount,
      method: halfPaymentMethod,
      date: new Date(),
    };
    
    setPayments([halfPayment]);
    setShowHalfPaymentModal(false);
    setHalfPaymentAmount(0);
    toast.success(`Half payment of ₦${halfPaymentAmount.toFixed(2)} added successfully!`);
  };

  const onSubmit = async (data: FormValues) => {
    if (items.length === 0) {
      toast.error("Please add at least one item to the invoice.");
      return;
    }
    
    const selectedCustomer = customers.find(c => c.id === data.customer);
    if (!selectedCustomer) {
      toast.error("Please select a valid customer.");
      return;
    }

    try {
      // Save invoice to database
      const invoiceData = {
        invoice_number: data.invoiceNumber,
        customer_id: data.customer,
        customer_name: selectedCustomer.name,
        issue_date: data.issueDate.toISOString().split('T')[0],
        due_date: data.dueDate.toISOString().split('T')[0],
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscountAmount(),
        total: calculateTotal(),
        amount_paid: calculateTotalPayments(),
        status: calculateOutstanding() <= 0 ? 'paid' : 'pending',
        notes: data.notes || ''
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        toast.error('Failed to create invoice');
        return;
      }

      // Save invoice items
      for (const item of items) {
        const { error: itemError } = await supabase
          .from('invoice_items')
          .insert({
            invoice_id: invoice.id,
            product_name: item.product,
            quantity: item.quantity,
            unit_price: item.price,
            total: item.total
          });

        if (itemError) {
          console.error('Error saving invoice item:', itemError);
        }
      }

      // Save payments to database
      if (payments.length > 0) {
        await savePaymentsToDatabase(invoice.id, data.customer, selectedCustomer.name);
      }

      // Also add to local storage for backward compatibility
      const newInvoice = {
        id: invoice.id,
        invoiceNumber: data.invoiceNumber,
        clientName: selectedCustomer.name,
        issueDate: data.issueDate.toISOString(),
        dueDate: data.dueDate.toISOString(),
        total: calculateTotal(),
        isPaid: calculateOutstanding() <= 0,
        discountAmount: calculateDiscountAmount(),
        amountPaid: calculateTotalPayments(),
      };
      
      invoices.push(newInvoice);
      
      console.log("Invoice created successfully:", {
        ...data,
        items,
        payments,
        subtotal: calculateSubtotal(),
        discount: discountPercentage,
        discountAmount: calculateDiscountAmount(),
        total: calculateTotal(),
        outstanding: calculateOutstanding(),
      });
      
      toast.success("Invoice created successfully!");
      
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
      
      // Call the onClose callback if provided
      if (onClose) {
        onClose();
      }
      
      // Reset form
      form.reset();
      setItems([]);
      setPayments([]);
      setDiscountPercentage(0);
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Number */}
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Customer */}
            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <div className="relative">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={
                            isLoadingCustomers 
                              ? "Loading customers..." 
                              : customers.length === 0 
                                ? "No customers available" 
                                : "Select a customer"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingCustomers ? (
                          <div className="px-2 py-4 text-center text-muted-foreground">
                            Loading customers...
                          </div>
                        ) : customers.length === 0 ? (
                          <div className="px-2 py-4 text-center text-muted-foreground">
                            No customers found. Please add customers first.
                          </div>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                {customer.email && (
                                  <div className="text-sm text-muted-foreground">{customer.email}</div>
                                )}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Items Table */}
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-medium mb-4">Items</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Product</label>
                <Select
                  onValueChange={(value) => setSelectedProduct(value)}
                  value={selectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingProducts
                        ? "Loading products..."
                        : products.length === 0 
                          ? "No products available" 
                          : "Search for item"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingProducts ? (
                      <div className="px-2 py-4 text-center text-muted-foreground">
                        Loading products...
                      </div>
                    ) : products.length === 0 ? (
                      <div className="px-2 py-4 text-center text-muted-foreground">
                        No products found. Please add products first.
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center px-2 pb-1">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <Input
                            placeholder="Search..."
                            className="h-8"
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        {filteredProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ₦{product.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="md:col-span-2 flex items-end">
                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  className="w-full"
                  disabled={products.length === 0 || isLoadingProducts}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add Item
                </Button>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>QTY</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No items added yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product}</TableCell>
                        <TableCell>₦{item.cost.toFixed(2)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₦{item.price.toFixed(2)}</TableCell>
                        <TableCell>₦{item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add a note for the customer..." 
                    className="min-h-24"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Payment Section */}
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-medium mb-4">Payment</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              {/* Issue Date */}
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Issue Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "MMMM do, yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Due Date */}
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "MMMM do, yyyy")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Payment Status */}
            <div className="mb-6">
              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handlePaymentStatusChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_paid">Not Paid</SelectItem>
                        <SelectItem value="half_paid">Half Paid</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Manual Payment Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <div className="flex items-center">
                  <span className="bg-gray-100 border border-r-0 border-input px-3 py-2 text-sm rounded-l-md">
                    ₦
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <Select onValueChange={setPaymentMethod} defaultValue={paymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 items-end">
                <Button 
                  type="button" 
                  onClick={addPayment} 
                  variant="outline" 
                  className="w-full"
                  disabled={paymentAmount <= 0}
                >
                  Add Payment
                </Button>
                <Button 
                  type="button" 
                  onClick={addOutstanding} 
                  variant="outline" 
                  className="w-full"
                  disabled={calculateOutstanding() <= 0}
                >
                  Add Outstanding
                </Button>
              </div>
            </div>
            
            {/* Payments List */}
            {payments.length > 0 && (
              <div className="border rounded-md overflow-hidden mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>₦{payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="capitalize">{payment.method.replace('_', ' ')}</TableCell>
                        <TableCell>{format(payment.date, "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePayment(payment.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          
          {/* Discount & Totals */}
          <div className="space-y-4">
            {/* Discount */}
            <div className="border p-4 rounded-md">
              <div className="flex items-end gap-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium mb-1">Discount</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-input px-3 py-2 text-sm rounded-l-md">
                      %
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                
                <div className="w-2/3">
                  <label className="block text-sm font-medium mb-1">Discount Amount</label>
                  <Input
                    type="text"
                    readOnly
                    value={`₦ ${calculateDiscountAmount().toFixed(2)}`}
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
            
            {/* Totals */}
            <div className="border p-4 rounded-md">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Subtotal:</span>
                  <span>₦ {calculateSubtotal().toFixed(2)}</span>
                </div>
                
                {discountPercentage > 0 && (
                  <div className="flex justify-between items-center text-gray-500">
                    <span>Discount ({discountPercentage}%):</span>
                    <span>- ₦ {calculateDiscountAmount().toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t font-bold">
                  <span>Total:</span>
                  <span>₦ {calculateTotal().toFixed(2)}</span>
                </div>
                
                {payments.length > 0 && (
                  <>
                    <div className="flex justify-between items-center text-gray-500">
                      <span>Paid:</span>
                      <span>₦ {calculateTotalPayments().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t font-bold">
                      <span>Balance Due:</span>
                      <span>₦ {calculateOutstanding().toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <Button type="submit" className="w-full md:w-auto">
            Save Invoice
          </Button>
        </form>
      </Form>

      {/* Half Payment Modal */}
      <Dialog open={showHalfPaymentModal} onOpenChange={setShowHalfPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Half Payment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount Paid</label>
              <div className="flex items-center">
                <span className="bg-gray-100 border border-r-0 border-input px-3 py-2 text-sm rounded-l-md">
                  ₦
                </span>
                <Input
                  type="number"
                  min="0"
                  max={calculateTotal()}
                  value={halfPaymentAmount}
                  onChange={(e) => setHalfPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="rounded-l-none"
                  placeholder="Enter amount paid"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <Select onValueChange={setHalfPaymentMethod} defaultValue={halfPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {halfPaymentAmount > 0 && (
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>₦{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span>₦{halfPaymentAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Balance:</span>
                    <span>₦{(calculateTotal() - halfPaymentAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowHalfPaymentModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleHalfPaymentSubmit}
                className="w-full"
                disabled={halfPaymentAmount <= 0}
              >
                Add Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateInvoiceForm;
