//app/dashboard/layout.tsx

"use client";

import { DashboardProvider, useDashboard } from "./DashboardContext";
import DashboardSidebar from "./DashboardSideBar";
import DashboardHeader from "./DashboardHeader";
// import MessagesPanel from "../messenger/MessagePanel";
// import DraggableChatPopup from "../messenger/DraggableChatPopup";
import PanelRenderer from "./PanelRenderer";
import { useState, useEffect } from "react";
import { Activity, X, RefreshCw, Loader2, LogOut } from "lucide-react";
import BubbleTransition from "@/app/components/BubbleTransitions";
import { AnimatePresence } from "framer-motion";

function SessionStatusIndicator() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [session, setSession] = useState({ minutes: 0, isActive: true });
  const { logout } = useDashboard();

  useEffect(() => {
    const checkSession = () => {
      const lastActivity = localStorage.getItem("lastActivity");
      if (!lastActivity) return;
      const diff = Date.now() - parseInt(lastActivity);
      const minutes = Math.floor(diff / 60000);
      setSession({ minutes, isActive: minutes < 30 });
    };
    const interval = setInterval(checkSession, 30000);
    checkSession();
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    localStorage.setItem("lastActivity", Date.now().toString());
    setSession({ minutes: 0, isActive: true });
    setIsMinimized(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 ${
            session.isActive ? "bg-slate-900" : "bg-red-500 animate-pulse"
          }`}
        >
          <Activity className="w-5 h-5 text-white" />
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-[calc(100vw-32px)] md:w-72 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Session Status</h3>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {session.isActive
              ? `System active. Last activity: ${session.minutes}m ago.`
              : "Session timeout imminent."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading, isSessionValid, user } = useDashboard();
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  const [showBubble, setShowBubble] = useState(false);
  const [bubblePhase, setBubblePhase] = useState<"closing" | "opening">(
    "closing",
  );

  useEffect(() => {
    const fromLogin = sessionStorage.getItem("fromLogin");
    if (fromLogin) {
      sessionStorage.removeItem("fromLogin");
      setShowBubble(false);
      return;
    }
    setShowBubble(true);
    setBubblePhase("closing");
  }, []);

  const handleAnimationComplete = () => {
    if (bubblePhase === "closing") setBubblePhase("opening");
    else setShowBubble(false);
  };

  if (!isSessionValid && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm w-full bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
          <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800">
            Session expired. Redirecting...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showBubble && (
          <BubbleTransition
            role={user?.role || "ceo"}
            phase={bubblePhase}
            onAnimationComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>

      <div
        className={`flex flex-col h-screen bg-slate-50 md:flex-row overflow-hidden transition-opacity duration-500 ${showBubble ? "opacity-0" : "opacity-100"}`}
      >
        <div className="hidden md:block">
          <DashboardSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <DashboardHeader
            onMessagesToggle={() => setIsMessagesOpen(!isMessagesOpen)}
          />
          <main className="flex-1 overflow-y-auto p-2 md:p-6 scroll-smooth">
            <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
              <PanelRenderer />
              <div className="md:px-2">{children}</div>
            </div>
          </main>
        </div>

        <div className="md:hidden border-t bg-white p-2 z-40">
          <DashboardSidebar />
        </div>

        {/* <MessagesPanel
          isOpen={isMessagesOpen}
          onClose={() => setIsMessagesOpen(false)}
          onChatSelect={(chat) => setSelectedChat(chat)}
        /> */}
        {/* <DraggableChatPopup
          chat={selectedChat}
          onClose={() => setSelectedChat(null)}
        /> */}
        <SessionStatusIndicator />
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <BubbleTransition
        role="ceo"
        phase="closing"
        onAnimationComplete={() => {}}
      />
    );
  }

  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
