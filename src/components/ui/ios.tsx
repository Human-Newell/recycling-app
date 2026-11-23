import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inset grouped list primitives — the iOS Settings building block. A white
 * rounded group of rows separated by hairlines, on the grouped background.
 */

export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("list-group", className)}>{children}</div>;
}

interface ListRowProps {
  icon?: ReactNode;
  iconTint?: "brand" | "streak" | "info" | "destructive" | "plain";
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  accessory?: ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  className?: string;
}

const ICON_TINTS: Record<string, string> = {
  brand: "bg-brand-soft text-brand-strong",
  streak: "bg-streak/10 text-streak",
  info: "bg-info-soft text-info",
  destructive: "bg-destructive/10 text-destructive",
  plain: "bg-muted/10 text-muted-foreground",
};

export function ListRow({
  icon,
  iconTint = "brand",
  title,
  subtitle,
  value,
  accessory,
  chevron,
  destructive,
  onClick,
  className,
}: ListRowProps) {
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn("list-row", interactive && "cursor-pointer", className)}
    >
      {icon && (
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            ICON_TINTS[iconTint]
          )}
        >
          {icon}
        </div>
      )}
      <div className={cn("flex-1 min-w-0", subtitle ? "py-2.5" : "")}>
        <p
          className={cn(
            "text-[16px] leading-snug",
            destructive ? "text-destructive" : "text-foreground",
            !subtitle && "truncate"
          )}
        >
          {title}
        </p>
        {subtitle && (
          <p className="text-[13px] text-muted-foreground leading-snug mt-0.5">{subtitle}</p>
        )}
      </div>
      {value && <div className="text-[15px] text-muted-foreground flex-shrink-0">{value}</div>}
      {accessory}
      {chevron && (
        <ChevronRight className="w-[18px] h-[18px] text-muted-foreground/50 flex-shrink-0" />
      )}
    </div>
  );
}

/**
 * iOS segmented control: pill track, sliding white selection card.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex gap-0.5 p-[2px] rounded-[10px] bg-muted/15", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => !active && onChange(option.value)}
            className={cn(
              "relative flex-1 h-8 rounded-lg text-[13px] font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId={`segment-${ariaLabel ?? "default"}`}
                className="absolute inset-0 rounded-lg bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * A stat in the Health "favorites" idiom: rounded value on a flat card.
 */
export function StatTile({
  icon,
  value,
  label,
  accent = "brand",
  delay = 0,
  className,
}: {
  icon?: ReactNode;
  value: ReactNode;
  label: string;
  accent?: "brand" | "streak" | "info";
  delay?: number;
  className?: string;
}) {
  const accents: Record<string, { text: string; bg: string }> = {
    brand: { text: "text-brand-strong", bg: "bg-brand-soft" },
    streak: { text: "text-streak", bg: "bg-streak/10" },
    info: { text: "text-info", bg: "bg-info-soft" },
  };
  const a = accents[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 380, damping: 30 }}
      className={cn("bg-card rounded-[16px] p-4 flex flex-col gap-3", className)}
    >
      {icon && (
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", a.bg)}>
          {icon}
        </div>
      )}
      <div>
        <p className="numerals text-[28px] leading-none font-bold text-foreground">{value}</p>
        <p className="text-[13px] text-muted-foreground mt-1.5 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}
