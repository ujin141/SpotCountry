"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function TrafficTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const trackVisit = async () => {
      // 1. Get or Generate Session ID (Stored in Session Storage per tab)
      // or LocalStorage for persistent user tracking
      let sessionId = sessionStorage.getItem("visitor_session_id");
      
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("visitor_session_id", sessionId);
      }

      // 2. Insert with Session ID
      // We record every page view, but with session_id so we can count distinct sessions later
      await supabase.from('traffic').insert({ 
        path: pathname,
        session_id: sessionId
      });
    };

    trackVisit();
  }, [pathname]);

  return null;
}
