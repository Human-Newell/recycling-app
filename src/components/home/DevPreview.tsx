import { useParams } from "react-router-dom";
import { AuthContext, type AuthContextType, type User } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import HistoryPage from "@/pages/HistoryPage";
import ProfilePage from "@/pages/ProfilePage";
import ScanPage from "@/pages/ScanPage";
import MobileLayout from "@/components/MobileLayout";

/** Dev-only stub data + auth override for previewing signed-in pages without a session. */
const stubUser: User = {
  id: "stub",
  email: "stub@example.com",
  name: "Jordan Newell",
  points: 1248,
  current_streak: 4,
  longest_streak: 11,
  total_scans: 86,
  badges_earned: 4,
  created_at: "2025-03-02T10:00:00Z",
  recyclingHistory: [
    { id: "e1", item: "Yogurt Pot", material: "Plastic (PP #5)", date: new Date(), points: 10, created_at: new Date(Date.now() - 3600e3).toISOString() },
    { id: "e2", item: "Glass Bottle", material: "Glass (Clear)", date: new Date(), points: 15, created_at: new Date(Date.now() - 7200e3).toISOString() },
    { id: "e3", item: "Cereal Box", material: "Cardboard", date: new Date(), points: 8, created_at: new Date(Date.now() - 26 * 3600e3).toISOString() },
    { id: "e4", item: "Aluminium Can", material: "Aluminium", date: new Date(), points: 12, created_at: new Date(Date.now() - 50 * 3600e3).toISOString() },
    { id: "e5", item: "Milk Carton", material: "Carton", date: new Date(), points: 9, created_at: new Date(Date.now() - 74 * 3600e3).toISOString() },
  ],
  badges: [
    { id: "b1", name: "First Scan", description: "Recycled your first item", imageUrl: "", criteria: "scan_1_item", unlockedAt: "2025-03-02T11:00:00Z" },
    { id: "b2", name: "Getting Going", description: "Recycled 10 items", imageUrl: "", criteria: "scan_10_items", unlockedAt: "2025-04-10T11:00:00Z" },
  ],
};

const stubAuth: AuthContextType = {
  user: stubUser,
  session: null,
  isAuthenticated: true,
  loading: false,
  login: async () => ({ success: true }),
  register: async () => ({ success: true }),
  loginWithProvider: async () => ({ success: true }),
  logout: async () => {},
  addRecyclingEntry: async () => ({ totalItems: 0 }),
  recyclingHistory: stubUser.recyclingHistory,
  refreshUser: async () => {},
  getPointsForMaterial: () => 10,
  syncOfflineEntries: async () => 0,
  setUserStyleMode: async () => {},
};

const noop = async () => {};

/** Routes /__preview/:which to a signed-in page with stub data (dev only). */
export function DevPreviewRouter() {
  const { which } = useParams();
  return (
    <AuthContext.Provider value={stubAuth}>
      <MobileLayout showNav>
        {which === "history" ? (
          <HistoryPage />
        ) : which === "profile" ? (
          <ProfilePage />
        ) : which === "badges" ? (
          <ProfilePage focusBadges />
        ) : which === "scan" ? (
          <ScanPage />
        ) : (
          <HomePage />
        )}
      </MobileLayout>
    </AuthContext.Provider>
  );
}

/** Kept for direct component tests: the dashboard with stub data. */
export function DevPreviewHome() {
  return (
    <AuthContext.Provider value={stubAuth}>
      <MobileLayout showNav>
        <HomePage />
      </MobileLayout>
    </AuthContext.Provider>
  );
}

export { noop };
