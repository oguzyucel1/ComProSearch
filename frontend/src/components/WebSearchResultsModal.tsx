// Dosya Yolu: src/components/WebSearchResultsModal.tsx

import React from "react";
import { X, ExternalLink, Search, Star } from "lucide-react";
import { ShoppingResult } from "../types"; // <-- Ortak tipler dosyasından import edildi

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
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white">
              Web Arama Sonuçları
            </h2>
            <p className="text-sm text-gray-400 truncate">
              "{searchTerm}" için bulundu
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
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
                    <p className="text-lg font-bold text-blue-400 mb-3">
                      {item.price}
                    </p>
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
