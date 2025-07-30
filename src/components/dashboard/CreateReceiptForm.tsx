import React, { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/utils/activityLogger";
import { useAuth } from "@/hooks/useAuth";

const receiptItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Price must be 0 or greater"),
});

const receiptFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerAddress: z.string().min(1, "Address is required"),
  customerPhone: z.string().min(1, "Phone is required"),
  items: z.array(receiptItemSchema).min(1, "At least one item is required"),
  discountPercent: z.coerce.number().min(0).max(100, "Discount must be between 0-100%"),
  taxPercent: z.coerce.number().min(0).max(100, "Tax must be between 0-100%"),
  shippingCost: z.coerce.number().min(0, "Shipping cost must be 0 or greater"),
});

type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

interface CreateReceiptFormProps {
  onComplete: () => void;
}

const CreateReceiptForm: React.FC<CreateReceiptFormProps> = ({ onComplete }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerAddress: "",
      customerPhone: "",
      items: [{ name: "", description: "", quantity: 1, unitPrice: 0 }],
      discountPercent: 0,
      taxPercent: 0,
      shippingCost: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discountPercent");
  const watchedTax = form.watch("taxPercent");
  const watchedShipping = form.watch("shippingCost");

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * watchedDiscount) / 100;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return ((subtotal - discount) * watchedTax) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    return subtotal - discount + tax + watchedShipping;
  };

  const onSubmit = async (data: ReceiptFormValues) => {
    setIsSubmitting(true);
    try {
      const receiptNumber = `REC-${Date.now()}`;
      const subtotal = calculateSubtotal();
      const discountAmount = calculateDiscount();
      const taxAmount = calculateTax();
      const total = calculateTotal();

      // First, create or get customer
      let customerId = null;
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', data.customerEmail)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: data.customerName,
            email: data.customerEmail,
            address: data.customerAddress,
            phone: data.customerPhone,
          })
          .select('id')
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;

        // Log customer creation activity
        if (user) {
          try {
            await logActivity({
              action: 'create',
              entityType: 'customer',
              entityName: data.customerName,
              userEmail: user.email,
              entityId: newCustomer.id,
              details: {
                name: data.customerName,
                email: data.customerEmail
              }
            });
          } catch (error) {
            console.error('Error logging customer creation activity:', error);
          }
        }
      }

      // Create receipt
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          receipt_number: receiptNumber,
          customer_id: customerId,
          customer_name: data.customerName,
          subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total,
          payment_method: 'cash', // Default payment method
        })
        .select('id')
        .single();

      if (receiptError) throw receiptError;

      // Create receipt items
      const receiptItems = data.items.map(item => ({
        receipt_id: receipt.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(receiptItems);

      if (itemsError) throw itemsError;

      // Log receipt creation activity
      if (user) {
        try {
          await logActivity({
            action: 'create',
            entityType: 'receipt',
            entityName: `Receipt ${receiptNumber}`,
            userEmail: user.email,
            entityId: receipt.id,
            details: {
              receiptNumber,
              customerName: data.customerName,
              total,
              itemCount: data.items.length
            }
          });
        } catch (error) {
          console.error('Error logging receipt creation activity:', error);
        }
      }

      toast.success("Receipt created successfully!");
      onComplete();
    } catch (error) {
      console.error('Error creating receipt:', error);
      toast.error("Failed to create receipt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* HG Logo in top right */}
        <div className="absolute top-4 right-4">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-black">HG</span>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold">Create Receipt</h2>
          <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter customer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Receipt Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", description: "", quantity: 1, unitPrice: 0 })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg">
                <FormField
                  control={form.control}
                  name={`items.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Item Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Description" {...field} />
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
                      <FormLabel>Qty Sold</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Per Unit (₦)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end">
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
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <FormField
            control={form.control}
            name="taxPercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax (%)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="100" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shippingCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shipping Cost (₦)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₦{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount ({watchedDiscount}%):</span>
                <span>-₦{calculateDiscount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({watchedTax}%):</span>
                <span>+₦{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>+₦{watchedShipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>₦{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating Receipt..." : "Create Receipt and Record Payment"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateReceiptForm;
