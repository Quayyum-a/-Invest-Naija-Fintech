import { Button } from "@/components/ui/button";
import { Home, TrendingUp, Bitcoin, BarChart3, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export default function BottomNavigation() {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      icon: Home,
      label: "Home",
    },
    {
      href: "/portfolio",
      icon: TrendingUp,
      label: "Invest",
    },
    {
      href: "/crypto",
      icon: Bitcoin,
      label: "Crypto",
    },

    {
      href: "/onboarding",
      icon: User,
      label: "Profile",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} to={item.href} className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full flex flex-col items-center py-2 px-1 h-auto space-y-1",
                    isActive
                      ? "text-naira-green"
                      : "text-gray-500 hover:text-gray-700",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-naira-green" : "text-gray-500",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isActive ? "text-naira-green" : "text-gray-500",
                    )}
                  >
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
