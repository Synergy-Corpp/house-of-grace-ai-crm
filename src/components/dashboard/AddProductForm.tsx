
import React from "react";
import SimpleProductModal from "./SimpleProductModal";

interface AddProductFormProps {
  onComplete?: (productName: string, productId: string) => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onComplete }) => {
  return <SimpleProductModal onComplete={onComplete} />;
};

export default AddProductForm;
