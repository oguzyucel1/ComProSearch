import React from "react";
import { Package, Zap, Scale, BarChart3 } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: "oksid" | "penta" | "denge" | "comparison") => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
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
      gradient: "from-gray-700 to-gray-900",
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
    <div className="bg-white/60 backdrop-blur-lg border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 py-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as any)}
                className={`relative flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-${tab.color}-500/25`
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`}
                />
                <span>{tab.name}</span>
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;
