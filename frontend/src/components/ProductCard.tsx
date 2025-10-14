import React, { useState, useEffect } from "react";
import { Eye, Heart, Check, X, ExternalLink } from "lucide-react";
import type { Product } from "../types";
import { getTryToUsdRate } from "../utils/exchange";

interface ProductCardProps {
  product: Product;
  tabType: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, tabType }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isOffered, setIsOffered] = useState(false);
  const [tryToUsd, setTryToUsd] = useState<number | null>(null);

  // Ürünün marketplace bilgisini kullan, yoksa tabType'ı kullan
  const effectiveTabType = product.marketplace || tabType;

  // LocalStorage'dan favoriler ve teklifleri yükle
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    const offers = JSON.parse(localStorage.getItem("offers") || "[]");

    setIsFavorited(favorites.some((fav: Product) => fav.id === product.id));
    setIsOffered(offers.some((offer: Product) => offer.id === product.id));
  }, [product.id]);

  // Fetch TRY -> USD rate (cached)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rate = await getTryToUsdRate();
        if (mounted) setTryToUsd(rate);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper: detect try-like currency values
  const isTRYCurrency = (c?: string | null) => {
    if (!c) return false;
    const s = String(c).trim().toLowerCase();
    return (
      s === "try" ||
      s === "tl" ||
      s === "₺" ||
      s === "trl" ||
      s === "tl." ||
      s === "tl,"
    );
  };

  // Favorilere ekle/çıkar
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

    if (isFavorited) {
      // Favorilerden çıkar
      const updated = favorites.filter((fav: Product) => fav.id !== product.id);
      localStorage.setItem("favorites", JSON.stringify(updated));
      setIsFavorited(false);
    } else {
      // Favorilere ekle
      favorites.push(product);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      setIsFavorited(true);
    }

    // Custom event tetikle
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  // Teklife ekle/çıkar
  const toggleOffer = () => {
    const offers = JSON.parse(localStorage.getItem("offers") || "[]");

    if (isOffered) {
      // Tekliflerden çıkar
      const updated = offers.filter(
        (offer: Product) => offer.id !== product.id
      );
      localStorage.setItem("offers", JSON.stringify(updated));
      setIsOffered(false);
    } else {
      // Tekliflere ekle
      offers.push(product);
      localStorage.setItem("offers", JSON.stringify(offers));
      setIsOffered(true);
    }

    // Custom event tetikle
    window.dispatchEvent(new Event("offersUpdated"));
  };

  const getGradient = () => {
    switch (effectiveTabType) {
      case "oksid":
        return "from-orange-600 to-amber-600";
      case "penta":
        return "from-red-600 to-red-900";
      case "denge":
        return "from-gray-400 to-gray-600";
      default:
        return "from-blue-600 to-indigo-700";
    }
  };

  const getBorderColor = () => {
    switch (effectiveTabType) {
      case "oksid":
        return "border-orange-700 hover:border-orange-500";
      case "penta":
        return "border-red-700 hover:border-red-500";
      case "denge":
        return "border-gray-600 hover:border-gray-400";
      default:
        return "border-blue-700 hover:border-blue-500";
    }
  };

  const getDefaultImage = () => {
    switch (effectiveTabType) {
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
      className={`group relative bg-gray-900/60 backdrop-blur-md rounded-xl border ${getBorderColor()} p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-2 hover:scale-105 ${
        !product.inStock ? "opacity-70" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          effectiveTabType === "penta"
            ? "from-red-600 to-rose-600"
            : getGradient()
        } opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-xl`}
      ></div>

      {/* Glowing border effect */}
      <div
        className={`absolute -inset-0.5 bg-gradient-to-r ${
          effectiveTabType === "penta"
            ? "from-red-600 to-rose-600"
            : getGradient()
        } opacity-0 group-hover:opacity-30 blur-sm transition-opacity duration-500 rounded-xl`}
      ></div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Product Image */}
        <div className="relative mb-4 overflow-hidden rounded-lg">
          <img
            src={product.image || getDefaultImage()}
            alt={product.name}
            className="w-full h-48 object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
          />

          {/* Image overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Stock Status Badge */}
          <div
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1 backdrop-blur-md transition-all duration-300 ${
              product.inStock
                ? "bg-green-900/80 text-green-200 border border-green-600/50 shadow-lg shadow-green-500/20"
                : "bg-red-900/80 text-red-200 border border-red-600/50 shadow-lg shadow-red-500/20"
            }`}
          >
            {product.inStock ? (
              <Check className="w-3 h-3 animate-pulse" />
            ) : (
              <X className="w-3 h-3" />
            )}
            <span>{product.inStock ? "Stokta" : "Stok Yok"}</span>
          </div>

          {/* Quick Actions */}
          <div
            className={`absolute top-3 left-3 flex space-x-2 transition-all duration-500 transform ${
              isHovered
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2"
            }`}
          >
            <button
              onClick={toggleFavorite}
              className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                isFavorited
                  ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                  : "bg-gray-800/90 text-gray-200 hover:text-red-400 hover:bg-red-600/20 backdrop-blur-md"
              }`}
              title={isFavorited ? "Favorilerden çıkar" : "Favorilere ekle"}
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorited ? "fill-current animate-pulse" : ""
                }`}
              />
            </button>
            <button
              onClick={toggleOffer}
              className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                isOffered
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-gray-800/90 text-gray-200 hover:text-blue-400 hover:bg-blue-600/20 backdrop-blur-md"
              }`}
              title={
                isOffered ? "Tekliflerden çıkar" : "Teklif ettiklerime ekle"
              }
            >
              <Eye
                className={`w-4 h-4 ${
                  isOffered ? "fill-current animate-pulse" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          {/* Category */}
          <span className="inline-block text-sm font-medium px-3 py-1 rounded-full bg-gray-800/60 text-gray-300 border border-gray-700/50 transition-all duration-300 group-hover:border-gray-600/70 group-hover:bg-gray-700/60">
            {product.category}
          </span>

          {/* Name */}
          <h3 className="font-bold text-lg text-gray-100 line-clamp-2 transition-all duration-300 group-hover:text-white group-hover:text-xl">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 w-full">
              {product.priceText ? (
                <p
                  className={`text-2xl font-bold bg-gradient-to-r ${
                    effectiveTabType === "penta"
                      ? "from-red-400 to-rose-500"
                      : effectiveTabType === "oksid"
                      ? "from-yellow-400 to-orange-500"
                      : effectiveTabType === "denge"
                      ? "from-gray-300 to-gray-600"
                      : "from-yellow-400 to-orange-500"
                  } bg-clip-text text-transparent animate-pulse drop-shadow-lg`}
                >
                  {product.priceText}
                </p>
              ) : (
                <p
                  className={`text-2xl font-bold bg-gradient-to-r ${
                    effectiveTabType === "penta"
                      ? "from-red-400 to-rose-500"
                      : effectiveTabType === "oksid"
                      ? "from-yellow-400 to-orange-500"
                      : effectiveTabType === "denge"
                      ? "from-gray-300 to-gray-600"
                      : "from-yellow-400 to-orange-500"
                  } bg-clip-text text-transparent animate-pulse drop-shadow-lg`}
                >
                  {product.price.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  {product.currency || "₺"}
                </p>
              )}

              {/* USD conversion for TRY prices */}
              {tryToUsd &&
                (isTRYCurrency(product.currency) ||
                  (product.priceText && /₺|tl/i.test(product.priceText))) && (
                  <div className="text-sm text-gray-400 mt-1">
                    {product.price
                      ? Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(product.price * tryToUsd)
                      : ""}
                  </div>
                )}

              {/* Price Change Indicator - Only show for favorited/offered products */}
              {(isFavorited || isOffered) &&
                product.lastPrice &&
                product.lastPrice !== product.price && (
                  <div className="flex items-center space-x-2 mt-2">
                    {product.price < product.lastPrice ? (
                      <div className="flex items-center space-x-1 text-green-400 text-sm font-semibold animate-pulse">
                        <span className="text-lg">↓</span>
                        <span>
                          Fiyat düştü! (
                          {(product.lastPrice - product.price).toLocaleString(
                            "tr-TR",
                            {
                              minimumFractionDigits: 2,
                            }
                          )}{" "}
                          {product.currency || "₺"} indirim)
                        </span>
                      </div>
                    ) : product.price > product.lastPrice ? (
                      <div className="flex items-center space-x-1 text-orange-400 text-sm font-semibold">
                        <span className="text-lg">↑</span>
                        <span>
                          Fiyat arttı (
                          {(product.price - product.lastPrice).toLocaleString(
                            "tr-TR",
                            {
                              minimumFractionDigits: 2,
                            }
                          )}{" "}
                          {product.currency || "₺"})
                        </span>
                      </div>
                    ) : null}
                    <div className="text-xs text-gray-500">
                      Önceki:{" "}
                      {product.lastPrice.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      {product.currency || "₺"}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Action Button */}
          {product.url ? (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 ${
                product.inStock
                  ? `bg-gradient-to-r ${getGradient()} text-white hover:shadow-xl shadow-lg ${
                      effectiveTabType === "penta"
                        ? "hover:shadow-red-500/30"
                        : "hover:shadow-current/30"
                    } relative overflow-hidden`
                  : "bg-gray-800 text-gray-500 cursor-not-allowed pointer-events-none"
              }`}
            >
              {product.inStock && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              )}
              <ExternalLink
                className={`w-5 h-5 relative z-10 ${
                  product.inStock
                    ? "group-hover:rotate-12 transition-transform duration-300"
                    : ""
                }`}
              />
              <span className="relative z-10">
                {product.inStock ? "Ürüne Git" : "Stok Yok"}
              </span>
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
    </div>
  );
};

export default ProductCard;
