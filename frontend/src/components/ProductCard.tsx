import React, { useState } from "react";
import { Star, Eye, Heart, ShoppingCart, Check, X } from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  description: string;
  inStock: boolean;
}

interface ProductCardProps {
  product: Product;
  tabType: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, tabType }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const getGradient = () => {
    switch (tabType) {
      case "oksid":
        return "from-orange-500 to-amber-500";
      case "penta":
        return "from-red-500 to-rose-500";
      case "denge":
        return "from-gray-700 to-gray-900";
      default:
        return "from-blue-500 to-indigo-600";
    }
  };

  const getBorderColor = () => {
    switch (tabType) {
      case "oksid":
        return "border-orange-200 hover:border-orange-300";
      case "penta":
        return "border-red-200 hover:border-red-300";
      case "denge":
        return "border-gray-200 hover:border-gray-300";
      default:
        return "border-blue-200 hover:border-blue-300";
    }
  };

  return (
    <div
      className={`bg-white/80 backdrop-blur-sm rounded-xl border-2 ${getBorderColor()} p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl group ${
        !product.inStock ? "opacity-75" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Stock Status Badge */}
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
            product.inStock
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {product.inStock ? (
            <Check className="w-3 h-3" />
          ) : (
            <X className="w-3 h-3" />
          )}
          <span>{product.inStock ? "Stokta" : "Stok Yok"}</span>
        </div>

        {/* Quick Actions */}
        <div
          className={`absolute top-2 left-2 flex space-x-2 transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className={`p-2 rounded-full transition-colors ${
              isFavorited
                ? "bg-red-500 text-white"
                : "bg-white/90 text-gray-600 hover:text-red-500"
            }`}
          >
            <Heart className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white/90 rounded-full text-gray-600 hover:text-blue-500 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        {/* Category */}
        <span className="text-sm text-gray-500 font-medium">
          {product.category}
        </span>

        {/* Name */}
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-2">
          {product.description}
        </p>

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating} ({product.reviews} değerlendirme)
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">
              ₺
              {product.price.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          disabled={!product.inStock}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
            product.inStock
              ? `bg-gradient-to-r ${getGradient()} text-white hover:shadow-lg transform hover:scale-105`
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>{product.inStock ? "Sepete Ekle" : "Stok Yok"}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
