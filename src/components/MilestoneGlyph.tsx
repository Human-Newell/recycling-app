import { Sprout, Recycle, Globe, Flame, Medal, Gem, Award, type LucideIcon } from "lucide-react";

/** Minimal line glyphs for milestones — the chic-mode counterpart to emoji badges. */
const GLYPHS: Record<string, LucideIcon> = {
  scan_1_item: Sprout,
  scan_10_items: Recycle,
  scan_50_items: Globe,
  streak_7_days: Flame,
  earn_100_points: Medal,
  earn_1000_points: Gem,
};

interface MilestoneGlyphProps {
  criteria: string;
  className?: string;
}

export function MilestoneGlyph({ criteria, className }: MilestoneGlyphProps) {
  const Icon = GLYPHS[criteria] ?? Award;
  return <Icon className={className} strokeWidth={1.5} />;
}
