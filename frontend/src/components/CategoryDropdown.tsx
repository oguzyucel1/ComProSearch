import React, { useMemo, useState } from "react";
import { ChevronDown, Tag, Search } from "lucide-react";

interface CategoryDropdownProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  tabType: string;
}

const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  tabType,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const getGradient = () => {
    switch (tabType) {
      case "oksid":
        return "from-orange-500 to-amber-500";
      case "penta":
        return "from-orange-500 to-yellow-500";
      case "denge":
        return "from-gray-400 to-gray-600";
      default:
        return "from-blue-500 to-indigo-600";
    }
  };

  const getBorderColor = () => {
    switch (tabType) {
      case "oksid":
        return "border-orange-700 focus:border-orange-500";
      case "penta":
        return "border-orange-700 focus:border-red-500";
      case "denge":
        return "border-gray-600 focus:border-gray-400";
      default:
        return "border-blue-700 focus:border-blue-500";
    }
  };

  const getHoverColor = () => {
    switch (tabType) {
      case "oksid":
        return "hover:bg-orange-950/20";
      case "penta":
        return "hover:bg-red-950/20";
      case "denge":
        return "hover:bg-gray-800/30";
      default:
        return "hover:bg-blue-950/20";
    }
  };

  const getSelectedDisplayName = () => {
    return selectedCategory === "all" ? "Tüm Kategoriler" : selectedCategory;
  };

  const getCategoryDisplayName = (category: string) => {
    return category === "all" ? "Tüm Kategoriler" : category;
  };

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      getCategoryDisplayName(c).toLowerCase().includes(q)
    );
  }, [categories, query]);

  return (
    <div className="relative lg:ml-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`min-w-[280px] px-6 py-3 bg-gray-900/60 backdrop-blur-sm border ${getBorderColor()} rounded-xl hover:bg-gray-900/70 transition-all duration-200 flex items-center justify-between font-medium text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600/40 text-base`}
      >
        <div className="flex items-center space-x-2">
          <Tag className="w-5 h-5 text-gray-300" />
          <span>{getSelectedDisplayName()}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-2 w-[360px] h-[380px] bg-gray-900/90 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden animate-slideDown">
            {/* Search input */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Kategori ara..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-800/70 border border-white/10 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/40 focus:border-blue-600/40"
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div className="py-2 overflow-y-auto h-[calc(380px-56px)]">
              {filteredCategories.map((category) => {
                const isSelected = selectedCategory === category;
                const displayName = getCategoryDisplayName(category);

                return (
                  <button
                    key={category}
                    onClick={() => {
                      onCategoryChange(category);
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center space-x-3 whitespace-normal break-words ${
                      isSelected
                        ? `bg-gradient-to-r ${getGradient()} text-white font-medium`
                        : `text-gray-200 ${getHoverColor()}`
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isSelected
                          ? "bg-white"
                          : tabType === "oksid"
                          ? "bg-orange-500"
                          : tabType === "penta"
                          ? "bg-red-500"
                          : tabType === "denge"
                          ? "bg-gray-400"
                          : "bg-blue-500"
                      }`}
                    />
                    <span>{displayName}</span>
                    {isSelected && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryDropdown;
