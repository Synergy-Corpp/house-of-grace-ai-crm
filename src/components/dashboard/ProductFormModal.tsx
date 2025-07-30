
import React from "react";
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
import { products } from "@/data/products";
import { logActivity } from "@/utils/activityLogger";

// Simplified schema for product form validation
const productFormSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  costPrice: z.coerce.number().min(0, { message: "Cost price must be 0 or greater." }),
  price: z.coerce.number().min(0, { message: "Price must be 0 or greater." }),
  quantityInStock: z.coerce.number().min(0, { message: "Quantity must be 0 or greater." }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormModalProps {
  onClose: () => void;
  onComplete?: (productName: string) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ onClose, onComplete }) => {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      costPrice: 0,
      price: 0,
      quantityInStock: 0,
    },
  });

  const onSubmit = (data: ProductFormValues) => {
    // Generate a simple product ID
    const productId = `PROD-${Date.now()}`;
    
    // Check if product name already exists
    const productExists = products.some(product => product.name.toLowerCase() === data.name.toLowerCase());
    
    if (productExists) {
      toast.error("A product with this name already exists");
      return;
    }

    // Add new product to the products array
    const newProduct = {
      id: productId,
      name: data.name,
      category: "General",
      brand: "N/A",
      price: data.price,
      cost: data.costPrice,
      image: "/placeholder.svg",
      rating: 0,
      inStock: data.quantityInStock > 0,
      freeShipping: false,
      featured: false,
      specs: {},
      description: `${data.name} - Available in stock`,
      quantity: data.quantityInStock,
    };

    products.push(newProduct);
    
    // Log the activity with correct parameter format
    logActivity({
      action: 'create',
      entityType: 'product',
      entityName: data.name,
      userEmail: 'current@user.com', // This should come from auth context
      entityId: newProduct.id,
      details: {
        costPrice: data.costPrice,
        sellingPrice: data.price,
        quantity: data.quantityInStock
      }
    });
    
    toast.success("Product added successfully!");
    
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete(data.name);
    }
    
    form.reset();
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="quantityInStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity in Stock</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-brand-blue hover:bg-brand-darkBlue">
            Save Product
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductFormModal;
