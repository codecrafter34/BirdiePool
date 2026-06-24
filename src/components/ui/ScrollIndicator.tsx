"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export function ScrollIndicator() {
  const [opacity, setOpacity] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Fade out completely after scrolling 150px down
      const newOpacity = Math.max(0, 1 - scrollY / 150);
      setOpacity(newOpacity);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      style={{ opacity }}
      className="animate-bounce flex flex-col items-center gap-2 text-muted-foreground pointer-events-none transition-opacity duration-75"
    >
      <span className="text-xs font-medium uppercase tracking-widest">Discover</span>
      <ChevronDown className="w-5 h-5" />
    </div>
  );
}
