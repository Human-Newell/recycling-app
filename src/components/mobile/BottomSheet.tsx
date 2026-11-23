import { ReactNode } from "react";
import { Drawer } from "vaul";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  title?: string;
  description?: string;
}

/**
 * iOS sheet: 10px top radius, grabber, frosted against the page, dismiss on
 * drag-down or tap-out (vaul handles the gesture + spring physics).
 */
export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
}: BottomSheetProps) {
  // vaul's Drawer handles its own drag + spring animations; wrapping the content
  // in a framer-motion motion.div with its own initial/animate/exit fights with
  // vaul's transform, causing the sheet to pop/disappear instead of slide.
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 outline-none bg-card rounded-t-[12px] shadow-float max-h-[88vh] overflow-hidden flex flex-col">
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-9 h-[5px] bg-muted-foreground/25 rounded-full" />
          </div>

          {(title || description) && (
            <div className="px-5 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {title && (
                    <Drawer.Title className="text-[22px] font-bold tracking-[-0.02em] text-foreground truncate">
                      {title}
                    </Drawer.Title>
                  )}
                  {description && (
                    <Drawer.Description className="text-[14px] text-muted-foreground mt-0.5">
                      {description}
                    </Drawer.Description>
                  )}
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  aria-label="Close"
                  className="ml-3 w-8 h-8 rounded-full bg-muted/15 flex items-center justify-center active:opacity-50 transition-opacity flex-shrink-0"
                >
                  <X className="w-4 h-4 text-muted-foreground" strokeWidth={2.4} />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
