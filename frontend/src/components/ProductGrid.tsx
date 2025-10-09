import React from "react";
import ProductCard from "./ProductCard";
import type { Product } from "../types";

interface ProductGridProps {
  products: Product[];
  tabType: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, tabType }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
          <span className="text-2xl">🔍</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Ürün bulunamadı</h3>
        <p className="text-gray-400">
          Arama kriterlerinizi değiştirip tekrar deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={String(product.id)}
          product={product}
          tabType={product.marketplace || tabType}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
