"use client";

import React from "react";
import { motion } from "framer-motion";
import { Home, ArrowRight } from "lucide-react";
import Link from "next/link";
import { bebasNeue, poppins } from "./utils/constants";

const Error404: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        {/* 404 Number */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h1
            className={`text-[8rem] sm:text-[10rem] md:text-[12rem] font-bold leading-none tracking-tighter text-emerald-600 ${bebasNeue.className}`}
          >
            404
          </h1>
        </motion.div>

        {/* Emerald Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="w-20 h-1 bg-emerald-500 mx-auto my-6 rounded-full"
        />

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2
            className={`text-2xl sm:text-3xl font-semibold text-slate-800 mb-3 ${bebasNeue.className}`}
          >
            Page Not Found
          </h2>
          <p
            className={`text-base sm:text-lg text-slate-600 max-w-md mx-auto ${poppins.className}`}
          >
            The page you are looking for doesn&apos;t exist or has been moved.
          </p>
        </motion.div>

        {/* Emerald Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm hover:shadow-emerald-200/50 transition-shadow duration-200"
            >
              <Home size={18} />
              <span className={poppins.className}>Go to Dashboard</span>
              <ArrowRight size={16} />
            </motion.button>
          </Link>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className={`mt-12 text-xs text-slate-400 ${poppins.className}`}
        >
          Doza Platform
        </motion.p>
      </div>
    </div>
  );
};

export default Error404;
