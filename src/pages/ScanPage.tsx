import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CheckCircle2, XCircle, Loader2, Sparkles, Info, Award, Zap, ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiService } from "@/services/apiService";
import { ANALYTICS_EVENTS, captureEvent, type ScanSource } from "@/services/analytics";
import { getEnvironmentalImpact } from "@/lib/impact";
import { enqueue, queuedCount, QUEUE_SYNCED_EVENT, type QueuedEntry } from "@/services/offlineQueue";
import { IOSHeader } from "@/components/IOSHeader";
import { BottomSheet } from "@/components/mobile/BottomSheet";

interface ScanResult {
  item: string;
  material: string;
  recyclable: boolean;
  points: number;
  instructions: string;
  imageData?: string;
  confidence?: number;
}

// Connectivity can change mid-flow (e.g. dropping between two checks), so read
// navigator.onLine fresh on every call instead of relying on a narrowed value.
const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showResultSheet, setShowResultSheet] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { user, addRecyclingEntry, getPointsForMaterial } = useAuth();

  // Offline queue indicator: how many scans are waiting to sync.
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    try {
      setPendingSyncCount(await queuedCount());
    } catch {
      // IndexedDB unavailable — the indicator is cosmetic, ignore failures.
    }
  }, []);

  useEffect(() => {
    void refreshPendingCount();
    window.addEventListener("online", refreshPendingCount);
    window.addEventListener(QUEUE_SYNCED_EVENT, refreshPendingCount);
    return () => {
      window.removeEventListener("online", refreshPendingCount);
      window.removeEventListener(QUEUE_SYNCED_EVENT, refreshPendingCount);
    };
  }, [refreshPendingCount]);

  const readAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File, source: ScanSource) => {
    captureEvent(ANALYTICS_EVENTS.ScanStarted, { mode: "my_item", source });

    if (!user) {
      toast.error("Please sign in to scan items");
      return;
    }

    // Read original image as data URL for preview, then await it so the
    // ScanResult captures the CURRENT scan's image, not a stale closure value.
    const previewDataUrl = await readAsDataURL(file);
    setCapturedImage(previewDataUrl);

    setScanning(true);
    setScanResult(null);
    setShowResultSheet(false);

    try {
      const compressedData = await compressImage(file);
      const identifyStartedAt = performance.now();
      const result = await apiService.identifyItem(compressedData);
      captureEvent(ANALYTICS_EVENTS.AiResult, {
        provider: result.provider,
        material: result.material,
        confidence: result.confidence,
        latency_ms: Math.round(performance.now() - identifyStartedAt),
      });

      const points = getPointsForMaterial(result.material);

      setScanResult({
        item: result.item,
        material: result.material,
        recyclable: result.recyclable,
        points: result.recyclable ? points : 0,
        instructions: result.instructions,
        imageData: previewDataUrl,
        confidence: result.confidence,
      });
      setShowResultSheet(true);
    } catch (error) {
      toast.error("Failed to identify item. Please try again.");
      console.error("Scan error:", error);
    }
    setScanning(false);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      img.onload = () => {
        const maxSize = 1024;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const getLocation = (): Promise<{ latitude: number | null; longitude: number | null; locationName: string }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null, locationName: "Mobile Scan" });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locationName: "Current Location",
          });
        },
        () => {
          resolve({ latitude: null, longitude: null, locationName: "Mobile Scan" });
        }
      );
    });
  };

  const resetScanState = () => {
    setShowResultSheet(false);
    setScanResult(null);
    setCapturedImage(null);
  };

  const handleConfirm = async () => {
    if (!scanResult || !user) return;

    if (scanResult.recyclable) {
      const location = await getLocation();

      // Save the scan to the local IndexedDB queue instead of the server.
      // Only called when the online attempt definitely did not record the
      // entry (offline up front, or a network failure before insert), so an
      // entry can never be both queued AND saved — zero double-counting.
      const saveOffline = async () => {
        const entry: QueuedEntry = {
          id: crypto.randomUUID(),
          userId: user.id,
          item: scanResult.item,
          material: scanResult.material,
          location,
          queuedAt: Date.now(),
        };
        await enqueue(entry);
        toast.success("Saved offline", {
          description: "It'll sync when you're back online.",
        });
        void refreshPendingCount();
      };

      // Offline before even trying: queue locally and skip the server.
      if (isOffline()) {
        await saveOffline();
        resetScanState();
        return;
      }

      let result: Awaited<ReturnType<typeof addRecyclingEntry>>;
      try {
        result = await addRecyclingEntry(
          scanResult.item,
          scanResult.material,
          location
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (isOffline() || /fetch|network|Failed to/i.test(message)) {
          await saveOffline();
          resetScanState();
          return;
        }
        result = { totalItems: 0, error: true };
      }

      if (result.error) {
        if (isOffline()) {
          // Connection dropped mid-request: the insert cannot have completed,
          // so queue the entry for replay when back online.
          await saveOffline();
          resetScanState();
          return;
        }
        toast.error("Failed to save scan", {
          description: "Please try again in a moment.",
        });
      } else if (result.isDuplicate) {
        toast.warning("Duplicate scan detected", {
          description: "This item was scanned recently. Try scanning a different item.",
        });
      } else {
        toast.success(`+${scanResult.points} points earned!`, {
          description: "Keep up the great work!",
        });
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        captureEvent(ANALYTICS_EVENTS.ScanConfirmed, {
          mode: "my_item",
          material: scanResult.material,
          had_local_verdict: false,
          region_id: null,
        });
      }
    }

    resetScanState();
  };

  const handleScanAnother = () => {
    setShowResultSheet(false);
    setScanResult(null);
    setCapturedImage(null);
  };

  return (
    <div className="min-h-screen bg-black md:max-w-lg md:mx-auto md:rounded-[24px] md:my-6 md:overflow-hidden md:shadow-float">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, "camera");
          e.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file, "gallery");
          e.target.value = "";
        }}
      />

      <IOSHeader title="Scan" back variant="dark" />

      <div className="px-4 pt-4 pb-10 space-y-6 md:pb-6">
        {/* Viewfinder */}
        <div className="relative aspect-[3/4] bg-[#111113] rounded-[24px] overflow-hidden border-[0.5px] border-white/10">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured item" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {scanning ? (
                  <motion.div
                    key="scanning"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="text-center"
                  >
                    <Loader2 className="w-12 h-12 text-white/80 animate-spin mx-auto mb-4" strokeWidth={2} />
                    <p className="text-white text-[17px] font-semibold">Analyzing…</p>
                    <p className="text-white/50 text-[13px] mt-1">Identifying the material</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ready"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="text-center px-8"
                  >
                    <Camera className="w-12 h-12 text-white/30 mx-auto mb-4" strokeWidth={1.6} />
                    <p className="text-white/70 text-[17px] font-medium">Ready to scan</p>
                    <p className="text-white/40 text-[13px] mt-1">
                      Point your camera at any item
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Scanning sweep */}
          {scanning && (
            <motion.div
              animate={{ y: ["-100%", "400%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-x-0 top-0 h-1/4 z-10 bg-gradient-to-b from-transparent via-brand/30 to-transparent"
            />
          )}

          {/* Viewfinder corners */}
          <div className="absolute top-5 left-5 w-9 h-9 border-t-[3px] border-l-[3px] border-white/80 rounded-tl-xl z-10" />
          <div className="absolute top-5 right-5 w-9 h-9 border-t-[3px] border-r-[3px] border-white/80 rounded-tr-xl z-10" />
          <div className="absolute bottom-5 left-5 w-9 h-9 border-b-[3px] border-l-[3px] border-white/80 rounded-bl-xl z-10" />
          <div className="absolute bottom-5 right-5 w-9 h-9 border-b-[3px] border-r-[3px] border-white/80 rounded-br-xl z-10" />
        </div>

        {/* Capture buttons — the shutter is the primary action */}
        {!scanResult && !scanning && (
          <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-3">
            <Button
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              disabled={!user}
              className="w-full btn-brand"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </Button>
            <Button
              size="lg"
              onClick={() => galleryInputRef.current?.click()}
              disabled={!user}
              className="w-full h-[50px] rounded-[14px] text-[17px] bg-white/10 text-white hover:bg-white/15 border-[0.5px] border-white/15"
            >
              <ImageIcon className="w-5 h-5" />
              Choose from Library
            </Button>
          </motion.div>
        )}

        {/* Offline queue indicator */}
        {pendingSyncCount > 0 && (
          <p className="text-[13px] text-white/50 text-center">
            {pendingSyncCount} scan{pendingSyncCount === 1 ? "" : "s"} waiting to sync
          </p>
        )}

        {/* Tips */}
        {!scanning && (
          <div className="rounded-[16px] bg-white/[0.06] border-[0.5px] border-white/10 p-4">
            <h3 className="text-[15px] font-semibold text-white/90 mb-2.5">Tips for a good scan</h3>
            <ul className="space-y-2 text-[14px] text-white/60">
              <li className="flex items-start gap-2">
                <span className="text-brand-strong w-1.5 h-1.5 rounded-full bg-brand mt-[7px] flex-shrink-0" />
                Good lighting gives the best results
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-[7px] flex-shrink-0" />
                Center the item and hold steady
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand mt-[7px] flex-shrink-0" />
                Recycling symbols on packaging help
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Scan Result Bottom Sheet */}
      <BottomSheet
        open={showResultSheet}
        onOpenChange={(open) => {
          if (!open) {
            setShowResultSheet(false);
          }
        }}
        title={scanResult?.item || "Scan Result"}
        description={scanResult?.material}
      >
        {scanResult && (
          <div className="space-y-6">
            {/* Result */}
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  scanResult.recyclable ? "bg-brand-soft" : "bg-destructive/10"
                }`}
              >
                {scanResult.recyclable ? (
                  <CheckCircle2 className="w-11 h-11 text-brand-strong" strokeWidth={2.2} />
                ) : (
                  <XCircle className="w-11 h-11 text-destructive" strokeWidth={2.2} />
                )}
              </motion.div>

              <h3 className="text-[26px] font-bold tracking-[-0.02em] text-foreground">{scanResult.item}</h3>
              <p className="text-[15px] text-muted-foreground mt-0.5">{scanResult.material}</p>

              {scanResult.confidence !== undefined && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className="w-36 h-2 bg-muted/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        scanResult.confidence >= 80
                          ? "bg-brand"
                          : scanResult.confidence >= 50
                          ? "bg-streak"
                          : "bg-destructive"
                      }`}
                      style={{ width: `${scanResult.confidence}%` }}
                    />
                  </div>
                  <span className="numerals text-xs text-muted-foreground">{scanResult.confidence}%</span>
                </div>
              )}

              {scanResult.recyclable && (
                <div className="mt-4 bg-brand-tint px-5 py-2.5 rounded-full flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-strong" strokeWidth={2.4} />
                  <span className="numerals text-[17px] font-bold text-brand-strong">
                    +{scanResult.points} Points
                  </span>
                </div>
              )}
            </div>

            {/* Disposal instructions */}
            <div
              className={`rounded-[16px] p-4 flex items-start gap-3 ${
                scanResult.recyclable ? "bg-brand-tint" : "bg-destructive/10"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  scanResult.recyclable ? "bg-brand text-white" : "bg-destructive text-white"
                }`}
              >
                <Info className="w-4 h-4" strokeWidth={2.4} />
              </div>
              <div className="flex-1">
                <p
                  className={`text-[15px] font-semibold ${
                    scanResult.recyclable ? "text-brand-strong" : "text-destructive"
                  }`}
                >
                  {scanResult.recyclable ? "Recyclable" : "Not Recyclable"}
                </p>
                <p className="text-[14px] mt-0.5 text-muted-foreground">{scanResult.instructions}</p>
              </div>
            </div>

            {/* Environmental Impact */}
            {scanResult.recyclable && (
              <div className="space-y-3">
                <h4 className="text-[17px] font-bold text-foreground">Environmental Impact</h4>
                {(() => {
                  const impact = getEnvironmentalImpact(scanResult.material);
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-card rounded-[16px] p-4 text-center">
                        <Award className="w-6 h-6 text-info mx-auto mb-2" strokeWidth={2.2} />
                        <p className="numerals text-[20px] font-bold text-foreground">
                          {impact.co2.toFixed(1)} kg
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                          CO₂ · ~{impact.drivingKm.toFixed(1)} km driving
                        </p>
                      </div>
                      <div className="bg-card rounded-[16px] p-4 text-center">
                        <Zap className="w-6 h-6 text-streak mx-auto mb-2" strokeWidth={2.2} />
                        <p className="numerals text-[20px] font-bold text-foreground">
                          {impact.energy.toFixed(1)} kWh
                        </p>
                        <p className="text-[13px] text-muted-foreground mt-0.5">
                          · ~{impact.phoneCharges} phone charges
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pb-2">
              <Button variant="outline" onClick={handleScanAnother} className="h-[50px] rounded-[14px] text-[17px]">
                Scan Another
              </Button>
              {scanResult.recyclable && (
                <Button onClick={handleConfirm} className="h-[50px] rounded-[14px] text-[17px] btn-brand">
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm
                </Button>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
