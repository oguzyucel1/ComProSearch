import React, { useState } from "react";
import { Eye, Heart, Check, X, ExternalLink } from "lucide-react";
import type { Product } from "../types";

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
        return "from-orange-600 to-amber-600";
      case "penta":
        return "from-red-600 to-rose-600";
      case "denge":
        return "from-gray-700 to-gray-900";
      default:
        return "from-blue-600 to-indigo-700";
    }
  };

  const getBorderColor = () => {
    switch (tabType) {
      case "oksid":
        return "border-orange-700 hover:border-orange-500";
      case "penta":
        return "border-red-700 hover:border-red-500";
      case "denge":
        return "border-gray-800 hover:border-gray-600";
      default:
        return "border-blue-700 hover:border-blue-500";
    }
  };

  const getDefaultImage = () => {
    switch (tabType) {
      case "oksid":
        return "/images/oksid_banner.jpg";
      case "penta":
        return "/images/penta_banner.jpg";
      case "denge":
        return "/images/denge_banner.png";
      default:
        return "https://placehold.co/600x400?text=No+Image";
    }
  };

  return (
    <div
      className={`bg-gray-900/60 backdrop-blur-md rounded-xl border ${getBorderColor()} p-6 transition-all duration-300 hover:shadow-xl group ${
        !product.inStock ? "opacity-70" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <img
          src={product.image || getDefaultImage()}
          alt={product.name}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
        />

        {/* Stock Status Badge */}
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 backdrop-blur-sm ${
            product.inStock
              ? "bg-green-900/60 text-green-300 border border-green-700/50"
              : "bg-red-900/60 text-red-300 border border-red-700/50"
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
                ? "bg-red-600 text-white"
                : "bg-gray-800/80 text-gray-200 hover:text-red-400"
            }`}
          >
            <Heart className="w-4 h-4" />
          </button>
          <button className="p-2 bg-gray-800/80 rounded-full text-gray-200 hover:text-blue-400 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        {/* Category */}
        <span className="text-sm text-gray-400 font-medium">
          {product.category}
        </span>

        {/* Name */}
        <h3 className="font-bold text-lg text-gray-100 line-clamp-2">
          {product.name}
        </h3>

        {/* Link Button */}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {product.priceText ? (
              <p className="text-2xl font-bold text-white">
                {product.priceText}
              </p>
            ) : (
              <p className="text-2xl font-bold text-white">
                {product.price.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                {product.currency || "₺"}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {product.url ? (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
              product.inStock
                ? `bg-gradient-to-r ${getGradient()} text-white hover:shadow-lg`
                : "bg-gray-800 text-gray-500 cursor-not-allowed pointer-events-none"
            }`}
          >
            <ExternalLink className="w-5 h-5" />
            <span>{product.inStock ? "Ürüne Git" : "Stok Yok"}</span>
          </a>
        ) : (
          <button
            disabled
            className="w-full py-3 px-4 rounded-lg font-medium bg-gray-800 text-gray-500 cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span>Link Mevcut Değil</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
