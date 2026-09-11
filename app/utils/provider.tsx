// app/providers.tsx
"use client";

// import { BarcodeScannerProvider } from "@/app/components/BarcodeScannerProvider";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { AuthProvider } from "./AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {/* <BarcodeScannerProvider> */}
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "linear-gradient(135deg, #017840 0%, #29AF45 100%)",
                color: "#fff",
                borderRadius: "12px",
                fontWeight: "500",
                boxShadow: "0 10px 25px rgba(1, 120, 64, 0.2)",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#fff",
                  secondary: "#017840",
                },
              },
              error: {
                duration: 4000,
                style: {
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                },
                iconTheme: {
                  primary: "#fff",
                  secondary: "#dc2626",
                },
              },
              loading: {
                style: {
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                },
              },
            }}
          />
          {/* </BarcodeScannerProvider> */}
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
