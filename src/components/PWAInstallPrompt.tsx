import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileCard } from "@/components/mobile/MobileCard";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem("pwa-install-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!deferredPrompt || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-24 left-4 right-4 z-50"
      >
        <MobileCard className="relative overflow-hidden">
          {/* Brand wash */}
          <div className="absolute inset-0 bg-brand opacity-5" />

          <div className="relative">
            <button
              onClick={handleDismiss}
              className="absolute top-0 right-0 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="pr-8">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 btn-brand rounded-xl flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Install EcoScan</h3>
                  <p className="text-xs text-muted-foreground">Get the full app experience</p>
                </div>
              </div>

              <p className="text-sm text-foreground/80 mb-4">
                Add EcoScan to your home screen for quick access, offline mode, and a native app experience.
              </p>

              <div className="flex space-x-2">
                <Button
                  onClick={handleInstall}
                  className="flex-1 btn-brand shadow-lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="border-2 border-border"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </MobileCard>
      </motion.div>
    </AnimatePresence>
  );
}
