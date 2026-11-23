import { ReactNode, useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface IOSHeaderProps {
  /** Condensed title shown in the bar once the large title scrolls away. */
  title: string;
  /** Large title rendered in flow at the top of the page content. */
  largeTitle?: ReactNode;
  /** Optional intro line under the large title. */
  subtitle?: ReactNode;
  /** Show a back chevron that pops the history stack (or goes to `backTo`). */
  back?: boolean;
  backTo?: string;
  /** Right-side action (icon buttons). */
  right?: ReactNode;
  /** "chrome" = frosted on scroll; "dark" = solid dark bar (camera pages). */
  variant?: "chrome" | "dark";
}

/**
 * iOS large-title navigation bar. The frosted bar is fixed; the large title
 * scrolls away with the content while the condensed title fades in over it.
 * Pages must not add their own top padding — this component handles it.
 */
export function IOSHeader({
  title,
  largeTitle,
  subtitle,
  back,
  backTo,
  right,
  variant = "chrome",
}: IOSHeaderProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setScrolled(window.scrollY > 36);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Fixed frosted bar */}
      <div
        className={cn(
          "fixed top-0 inset-x-0 z-40 transition-all duration-200",
          variant === "chrome" && scrolled
            ? "chrome-blur border-b-[0.5px] border-border"
            : variant === "chrome"
            ? "bg-transparent border-b-[0.5px] border-transparent"
            : "bg-black border-b-[0.5px] border-white/10"
        )}
      >
        <div className="pt-[env(safe-area-inset-top)]">
          <div className="h-11 px-2 flex items-center justify-between">
            <div className="flex-1 flex items-center min-w-0">
              {back && (
                <button
                  onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
                  className="flex items-center pl-1.5 pr-3 py-1.5 rounded-full text-brand-strong active:opacity-50 transition-opacity"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-6 h-6 -ml-1" strokeWidth={2.5} />
                </button>
              )}
              <span
                aria-hidden={!(scrolled || variant === "dark")}
                className={cn(
                  "text-[17px] font-semibold truncate transition-all duration-200",
                  variant === "dark" ? "text-white" : "text-foreground",
                  scrolled || variant === "dark" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                )}
              >
                {title}
              </span>
            </div>
            <div className="flex items-center gap-1 pr-1">{right}</div>
          </div>
        </div>
      </div>

      {/* In-flow large title, clears the fixed bar */}
      {(largeTitle || subtitle) && (
        <div className="px-4 pt-[calc(env(safe-area-inset-top)+52px)]">
          {largeTitle && (
            <h1 className="text-[32px] leading-tight font-bold tracking-[-0.022em] text-foreground">
              {largeTitle}
            </h1>
          )}
          {subtitle && (
            <div className="text-[15px] text-muted-foreground mt-0.5">{subtitle}</div>
          )}
        </div>
      )}
    </>
  );
}
