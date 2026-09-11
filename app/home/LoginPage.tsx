"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { bebasNeue, poppins } from "../utils/constants";
import Image from "next/image";
import LoadingScreen from "../components/LoadingScreen";

const LoginPage: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });

  const router = useRouter();

  // ─── Defer client‑side rendering ─────────────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  // ─── Hardcoded credentials ────────────────────────────────────
  const VALID_EMAIL = "eddybames007@gmail.com";
  const VALID_PASSWORD = "1234567890";

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "email":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return "Please enter a valid email address";
        return "";
      case "password":
        if (!value.trim()) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return "";
      default:
        return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const hasErrors = () => {
    return (
      Object.values(fieldErrors).some((error) => error !== "") ||
      !formData.email.trim() ||
      !formData.password.trim()
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    setFieldErrors({
      email: "",
      password: "",
    });

    const newFieldErrors = {
      email: validateField("email", formData.email),
      password: validateField("password", formData.password),
    };
    setFieldErrors(newFieldErrors);

    if (Object.values(newFieldErrors).some((error) => error !== "")) {
      setLoading(false);
      return;
    }

    const { email, password } = formData;
    if (email.trim() !== VALID_EMAIL || password.trim() !== VALID_PASSWORD) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const dummyUser = {
        id: "dummy-user-id",
        email: email.trim(),
        fullName: "Eddy Bames",
        role: "ceo", // valid admin role
      };

      const sessionWithExpiry = {
        user: dummyUser,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        lastActivity: Date.now(),
      };

      localStorage.setItem("adminSession", JSON.stringify(sessionWithExpiry));
      localStorage.setItem(
        "authToken",
        `doza-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      );
      localStorage.setItem("loginTime", new Date().toISOString());
      localStorage.setItem("lastActivity", Date.now().toString());

      // Handle logout in other tabs
      window.addEventListener("storage", (e) => {
        if (e.key === "logout") {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/";
        }
      });

      router.push("/dashboard"); // ✅ admin dashboard route
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetHelp = () => {
    window.location.href =
      "mailto:support@doza.com?subject=Login Assistance&body=Please help me with login access to my healthcare center.";
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 selection:bg-emerald-100 ${poppins.className}`}
    >
      <AnimatePresence>{loading && <LoadingScreen />}</AnimatePresence>

      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] border border-white overflow-hidden"
        >
          {/* LEFT COLUMN: BRANDING (Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-emerald-600 to-teal-700 p-16 flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-700" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[length:32px_32px]" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-16">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Image
                    src="/logo.png"
                    alt="Doza Logo"
                    width={28}
                    height={28}
                  />
                </div>
                <span
                  className={`text-2xl tracking-tighter font-bold text-white ${bebasNeue.className}`}
                >
                  DOZA
                </span>
              </div>

              <h1
                className={`text-6xl font-bold text-white leading-[0.95] mb-8 ${bebasNeue.className}`}
              >
                ADMIN <br />
                <span className="text-emerald-200 text-7xl">CONTROL.</span>
              </h1>
              <p className="text-emerald-50/70 text-lg leading-relaxed max-w-sm">
                Secure access to manage centers, users, subscriptions and more.
              </p>
            </div>

            <div className="relative z-10 space-y-8">
              <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10">
                <div className="flex items-center gap-4 text-white">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Secure Platform</p>
                    <p className="text-xs text-emerald-100/60">
                      Role‑based access for Doza leaders.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LOGIN FORM */}
          <div className="lg:col-span-7 p-8 md:p-16 lg:p-20 flex flex-col justify-center bg-white/50">
            <div className="max-w-md mx-auto w-full">
              {/* Mobile Branding */}
              <div className="lg:hidden flex items-center justify-between mb-12">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="Doza Logo"
                    width={32}
                    height={32}
                  />
                  <span
                    className={`text-2xl font-bold text-slate-900 ${bebasNeue.className}`}
                  >
                    DOZA
                  </span>
                </div>
              </div>

              <header className="mb-10 text-left">
                <h2
                  className={`text-5xl font-bold text-slate-700 mb-2 ${bebasNeue.className}`}
                >
                  Admin Login
                </h2>
                <p className="text-slate-500 font-medium">
                  Sign in to the Doza management platform.
                </p>
              </header>

              {/* Error Handling */}
              {(error || Object.values(fieldErrors).some((err) => err)) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3 mb-8"
                >
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold">Authentication Error</p>
                        <p className="opacity-80">{error}</p>
                      </div>
                    </div>
                  )}
                  {Object.values(fieldErrors).some((err) => err) && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Please fix the following issues:
                      </p>
                      <ul className="text-xs text-amber-700 mt-1 list-disc list-inside space-y-1">
                        {fieldErrors.email && (
                          <li>Email: {fieldErrors.email}</li>
                        )}
                        {fieldErrors.password && (
                          <li>Password: {fieldErrors.password}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Field */}
                <div>
                  <div className="flex justify-between items-end mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Email Address
                    </label>
                    {fieldErrors.email && (
                      <span className="text-[10px] font-bold text-red-500 uppercase italic">
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"
                      size={18}
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={`w-full bg-slate-100 border-2 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 transition-all outline-none 
                        ${
                          fieldErrors.email
                            ? "border-red-200 bg-red-50/30"
                            : "border-transparent focus:bg-white focus:border-emerald-500"
                        }`}
                      placeholder="Enter your registered email"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-end mb-2 ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Password
                    </label>
                    {fieldErrors.password && (
                      <span className="text-[10px] font-bold text-red-500 uppercase italic">
                        {fieldErrors.password}
                      </span>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"
                      size={18}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={`w-full bg-slate-100 border-2 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-slate-900 transition-all outline-none 
                        ${
                          fieldErrors.password
                            ? "border-red-200 bg-red-50/30"
                            : "border-transparent focus:bg-white focus:border-emerald-500"
                        }`}
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || hasErrors()}
                  className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 group shadow-2xl shadow-slate-900/10 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      ACCESS PLATFORM
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </motion.button>
              </form>

              <footer className="mt-12 text-center">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={handleGetHelp}
                    className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                  >
                    <Mail size={14} /> Email Support
                  </button>
                  <span className="text-slate-300">•</span>
                  <a
                    href="tel:+2348127728084"
                    className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>{" "}
                    Call Support
                  </a>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-center">
                  <button
                    onClick={() => router.push("/")}
                    className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"
                  >
                    <ChevronLeft size={14} /> Back to Site
                  </button>
                </div>
              </footer>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
