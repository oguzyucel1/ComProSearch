import React from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Ürün ara...",
}) => {
  return (
    <div className="relative flex-1 max-w-2xl group">
      {/* Animated gradient border */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-0 group-focus-within:opacity-50 blur-sm transition-all duration-500 rounded-xl bg-[length:200%_100%] animate-gradient-x"></div>

      {/* Search icon with enhanced animation */}
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-20">
        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-all duration-300 group-focus-within:scale-110" />
      </div>

      {/* Main input with enhanced styling */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-12 py-3 bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-xl placeholder-gray-400 focus:ring-4 focus:ring-blue-600/30 focus:border-blue-600/50 hover:border-white/20 transition-all duration-300 text-gray-100 relative z-10 shadow-xl focus:shadow-2xl focus:shadow-blue-500/20"
        placeholder={placeholder}
      />

      {/* Clear button with enhanced animation */}
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-400 transition-all duration-300 z-10 group hover:scale-110 hover:rotate-90"
        >
          <X className="h-5 w-5 transition-transform duration-300" />
        </button>
      )}

      {/* Floating particles effect (optional) */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500/20 rounded-full blur-sm animate-ping opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-purple-500/20 rounded-full blur-sm animate-ping opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 delay-200"></div>
      </div>
    </div>
  );
};

export default SearchBar;
