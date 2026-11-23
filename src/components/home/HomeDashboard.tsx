import { useNavigate } from "react-router-dom";
import { Recycle, Flame, Award, TrendingUp, Camera } from "lucide-react";
import { IOSHeader } from "@/components/IOSHeader";
import { ListGroup, ListRow, StatTile } from "@/components/ui/ios";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { formatDistanceToNow } from "date-fns";
import type { User } from "@/contexts/AuthContext";

interface HomeDashboardProps {
  user: User;
  onRefresh: () => Promise<void>;
}

const WEEKLY_GOAL = 10;

/** Flat green ring in the Fitness idiom — goal progress for the week. */
function GoalRing({ progress }: { progress: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = Math.min(progress, 1);
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0" aria-hidden>
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
      <text
        x="40"
        y="36"
        textAnchor="middle"
        fill="white"
        fontSize="17"
        fontWeight="700"
        fontFamily="inherit"
      >
        {Math.round(pct * 100)}%
      </text>
      <text x="40" y="50" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9" fontWeight="600">
        THIS WEEK
      </text>
    </svg>
  );
}

/**
 * The signed-in home screen: impact ring up top, stats, recent activity —
 * everything in inset grouped lists on the iOS system background.
 */
export default function HomeDashboard({ user, onRefresh }: HomeDashboardProps) {
  const navigate = useNavigate();
  const firstName = user.name.split(" ")[0];

  const thisWeek = user.recyclingHistory.filter((e) => {
    if (!e.created_at) return false;
    const d = new Date(e.created_at).getTime();
    return Date.now() - d < 7 * 24 * 3600e3;
  }).length;
  const recent = user.recyclingHistory.slice(0, 5);
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <PullToRefresh onRefresh={onRefresh} className="min-h-screen">
      <IOSHeader
        title="Today"
        largeTitle={greeting}
        subtitle={`Here's your recycling, ${firstName}.`}
        right={
          <button
            onClick={() => navigate("/profile")}
            aria-label="Your profile"
            className="w-9 h-9 rounded-full bg-brand text-white text-[15px] font-semibold flex items-center justify-center active:opacity-60 transition-opacity"
          >
            {firstName.charAt(0).toUpperCase()}
          </button>
        }
      />

      <div className="px-4 pt-2 pb-10 space-y-6">
        {/* Impact summary — flat systemGreen card, the screen's one big moment */}
        <section
          aria-label="Your impact"
          className="bg-brand rounded-[20px] p-5 text-white flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-white/70">
              Total points
            </p>
            <p className="numerals text-[44px] leading-[1.1] font-extrabold mt-0.5">
              {user.points.toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-[15px] font-medium text-white/90">
              <Flame className="w-4 h-4" strokeWidth={2.4} />
              {user.current_streak}-day streak
            </div>
          </div>
          <GoalRing progress={thisWeek / WEEKLY_GOAL} />
        </section>

        {/* Stat tiles */}
        <section className="grid grid-cols-3 gap-3" aria-label="Stats">
          <StatTile
            icon={<TrendingUp className="w-4 h-4" />}
            value={user.total_scans ?? 0}
            label="Scans"
            accent="brand"
            delay={0.05}
          />
          <StatTile
            icon={<Award className="w-4 h-4" />}
            value={user.badges_earned ?? 0}
            label="Badges"
            accent="info"
            delay={0.1}
          />
          <StatTile
            icon={<Flame className="w-4 h-4" />}
            value={user.longest_streak}
            label="Best streak"
            accent="streak"
            delay={0.15}
          />
        </section>

        {/* Recent activity */}
        <section aria-label="Recent activity">
          <header className="flex items-baseline justify-between px-1 pb-2">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-foreground">Recent</h2>
            <button
              onClick={() => navigate("/history")}
              className="text-[15px] text-brand-strong font-medium active:opacity-50 transition-opacity"
            >
              See All
            </button>
          </header>

          {recent.length === 0 ? (
            <div className="bg-card rounded-[16px] p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-brand-soft flex items-center justify-center mx-auto mb-3">
                <Recycle className="w-7 h-7 text-brand-strong" strokeWidth={2} />
              </div>
              <h3 className="text-[17px] font-semibold text-foreground">Nothing yet</h3>
              <p className="text-[14px] text-muted-foreground mt-1 mb-4">
                Your first scan starts the record.
              </p>
              <Button onClick={() => navigate("/scan")} className="btn-brand">
                <Camera className="w-4 h-4" />
                Scan an item
              </Button>
            </div>
          ) : (
            <ListGroup>
              {recent.map((entry) => (
                <ListRow
                  key={entry.id}
                  icon={<Recycle className="w-4 h-4" strokeWidth={2.2} />}
                  iconTint="brand"
                  title={entry.item}
                  subtitle={
                    entry.created_at
                      ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })
                      : entry.material
                  }
                  value={<span className="numerals font-semibold text-brand-strong">+{entry.points}</span>}
                  chevron
                  onClick={() => navigate("/history")}
                />
              ))}
            </ListGroup>
          )}
        </section>

        {/* Quick links */}
        <section aria-label="Quick links">
          <ListGroup>
            <ListRow
              icon={<Camera className="w-4 h-4" strokeWidth={2.2} />}
              iconTint="brand"
              title="Scan an item"
              chevron
              onClick={() => navigate("/scan")}
            />
            <ListRow
              icon={<Award className="w-4 h-4" strokeWidth={2.2} />}
              iconTint="info"
              title="Your badges"
              value={
                <span className="numerals">
                  {user.badges_earned ?? 0}
                </span>
              }
              chevron
              onClick={() => navigate("/badges")}
            />
          </ListGroup>
        </section>

        {/* The quiet footnote */}
        <p className="text-center text-[13px] text-muted-foreground/70 px-8">
          Every scan is a small win for the planet.
        </p>
      </div>
    </PullToRefresh>
  );
}
