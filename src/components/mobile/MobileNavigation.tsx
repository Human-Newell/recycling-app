import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Activity, Award, CircleUser, Camera, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/history", label: "Activity", icon: Activity, requiresAuth: true },
  { path: "/badges", label: "Awards", icon: Award, requiresAuth: true },
  { path: "/profile", label: "You", icon: CircleUser },
];

/**
 * iOS tab bar: frosted, hairline-topped, with a raised center scan button in
 * the Venmo/Clips idiom. Replaces the old bottom nav + floating action button.
 */
export function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const onScanPage = location.pathname === "/scan";

  return (
    <motion.nav
      initial={{ y: 90 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden chrome-blur border-t-[0.5px] border-border pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 items-stretch max-w-lg mx-auto px-2 h-[56px]">
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <TabButton key={item.path} item={item} />
        ))}

        {/* Raised center scan button */}
        <div className="relative h-full">
          <motion.button
            onClick={() => navigate(onScanPage ? "/" : "/scan")}
            whileTap={{ scale: 0.88 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            aria-label={onScanPage ? "Close scanner" : "Scan an item"}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 -top-[22px] w-[58px] h-[58px] rounded-full flex items-center justify-center",
              "bg-brand text-white shadow-float ring-4 ring-background active:opacity-80 transition-opacity"
            )}
          >
            <motion.span
              key={onScanPage ? "close" : "scan"}
              initial={{ scale: 0.6, rotate: -45, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="flex"
            >
              {onScanPage ? (
                <X className="w-6 h-6" strokeWidth={2.75} />
              ) : (
                <Camera className="w-[26px] h-[26px]" strokeWidth={2.25} />
              )}
            </motion.span>
          </motion.button>
        </div>

        {NAV_ITEMS.slice(2).map((item) => (
          <TabButton key={item.path} item={item} />
        ))}
      </div>
    </motion.nav>
  );

  function TabButton({
    item,
  }: {
    item: { path: string; label: string; icon: typeof Home; requiresAuth?: boolean };
  }) {
    const isActive = location.pathname === item.path;
    const isDisabled = item.requiresAuth && !user;
    const Icon = item.icon;

    return (
      <motion.button
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        onClick={() => !isDisabled && navigate(item.path)}
        disabled={isDisabled}
        className={cn(
          "self-center flex flex-col items-center justify-center gap-0.5 h-[52px] pt-1 transition-colors",
          isDisabled ? "text-muted-foreground/35 cursor-not-allowed" : isActive ? "text-brand-strong" : "text-muted-foreground"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="w-[24px] h-[24px]" strokeWidth={isActive ? 2.4 : 1.9} />
        <span className={cn("text-[10px] leading-none", isActive ? "font-semibold" : "font-medium")}>
          {item.label}
        </span>
      </motion.button>
    );
  }
}
