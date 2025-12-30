"use client";

import { useEffect, useState } from "react";

export default function MobileLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile layout - full screen, optimized for touch
  if (isMobile) {
    return (
      <div className="mobile-layout h-screen w-screen flex flex-col bg-[#0f1729]">
        {children}
      </div>
    );
  }

  // Desktop layout - with padding and sidebar-friendly
  return (
    <div className="desktop-layout min-h-screen bg-[#0f1729] flex flex-col">
      {children}
    </div>
  );
}
