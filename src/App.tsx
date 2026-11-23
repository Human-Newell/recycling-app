import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider, useTheme } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import ScanPage from "@/pages/ScanPage";
import HistoryPage from "@/pages/HistoryPage";
import ProfilePage from "@/pages/ProfilePage";
import MobileLayout from "@/components/MobileLayout";
import { DevPreviewRouter } from "@/components/home/DevPreview";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";

function AnimatedRoutes() {
  const location = useLocation();

  // iOS-feel page change: quick, restrained, no slide theatrics.
  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
  };

  const pageTransition = { type: "tween" as const, ease: "easeOut" as const, duration: 0.2 };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
              <HomePage />
            </motion.div>
          }
        />
        <Route
          path="/scan"
          element={
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
              <ScanPage />
            </motion.div>
          }
        />
        <Route
          path="/history"
          element={
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
              <HistoryPage />
            </motion.div>
          }
        />
        <Route
          path="/profile"
          element={
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
              <ProfilePage />
            </motion.div>
          }
        />
        <Route
          path="/badges"
          element={
            <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants} transition={pageTransition}>
              <ProfilePage focusBadges />
            </motion.div>
          }
        />
        {import.meta.env.DEV && <Route path="/__preview/:which" element={<DevPreviewRouter />} />}
      </Routes>
    </AnimatePresence>
  );
}

// Reads theme from next-themes (which respects manual toggles via ProfilePage)
// instead of sonner's hardcoded "system", so toasts match the app theme.
// Also keeps the iOS/PWA status-bar tint in sync with light/dark.
function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", resolvedTheme === "dark" ? "#000000" : "#f2f2f7");
  }, [resolvedTheme]);

  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme={(resolvedTheme as "light" | "dark") || "system"}
      toastOptions={{
        style: {
          borderRadius: "16px",
          fontFamily: "inherit",
        },
      }}
    />
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppShell />
          <PWAInstallPrompt />
          <NotificationPermissionPrompt />
        </BrowserRouter>
        <ThemedToaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const { user } = useAuth();

  return (
    <MobileLayout showNav={!!user}>
      <AnimatedRoutes />
    </MobileLayout>
  );
}

export default App;
