import React, { useState } from "react";
import {
  Search,
  Filter,
  ShoppingCart,
  TrendingUp,
  Scale,
  Package,
  Star,
  Eye,
  Heart,
  RefreshCw,
  Loader2,
  Check,
} from "lucide-react";
import TabNavigation from "./components/TabNavigation";
import ProductGrid from "./components/ProductGrid";
import SearchBar from "./components/SearchBar";
import CategoryDropdown from "./components/CategoryDropdown";
import ComparisonTab from "./components/ComparisonTab";

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
    accentText: "text-gray-900",
    accentBg: "bg-gray-900",
  },
  comparison: {
    name: "Karşılaştırma",
    accentText: "text-blue-600",
    accentBg: "bg-blue-600",
  },
};

// Mock data for demonstration
const mockProducts = {
  oksid: [
    {
      id: 1,
      name: "Premium Oksid 2024",
      category: "Elektronik",
      price: 1299.99,
      image:
        "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?w=400&h=300&fit=crop",
      rating: 4.8,
      reviews: 142,
      description: "Yüksek performanslı oksid ürünü",
      inStock: true,
    },
    {
      id: 2,
      name: "Oksid Pro Max",
      category: "Teknoloji",
      price: 2199.99,
      image:
        "https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?w=400&h=300&fit=crop",
      rating: 4.9,
      reviews: 89,
      description: "Profesyonel kullanım için geliştirilmiş",
      inStock: true,
    },
  ],
  penta: [
    {
      id: 3,
      name: "Penta Ultimate",
      category: "Endüstriyel",
      price: 999.99,
      image:
        "https://images.pexels.com/photos/57690/pexels-photo-57690.jpeg?w=400&h=300&fit=crop",
      rating: 4.7,
      reviews: 203,
      description: "Endüstriyel penta çözümü",
      inStock: true,
    },
    {
      id: 4,
      name: "Penta Standard",
      category: "Genel",
      price: 599.99,
      image:
        "https://images.pexels.com/photos/163064/play-stone-network-networked-interactive-163064.jpeg?w=400&h=300&fit=crop",
      rating: 4.5,
      reviews: 156,
      description: "Standart kullanım için ideal",
      inStock: false,
    },
  ],
  denge: [
    {
      id: 5,
      name: "Denge Pro",
      category: "Hassasiyet",
      price: 1599.99,
      image:
        "https://images.pexels.com/photos/60582/newton-s-cradle-balls-sphere-action-60582.jpeg?w=400&h=300&fit=crop",
      rating: 4.9,
      reviews: 78,
      description: "Yüksek hassasiyetli denge sistemi",
      inStock: true,
    },
    {
      id: 6,
      name: "Denge Classic",
      category: "Standart",
      price: 899.99,
      image:
        "https://images.pexels.com/photos/248515/pexels-photo-248515.jpeg?w=400&h=300&fit=crop",
      rating: 4.6,
      reviews: 234,
      description: "Klasik denge çözümü",
      inStock: true,
    },
  ],
};

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("oksid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [updating, setUpdating] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);

  const handleUpdate = async () => {
    if (updating) return;
    setUpdating(true);
    setJustUpdated(false);
    // TODO: Replace with real API call per tab
    await new Promise((r) => setTimeout(r, 1200));
    setUpdating(false);
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 1200);
  };

  const getTabData = () => {
    if (activeTab === "comparison") return [];
    return mockProducts[activeTab] || [];
  };

  const filteredProducts = getTabData().filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(getTabData().map((p) => p.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                MarketPlace Pro
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Heart className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
                  7
                </span>
              </button>
            </div>
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
            <div className="mb-4 flex items-center justify-end">
              <button
                onClick={handleUpdate}
                disabled={updating}
                className={`inline-flex items-center gap-2 rounded-md border border-current px-3 py-2 text-sm font-semibold transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current disabled:opacity-60 disabled:cursor-not-allowed ${TABS[activeTab].accentText}`}
              >
                {updating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Güncelleniyor…</span>
                  </>
                ) : justUpdated ? (
                  <>
                    <Check className="size-4" />
                    <span>Güncellendi</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" />
                    <span>{TABS[activeTab].name}’i güncelle</span>
                  </>
                )}
              </button>
            </div>
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
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  tabType={activeTab}
                />
              </div>
            </div>

            {/* Results Summary */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                <span className="font-semibold text-gray-900">
                  {filteredProducts.length}
                </span>{" "}
                ürün bulundu
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Sırala:</span>
                <select className="px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="name">İsme göre</option>
                  <option value="price-low">Fiyat (Düşük-Yüksek)</option>
                  <option value="price-high">Fiyat (Yüksek-Düşük)</option>
                  <option value="rating">Puana göre</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <ProductGrid products={filteredProducts} tabType={activeTab} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
