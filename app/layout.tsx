import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Poppins, Bebas_Neue } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { Providers } from "./utils/provider";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: ["400"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://dozamedic.com"),
  title: {
    default: "Doza | Healthcare Center Management Platform",
    template: "%s | Doza Healthcare",
  },
  description:
    "Doza is a modern healthcare center management platform. Manage patients, staff, emergency services, requisitions, and analytics – all in one place. Built for hospitals, clinics, and medical practices.",
  keywords: [
    "healthcare management",
    "hospital management system",
    "EMR",
    "patient records",
    "Telemedicine",
    "medical software",
    "clinic management",
    "patient care",
    "healthcare technology",
    "hospital software",
    "medical records management",
    "patient scheduling",
    "electronic health records",
    "healthcare workflow",
    "staff management",
    "emergency department",
    "requisition approvals",
    "clinical workflow",
    "healthcare analytics",
    "medical practice software",
    "doza",
  ],
  authors: [{ name: "Doza Healthcare" }],
  creator: "Doza Healthcare",
  publisher: "Doza Healthcare",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dashboard.dozamedic.com",
    title: "Doza | Healthcare Center Management Platform",
    description:
      "Streamline your healthcare center with Doza. Patient management, emergency tracking, staff coordination, and clinical workflows – all in one secure platform.",
    siteName: "Doza Healthcare",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Doza Healthcare Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Doza | Healthcare Center Management Platform",
    description:
      "Modern healthcare management for hospitals, clinics, and medical practices. Doza helps you focus on patient care.",
    images: ["/twitter-image.png"],
    creator: "@dozahealth",
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: "#017840",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`
          ${bebasNeue.variable}
          ${poppins.variable}
          antialiased
          bg-gradient-to-br from-emerald-50 via-white to-blue-50
          min-h-screen
        `}
        suppressHydrationWarning
      >
        <Providers>
          {/* Premium Healthcare-Themed Background */}
          <div className="fixed inset-0 bg-gradient-to-br from-emerald-50/90 via-white/95 to-cyan-50/90 -z-20" />

          {/* Premium Grid Pattern */}
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),transparent)] -z-10" />

          {/* Subtle Animated Background Elements */}
          <div className="fixed inset-0 overflow-hidden -z-10">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
          </div>

          {/* Main Content */}
          <main className="relative min-h-screen">{children}</main>

          {/* Service Worker Registration */}
          <ServiceWorkerRegistration />

          <OfflineIndicator />

          {/* Vercel Analytics & Speed Insights */}
          <Analytics />
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
