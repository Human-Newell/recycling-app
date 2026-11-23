import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ListGroup, ListRow } from "@/components/ui/ios";
import { BottomSheet } from "@/components/mobile/BottomSheet";
import { IOSHeader } from "@/components/IOSHeader";
import { MobileCard } from "@/components/mobile/MobileCard";
import {
  Award,
  TrendingUp,
  Flame,
  Leaf,
  LogOut,
  Mail,
  Calendar,
  Lock,
  CheckCircle2,
  Moon,
  Sun,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useState } from "react";
import { useTheme } from "next-themes";
import { getTotalEnvironmentalImpact } from "@/lib/impact";
import { MilestoneGlyph } from "@/components/MilestoneGlyph";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  requirement?: number;
}

const BADGE_REQUIREMENTS: Record<string, { progress: number; label: string; type: "scans" | "points" | "streak" }> = {
  scan_1_item: { progress: 1, label: "1 scan", type: "scans" },
  scan_10_items: { progress: 10, label: "10 scans", type: "scans" },
  scan_50_items: { progress: 50, label: "50 scans", type: "scans" },
  streak_7_days: { progress: 7, label: "7 day streak", type: "streak" },
  earn_100_points: { progress: 100, label: "100 points", type: "points" },
  earn_1000_points: { progress: 1000, label: "1000 points", type: "points" },
};

function getUserStatForType(type: "scans" | "points" | "streak", user: NonNullable<ReturnType<typeof useAuth>["user"]>): number {
  switch (type) {
    case "scans": return user.total_scans || 0;
    case "points": return user.points;
    case "streak": return user.current_streak;
  }
}

export default function ProfilePage({ focusBadges = false }: { focusBadges?: boolean }) {
  const { user, logout, recyclingHistory } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const badgesSectionRef = useRef<HTMLDivElement | null>(null);

  // If we landed on /badges, scroll the badges section into view after mount.
  useEffect(() => {
    if (focusBadges && user && badgesSectionRef.current) {
      badgesSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [focusBadges, user]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Chart data: last 7 days activity (local-time day boundaries)
  const weeklyActivityData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // toLocaleDateString('en-CA') gives YYYY-MM-DD in LOCAL time (not UTC),
      // matching the user's actual day boundaries rather than UTC's.
      const dateStr = date.toLocaleDateString("en-CA");
      const count = recyclingHistory.filter((entry) =>
        entry.created_at?.startsWith(dateStr)
      ).length;
      days.push({
        day: format(date, "EEE"),
        count,
      });
    }
    return days;
  }, [recyclingHistory]);

  // Chart data: material breakdown
  const materialBreakdownData = useMemo(() => {
    const counts: Record<string, number> = {};
    recyclingHistory.forEach((entry) => {
      const material = entry.material.split(" (")[0].split("#")[0].trim();
      counts[material] = (counts[material] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [recyclingHistory]);

  // iOS system chart palette: tints of the brand + system hues
  const MATERIAL_COLORS = ["#34C759", "#30D158", "#0A84FF", "#FF9F0A", "#FF375F", "#5E5CE6", "#64D2FF"];
  const CHART_BAR_FILL = "#34C759";
  const CHART_TICK = theme === "dark" ? "#98989D" : "#6C6C72";

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Award className="w-14 h-14 text-muted-foreground/40 mx-auto mb-4" strokeWidth={1.8} />
          <h2 className="text-[22px] font-bold text-foreground mb-1">Sign in to view profile</h2>
          <p className="text-[15px] text-muted-foreground">Track your achievements and progress</p>
        </div>
      </div>
    );
  }

  // Build badges from real data + all available badge definitions.
  // (user_badges.badge_id always maps to a known criteria via the seed, so no
  // separate "unknown badges" pass is needed.)
  const unlockedBadgeIds = new Set(user.badges.map((b) => b.criteria));
  const allBadges = Object.entries(BADGE_REQUIREMENTS).map(([criteria, req]) => {
    const isUnlocked = unlockedBadgeIds.has(criteria);
    const current = getUserStatForType(req.type, user);
    const badgeData = user.badges.find((b) => b.criteria === criteria);

    return {
      id: criteria,
      name: badgeData?.name || criteria.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: badgeData?.description || `Reach ${req.label}`,
      unlocked: isUnlocked,
      unlockedAt: badgeData?.unlockedAt,
      progress: isUnlocked ? undefined : Math.min(current, req.progress),
      requirement: req.progress,
    };
  });

  const impact = getTotalEnvironmentalImpact(recyclingHistory);
  const unlockedCount = allBadges.filter((b) => b.unlocked).length;

  return (
    <div className="min-h-screen pb-8">
      <IOSHeader
        title={user.name}
        largeTitle={user.name}
        subtitle={
          <span className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {user.email}
          </span>
        }
        right={
          <div className="w-9 h-9 rounded-full bg-brand text-white text-[15px] font-semibold flex items-center justify-center">
            {user.name.charAt(0).toUpperCase()}
          </div>
        }
      />

      <div className="px-4 pt-2 pb-10 space-y-6">
        {/* Membership line */}
        <p className="text-[13px] text-muted-foreground px-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Member since{" "}
          {format(user.created_at ? new Date(user.created_at) : new Date(), "MMMM yyyy")}
        </p>

        {/* Stats — Health-style favorites cards */}
        <section className="grid grid-cols-2 gap-3" aria-label="Your stats">
          <div className="bg-card rounded-[16px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-brand-strong" strokeWidth={2.4} />
              <span className="text-[13px] font-medium text-muted-foreground">Points</span>
            </div>
            <p className="numerals text-[30px] leading-none font-bold">{user.points.toLocaleString()}</p>
          </div>
          <div className="bg-card rounded-[16px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-streak" strokeWidth={2.4} />
              <span className="text-[13px] font-medium text-muted-foreground">Current streak</span>
            </div>
            <p className="numerals text-[30px] leading-none font-bold">
              {user.current_streak}
              <span className="text-[15px] font-medium text-muted-foreground ml-1">days</span>
            </p>
          </div>
          <div className="bg-card rounded-[16px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-info" strokeWidth={2.4} />
              <span className="text-[13px] font-medium text-muted-foreground">Best streak</span>
            </div>
            <p className="numerals text-[30px] leading-none font-bold">{user.longest_streak}</p>
          </div>
          <div className="bg-card rounded-[16px] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-brand-strong" strokeWidth={2.4} />
              <span className="text-[13px] font-medium text-muted-foreground">Total scans</span>
            </div>
            <p className="numerals text-[30px] leading-none font-bold">{user.total_scans ?? 0}</p>
          </div>
        </section>

        {/* Badges */}
        <section ref={badgesSectionRef} aria-label="Badges" className="scroll-mt-20">
          <header className="flex items-baseline justify-between px-1 pb-2">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground">Badges</h2>
            <span className="numerals text-[15px] text-muted-foreground font-medium">
              {unlockedCount} of {allBadges.length}
            </span>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {allBadges.map((badge, index) => (
              <motion.button
                key={badge.id}
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, type: "spring", stiffness: 380, damping: 30 }}
                whileTap={badge.unlocked ? { scale: 0.96 } : undefined}
                onClick={() => badge.unlocked && setSelectedBadge(badge)}
                className={`bg-card rounded-[16px] p-4 text-center ${
                  badge.unlocked ? "" : "opacity-55"
                } ${badge.unlocked ? "cursor-pointer" : ""}`}
              >
                <div className="relative w-full">
                  {!badge.unlocked && (
                    <span className="absolute top-0 right-0 text-muted-foreground/50">
                      <Lock className="w-3.5 h-3.5" strokeWidth={2.4} />
                    </span>
                  )}
                  <div
                    className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${
                      badge.unlocked ? "bg-brand-soft" : "bg-muted/10"
                    }`}
                  >
                    <MilestoneGlyph
                      criteria={badge.id}
                      className={`w-7 h-7 ${badge.unlocked ? "text-brand-strong" : "text-muted-foreground"}`}
                    />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground">{badge.name}</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                    {badge.description}
                  </p>

                  {badge.unlocked ? (
                    <p className="text-[12px] text-brand-strong mt-2 font-semibold">Earned</p>
                  ) : badge.progress !== undefined && badge.requirement ? (
                    <div className="mt-2.5">
                      <div className="w-full bg-muted/20 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand h-full rounded-full transition-all duration-300"
                          style={{ width: `${(badge.progress / badge.requirement) * 100}%` }}
                        />
                      </div>
                      <p className="numerals text-[11px] text-muted-foreground mt-1">
                        {badge.progress}/{badge.requirement}
                      </p>
                    </div>
                  ) : null}
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Charts */}
        {recyclingHistory.length > 0 && (
          <section className="space-y-4" aria-label="Charts">
            <MobileCard>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-brand-strong" strokeWidth={2.4} />
                <h3 className="text-[16px] font-semibold text-foreground">This Week</h3>
              </div>
              <div className="h-40 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivityData} barCategoryGap="28%">
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: CHART_TICK }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "rgba(120,120,128,0.08)" }}
                      contentStyle={{
                        backgroundColor: theme === "dark" ? "#1C1C1E" : "#ffffff",
                        border: "none",
                        borderRadius: "12px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
                        color: theme === "dark" ? "#ffffff" : "#000000",
                        fontSize: "13px",
                      }}
                      labelStyle={{ color: theme === "dark" ? "#ffffff" : "#000000" }}
                      formatter={(value: number) => [`${value} items`, "Scanned"]}
                    />
                    <Bar dataKey="count" fill={CHART_BAR_FILL} radius={[6, 6, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </MobileCard>

            {materialBreakdownData.length > 0 && (
              <MobileCard>
                <div className="flex items-center gap-2 mb-3">
                  <PieChartIcon className="w-4 h-4 text-brand-strong" strokeWidth={2.4} />
                  <h3 className="text-[16px] font-semibold text-foreground">Materials</h3>
                </div>
                <div className="flex items-center gap-5">
                  <div className="h-32 w-32 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={materialBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={34}
                          outerRadius={58}
                          dataKey="value"
                          strokeWidth={2}
                          stroke={theme === "dark" ? "#1C1C1E" : "#ffffff"}
                        >
                          {materialBreakdownData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={MATERIAL_COLORS[index % MATERIAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {materialBreakdownData.slice(0, 5).map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-[14px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: MATERIAL_COLORS[index % MATERIAL_COLORS.length] }}
                          />
                          <span className="text-foreground/80 truncate">{item.name}</span>
                        </div>
                        <span className="numerals font-medium text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </MobileCard>
            )}
          </section>
        )}

        {/* Impact summary */}
        <section aria-label="Impact">
          <ListGroup>
            <ListRow
              title="CO₂ saved"
              value={<span className="numerals font-semibold">{impact.totalCo2.toFixed(1)} kg</span>}
            />
            <ListRow
              title="Energy saved"
              value={<span className="numerals font-semibold">{impact.totalEnergy.toFixed(1)} kWh</span>}
            />
            <ListRow
              title="Badges earned"
              value={
                <span className="numerals font-semibold">
                  {unlockedCount}/{allBadges.length}
                </span>
              }
            />
          </ListGroup>
        </section>

        {/* Settings */}
        <section aria-label="Settings">
          <ListGroup>
            <ListRow
              icon={theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={2.4} /> : <Moon className="w-4 h-4" strokeWidth={2.4} />}
              iconTint="plain"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            />
            <ListRow
              icon={<LogOut className="w-4 h-4" strokeWidth={2.4} />}
              iconTint="destructive"
              title="Sign Out"
              destructive
              onClick={handleLogout}
            />
          </ListGroup>
        </section>
      </div>

      {/* Badge Detail Sheet */}
      <BottomSheet
        open={!!selectedBadge}
        onOpenChange={(open) => !open && setSelectedBadge(null)}
        title={selectedBadge?.name}
        description="Badge"
      >
        {selectedBadge && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 mb-4 rounded-full bg-brand-soft flex items-center justify-center">
                <MilestoneGlyph criteria={selectedBadge.id} className="w-10 h-10 text-brand-strong" />
              </div>
              <h3 className="text-[24px] font-bold tracking-[-0.02em] text-foreground">{selectedBadge.name}</h3>
              <p className="text-[15px] text-muted-foreground mt-1">{selectedBadge.description}</p>
            </div>

            {selectedBadge.unlocked && (
              <div className="bg-brand-tint rounded-[16px] p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-brand rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-brand-strong">Badge unlocked</p>
                  <p className="text-[13px] text-muted-foreground">
                    {selectedBadge.unlockedAt
                      ? format(new Date(selectedBadge.unlockedAt), "MMMM d, yyyy")
                      : "Earned through your recycling efforts"}
                  </p>
                </div>
              </div>
            )}

            {selectedBadge.progress !== undefined && selectedBadge.requirement && (
              <div className="space-y-2">
                <div className="flex justify-between text-[14px]">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="numerals font-semibold text-foreground">
                    {selectedBadge.progress}/{selectedBadge.requirement}
                  </span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-brand h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (selectedBadge.progress / selectedBadge.requirement) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Button onClick={() => setSelectedBadge(null)} className="w-full h-[50px] rounded-[14px] text-[17px] btn-brand">
              Close
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
