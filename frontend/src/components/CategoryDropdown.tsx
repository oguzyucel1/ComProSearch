import React, { useState } from "react";
import { ChevronDown, Tag } from "lucide-react";

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

  const getGradient = () => {
    switch (tabType) {
      case "oksid":
        return "from-orange-500 to-amber-500";
      case "penta":
        return "from-red-500 to-rose-500";
      case "denge":
        return "from-gray-700 to-gray-900";
      default:
        return "from-blue-500 to-indigo-600";
    }
  };

  const getBorderColor = () => {
    switch (tabType) {
      case "oksid":
        return "border-orange-200 focus:border-orange-400";
      case "penta":
        return "border-red-200 focus:border-red-400";
      case "denge":
        return "border-gray-300 focus:border-gray-500";
      default:
        return "border-blue-200 focus:border-blue-400";
    }
  };

  const getHoverColor = () => {
    switch (tabType) {
      case "oksid":
        return "hover:bg-orange-50";
      case "penta":
        return "hover:bg-red-50";
      case "denge":
        return "hover:bg-gray-50";
      default:
        return "hover:bg-blue-50";
    }
  };

  const getSelectedDisplayName = () => {
    return selectedCategory === "all" ? "Tüm Kategoriler" : selectedCategory;
  };

  const getCategoryDisplayName = (category: string) => {
    return category === "all" ? "Tüm Kategoriler" : category;
  };

  return (
    <div className="relative lg:ml-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`min-w-[200px] px-6 py-3 bg-white/80 backdrop-blur-sm border-2 ${getBorderColor()} rounded-xl hover:bg-white/90 transition-all duration-200 flex items-center justify-between font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      >
        <div className="flex items-center space-x-2">
          <Tag className="w-5 h-5 text-gray-500" />
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-lg border border-gray-200 rounded-xl shadow-2xl z-20 overflow-hidden animate-slideDown">
            <div className="py-2">
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                const displayName = getCategoryDisplayName(category);

                return (
                  <button
                    key={category}
                    onClick={() => {
                      onCategoryChange(category);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left transition-all duration-200 flex items-center space-x-3 ${
                      isSelected
                        ? `bg-gradient-to-r ${getGradient()} text-white font-medium`
                        : `text-gray-700 ${getHoverColor()}`
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isSelected
                          ? "bg-white"
                          : tabType === "oksid"
                          ? "bg-orange-400"
                          : tabType === "penta"
                          ? "bg-red-400"
                          : tabType === "denge"
                          ? "bg-gray-400"
                          : "bg-blue-400"
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
