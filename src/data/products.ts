
export interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
  description?: string;
  quantity?: number;
  category: string;
  brand: string;
  image: string;
  rating: number;
  inStock: boolean;
  freeShipping: boolean;
  featured: boolean;
  specs: Record<string, string>;
}

// Categories and brands for filters and forms
export const categories = [
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "books", label: "Books" },
  { value: "home", label: "Home & Garden" },
  { value: "sports", label: "Sports & Outdoors" },
];

export const brands = [
  { value: "techpro", label: "TechPro" },
  { value: "innovate", label: "Innovate" },
  { value: "premium", label: "Premium" },
  { value: "value", label: "Value" },
  { value: "luxury", label: "Luxury" },
];

// Shared product store - in a real app, this would be managed by a state management library or backend
export const products: Product[] = [];
