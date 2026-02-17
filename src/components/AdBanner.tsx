"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useAds } from "@/context/AdContext";
import { supabase } from "@/lib/supabase";

interface AdBannerProps {
  position: string;
  className?: string;
}

export default function AdBanner({ position, className = "" }: AdBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { ads } = useAds();

  const ad = ads.find(a => a.position === position && a.status === "active");

  if (!ad || !isVisible) return null;

  const handleAdClick = async () => {
    // Call RPC to increment clicks safely
    await supabase.rpc('increment_ad_clicks', { row_id: ad.id });
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-xl shadow-sm group ${className}`}>
      <button 
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(false);
        }}
        className="absolute top-2 right-2 p-1 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X className="w-3 h-3" />
      </button>
      
      <a 
        href={ad.link} 
        target="_blank" 
        rel="noopener noreferrer" 
        onClick={handleAdClick} // Track click
        className="block relative aspect-[4/1] md:aspect-[5/1] w-full"
      >
         <img 
           src={ad.imageUrl} 
           alt={ad.title} 
           className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
         />
         <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center px-8">
            <span className="text-white text-xs font-bold border border-white/50 px-2 py-0.5 rounded backdrop-blur-sm">
              AD
            </span>
         </div>
      </a>
    </div>
  );
}
