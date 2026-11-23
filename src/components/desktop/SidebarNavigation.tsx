import { useLocation, useNavigate } from "react-router-dom";
import { Home, Activity, Award, CircleUser, Camera, Leaf } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Kept in sync with package.json until a release script manages it.
const APP_VERSION = "v0.0.0";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/history", label: "Activity", icon: Activity, requiresAuth: true },
  { path: "/badges", label: "Awards", icon: Award, requiresAuth: true },
  { path: "/profile", label: "You", icon: CircleUser },
];

/**
 * Persistent left sidebar for md+ screens. Hidden below md, where the
 * iOS tab bar (MobileNavigation) takes over.
 */
export function SidebarNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-50 md:w-64 md:flex-col bg-card border-r-[0.5px] border-border">
      {/* Logo / app name */}
      <div className="p-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-brand flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-[19px] font-bold tracking-[-0.02em] text-foreground">EcoScan</span>
        </div>
      </div>

      {/* Primary scan action — desktop replacement for the mobile scan tab */}
      <div className="px-4 pt-1">
        <button
          onClick={() => navigate("/scan")}
          className={cn(
            "w-full flex items-center gap-2.5 px-4 h-11 rounded-xl font-semibold transition-all active:opacity-70",
            location.pathname === "/scan"
              ? "bg-brand/15 text-brand-strong"
              : "btn-brand text-white"
          )}
        >
          <Camera className="w-[18px] h-[18px]" />
          <span>Scan Item</span>
        </button>
      </div>

      {/* Nav items — same routes as the mobile tab bar */}
      <div className="flex-1 p-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isDisabled = item.requiresAuth && !user;

          return (
            <button
              key={item.path}
              onClick={() => !isDisabled && navigate(item.path)}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors active:opacity-60",
                isActive
                  ? "bg-brand-tint text-brand-strong font-semibold"
                  : isDisabled
                  ? "text-muted-foreground/35 cursor-not-allowed"
                  : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
              <span className="text-[15px]">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t-[0.5px] border-border">
        <p className="text-xs text-muted-foreground/60 text-center">
          EcoScan {APP_VERSION}
        </p>
      </div>
    </nav>
  );
}
