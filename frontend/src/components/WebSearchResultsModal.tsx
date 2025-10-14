// Dosya Yolu: src/components/WebSearchResultsModal.tsx

import React, { useState, useEffect } from "react";
import { X, ExternalLink, Search, Star } from "lucide-react";
import { ShoppingResult } from "../types"; // <-- Ortak tipler dosyasından import edildi
import { getTryToUsdRate } from "../utils/exchange";

interface WebSearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ShoppingResult[];
  isLoading: boolean;
  searchTerm: string;
}

const WebSearchResultsModal: React.FC<WebSearchResultsModalProps> = ({
  isOpen,
  onClose,
  results,
  isLoading,
  searchTerm,
}) => {
  const [tryToUsd, setTryToUsd] = useState<number | null>(null);

  // Fetch TRY -> USD rate (cached)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rate = await getTryToUsdRate();
        console.log("TRY->USD rate fetched:", rate);
        if (mounted) setTryToUsd(rate);
      } catch (e) {
        console.error("Failed to fetch exchange rate:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper: extract numeric price from string and check if TRY
  const extractPrice = (
    priceStr: string
  ): { amount: number; isTRY: boolean } | null => {
    if (!priceStr) return null;

    // Check if contains TRY/TL/₺
    const isTRY = /₺|tl|try/i.test(priceStr);

    // Extract numeric value (remove currency symbols and convert to number)
    const cleaned = priceStr.replace(/[^\d.,]/g, "");

    let amount: number;

    // Determine format by checking which separator appears last
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    if (lastComma > lastDot) {
      // Format: 1.234,56 (European/Turkish - comma is decimal)
      amount = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
    } else if (lastDot > lastComma) {
      // Format: 1,234.56 (US - dot is decimal) or 33,609.00
      amount = parseFloat(cleaned.replace(/,/g, ""));
    } else if (lastComma === -1 && lastDot === -1) {
      // No separators
      amount = parseFloat(cleaned);
    } else {
      // Single separator - assume it's thousands if > 3 digits before it
      if (cleaned.indexOf(",") !== -1) {
        const parts = cleaned.split(",");
        if (parts[0] && parts[0].length > 3) {
          // Likely thousands separator: 1234,56 -> treat comma as decimal
          amount = parseFloat(cleaned.replace(",", "."));
        } else {
          // Likely decimal: 12,34 -> treat comma as decimal
          amount = parseFloat(cleaned.replace(",", "."));
        }
      } else {
        amount = parseFloat(cleaned);
      }
    }

    return isNaN(amount) ? null : { amount, isTRY };
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/80 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Web Arama Sonuçları
            </h2>
            <p className="text-sm text-gray-400 truncate flex items-center space-x-2 mt-1">
              <Search className="w-4 h-4" />
              <span>"{searchTerm}" için bulundu</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-red-600/20 rounded-lg transition-all duration-300 hover:scale-110"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
              <p className="text-lg">Google Alışveriş sonuçları aranıyor...</p>
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Search className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                Sonuç Bulunamadı
              </h3>
              <p>Bu ürün için web'de bir eşleşme bulunamadı.</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800/50 rounded-lg border border-white/10 p-4 flex flex-col justify-between"
                >
                  <div>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-32 object-contain rounded-md mb-3 bg-white/10 p-1"
                    />
                    <h4 className="font-semibold text-gray-200 text-sm mb-2 line-clamp-2">
                      {item.title}
                    </h4>
                  </div>
                  <div className="mt-auto">
                    {item.rating && (
                      <div className="flex items-center space-x-1 text-yellow-400 mb-2">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-bold text-gray-200">
                          {item.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <div className="mb-3">
                      <p className="text-lg font-bold text-blue-400">
                        {item.price}
                      </p>
                      {(() => {
                        const priceInfo = extractPrice(item.price);
                        console.log("Price analysis:", {
                          original: item.price,
                          parsed: priceInfo,
                          rate: tryToUsd,
                        });

                        if (priceInfo && priceInfo.isTRY && tryToUsd) {
                          const usdAmount = priceInfo.amount * tryToUsd;
                          console.log("Showing USD:", usdAmount);
                          return (
                            <div className="mt-2 flex items-center space-x-2">
                              <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-md">
                                <span className="text-xs text-green-400 font-semibold">
                                  ≈
                                </span>
                                <span className="text-sm font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                  {Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: "USD",
                                  }).format(usdAmount)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 italic">
                                USD
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Mağazaya Git</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSearchResultsModal;
