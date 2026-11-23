import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  pressable?: boolean;
  onClick?: () => void;
  delay?: number;
}

/**
 * iOS surface card: flat white cell on the grouped background — no border,
 * no shadow. Depth comes from layering, exactly like Health/Settings.
 */
export function MobileCard({ children, className = "", pressable = false, onClick, delay = 0 }: MobileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 32 }}
      whileTap={pressable ? { scale: 0.97 } : undefined}
      onClick={onClick}
      className={cn(
        "bg-card rounded-[var(--radius-card)] p-4 overflow-hidden",
        pressable && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  delay?: number;
}

export function StatCard({ icon, value, label, trend, trendValue, delay = 0 }: StatCardProps) {
  return (
    <MobileCard delay={delay} className="flex-1 min-w-[140px]">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-brand-soft rounded-xl">{icon}</div>
          {trend && trendValue && (
            <span
              className={`text-xs font-semibold ${
                trend === "up"
                  ? "text-brand-strong"
                  : trend === "down"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
        </div>
        <div>
          <p className="numerals text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </MobileCard>
  );
}
