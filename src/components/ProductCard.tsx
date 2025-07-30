
import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Check if product is in stock based on quantity
  const isInStock = product.quantity > 0;

  return (
    <Link to={`/product/${product.id}`} className="block">
      <div className="product-card bg-white rounded-lg overflow-hidden border border-gray-200">
        <div className="relative">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-48 object-cover"
          />
          {product.featured && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
              Featured
            </Badge>
          )}
          {!isInStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-medium text-lg">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-brand-blue font-medium">{product.brand}</span>
            <span className="text-sm text-gray-500">{product.category}</span>
          </div>
          <h3 className="font-medium text-lg mb-2 line-clamp-2">{product.name}</h3>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">₦{product.price.toLocaleString()}</span>
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              <span className="text-sm text-gray-600">{product.rating}</span>
            </div>
          </div>
          {product.freeShipping && (
            <span className="block mt-2 text-sm text-green-600">Free Shipping</span>
          )}
          <div className="mt-2 text-sm text-gray-600">
            Stock: {product.quantity}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
