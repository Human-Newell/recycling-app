import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileCard } from "@/components/mobile/MobileCard";
import { notificationService } from "@/services/notificationService";
import { subscribeToPush } from "@/services/pushSubscription";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Await init so the permission state is current before we decide to prompt.
      await notificationService.init();
      if (cancelled) return;

      if (!notificationService.hasAskedPermission() && notificationService.isEnabled() === false) {
        // Wait 5 seconds before showing notification prompt
        setTimeout(() => {
          if (!cancelled) setShowPrompt(true);
        }, 5000);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  const handleEnable = async () => {
    const granted = await notificationService.requestPermission();
    
    if (granted) {
      // Fire-and-forget: register the Web Push subscription without blocking
      // the UI. subscribeToPush never throws, but catch defensively anyway.
      void subscribeToPush().catch(() => {});

      toast.success("Notifications enabled!", {
        description: "You'll receive updates about badges and achievements",
      });
      setShowPrompt(false);
    } else {
      toast.error("Notifications blocked", {
        description: "You can enable them later in your browser settings",
      });
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notifications-enabled', 'false');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-24 left-4 right-4 z-50"
      >
        <MobileCard className="relative overflow-hidden shadow-2xl">
          {/* Info wash */}
          <div className="absolute inset-0 bg-info opacity-5" />

          <div className="relative">
            <button
              onClick={handleDismiss}
              className="absolute top-0 right-0 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="pr-8">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-info rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Enable Notifications</h3>
                  <p className="text-xs text-muted-foreground">Stay updated on your progress</p>
                </div>
              </div>

              <p className="text-sm text-foreground/80 mb-4">
                Get notified when you unlock badges, reach milestones, and achieve streaks!
              </p>

              <div className="flex space-x-2">
                <Button
                  onClick={handleEnable}
                  className="flex-1 bg-info text-white hover:bg-info/90 shadow-lg"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable
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
