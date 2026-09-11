// app/hooks/useNetworkStatus.ts

"use client";

import { useState, useEffect } from "react";

export function useNetworkStatus() {
  // Start with `true` on server, update on client
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Set initial state on client
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.log("🟢 Online event fired");
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log("🔴 Offline event fired");
      setIsOnline(false);
    };

    // Listen for browser events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Fallback: check every 5 seconds in case events are missed
    const interval = setInterval(() => {
      const current = navigator.onLine;
      if (current !== isOnline) {
        console.log(
          `🔌 Poll detected change: ${current ? "online" : "offline"}`,
        );
        setIsOnline(current);
      }
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  return isOnline;
}
