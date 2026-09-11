// app/dashboard/components/LoadingScreen.tsx
"use client";

import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="animate-spin rounded-full h-32 w-32 border-[6px] border-emerald-200 border-t-emerald-600" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Image
              src="/logo.png"
              alt="Doza Logo"
              width={60}
              height={60}
              className="animate-pulse"
            />
          </div>
        </div>
        <p className="text-gray-700 font-medium text-lg">
          Loading Dashboard...
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Preparing your Doza Center Insights
        </p>
      </div>
    </div>
  );
}
