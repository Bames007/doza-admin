// app/dashboard/DashboardHeader.tsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDashboard } from "./DashboardContext";
import {
  Bell,
  User,
  MessageCircle,
  Search,
  X,
  LogOut,
  Settings,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/utils/utils";
import { poppins, bebasNeue } from "@/app/utils/constants";

interface DashboardHeaderProps {
  onMessagesToggle: () => void;
}

export default function DashboardHeader({
  onMessagesToggle,
}: DashboardHeaderProps) {
  const {
    toggleSidebar,
    user,
    logout,
    currentPage,
    isMobileMenuOpen,
    setMobileMenuOpen,
  } = useDashboard();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manage mobile overlay
  useEffect(() => {
    setMobileMenuOpen(isSearchOpen || isMenuOpen || isNotificationsOpen);
  }, [isSearchOpen, isMenuOpen, isNotificationsOpen, setMobileMenuOpen]);

  const handleMobileMenuToggle = () => {
    if (isMobile) setMobileMenuOpen(!isMobileMenuOpen);
    else toggleSidebar();
  };

  const toggleNotifications = () => setIsNotificationsOpen((prev) => !prev);
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const MobileOverlay = ({ children, title, onClose }: any) => (
    <div className="fixed inset-0 z-[60] bg-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2
          className={cn(
            "text-lg font-black text-slate-900",
            bebasNeue.className,
          )}
        >
          {title}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );

  // Desktop/Tablet view
  if (!isMobile) {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60",
          poppins.className,
        )}
      >
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <h1 className={cn("text-xl text-slate-900", bebasNeue.className)}>
                {currentPage}
              </h1>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openSearch}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
            >
              <Search className="w-5 h-5 text-slate-600" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleNotifications}
                className="relative p-2 rounded-xl hover:bg-slate-100"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Notifications
                        </h3>
                        <p className="text-xs text-slate-500">3 unread</p>
                      </div>
                      <button className="text-[10px] font-bold text-emerald-600 hover:underline">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {/* Placeholder notifications */}
                      <div className="p-4 border-b border-slate-50 hover:bg-slate-50">
                        <p className="text-sm font-medium text-slate-900">
                          New appointment with John Smith
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          5 min ago
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages */}
            <button
              onClick={onMessagesToggle}
              className="relative p-2 rounded-xl hover:bg-slate-100"
            >
              <MessageCircle className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
            </button>

            {/* Profile */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={toggleMenu}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100"
              >
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {user?.fullName?.charAt(0) || "U"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">
                    {user?.fullName?.split(" ")[0] || "User"}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">
                    {user?.role}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user?.fullName?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user?.fullName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                        <User className="w-4 h-4" /> Profile
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg">
                        <HelpCircle className="w-4 h-4" /> Help
                      </button>
                      <hr className="my-2 border-slate-100" />
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Mobile view
  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div>
              <h1
                className={cn(
                  "text-sm font-black text-slate-900",
                  bebasNeue.className,
                )}
              >
                {currentPage}
              </h1>
              <p className="text-[9px] text-slate-400 tracking-wide">
                Doza Admin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={openSearch}
              className="p-2 rounded-xl hover:bg-slate-100"
            >
              <Search className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={onMessagesToggle}
              className="relative p-2 rounded-xl hover:bg-slate-100"
            >
              <MessageCircle className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
            </button>
            <button
              onClick={toggleNotifications}
              className="relative p-2 rounded-xl hover:bg-slate-100"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-xl hover:bg-slate-100"
            >
              <User className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlays */}
      {isSearchOpen && (
        <MobileOverlay title="Search" onClose={closeSearch}>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-base"
                autoFocus
              />
            </div>
          </div>
        </MobileOverlay>
      )}

      {isMenuOpen && (
        <MobileOverlay title="Profile" onClose={() => setIsMenuOpen(false)}>
          <div className="p-4">
            <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl mb-6">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              <div>
                <p className="font-bold text-slate-900">{user?.fullName}</p>
                <p className="text-sm text-slate-600">{user?.role}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl">
                <User className="w-5 h-5" /> Profile
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl">
                <Settings className="w-5 h-5" /> Settings
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-xl">
                <HelpCircle className="w-5 h-5" /> Help
              </button>
              <hr className="my-2" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>
        </MobileOverlay>
      )}

      {isNotificationsOpen && (
        <MobileOverlay
          title="Notifications"
          onClose={() => setIsNotificationsOpen(false)}
        >
          <div className="divide-y divide-slate-100 p-4">
            <div className="p-3 bg-emerald-50/50 rounded-xl">
              <p className="text-sm font-medium text-slate-900">
                New appointment with John Smith
              </p>
              <p className="text-xs text-slate-400 mt-0.5">5 min ago</p>
            </div>
          </div>
        </MobileOverlay>
      )}
    </>
  );
}
