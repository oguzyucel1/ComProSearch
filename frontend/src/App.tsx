import React, { useEffect, useMemo, useState } from "react";
import { Package, KeyRound } from "lucide-react";
import TabNavigation from "./components/TabNavigation";
import ProductGrid from "./components/ProductGrid";
import SearchBar from "./components/SearchBar";
import CategoryDropdown from "./components/CategoryDropdown";
import ComparisonTab from "./components/ComparisonTab";
import OtpInputPage from "./pages/OtpInputPage";
import type { Product } from "./types";
import { fetchProductsByTab, fetchCategoriesByTab } from "./services/products";

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
  const [activeTab, setActiveTab] = useState<TabType>("oksid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(initial);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<50 | 100 | 200>(50);
  const [total, setTotal] = useState(0);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("name");

  useEffect(() => {
    if (activeTab === "comparison") {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProductsByTab(activeTab, page, pageSize, {
      search: searchQuery,
      category: selectedCategory,
      sort: sortBy,
    })
      .then(({ items, total }) => {
        if (cancelled) return;
        setProducts(items);
        setTotal(total);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Veri çekilirken hata oluştu");
        setProducts([]);
        setTotal(0);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, page, pageSize, searchQuery, selectedCategory, sortBy]);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100">
        {/* Header */}
        <header className="bg-gray-900/60 backdrop-blur border-b border-white/10 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-900/20">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">
                  ComPro Product Search
                </h1>
              </div>
              <button
                onClick={() => setShowOtpPage(false)}
                className="inline-flex items-center gap-2 rounded-md border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Package className="size-4" />
                <span>Ana Sayfaya Dön</span>
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OtpInputPage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100">
      {/* Header */}
      <header className="bg-gray-900/60 backdrop-blur border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md shadow-orange-900/20">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                ComPro Product Search
              </h1>
            </div>
            <button
              onClick={() => setShowOtpPage(true)}
              className="inline-flex items-center gap-2 rounded-md border border-green-500 px-4 py-2 text-sm font-semibold text-green-400 transition-colors hover:bg-green-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <KeyRound className="size-4" />
              <span>Ürün Güncelleme</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "comparison" ? (
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
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-300">
                Toplam
                <span className="font-semibold text-white mx-1">{total}</span>
                ürün • Bu sayfada
                <span className="font-semibold text-white mx-1">
                  {pageProducts.length}
                </span>
              </p>
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
              <div className="py-12 text-center text-gray-300">Yükleniyor…</div>
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
      </main>
    </div>
  );
}

export default App;
