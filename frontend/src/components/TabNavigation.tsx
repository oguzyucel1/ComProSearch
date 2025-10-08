import React, { ReactNode } from "react";
import { Package, Zap, Scale, BarChart3 } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: "oksid" | "penta" | "denge" | "comparison") => void;
  rightContent?: ReactNode;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  rightContent,
}) => {
  const tabs = [
    {
      id: "oksid",
      name: "Oksid",
      icon: Package,
      color: "orange",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      id: "penta",
      name: "Penta",
      icon: Zap,
      color: "red",
      gradient: "from-red-500 to-rose-500",
    },
    {
      id: "denge",
      name: "Denge",
      icon: Scale,
      color: "gray",
      gradient: "from-gray-400 to-gray-600",
    },
    {
      id: "comparison",
      name: "Karşılaştırma",
      icon: BarChart3,
      color: "blue",
      gradient: "from-blue-500 to-indigo-600",
    },
  ];

  return (
    <div className="bg-gray-900/60 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 gap-3">
          <nav className="flex flex-wrap gap-4">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as any)}
                  className={`group relative flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl shadow-black/20 ring-2 ring-white/20`
                      : "text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Active tab glow effect */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl animate-pulse"></div>
                  )}

                  {/* Icon with enhanced animations */}
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      isActive
                        ? "drop-shadow-lg animate-pulse"
                        : "opacity-80 group-hover:opacity-100 group-hover:rotate-12 group-hover:scale-110"
                    }`}
                  />

                  {/* Text with gradient effect on hover */}
                  <span
                    className={`relative transition-all duration-300 ${
                      isActive
                        ? "font-semibold"
                        : `group-hover:bg-gradient-to-r ${
                            tab.id === "oksid"
                              ? "group-hover:from-orange-400 group-hover:to-amber-400"
                              : tab.id === "penta"
                              ? "group-hover:from-red-400 group-hover:to-rose-400"
                              : tab.id === "denge"
                              ? "group-hover:from-gray-300 group-hover:to-gray-500"
                              : "group-hover:from-blue-400 group-hover:to-purple-400"
                          } group-hover:bg-clip-text group-hover:text-transparent`
                    }`}
                  >
                    {tab.name}
                  </span>
                </button>
              );
            })}
          </nav>
          {rightContent && <div className="shrink-0">{rightContent}</div>}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
