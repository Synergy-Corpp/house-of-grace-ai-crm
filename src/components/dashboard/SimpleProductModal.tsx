
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const productFormSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  costPrice: z.coerce.number().min(0, { message: "Cost price must be 0 or greater." }),
  price: z.coerce.number().min(0, { message: "Price must be 0 or greater." }),
  quantityInStock: z.coerce.number().min(0, { message: "Quantity must be 0 or greater." }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface SimpleProductModalProps {
  onComplete?: (productName: string, productId: string) => void;
}

const SimpleProductModal: React.FC<SimpleProductModalProps> = ({ onComplete }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      costPrice: 0,
      price: 0,
      quantityInStock: 0,
    },
  });

  const generateProductImage = async (productName: string): Promise<string | null> => {
    try {
      console.log('Generating image for product:', productName);
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Professional product photo of ${productName}, clean white background, high quality, commercial photography style, detailed, well-lit`
        }),
      });

      if (!response.ok) {
        console.error('Failed to generate image:', response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.imageURL) {
        console.log('Image generated successfully:', data.imageURL);
        return data.imageURL;
      } else {
        console.error('No image URL returned');
        return null;
      }
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    console.log('Starting product submission with data:', data);
    
    try {
      // Check if product name already exists
      console.log('Checking for existing products with name:', data.name);
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('name')
        .ilike('name', data.name);

      if (checkError) {
        console.error('Error checking existing products:', checkError);
        throw checkError;
      }

      console.log('Existing products check result:', existingProducts);

      if (existingProducts && existingProducts.length > 0) {
        console.log('Product with this name already exists');
        toast({
          title: "Error",
          description: "A product with this name already exists",
          variant: "destructive",
        });
        return;
      }

      // Generate image for the product
      console.log('Generating image for:', data.name);
      const imageUrl = await generateProductImage(data.name);
      
      if (imageUrl) {
        console.log('Image generated successfully, URL:', imageUrl);
      } else {
        console.log('Image generation failed, proceeding without image');
      }

      // Create the product
      console.log('Inserting new product into database');
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          name: data.name,
          cost: data.costPrice,
          price: data.price,
          quantity: data.quantityInStock,
          category: "General",
          brand: "N/A",
          image_url: imageUrl,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting product:', insertError);
        throw insertError;
      }

      console.log('Product inserted successfully:', newProduct);

      toast({
        title: "Success",
        description: `Product added successfully${imageUrl ? ' with generated image' : ''}!`,
      });
      
      if (onComplete) {
        console.log('Calling onComplete callback with:', data.name, newProduct.id);
        onComplete(data.name, newProduct.id);
      }
      
      form.reset();

    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
                <FormLabel>Cost Price (₦)</FormLabel>
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
                <FormLabel>Selling Price (₦)</FormLabel>
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
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding Product..." : "Save Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SimpleProductModal;
