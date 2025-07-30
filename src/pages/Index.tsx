import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProductCard from "../components/ProductCard";
import Filters from "../components/Filters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package, Plus, Trash2 } from "lucide-react";
import AddProductForm from "@/components/dashboard/AddProductForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/utils/activityLogger";
import { useAuth } from "@/hooks/useAuth";

interface Product {
  id: string;
  name: string;
  category: string | null;
  brand: string | null;
  price: number;
  cost: number;
  image_url: string | null;
  image: string;
  rating: number;
  inStock: boolean;
  freeShipping: boolean;
  featured: boolean;
  specs: Record<string, any>;
  description: string | null;
  quantity: number;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      console.log('Fetching products...');
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      console.log('Raw products data:', data);
      
      const processedProducts = (data || []).map(product => ({
        ...product,
        image: product.image_url || "/placeholder.svg",
        inStock: product.quantity > 0,
        rating: 4.5,
        freeShipping: false,
        featured: false,
        specs: {},
      })) as Product[];
      
      console.log('Processed products:', processedProducts);
      return processedProducts;
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (product: { id: string; name: string }) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);
      
      if (error) throw error;
      return product;
    },
    onSuccess: async (deletedProduct) => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      
      // Log the deletion activity
      if (user) {
        try {
          await logActivity({
            action: 'delete',
            entityType: 'product',
            entityName: deletedProduct.name,
            userEmail: user.email,
            entityId: deletedProduct.id,
            details: {
              name: deletedProduct.name
            }
          });
        } catch (error) {
          console.error('Error logging delete activity:', error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
      console.error('Error deleting product:', error);
    },
  });

  const handleProductAdded = async (productName: string, productId: string) => {
    console.log('Product added:', productName, productId);
    setAddProductDialogOpen(false);
    
    // Log the activity
    if (user) {
      try {
        await logActivity({
          action: 'create',
          entityType: 'product',
          entityName: productName,
          userEmail: user.email,
          entityId: productId,
          details: {
            name: productName
          }
        });
      } catch (error) {
        console.error('Error logging activity:', error);
      }
    }
    
    // Immediately invalidate and refetch products to show the new product
    await queryClient.invalidateQueries({ queryKey: ['products'] });
    
    toast({
      title: "Success",
      description: `Product "${productName}" added successfully`,
    });
  };

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate({ id: product.id, name: product.name });
    }
  };

  // Filter logic - only apply filters if they are not default values
  const filteredProducts = products.filter((product) => {
    const hasActiveFilters = searchQuery !== "" || selectedCategory !== "all" || selectedBrand !== "all" || priceRange[0] !== 0 || priceRange[1] !== 2000;
    
    if (!hasActiveFilters) {
      return true;
    }

    const matchesSearch = searchQuery === "" || product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || product.brand === selectedBrand;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
  });

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Package className="mr-2 h-6 w-6" />
            <h1 className="text-3xl font-bold">Inventory</h1>
          </div>
          <Button onClick={() => setAddProductDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Package className="mr-2 h-6 w-6" />
            <h1 className="text-3xl font-bold">Inventory</h1>
          </div>
          <Button onClick={() => setAddProductDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
        
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-xl font-medium mb-1">No products yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first product to the inventory</p>
          <Button onClick={() => setAddProductDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Product
          </Button>
        </div>

        <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl">
                <Plus className="mr-2 h-5 w-5" />
                Add New Product
              </DialogTitle>
            </DialogHeader>
            <AddProductForm onComplete={handleProductAdded} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Package className="mr-2 h-6 w-6" />
          <h1 className="text-3xl font-bold">Inventory</h1>
        </div>
        <Button onClick={() => setAddProductDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4">
          <Filters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedBrand={selectedBrand}
            onBrandChange={setSelectedBrand}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
          />
        </div>
        
        <div className="lg:w-3/4">
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={() => handleDeleteProduct(product)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          {filteredProducts.length === 0 && products.length > 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-xl font-medium mb-1">No products found</h3>
              <p className="text-gray-500">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={addProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <Plus className="mr-2 h-5 w-5" />
              Add New Product
            </DialogTitle>
          </DialogHeader>
          <AddProductForm onComplete={handleProductAdded} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
