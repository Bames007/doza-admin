// components/NetworkStatus.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Signal, SignalHigh, SignalLow, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Custom hook that handles client-side only
const useClientNetworkState = () => {
  const [networkState, setNetworkState] = useState({
    online: true,
    downlink: 0,
    effectiveType: "4g",
    rtt: 0,
    saveData: false,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const handleOnline = () => {
        setNetworkState((prev) => ({ ...prev, online: true }));
      };

      const handleOffline = () => {
        setNetworkState((prev) => ({ ...prev, online: false }));
      };

      // Get initial connection info if available
      const connection = (navigator as any).connection;
      if (connection) {
        const updateConnection = () => {
          setNetworkState({
            online: navigator.onLine,
            downlink: connection.downlink || 0,
            effectiveType: connection.effectiveType || "unknown",
            rtt: connection.rtt || 0,
            saveData: connection.saveData || false,
          });
        };

        connection.addEventListener("change", updateConnection);
        updateConnection();

        return () => {
          connection.removeEventListener("change", updateConnection);
        };
      } else {
        // Fallback for browsers that don't support Network Information API
        setNetworkState((prev) => ({
          ...prev,
          online: navigator.onLine,
        }));

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        };
      }
    }
  }, []);

  return networkState;
};

const NetworkStatus: React.FC = () => {
  const networkState = useClientNetworkState();

  const getNetworkStatus = () => {
    if (!networkState.online) {
      return { icon: WifiOff, color: "text-red-500", quality: "Offline" };
    }

    const speed = networkState.downlink || 0;

    if (speed > 5) {
      return {
        icon: SignalHigh,
        color: "text-green-500",
        quality: "Excellent",
      };
    } else if (speed > 2) {
      return { icon: Signal, color: "text-yellow-500", quality: "Good" };
    } else if (speed > 0) {
      return { icon: SignalLow, color: "text-orange-500", quality: "Poor" };
    } else {
      return { icon: Wifi, color: "text-blue-500", quality: "Unknown" };
    }
  };

  const { icon: Icon, color, quality } = getNetworkStatus();
  const speed = networkState.downlink || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-gray-200"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-medium text-gray-700">
            {speed > 0 ? `${speed.toFixed(1)} Mbps` : "---"}
          </span>
        </div>
        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        <span className="text-xs text-gray-500 capitalize">{quality}</span>
      </motion.div>
    </AnimatePresence>
  );
};

export default NetworkStatus;
