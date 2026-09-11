// app/dashboard/components/OfflineIndicator.tsx

"use client";

import { useNetworkStatus } from "@/app/hooks/useNetworkStatus";
import { WifiOff } from "lucide-react";
import { cn } from "@/app/utils/utils";

export function OfflineIndicator() {
  const isOnline = useNetworkStatus();

  // Debug: log when the component renders
  console.log("OfflineIndicator rendered, isOnline =", isOnline);

  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[999] flex items-center gap-3 bg-amber-50 border-2 border-amber-400 text-amber-900 px-4 py-3 rounded-xl shadow-2xl animate-pulse"
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="w-5 h-5 flex-shrink-0 text-amber-600" />
      <div className="flex flex-col">
        <span className="text-sm font-bold">You are offline</span>
        <span className="text-xs opacity-80">
          Changes will sync when online
        </span>
      </div>
    </div>
  );
}
