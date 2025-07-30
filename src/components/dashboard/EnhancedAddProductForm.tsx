
import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { categories, brands } from "@/data/products";
import { Upload, Wand2 } from "lucide-react";

const productFormSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  description: z.string().optional(),
  costPrice: z.coerce.number().min(0, { message: "Cost price must be 0 or greater." }),
  price: z.coerce.number().min(0, { message: "Price must be 0 or greater." }),
  quantityInStock: z.coerce.number().min(0, { message: "Quantity must be 0 or greater." }),
  category: z.string().min(1, { message: "Please select a category." }),
  brand: z.string().min(1, { message: "Please select a brand." }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface EnhancedAddProductFormProps {
  onComplete?: (productName: string, productId: string) => void;
}

const EnhancedAddProductForm: React.FC<EnhancedAddProductFormProps> = ({ onComplete }) => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      costPrice: 0,
      price: 0,
      quantityInStock: 0,
      category: "",
      brand: "",
    },
  });

  const generateProductImage = async (productName: string, category: string) => {
    setIsGeneratingImage(true);
    try {
      console.log('Generating image for product:', productName);
      
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Professional product photo of ${productName}, ${category} category, clean white background, high quality, commercial photography style`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      
      if (data.imageURL) {
        setPreviewImage(data.imageURL);
        toast.success("Product image generated successfully!");
      } else {
        throw new Error('No image URL returned');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error("Failed to generate image. You can still add the product without an image.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToSupabase = async (file: File, productId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      // Check if product name already exists
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('name')
        .ilike('name', data.name);

      if (checkError) {
        throw checkError;
      }

      if (existingProducts && existingProducts.length > 0) {
        toast.error("A product with this name already exists");
        return;
      }

      // Create the product first
      const { data: newProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          name: data.name,
          description: data.description || null,
          cost: data.costPrice,
          price: data.price,
          quantity: data.quantityInStock,
          category: data.category,
          brand: data.brand,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      let imageUrl = null;

      // Handle image upload if there's a file
      if (imageFile) {
        imageUrl = await uploadImageToSupabase(imageFile, newProduct.id);
      } else if (previewImage && previewImage.startsWith('http')) {
        // If we have a generated image URL, use it directly
        imageUrl = previewImage;
      }

      // Update product with image URL if we have one
      if (imageUrl) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: imageUrl })
          .eq('id', newProduct.id);

        if (updateError) {
          console.error('Error updating image URL:', updateError);
        }
      }

      toast.success("Product added successfully!");
      
      if (onComplete) {
        onComplete(data.name, newProduct.id);
      }
      
      form.reset();
      setPreviewImage(null);
      setImageFile(null);

    } catch (error) {
      console.error('Error adding product:', error);
      toast.error("Failed to add product. Please try again.");
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

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter product description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.value} value={brand.value}>
                        {brand.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        {/* Image Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Product Image</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const name = form.getValues('name');
                  const category = form.getValues('category');
                  if (name && category) {
                    generateProductImage(name, category);
                  } else {
                    toast.error("Please enter product name and select category first");
                  }
                }}
                disabled={isGeneratingImage}
                className="flex items-center gap-2"
              >
                <Wand2 className="h-4 w-4" />
                {isGeneratingImage ? "Generating..." : "Generate Image"}
              </Button>
              
              <Button type="button" variant="outline" asChild>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>

          {previewImage && (
            <div className="border rounded-lg p-4">
              <img
                src={previewImage}
                alt="Product preview"
                className="max-h-48 mx-auto rounded"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-brand-gold hover:bg-yellow-600">
            {isSubmitting ? "Adding Product..." : "Add Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EnhancedAddProductForm;
