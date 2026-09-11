"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("ServiceWorker registered:", registration);
          })
          .catch((error) => {
            console.log("ServiceWorker registration failed:", error);
          });
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
