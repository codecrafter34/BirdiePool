"use client";

import dynamic from "next/dynamic";

const HeroCanvas = dynamic(() => import("@/components/3d/HeroCanvas"), { 
  ssr: false, 
  loading: () => <div className="w-full h-full" /> 
});

export default HeroCanvas;
