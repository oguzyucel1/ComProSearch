import React, { useState } from "react";
import {
  Search,
  BarChart3,
  ExternalLink,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface ComparisonResult {
  marketplace: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  url: string;
  image: string;
  available: boolean;
}

const ComparisonTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);

  // Mock comparison data
  const mockResults: ComparisonResult[] = [
    {
      marketplace: "Oksid Market",
      name: "Premium Ürün XY-2024",
      price: 1299.99,
      rating: 4.8,
      reviews: 142,
      url: "#",
      image:
        "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?w=200&h=150&fit=crop",
      available: true,
    },
    {
      marketplace: "Penta Store",
      name: "Premium Ürün XY-2024",
      price: 1399.99,
      rating: 4.6,
      reviews: 98,
      url: "#",
      image:
        "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?w=200&h=150&fit=crop",
      available: true,
    },
    {
      marketplace: "Denge Shop",
      name: "Premium Ürün XY-2024",
      price: 1199.99,
      rating: 4.9,
      reviews: 203,
      url: "#",
      image:
        "https://images.pexels.com/photos/57690/pexels-photo-57690.jpeg?w=200&h=150&fit=crop",
      available: false,
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  const getLowestPrice = () => {
    const availableResults = results.filter((r) => r.available);
    return Math.min(...availableResults.map((r) => r.price));
  };

  const getPriceTrend = (price: number) => {
    const lowestPrice = getLowestPrice();
    if (price === lowestPrice) return "lowest";
    if (price > lowestPrice * 1.1) return "highest";
    return "medium";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Ürün Karşılaştırma
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          3 farklı marketplace'den fiyat karşılaştırması yapın ve en iyi teklifi
          bulun
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label
              htmlFor="comparison-search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Karşılaştırılacak ürün adı
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="comparison-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ürün adını girin..."
              />
            </div>
          </div>
          <div className="md:self-end">
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Aranıyor...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  <span>Karşılaştır</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* Price Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-1">
                  En İyi Fiyat
                </h3>
                <p className="text-3xl font-bold text-green-700">
                  ₺
                  {getLowestPrice().toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600 mb-1">
                  Karşılaştırılan mağaza sayısı
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {results.length}
                </p>
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result, index) => {
              const priceTrend = getPriceTrend(result.price);

              return (
                <div
                  key={index}
                  className={`bg-white/80 backdrop-blur-sm rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-xl ${
                    !result.available
                      ? "border-gray-200 opacity-75"
                      : priceTrend === "lowest"
                      ? "border-green-300 ring-2 ring-green-100"
                      : priceTrend === "highest"
                      ? "border-red-300"
                      : "border-gray-200"
                  }`}
                >
                  {/* Marketplace Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900">
                      {result.marketplace}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {priceTrend === "lowest" && result.available && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          En Ucuz
                        </span>
                      )}
                      {priceTrend === "highest" && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          En Pahalı
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="mb-4">
                    <img
                      src={result.image}
                      alt={result.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 line-clamp-2">
                      {result.name}
                    </h4>

                    {/* Rating */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(result.rating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {result.rating} ({result.reviews})
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-2xl font-bold ${
                          priceTrend === "lowest"
                            ? "text-green-600"
                            : priceTrend === "highest"
                            ? "text-red-600"
                            : "text-gray-900"
                        }`}
                      >
                        ₺
                        {result.price.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      {!result.available && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                          Stok Yok
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      disabled={!result.available}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
                        result.available
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>
                        {result.available ? "Mağazaya Git" : "Müsait Değil"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analysis */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Fiyat Analizi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">
                  En Düşük Fiyat
                </p>
                <p className="text-xl font-bold text-green-700">
                  ₺
                  {getLowestPrice().toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium">
                  En Yüksek Fiyat
                </p>
                <p className="text-xl font-bold text-red-700">
                  ₺
                  {Math.max(...results.map((r) => r.price)).toLocaleString(
                    "tr-TR",
                    { minimumFractionDigits: 2 }
                  )}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">
                  Ortalama Fiyat
                </p>
                <p className="text-xl font-bold text-blue-700">
                  ₺
                  {(
                    results.reduce((sum, r) => sum + r.price, 0) /
                    results.length
                  ).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && !isSearching && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Karşılaştırma Bekleniyor
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Yukarıdaki arama kutusuna ürün adını yazarak farklı
            marketplace'lerden fiyat karşılaştırması yapabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComparisonTab;
