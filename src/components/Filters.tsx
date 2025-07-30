import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedBrand: string;
  onBrandChange: (value: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (value: [number, number]) => void;
}

const Filters: React.FC<FiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedBrand,
  onBrandChange,
  priceRange,
  onPriceRangeChange,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "Laptops", label: "Laptops" },
    { value: "Smartphones", label: "Smartphones" },
    { value: "Tablets", label: "Tablets" },
    { value: "Accessories", label: "Accessories" },
    { value: "Gaming", label: "Gaming" },
  ];

  const brands = [
    { value: "all", label: "All Brands" },
    { value: "Apple", label: "Apple" },
    { value: "Samsung", label: "Samsung" },
    { value: "Dell", label: "Dell" },
    { value: "HP", label: "HP" },
    { value: "Lenovo", label: "Lenovo" },
    { value: "Sony", label: "Sony" },
  ];

  const handleSliderChange = (value: number[]) => {
    onPriceRangeChange([value[0], value[1]]);
  };

  return (
    <div className="bg-white border rounded-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              <h3 className="font-semibold text-lg">Filters</h3>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-6 p-4 pt-0">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select value={selectedCategory || "all"} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Laptops">Laptops</SelectItem>
                <SelectItem value="Smartphones">Smartphones</SelectItem>
                <SelectItem value="Tablets">Tablets</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Gaming">Gaming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Brand</label>
            <Select value={selectedBrand || "all"} onValueChange={onBrandChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="Apple">Apple</SelectItem>
                <SelectItem value="Samsung">Samsung</SelectItem>
                <SelectItem value="Dell">Dell</SelectItem>
                <SelectItem value="HP">HP</SelectItem>
                <SelectItem value="Lenovo">Lenovo</SelectItem>
                <SelectItem value="Sony">Sony</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <Slider
              defaultValue={[0, 2000]}
              max={2000}
              step={10}
              value={[priceRange[0], priceRange[1]]}
              onValueChange={handleSliderChange}
              className="my-4"
            />
            <div className="flex items-center justify-between text-sm">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1]}</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => {
              onSearchChange("");
              onCategoryChange("all");
              onBrandChange("all");
              onPriceRangeChange([0, 2000]);
            }}
            className="w-full"
          >
            Clear Filters
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default Filters;
