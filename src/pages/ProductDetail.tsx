
import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { products } from "@/data/products";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-8">The product you are looking for does not exist.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const handleQuoteRequest = () => {
    toast({
      title: "Quote Requested",
      description: `We've received your request for ${product.name}. Our team will contact you shortly.`,
    });
  };

  return (
    <div className="py-8">
      <Link 
        to="/inventory" 
        className="inline-flex items-center text-brand-blue hover:underline mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Inventory
      </Link>
      
      <div className="bg-white rounded-lg overflow-hidden shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="p-6 flex items-center justify-center">
            <img 
              src={product.image} 
              alt={product.name} 
              className="max-w-full max-h-96 object-contain"
            />
          </div>
          
          {/* Product Details */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-brand-blue hover:bg-brand-darkBlue">
                {product.category}
              </Badge>
              {product.featured && (
                <Badge className="bg-yellow-500 hover:bg-yellow-600">
                  Featured
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xl font-bold">${product.price.toLocaleString()}</span>
              <div className="flex items-center">
                <span className="text-yellow-500 mr-1">★</span>
                <span className="text-sm">{product.rating} Rating</span>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">{product.description}</p>
            
            {/* Status Indicators */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className={`px-3 py-1 rounded-full text-sm ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </div>
              {product.freeShipping && (
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Free Shipping
                </div>
              )}
              <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                Brand: {product.brand}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <Button 
                disabled={!product.inStock}
                onClick={handleQuoteRequest}
                className="bg-brand-blue hover:bg-brand-darkBlue"
              >
                Request Quote
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Compare Similar Items
              </Button>
            </div>
            
            {/* Specs Table */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Technical Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex">
                    <div className="w-36 text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </div>
                    <div className="flex-grow font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Products section would go here in a full implementation */}
    </div>
  );
};

export default ProductDetail;
