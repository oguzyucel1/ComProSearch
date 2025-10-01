import React, { useState } from "react";
import { Search, BarChart3, ExternalLink } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ComparisonResult {
  marketplace: string;
  name: string;
  price: number;
  priceText?: string;
  currency?: string;
  url: string;
  available: boolean;
}

interface MarketplaceProducts {
  oksid: ComparisonResult[];
  penta: ComparisonResult[];
  denge: ComparisonResult[];
}

const ComparisonTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MarketplaceProducts>({
    oksid: [],
    penta: [],
    denge: [],
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    try {
      const searchTerm = searchQuery.trim();

      // Search in Oksid - get ALL matching products
      const { data: oksidData } = await supabase
        .from("oksid_products")
        .select("name, price_2, price_1, currency, url, stock")
        .ilike("name", `%${searchTerm}%`);

      const oksidResults: ComparisonResult[] = (oksidData || []).map(
        (item) => ({
          marketplace: "Oksid",
          name: item.name,
          price: Number(item.price_2 || item.price_1 || 0),
          currency: item.currency,
          url: item.url || "#",
          available: String(item.stock || "").toLowerCase() !== "stok yok",
        })
      );

      // Search in Penta (Bayinet) - get ALL matching products
      const { data: pentaData } = await supabase
        .from("bayinet_products")
        .select("name, price, price_display, url, stock_info")
        .ilike("name", `%${searchTerm}%`);

      const pentaResults: ComparisonResult[] = (pentaData || []).map(
        (item) => ({
          marketplace: "Penta",
          name: item.name,
          price: Number(item.price || 0),
          priceText: item.price_display,
          url: item.url || "#",
          available: !String(item.stock_info || "")
            .toLowerCase()
            .includes("yok"),
        })
      );

      // Search in Denge - get ALL matching products
      const { data: dengeData } = await supabase
        .from("denge_products")
        .select("name, special_price, list_price, currency, stock_info")
        .ilike("name", `%${searchTerm}%`);

      const dengeResults: ComparisonResult[] = (dengeData || []).map(
        (item) => ({
          marketplace: "Denge",
          name: item.name,
          price: Number(item.special_price || item.list_price || 0),
          currency: item.currency,
          url: "#",
          available: !String(item.stock_info || "")
            .toLowerCase()
            .includes("yok"),
        })
      );

      setResults({
        oksid: oksidResults,
        penta: pentaResults,
        denge: dengeResults,
      });
    } catch (error) {
      console.error("Comparison search error:", error);
      setResults({ oksid: [], penta: [], denge: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const getTotalResults = () => {
    return results.oksid.length + results.penta.length + results.denge.length;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Ürün Karşılaştırma
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          3 farklı marketplace'den fiyat karşılaştırması yapın ve en iyi teklifi
          bulun
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-8 border border-white/10">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label
              htmlFor="comparison-search"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Karşılaştırılacak ürün adı
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
              <input
                id="comparison-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-3 bg-gray-800/60 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 relative z-0"
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

      {/* Results - 3 Column Layout */}
      {getTotalResults() > 0 && (
        <div className="space-y-6">
          {/* Summary Header */}
          <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-700/50 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-1">
                  Toplam Sonuç
                </h3>
                <p className="text-3xl font-bold text-blue-400">
                  {getTotalResults()} ürün bulundu
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-blue-400">
                  Oksid: {results.oksid.length}
                </p>
                <p className="text-sm text-red-400">
                  Penta: {results.penta.length}
                </p>
                <p className="text-sm text-gray-400">
                  Denge: {results.denge.length}
                </p>
              </div>
            </div>
          </div>

          {/* 3 Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Oksid Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-600 to-orange-600 rounded-lg p-4 text-center">
                <h3 className="text-xl font-bold text-white">
                  Oksid ({results.oksid.length})
                </h3>
              </div>
              {results.oksid.length > 0 ? (
                results.oksid.map((product, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-orange-500/30 p-4 hover:border-orange-500/50 transition-all"
                  >
                    <h4 className="font-medium text-gray-100 mb-2 line-clamp-2">
                      {product.name}
                    </h4>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-orange-400">
                        {product.price.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        {product.currency || "₺"}
                      </span>
                      {!product.available && (
                        <span className="px-2 py-1 bg-red-900/60 text-red-300 text-xs font-medium rounded-full border border-red-700/50">
                          Stok Yok
                        </span>
                      )}
                    </div>
                    {product.url && product.url !== "#" && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 bg-orange-600/80 hover:bg-orange-600 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ürüne Git</span>
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-gray-900/60 rounded-lg border border-white/10 p-6 text-center">
                  <p className="text-gray-400">Ürün bulunamadı</p>
                </div>
              )}
            </div>

            {/* Penta Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-red-600 to-red-600 rounded-lg p-4 text-center">
                <h3 className="text-xl font-bold text-white">
                  Penta ({results.penta.length})
                </h3>
              </div>
              {results.penta.length > 0 ? (
                results.penta.map((product, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-red-500/30 p-4 hover:border-red-500/50 transition-all"
                  >
                    <h4 className="font-medium text-gray-100 mb-2 line-clamp-2">
                      {product.name}
                    </h4>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-red-400">
                        {product.priceText ||
                          `${product.price.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })} ₺`}
                      </span>
                      {!product.available && (
                        <span className="px-2 py-1 bg-red-900/60 text-red-300 text-xs font-medium rounded-full border border-red-700/50">
                          Stok Yok
                        </span>
                      )}
                    </div>
                    {product.url && product.url !== "#" && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 bg-red-600/80 hover:bg-red-600 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ürüne Git</span>
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-gray-900/60 rounded-lg border border-white/10 p-6 text-center">
                  <p className="text-gray-400">Ürün bulunamadı</p>
                </div>
              )}
            </div>

            {/* Denge Column */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-gray-600 to-gray-600 rounded-lg p-4 text-center">
                <h3 className="text-xl font-bold text-white">
                  Denge ({results.denge.length})
                </h3>
              </div>
              {results.denge.length > 0 ? (
                results.denge.map((product, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-500/30 p-4 hover:border-gray-500/50 transition-all"
                  >
                    <h4 className="font-medium text-gray-100 mb-2 line-clamp-2">
                      {product.name}
                    </h4>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-gray-300">
                        {product.price.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        {product.currency || "₺"}
                      </span>
                      {!product.available && (
                        <span className="px-2 py-1 bg-red-900/60 text-red-300 text-xs font-medium rounded-full border border-red-700/50">
                          Stok Yok
                        </span>
                      )}
                    </div>
                    {product.url && product.url !== "#" && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 bg-gray-600/80 hover:bg-gray-600 text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ürüne Git</span>
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-gray-900/60 rounded-lg border border-white/10 p-6 text-center">
                  <p className="text-gray-400">Ürün bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {getTotalResults() === 0 && !isSearching && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Karşılaştırma Bekleniyor
          </h3>
          <p className="text-gray-400 max-w-md mx-auto">
            Yukarıdaki arama kutusuna ürün adını yazarak farklı
            marketplace'lerden fiyat karşılaştırması yapabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComparisonTab;
