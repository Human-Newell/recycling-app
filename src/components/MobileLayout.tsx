import { ReactNode } from "react";
import { MobileNavigation } from "./mobile/MobileNavigation";
import { SidebarNavigation } from "./desktop/SidebarNavigation";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function MobileLayout({ children, showNav = true }: MobileLayoutProps) {
  return (
    <div className="app-canvas min-h-screen transition-colors">
      {/* md+: persistent left sidebar (hidden below md) */}
      {showNav && <SidebarNavigation />}
      <main
        className={
          showNav
            ? "pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0 md:pl-64 min-h-screen md:h-screen md:overflow-y-auto md:overflow-x-hidden"
            : "min-h-screen"
        }
      >
        {/* Mobile keeps the single-scroll layout; md+ centers content in a wide container */}
        <div className={showNav ? "max-w-5xl mx-auto md:px-6" : ""}>
          {children}
        </div>
      </main>
      {showNav && <MobileNavigation />}
    </div>
  );
}
