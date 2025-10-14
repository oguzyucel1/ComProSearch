import React, { useEffect, useMemo, useState } from "react";
import { Package, KeyRound, Heart, Eye, X } from "lucide-react";
import TabNavigation from "./components/TabNavigation";
import ProductGrid from "./components/ProductGrid";
import SearchBar from "./components/SearchBar";
import CategoryDropdown from "./components/CategoryDropdown";
import ComparisonTab from "./components/ComparisonTab";
import OtpInputPage from "./pages/OtpInputPage";
import type { Product } from "./types";
import {
  fetchProductsByTab,
  fetchCategoriesByTab,
  fetchLastUpdatedDate,
} from "./services/products";

type TabType = "oksid" | "penta" | "denge" | "comparison";

const TABS: Record<
  TabType,
  { name: string; accentText: string; accentBg: string }
> = {
  oksid: {
    name: "Oksid",
    accentText: "text-orange-600",
    accentBg: "bg-orange-600",
  },
  penta: {
    name: "Penta",
    accentText: "text-red-600",
    accentBg: "bg-red-600",
  },
  denge: {
    name: "Denge",
    accentText: "text-gray-400",
    accentBg: "bg-gray-900",
  },
  comparison: {
    name: "Karşılaştırma",
    accentText: "text-blue-600",
    accentBg: "bg-blue-600",
  },
};

// Remote data state
const initial: Product[] = [];

function App() {
  const [showOtpPage, setShowOtpPage] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("oksid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(initial);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<50 | 100 | 200>(50);
  const [total, setTotal] = useState(0);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("name");
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);

  // LocalStorage'dan favoriler ve teklifleri yükle
  useEffect(() => {
    const loadFavorites = () => {
      const stored = JSON.parse(localStorage.getItem("favorites") || "[]");
      // Marketplace bilgisi olmayan ürünleri filtrele (eski veriler)
      const validFavorites = stored.filter((item: Product) => item.marketplace);
      if (validFavorites.length !== stored.length) {
        // Geçersiz ürünler varsa localStorage'ı güncelle
        localStorage.setItem("favorites", JSON.stringify(validFavorites));
      }
      setFavorites(validFavorites);
    };
    const loadOffers = () => {
      const stored = JSON.parse(localStorage.getItem("offers") || "[]");
      // Marketplace bilgisi olmayan ürünleri filtrele (eski veriler)
      const validOffers = stored.filter((item: Product) => item.marketplace);
      if (validOffers.length !== stored.length) {
        // Geçersiz ürünler varsa localStorage'ı güncelle
        localStorage.setItem("offers", JSON.stringify(validOffers));
      }
      setOffers(validOffers);
    };

    loadFavorites();
    loadOffers();

    // Custom eventleri dinle (ProductCard'dan tetiklenir)
    window.addEventListener("favoritesUpdated", loadFavorites);
    window.addEventListener("offersUpdated", loadOffers);

    // Storage değişikliklerini dinle
    window.addEventListener("storage", loadFavorites);
    window.addEventListener("storage", loadOffers);

    return () => {
      window.removeEventListener("favoritesUpdated", loadFavorites);
      window.removeEventListener("offersUpdated", loadOffers);
      window.removeEventListener("storage", loadFavorites);
      window.removeEventListener("storage", loadOffers);
    };
  }, []);

  useEffect(() => {
    if (activeTab === "comparison" || showFavorites || showOffers) {
      setProducts([]);
      setLastUpdated(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    // Fetch both products and last updated date
    Promise.all([
      fetchProductsByTab(activeTab, page, pageSize, {
        search: searchQuery,
        category: selectedCategory,
        sort: sortBy,
      }),
      fetchLastUpdatedDate(activeTab),
    ])
      .then(([productsResult, lastUpdatedDate]) => {
        if (cancelled) return;
        setProducts(productsResult.items);
        setTotal(productsResult.total);
        setLastUpdated(lastUpdatedDate);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Veri çekilirken hata oluştu");
        setProducts([]);
        setTotal(0);
        setLastUpdated(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    page,
    pageSize,
    searchQuery,
    selectedCategory,
    sortBy,
    showFavorites,
    showOffers,
  ]);

  // Reset page when tab, pageSize, search, category, or sort changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, pageSize, searchQuery, selectedCategory, sortBy]);

  // Reset category selection when tab changes
  useEffect(() => {
    setSelectedCategory("all");
  }, [activeTab]);

  // Fetch full category list for active tab (paged through entire table)
  useEffect(() => {
    let cancelled = false;
    setAllCategories([]);
    if (activeTab === "comparison") return;
    fetchCategoriesByTab(activeTab)
      .then((cats) => {
        if (cancelled) return;
        setAllCategories(cats);
      })
      .catch(() => {
        if (cancelled) return;
        setAllCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // Server-side filtreleme kullanıldığı için doğrudan products'ı gösteriyoruz
  const pageProducts = products;

  const categories: string[] = useMemo(() => {
    return ["all", ...allCategories];
  }, [allCategories]);

  // If OTP page is active, render it
  if (showOtpPage) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900/60 backdrop-blur-xl border-b border-white/10 z-50 flex-shrink-0 relative overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-orange-500/5 animate-pulse"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/30 group-hover:shadow-orange-500/40 transition-all duration-300 group-hover:scale-110">
                  <Package className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-orange-200 bg-clip-text text-transparent hover:from-orange-200 hover:via-purple-200 hover:to-blue-200 transition-all duration-500">
                  SearchPro
                </h1>
              </div>
              <button
                onClick={() => setShowOtpPage(false)}
                className="group inline-flex items-center gap-2 rounded-lg border border-blue-500/50 px-4 py-2 text-sm font-semibold text-blue-400 transition-all duration-300 hover:bg-blue-500/10 hover:border-blue-400 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Package className="size-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="group-hover:text-blue-300 transition-colors">
                  Ana Sayfaya Dön
                </span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <OtpInputPage />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-blue-500/5 to-purple-500/5 animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/30 group-hover:shadow-orange-500/40 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Package className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-orange-100 to-blue-200 bg-clip-text text-transparent hover:from-blue-200 hover:via-purple-200 hover:to-orange-200 transition-all duration-700 hover:scale-105">
                SearchPro
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowFavorites(!showFavorites);
                  setShowOffers(false);
                  setShowOtpPage(false);
                  const stored = JSON.parse(
                    localStorage.getItem("favorites") || "[]"
                  );
                  setFavorites(stored);
                }}
                className={`group inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 ${
                  showFavorites
                    ? "border-red-500 bg-red-500/20 text-red-300 shadow-red-500/20"
                    : "border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 hover:shadow-red-500/20 focus-visible:ring-red-500"
                }`}
              >
                <Heart
                  className={`size-4 transition-transform duration-300 ${
                    showFavorites ? "fill-current" : "group-hover:scale-110"
                  }`}
                />
                <span className="group-hover:text-red-300 transition-colors">
                  Favorilerim ({favorites.length})
                </span>
              </button>
              <button
                onClick={() => {
                  setShowOffers(!showOffers);
                  setShowFavorites(false);
                  setShowOtpPage(false);
                  const stored = JSON.parse(
                    localStorage.getItem("offers") || "[]"
                  );
                  setOffers(stored);
                }}
                className={`group inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 ${
                  showOffers
                    ? "border-blue-500 bg-blue-500/20 text-blue-300 shadow-blue-500/20"
                    : "border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 hover:shadow-blue-500/20 focus-visible:ring-blue-500"
                }`}
              >
                <Eye
                  className={`size-4 transition-transform duration-300 ${
                    showOffers ? "fill-current" : "group-hover:scale-110"
                  }`}
                />
                <span className="group-hover:text-blue-300 transition-colors">
                  Teklif Sunduklarım ({offers.length})
                </span>
              </button>
              <button
                onClick={() => {
                  setShowOtpPage(true);
                  setShowFavorites(false);
                  setShowOffers(false);
                }}
                className="group inline-flex items-center gap-2 rounded-lg border border-green-500/50 px-4 py-2 text-sm font-semibold text-green-400 transition-all duration-300 hover:bg-green-500/10 hover:border-green-400 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                <KeyRound className="size-4 group-hover:rotate-12 transition-transform duration-300" />
                <span className="group-hover:text-green-300 transition-colors">
                  Ürün Güncelleme
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      {!showFavorites && !showOffers && (
        <div className="flex-shrink-0">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {showFavorites ? (
            <>
              <div className="mb-8 relative">
                <button
                  onClick={() => setShowFavorites(false)}
                  className="absolute -top-2 right-0 p-2 rounded-full bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400 transition-all duration-300 hover:scale-110 hover:rotate-90 group"
                  title="Ana sayfaya dön"
                >
                  <X className="w-6 h-6 transition-transform duration-300" />
                </button>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent mb-2">
                  Favorilerim
                </h2>
                <p className="text-gray-400">
                  Favori olarak işaretlediğiniz {favorites.length} adet ürün
                  var!
                </p>
              </div>
              {favorites.length === 0 ? (
                <div className="py-12 text-center">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">
                    Henüz favori ürününüz yok
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Ürün kartlarındaki kalp ikonuna tıklayarak favorilere
                    ekleyebilirsiniz
                  </p>
                </div>
              ) : (
                <ProductGrid products={favorites} tabType="oksid" />
              )}
            </>
          ) : showOffers ? (
            <>
              <div className="mb-8 relative">
                <button
                  onClick={() => setShowOffers(false)}
                  className="absolute -top-2 right-0 p-2 rounded-full bg-blue-500/10 border border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-400 transition-all duration-300 hover:scale-110 hover:rotate-90 group"
                  title="Ana sayfaya dön"
                >
                  <X className="w-6 h-6 transition-transform duration-300" />
                </button>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent mb-2">
                  Teklif Sunduklarım
                </h2>
                <p className="text-gray-400">
                  Teklif sunduğunuz {offers.length} adet ürün var!
                </p>
              </div>
              {offers.length === 0 ? (
                <div className="py-12 text-center">
                  <Eye className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">
                    Henüz teklif ettiğiniz ürün yok
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Ürün kartlarındaki göz ikonuna tıklayarak teklif
                    ettiklerinize ekleyebilirsiniz
                  </p>
                </div>
              ) : (
                <ProductGrid products={offers} tabType="oksid" />
              )}
            </>
          ) : activeTab === "comparison" ? (
            <ComparisonTab />
          ) : (
            <>
              {/* Search and Filter Section */}
              <div className="mb-8 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={`${
                      activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                    } ürünlerinde ara...`}
                  />
                  <CategoryDropdown
                    key={activeTab}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    tabType={activeTab}
                  />
                </div>
              </div>

              {/* Results Summary */}
              <div className="mb-6 flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/40 to-gray-800/40 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="group">
                  <p className="text-gray-300 transition-all duration-300 group-hover:text-gray-200">
                    Toplam
                    <span className="font-bold text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text mx-1 transition-all duration-500 hover:from-purple-400 hover:to-orange-400">
                      {total.toLocaleString("tr-TR")}
                    </span>
                    ürün • Bu sayfada
                    <span className="font-bold text-transparent bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text mx-1 transition-all duration-500 hover:from-red-400 hover:to-pink-400">
                      {pageProducts.length}
                    </span>
                  </p>
                  {lastUpdated && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center group-hover:text-gray-300 transition-colors">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                      Son güncelleme: {lastUpdated}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  {/* Sıralama */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Sırala:</span>
                    <div className="flex rounded-lg border border-white/10 bg-gray-900/60 backdrop-blur-sm overflow-hidden">
                      {[
                        { value: "price-low", label: "Fiyat ↑" },
                        { value: "price-high", label: "Fiyat ↓" },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={`px-3 py-1.5 text-sm transition-colors ${
                            sortBy === option.value
                              ? "bg-white/10 text-white font-medium"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sayfa başı */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Sayfa başı:</span>
                    <div className="flex rounded-lg border border-white/10 bg-gray-900/60 backdrop-blur-sm overflow-hidden">
                      {[50, 100, 200].map((s) => (
                        <button
                          key={s}
                          onClick={() => setPageSize(s as 50 | 100 | 200)}
                          className={`px-3 py-1.5 text-sm transition-colors ${
                            pageSize === s
                              ? "bg-white/10 text-white font-medium"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              {loading ? (
                <div className="py-12 text-center text-gray-300">
                  Yükleniyor…
                </div>
              ) : error ? (
                <div className="py-12 text-center text-red-300">{error}</div>
              ) : (
                <ProductGrid products={pageProducts} tabType={activeTab} />
              )}

              {/* Pagination */}
              {!loading && !error && total > 0 && (
                <div className="mt-8 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {(() => {
                      const start = (page - 1) * pageSize + 1;
                      const end = Math.min(page * pageSize, total);
                      return `Gösterilen: ${start}–${end}`;
                    })()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg bg-gray-900/60 border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Önceki
                    </button>
                    <span className="text-sm text-gray-400">
                      Sayfa {page} / {Math.max(1, Math.ceil(total / pageSize))}
                    </span>
                    <button
                      onClick={() =>
                        setPage((p) =>
                          Math.min(
                            Math.max(1, Math.ceil(total / pageSize)),
                            p + 1
                          )
                        )
                      }
                      disabled={page >= Math.ceil(total / pageSize)}
                      className="px-4 py-2 rounded-lg bg-gray-900/60 border border-white/10 text-gray-200 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
