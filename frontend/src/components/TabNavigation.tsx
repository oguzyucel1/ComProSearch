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
    <div className="bg-gray-900/60 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 gap-3">
          <nav className="flex flex-wrap gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as any)}
                  className={`relative flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "" : "opacity-90"}`} />
                  <span>{tab.name}</span>
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
