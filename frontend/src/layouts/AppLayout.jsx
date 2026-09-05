import React, { useState } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { X } from "lucide-react";

/**
 * Route Transition Animation Constants
 * Snappy 80ms (0.08s) transition speed for quick, responsive route changes.
 */
const TRANSITION_DURATION_SECONDS = 0.08;

const PAGE_TRANSITION_VARIANTS = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: TRANSITION_DURATION_SECONDS,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: TRANSITION_DURATION_SECONDS,
      ease: "easeIn",
    },
  },
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentOutlet = useOutlet();

  return (
    <div
      className="min-h-screen flex text-slate-800 font-sans relative overflow-hidden"
      style={{
        background: "linear-gradient(90deg, #e0f2fe 0%, #ffffff 48%, #ffffff 52%, #e6f4ea 100%)",
      }}
    >
      {/* Ambient Blurred Mesh Orbs for Smooth Transparent Color Blending */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Left Side Light Blue Glow */}
        <div className="absolute -top-32 -left-20 w-[550px] h-[550px] bg-sky-200/50 rounded-full blur-3xl opacity-70" />
        {/* Middle Soft White Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-white/90 rounded-full blur-3xl opacity-90" />
        {/* Right Side Light Green Glow */}
        <div className="absolute -bottom-32 -right-20 w-[600px] h-[600px] bg-emerald-200/50 rounded-full blur-3xl opacity-70" />
      </div>

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block shrink-0 z-10">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          isMobileSheet={false}
        />
      </div>

      {/* Mobile Drawer Overlay & Sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 bottom-0 z-50 md:hidden shadow-2xl bg-white/95 backdrop-blur-lg"
            >
              <div className="relative h-full">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-4 right-4 p-1 rounded-md text-slate-500 hover:bg-slate-100 z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                <Sidebar
                  collapsed={false}
                  onToggleCollapse={() => {}}
                  isMobileSheet={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen z-10">
        <Navbar
          onMobileMenuClick={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={PAGE_TRANSITION_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className="max-w-7xl mx-auto h-full will-change-transform"
            >
              {currentOutlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
