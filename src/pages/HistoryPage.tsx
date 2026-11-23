import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Recycle, Leaf, RefreshCw, Wind, Zap } from "lucide-react";
import { IOSHeader } from "@/components/IOSHeader";
import { ListGroup, ListRow, StatTile } from "@/components/ui/ios";
import { ListItemSkeleton } from "@/components/mobile/LoadingSkeletons";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { SwipeablePages } from "@/components/mobile/SwipeablePages";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { getTotalEnvironmentalImpact } from "@/lib/impact";

export default function HistoryPage() {
  const { user, recyclingHistory, loading, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    toast.success("Activity refreshed");
    setTimeout(() => setRefreshing(false), 800);
  };

  const getDateLabel = (date?: string) => {
    const itemDate = new Date(date || Date.now());
    if (isToday(itemDate)) return "Today";
    if (isYesterday(itemDate)) return "Yesterday";
    return format(itemDate, "EEEE, MMMM d");
  };

  const groupByDate = () => {
    const grouped: Record<string, typeof recyclingHistory> = {};
    recyclingHistory.forEach((entry) => {
      const dateLabel = getDateLabel(entry.created_at);
      if (!grouped[dateLabel]) grouped[dateLabel] = [];
      grouped[dateLabel].push(entry);
    });
    return grouped;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Leaf className="w-14 h-14 text-muted-foreground/40 mx-auto mb-4" strokeWidth={1.8} />
          <h2 className="text-[22px] font-bold text-foreground mb-1">Sign in to view activity</h2>
          <p className="text-[15px] text-muted-foreground">Track your recycling journey</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+60px)] space-y-3">
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
      </div>
    );
  }

  const groupedHistory = groupByDate();
  const totalPoints = recyclingHistory.reduce((sum, entry) => sum + entry.points, 0);
  const impact = getTotalEnvironmentalImpact(recyclingHistory);

  return (
    <SwipeablePages currentPath={location.pathname} swipeConfig={{ right: "/" }}>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-screen pb-8">
        <IOSHeader
          title="Activity"
          largeTitle="Activity"
          subtitle="Every item you've recycled."
          right={
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh activity"
              className="w-9 h-9 rounded-full flex items-center justify-center text-brand-strong active:bg-muted/20 transition-colors"
            >
              <RefreshCw className={`w-[19px] h-[19px] ${refreshing ? "animate-spin" : ""}`} />
            </button>
          }
        />

        <div className="px-4 pt-2 pb-10 space-y-6">
          {/* Summary tiles */}
          <section className="grid grid-cols-3 gap-3" aria-label="Summary">
            <StatTile
              value={recyclingHistory.length}
              label="Items"
              accent="brand"
            />
            <StatTile
              value={totalPoints}
              label="Points"
              accent="info"
              delay={0.05}
            />
            <StatTile
              value={user.current_streak}
              label="Day streak"
              accent="streak"
              delay={0.1}
            />
          </section>

          {/* Environmental impact */}
          {recyclingHistory.length > 0 && (
            <section aria-label="Environmental impact">
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground px-1 pb-2">
                Environmental Impact
              </h2>
              <ListGroup>
                <ListRow
                  icon={<Wind className="w-4 h-4" strokeWidth={2.2} />}
                  iconTint="brand"
                  title="CO₂ saved"
                  value={
                    <span className="numerals font-semibold text-foreground">
                      {impact.totalCo2.toFixed(1)} kg
                    </span>
                  }
                />
                <ListRow
                  icon={<Zap className="w-4 h-4" strokeWidth={2.2} />}
                  iconTint="streak"
                  title="Energy saved"
                  value={
                    <span className="numerals font-semibold text-foreground">
                      {impact.totalEnergy.toFixed(0)} kWh
                    </span>
                  }
                />
              </ListGroup>
            </section>
          )}

          {/* Timeline */}
          <section aria-label="Timeline">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground px-1 pb-2">
              Timeline
            </h2>

            {Object.keys(groupedHistory).length === 0 ? (
              <div className="bg-card rounded-[16px] p-10 text-center">
                <Leaf className="w-12 h-12 text-muted-foreground/35 mx-auto mb-3" strokeWidth={1.8} />
                <h3 className="text-[17px] font-semibold text-foreground">No history yet</h3>
                <p className="text-[14px] text-muted-foreground mt-1">
                  Start scanning items to build your record
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedHistory).map(([date, entries]) => (
                  <div key={date}>
                    {/* iOS section header: small uppercase label above the group */}
                    <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-[0.06em] px-4 pb-1.5">
                      {date}
                    </p>
                    <ListGroup>
                      {entries.map((entry) => (
                        <ListRow
                          key={entry.id}
                          icon={<Recycle className="w-4 h-4" strokeWidth={2.2} />}
                          iconTint="brand"
                          title={entry.item}
                          subtitle={
                            <>
                              {entry.material}
                              {entry.created_at && (
                                <span className="text-muted-foreground/60">
                                  {" · "}
                                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                                </span>
                              )}
                            </>
                          }
                          value={
                            <span className="numerals font-semibold text-brand-strong">
                              +{entry.points}
                            </span>
                          }
                        />
                      ))}
                    </ListGroup>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </PullToRefresh>
    </SwipeablePages>
  );
}
