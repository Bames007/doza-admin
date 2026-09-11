// app/dashboard/DashboardContext.tsx

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "./config/type";

interface DashboardContextType {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  activePanel: string;
  setActivePanel: (panel: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  isSessionValid: boolean;
  refreshSession: () => Promise<void>;
  navigateToPanel: (panelId: string) => void; // ← only one argument
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

const SESSION_EXPIRY = 24 * 60 * 60 * 1000;
const SESSION_TIMEOUT = 30 * 60 * 1000;

const defaultUser: User = {
  id: "",
  email: "",
  fullName: "",
  role: "ceo",
};

// ─── Mapping from panelId to display name ──────────────────────
const panelToPageName: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  dozaCenters: "Doza Centers",
  dozaMedics: "Doza Medics",
  users: "Doza Users",
  dozaNetwork: "Doza Network",
  subscriptions: "Subscriptions",
  referrals: "Referral Codes",
  approvals: "Approvals",
  verification: "Verification",
  auditlogs: "Audit Logs",
  settings: "Settings",
  health: "System Health",
  api: "API Management",
  logs: "Logs",
  security: "Security",
  "medical-analytics": "Medical Analytics",
  patients: "Patients",
  "medical-records": "Medical Records",
  prescriptions: "Prescriptions",
  cds: "Clinical Decision Support",
  requisitions: "Requisitions",
  "nursing-analytics": "Nursing Analytics",
  vitals: "Vitals Monitoring",
  tasks: "Task Management",
  "hospital-analytics": "Hospital Analytics",
  hospitals: "Hospitals",
  "bed-occupancy": "Bed Occupancy",
  staff: "Staff",
  "clinic-analytics": "Clinic Analytics",
  clinics: "Clinics",
  appointments: "Appointments",
  "ops-analytics": "Operations Analytics",
  resources: "Resource Allocation",
  scheduling: "Staff Scheduling",
  inventory: "Inventory",
  billing: "Billing",
  "financial-reports": "Financial Reports",
  profile: "Profile",
  notifications: "Notifications",
  messages: "Messages",
  help: "Help",
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [activePanel, setActivePanel] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);

  const logout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    setUser(null);
    setIsSessionValid(false);
    router.push("/login?logout=true");
  }, [router]);

  const validateSession = useCallback(() => {
    try {
      const stored = localStorage.getItem("adminSession");
      if (!stored) return false;
      const parsed = JSON.parse(stored);
      const { user: u, expiresAt, lastActivity } = parsed;
      if (Date.now() > expiresAt) return false;
      if (Date.now() - lastActivity > SESSION_TIMEOUT) return false;
      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const stored = localStorage.getItem("adminSession");
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = {
          ...parsed,
          expiresAt: Date.now() + SESSION_EXPIRY,
          lastActivity: Date.now(),
        };
        localStorage.setItem("adminSession", JSON.stringify(updated));
      }
    } catch (e) {
      console.error("Failed to refresh session", e);
    }
  }, []);

  // ─── navigateToPanel: updates panel, page name, URL hash ──
  const navigateToPanel = useCallback((panelId: string) => {
    const pageName = panelToPageName[panelId] || panelId;
    setActivePanel(panelId);
    setCurrentPage(pageName);
    setMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const newUrl = `${currentPath}#${panelId}`;
      window.history.pushState({ panel: panelId }, pageName, newUrl);
    }
    localStorage.setItem("lastActivity", Date.now().toString());
  }, []);

  // ─── Initialize session ──────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem("adminSession");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (validateSession()) {
            setUser(parsed.user);
            setIsSessionValid(true);
            // If there's a hash in URL, set panel accordingly
            if (typeof window !== "undefined") {
              const hash = window.location.hash.replace("#", "");
              if (hash && panelToPageName[hash]) {
                navigateToPanel(hash);
              }
            }
          } else {
            logout();
          }
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error loading session", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router, validateSession, logout, navigateToPanel]);

  // ─── Activity timeout ──────────────────────────────────────
  useEffect(() => {
    const updateActivity = () => {
      const stored = localStorage.getItem("adminSession");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.lastActivity = Date.now();
          localStorage.setItem("adminSession", JSON.stringify(parsed));
        } catch {}
      }
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((ev) => document.addEventListener(ev, updateActivity));
    return () =>
      events.forEach((ev) => document.removeEventListener(ev, updateActivity));
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const value: DashboardContextType = {
    user,
    setUser,
    logout,
    currentPage,
    setCurrentPage,
    activePanel,
    setActivePanel,
    sidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setMobileMenuOpen,
    isLoading,
    isSessionValid,
    refreshSession,
    navigateToPanel, // ← now only takes panelId
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};
