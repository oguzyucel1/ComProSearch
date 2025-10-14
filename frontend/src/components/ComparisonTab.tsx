// Dosya Yolu: src/components/ComparisonTab.tsx

import React, { useState } from "react";
import { Search, BarChart3, ExternalLink, Globe, Copy, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import WebSearchResultsModal from "./WebSearchResultsModal";
import { ShoppingResult } from "../types"; // <-- Ortak tipler dosyasından import edildi

// Tipler ve Interface'ler
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [webSearchResults, setWebSearchResults] = useState<ShoppingResult[]>(
    []
  );
  const [isWebSearching, setIsWebSearching] = useState(false);
  const [currentSearchTerm, setCurrentSearchTerm] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  const copyProductName = async (productName: string) => {
    try {
      await navigator.clipboard.writeText(productName);
      setCopyMessage("Ürün adı kopyalandı!");
      setTimeout(() => setCopyMessage(""), 2000); // 2 saniye sonra mesajı temizle
    } catch (err) {
      console.error("Kopyalama başarısız:", err);
      setCopyMessage("Kopyalama başarısız!");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const searchTerm = searchQuery.trim();

      const { data: oksidData } = await supabase
        .from("oksid_products")
        .select("name, price_2, price_1, currency, url, stock")
        .ilike("name", `%${searchTerm}%`);

      const oksidResults: ComparisonResult[] = (oksidData || []).map((item) => {
        // Oksid stok kontrolü: "Stokta Yok" string kontrolü
        const stockInfo = String(item.stock || "")
          .trim()
          .toLowerCase();
        const falsy = new Set([
          "0",
          "false",
          "no",
          "hayir",
          "yok",
          "out",
          "stok yok",
          "stokta yok",
          "yoktur",
        ]);
        const available = stockInfo ? !falsy.has(stockInfo) : true;

        return {
          marketplace: "Oksid",
          name: item.name,
          price: Number(item.price_1 || item.price_2 || 0),
          currency: item.currency,
          url: item.url || "#",
          available,
        };
      });

      const { data: pentaData } = await supabase
        .from("bayinet_products")
        .select("name, price, currency, url, stock_info")
        .ilike("name", `%${searchTerm}%`);

      const pentaResults: ComparisonResult[] = (pentaData || []).map((item) => {
        // Bayinet stok kontrolü: Merkez(X) formatından toplam stok hesapla
        const stockInfo = String(item.stock_info || "").trim();
        let available = true;

        if (stockInfo) {
          const depots = stockInfo.split("|").map((d) => d.trim());
          let totalStock = 0;

          for (const depot of depots) {
            const match = depot.match(/[(\(](\d+)[)\)]/);
            if (match && match[1]) {
              totalStock += parseInt(match[1], 10);
            }
          }

          available = totalStock > 0;
        }

        return {
          marketplace: "Penta",
          name: item.name,
          price: Number(item.price || 0),
          priceText: item.price
            ? `${Number(item.price).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
              })} ${item.currency || ""}`
            : undefined,
          currency: item.currency,
          url: item.url || "#",
          available,
        };
      });

      const { data: dengeData } = await supabase
        .from("denge_products")
        .select("name, special_price, list_price, currency, stock_info, url")
        .ilike("name", `%${searchTerm}%`);

      const dengeResults: ComparisonResult[] = (dengeData || []).map((item) => {
        // Denge stok kontrolü: sayısal değer, 0'dan büyükse stokta var
        const stockNum = Number(item.stock_info);
        const available = !isNaN(stockNum) ? stockNum > 0 : false;

        return {
          marketplace: "Denge",
          name: item.name,
          price: Number(item.special_price || item.list_price || 0),
          currency: item.currency,
          url: item.url || "#",
          available,
        };
      });

      console.log("Comparison results:", {
        oksid: oksidResults.length,
        penta: pentaResults.length,
        denge: dengeResults.length,
      });
      console.log("Penta data sample:", pentaData?.slice(0, 2));
      console.log("Penta results sample:", pentaResults.slice(0, 2));

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

  const handleWebSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setCurrentSearchTerm(searchTerm);
    setIsModalOpen(true);
    setIsWebSearching(true);
    setWebSearchResults([]);

    const functionUrl = import.meta.env.VITE_SUPABASE_SHOPPING_SEARCH_URL;
    if (!functionUrl) {
      console.error("Supabase function URL is not defined in .env file.");
      setIsWebSearching(false);
      return;
    }

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: searchTerm }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Web search failed");
      }
      const data = await response.json();
      setWebSearchResults(data.shopping);
    } catch (error) {
      console.error("Web search error:", error);
    } finally {
      setIsWebSearching(false);
    }
  };

  const getTotalResults = () => {
    return results.oksid.length + results.penta.length + results.denge.length;
  };

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="text-center relative">
        <div className="relative inline-block group">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>

          {/* Icon Container */}
          <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
            <BarChart3 className="w-10 h-10 text-white animate-pulse" />
          </div>
        </div>

        {/* Title with Gradient */}
        <h2 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:from-blue-300 hover:via-purple-300 hover:to-pink-300 transition-all duration-500 cursor-default">
          Ürün Karşılaştırma
        </h2>

        {/* Subtitle */}
        <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed hover:text-gray-200 transition-colors duration-300">
          <span className="font-semibold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            3 farklı marketplace
          </span>
          'den
          <span className="font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {" "}
            fiyat karşılaştırması
          </span>{" "}
          yapın ve
          <span className="font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            {" "}
            en iyi teklifi
          </span>{" "}
          bulun
        </p>
      </div>

      {/* Search Container - Premium Design */}
      <div className="relative group">
        {/* Animated Border Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>

        <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label
                htmlFor="comparison-search"
                className="block text-sm font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mb-3"
              >
                🔍 Karşılaştırılacak Ürün Adı
              </label>
              <div className="relative group/input">
                {/* Search Icon */}
                <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-hover/input:text-blue-400 transition-colors duration-300 z-10" />

                {/* Input Field */}
                <input
                  id="comparison-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/80 border border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-300 placeholder-gray-500 relative z-0 transition-all duration-300 font-medium"
                  placeholder="Ürün adını girin ve karşılaştırın..."
                />
              </div>
            </div>
            <div className="md:self-end flex flex-col md:flex-row gap-3 w-full md:w-auto">
              {/* Compare Button - Premium */}
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-3 overflow-hidden transform hover:scale-105 active:scale-95"
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <div className="relative flex items-center gap-3">
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="text-lg">Aranıyor...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      <span className="text-lg">Karşılaştır</span>
                    </>
                  )}
                </div>
              </button>

              {/* Web Search Button - Premium */}
              <button
                onClick={() => handleWebSearch(searchQuery)}
                disabled={!searchQuery.trim() || isWebSearching}
                className="group relative px-8 py-4 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-white font-bold rounded-xl hover:shadow-2xl hover:shadow-gray-700/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-3 overflow-hidden transform hover:scale-105 active:scale-95 border border-gray-600/50"
              >
                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <div className="relative flex items-center gap-3">
                  {isWebSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span className="text-lg">Aranıyor...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      <span className="text-lg">Web'de Ara</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {getTotalResults() > 0 && (
        <div className="space-y-8">
          {/* Toplam Sonuç Kartı - Daha Modern ve Göz Alıcı */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-8 h-8 text-blue-400 animate-pulse" />
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                    Karşılaştırma Sonuçları
                  </h3>
                </div>
                <p className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {getTotalResults()} <span className="text-3xl">ürün</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center md:justify-end">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative px-6 py-4 bg-gradient-to-br from-orange-600/30 to-amber-600/30 border border-orange-500/40 rounded-xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                    <p className="text-xs text-orange-300 font-medium mb-1">
                      Oksid
                    </p>
                    <p className="text-3xl font-bold text-orange-400">
                      {results.oksid.length}
                    </p>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative px-6 py-4 bg-gradient-to-br from-red-600/30 to-rose-600/30 border border-red-500/40 rounded-xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                    <p className="text-xs text-red-300 font-medium mb-1">
                      Penta
                    </p>
                    <p className="text-3xl font-bold text-red-400">
                      {results.penta.length}
                    </p>
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative px-6 py-4 bg-gradient-to-br from-gray-600/30 to-gray-700/30 border border-gray-500/40 rounded-xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                    <p className="text-xs text-gray-300 font-medium mb-1">
                      Denge
                    </p>
                    <p className="text-3xl font-bold text-gray-400">
                      {results.denge.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Oksid Column */}
            <div className="space-y-4">
              <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-2xl p-5 text-center shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                  <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                    Oksid
                    <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                      {results.oksid.length}
                    </span>
                  </h3>
                </div>
              </div>

              {results.oksid.length > 0 ? (
                results.oksid.map((product, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-5 hover:border-orange-400/60 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:transform hover:-translate-y-1"
                  >
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10">
                      {/* Product Name & Copy Button */}
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <h4 className="font-semibold text-gray-100 line-clamp-2 flex-1 leading-snug group-hover:text-white transition-colors">
                          {product.name}
                        </h4>
                        <button
                          onClick={() => copyProductName(product.name)}
                          className="flex-shrink-0 p-2 text-orange-400 hover:text-orange-300 hover:bg-orange-500/20 rounded-lg transition-all hover:scale-110"
                          title="Ürün adını kopyala"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="mb-3 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <div className="text-sm text-orange-300 mb-1 font-medium">
                          Fiyat
                        </div>
                        <div className="text-2xl font-black bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                          {product.price.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          {product.currency || "₺"}
                        </div>
                      </div>

                      {/* Stock Status */}
                      <div className="mb-3">
                        {product.available ? (
                          <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-900/60 to-emerald-900/60 text-green-300 text-sm font-semibold rounded-xl border border-green-600/50 shadow-lg shadow-green-900/20">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></span>
                            Stokta Var
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-900/60 to-rose-900/60 text-red-300 text-sm font-semibold rounded-xl border border-red-600/50 shadow-lg shadow-red-900/20">
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Stokta Yok
                          </div>
                        )}
                      </div>

                      {/* Link Button */}
                      {product.url && product.url !== "#" && (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:scale-105 ${
                            product.available
                              ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white hover:shadow-orange-500/30"
                              : "bg-gradient-to-r from-orange-900/60 to-amber-900/60 border border-orange-600/40 text-orange-300 hover:from-orange-800/70 hover:to-amber-800/70 hover:border-orange-500/60 hover:text-orange-200 hover:shadow-orange-700/20"
                          }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Ürüne Git</span>
                        </a>
                      )}
                    </div>
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
              <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-red-500 via-red-600 to-rose-600 rounded-2xl p-5 text-center shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                  <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                    Penta
                    <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                      {results.penta.length}
                    </span>
                  </h3>
                </div>
              </div>

              {results.penta.length > 0 ? (
                results.penta.map((product, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-2xl border border-red-500/30 p-5 hover:border-red-400/60 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 hover:transform hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <h4 className="font-semibold text-gray-100 line-clamp-2 flex-1 leading-snug group-hover:text-white transition-colors">
                          {product.name}
                        </h4>
                        <button
                          onClick={() => copyProductName(product.name)}
                          className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all hover:scale-110"
                          title="Ürün adını kopyala"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                        <div className="text-sm text-red-300 mb-1 font-medium">
                          Fiyat
                        </div>
                        <div className="text-2xl font-black bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent">
                          {product.priceText ||
                            `${product.price.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                            })} ₺`}
                        </div>
                      </div>

                      <div className="mb-3">
                        {product.available ? (
                          <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-900/60 to-emerald-900/60 text-green-300 text-sm font-semibold rounded-xl border border-green-600/50 shadow-lg shadow-green-900/20">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></span>
                            Stokta Var
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-900/60 to-rose-900/60 text-red-300 text-sm font-semibold rounded-xl border border-red-600/50 shadow-lg shadow-red-900/20">
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Stokta Yok
                          </div>
                        )}
                      </div>

                      {product.url && product.url !== "#" && (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:scale-105 ${
                            product.available
                              ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white hover:shadow-red-500/30"
                              : "bg-gradient-to-r from-red-900/60 to-rose-900/60 border border-red-600/40 text-red-300 hover:from-red-800/70 hover:to-rose-800/70 hover:border-red-500/60 hover:text-red-200 hover:shadow-red-700/20"
                          }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Ürüne Git</span>
                        </a>
                      )}
                    </div>
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
              <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-2xl p-5 text-center shadow-2xl transform group-hover:scale-105 transition-all duration-300">
                  <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2">
                    Denge
                    <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                      {results.denge.length}
                    </span>
                  </h3>
                </div>
              </div>

              {results.denge.length > 0 ? (
                results.denge.map((product, idx) => (
                  <div
                    key={idx}
                    className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-500/30 p-5 hover:border-gray-400/60 hover:shadow-2xl hover:shadow-gray-500/20 transition-all duration-300 hover:transform hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/0 to-gray-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <h4 className="font-semibold text-gray-100 line-clamp-2 flex-1 leading-snug group-hover:text-white transition-colors">
                          {product.name}
                        </h4>
                        <button
                          onClick={() => copyProductName(product.name)}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-500/20 rounded-lg transition-all hover:scale-110"
                          title="Ürün adını kopyala"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mb-3 p-3 bg-gray-500/10 rounded-xl border border-gray-500/20">
                        <div className="text-sm text-gray-300 mb-1 font-medium">
                          Fiyat
                        </div>
                        <div className="text-2xl font-black bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                          {product.price.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          {product.currency || "₺"}
                        </div>
                      </div>

                      <div className="mb-3">
                        {product.available ? (
                          <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-green-900/60 to-emerald-900/60 text-green-300 text-sm font-semibold rounded-xl border border-green-600/50 shadow-lg shadow-green-900/20">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></span>
                            Stokta Var
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-red-900/60 to-rose-900/60 text-red-300 text-sm font-semibold rounded-xl border border-red-600/50 shadow-lg shadow-red-900/20">
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Stokta Yok
                          </div>
                        )}
                      </div>

                      {product.url && product.url !== "#" && (
                        <a
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl transform hover:scale-105 ${
                            product.available
                              ? "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white hover:shadow-gray-500/30"
                              : "bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-600/40 text-gray-400 hover:from-gray-700/70 hover:to-gray-800/70 hover:border-gray-500/60 hover:text-gray-300 hover:shadow-gray-700/20"
                          }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Ürüne Git</span>
                        </a>
                      )}
                    </div>
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

      <WebSearchResultsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        results={webSearchResults}
        isLoading={isWebSearching}
        searchTerm={currentSearchTerm}
      />

      {/* Kopyalama Toast Mesajı */}
      {copyMessage && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all">
          {copyMessage}
        </div>
      )}
    </div>
  );
};

export default ComparisonTab;
