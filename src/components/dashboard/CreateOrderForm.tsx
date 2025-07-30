import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SearchableSelect from "@/components/SearchableSelect";

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  cost: z.coerce.number().min(0, "Cost must be 0 or greater"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
});

const orderFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerId: z.string().min(1, "Customer is required"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  paymentAmount: z.coerce.number().min(0, "Payment amount must be 0 or greater"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentStatus: z.string().min(1, "Payment status is required"),
  paymentReference: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  transactionId: z.string().optional(),
  paymentNotes: z.string().optional(),
  discountPercent: z.coerce.number().min(0).max(100, "Discount must be between 0-100%"),
});

const newCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;
type NewCustomerValues = z.infer<typeof newCustomerSchema>;

interface CreateOrderFormProps {
  onComplete: () => void;
}

interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
  quantity: number;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ onComplete }) => {
  const [addOutstanding, setAddOutstanding] = useState(false);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; email?: string; phone?: string; address?: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      invoiceNumber: `#${String(Date.now()).slice(-5)}`,
      customerId: "",
      items: [{ productId: "", productName: "", cost: 0, quantity: 1, price: 0 }],
      notes: "",
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      paymentAmount: 0,
      paymentMethod: "cash",
      paymentStatus: "pending",
      paymentReference: "",
      bankName: "",
      accountNumber: "",
      transactionId: "",
      paymentNotes: "",
      discountPercent: 0,
    },
  });

  const newCustomerForm = useForm<NewCustomerValues>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discountPercent");
  const watchedPaymentMethod = form.watch("paymentMethod");

  // Load customers from database
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('id, name, email, phone, address')
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

  const customerOptions = customers.map(customer => ({
    value: customer.id,
    label: `${customer.name}${customer.email ? ` (${customer.email})` : ''}`
  }));

  const productOptions = products.map(product => ({
    value: product.id,
    label: product.name
  }));

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * watchedDiscount) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscountAmount();
    return subtotal - discount;
  };

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct) {
      form.setValue(`items.${index}.productId`, productId);
      form.setValue(`items.${index}.productName`, selectedProduct.name);
      form.setValue(`items.${index}.cost`, selectedProduct.cost);
      form.setValue(`items.${index}.price`, selectedProduct.price);
    }
  };

  const handleAddNewCustomer = async (data: NewCustomerValues) => {
    try {
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert([{
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        toast.error('Failed to create customer');
        return;
      }

      // Add to local customers list
      setCustomers(prev => [...prev, newCustomer]);
      
      // Select the new customer in the form
      form.setValue('customerId', newCustomer.id);
      
      // Reset and close modal
      newCustomerForm.reset();
      setShowNewCustomerModal(false);
      
      toast.success('Customer created successfully!');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    try {
      const selectedCustomer = customers.find(c => c.id === data.customerId);
      
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: data.invoiceNumber,
          customer_id: data.customerId,
          customer_name: selectedCustomer?.name || '',
          subtotal: calculateSubtotal(),
          discount_amount: calculateDiscountAmount(),
          total: calculateTotal(),
          notes: data.notes || null,
          order_date: data.issueDate,
          status: 'pending'
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        toast.error('Failed to create order');
        return;
      }

      // Create order items
      const orderItems = data.items.map(item => ({
        order_id: order.id,
        product_id: item.productId || null,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.quantity * item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        toast.error('Failed to create order items');
        return;
      }

      // Create payment record if payment amount > 0
      if (data.paymentAmount > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([{
            customer_id: data.customerId,
            customer_name: selectedCustomer?.name || '',
            amount: data.paymentAmount,
            payment_method: data.paymentMethod,
            payment_date: data.issueDate,
            status: data.paymentStatus,
            notes: data.paymentNotes || null,
            payment_number: `PAY-${order.order_number}`,
          }]);

        if (paymentError) {
          console.error('Error creating payment:', paymentError);
          toast.error('Failed to create payment record');
          return;
        }
      }

      toast.success("Order created successfully!");
      onComplete();
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Create Order</h2>
            <p className="text-muted-foreground">{format(new Date(), 'M/d/yyyy')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Customer</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewCustomerModal(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Add New
                </Button>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Customer</FormLabel>
                      <FormControl>
                        {isLoadingCustomers ? (
                          <div className="text-sm text-muted-foreground">Loading customers...</div>
                        ) : (
                          <SearchableSelect
                            options={customerOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Search for customer"
                            emptyText="No customer found"
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: "", productName: "", cost: 0, quantity: 1, price: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-4 font-medium text-sm">
                  <span>Item</span>
                  <span>Cost</span>
                  <span>QTY</span>
                  <span>Price</span>
                  <span>Total</span>
                  <span></span>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-6 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            {isLoadingProducts ? (
                              <div className="text-sm text-muted-foreground p-2 border rounded">
                                Loading products...
                              </div>
                            ) : (
                              <SearchableSelect
                                options={productOptions}
                                value={field.value}
                                onValueChange={(value) => handleProductSelect(index, value)}
                                placeholder={products.length === 0 ? "No products found" : "Search for item"}
                                emptyText="No item found"
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.cost`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center">
                              <span className="text-sm mr-1">₦</span>
                              <Input type="number" step="0.01" min="0" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex items-center">
                              <span className="text-sm mr-1">₦</span>
                              <Input type="number" step="0.01" min="0" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="text-sm">
                      ₦{(watchedItems[index]?.quantity * watchedItems[index]?.price || 0).toFixed(2)}
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Add a note for the order..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Amount (₦)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="transfer">Bank Transfer</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="mobile">Mobile Payment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="partial">Partially Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Reference (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Receipt #12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Conditional fields based on payment method */}
              {(watchedPaymentMethod === "transfer" || watchedPaymentMethod === "card") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., First Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Last 4 digits only" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Transaction reference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Notes (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional payment details" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Discount</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="discountPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="mt-2 text-sm text-muted-foreground">
                  Discount Amount: ₦{calculateDiscountAmount().toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₦{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₦{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button type="submit" className="w-full">
            Create Order
          </Button>
        </form>
      </Form>

      {/* New Customer Modal */}
      <Dialog open={showNewCustomerModal} onOpenChange={setShowNewCustomerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Add New Customer
            </DialogTitle>
          </DialogHeader>
          <Form {...newCustomerForm}>
            <form onSubmit={newCustomerForm.handleSubmit(handleAddNewCustomer)} className="space-y-4">
              <FormField
                control={newCustomerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newCustomerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (optional)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newCustomerForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={newCustomerForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter customer address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Add Customer
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewCustomerModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateOrderForm;
