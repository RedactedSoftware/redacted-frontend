"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme: themeValue, setTheme, resolvedTheme } = useTheme();
  const currentTheme = (resolvedTheme ?? themeValue) as string;
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMenu = () => setIsOpen(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { href: "/", label: "📊 Dashboard", icon: "📊" },
    { href: "/map", label: "🗺️ Live Map", icon: "🗺️" },
    { href: "/history/sessions", label: "📋 Sessions", icon: "📋" },
  ];

  return (
    <nav className="sm:hidden bg-[#1a2438] border-b border-slate-700/30 sticky top-0 z-50">
      {/* Desktop Navigation */}
      <div className="hidden sm:flex items-center justify-between px-6 py-4">
        <div className="text-xl font-bold text-white">🛰️ GPS Tracker</div>
        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-cyan-400 border-b-2 border-cyan-400"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {mounted && (
            <button
              onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
              className="ml-4 text-lg hover:opacity-80 transition-opacity"
              aria-label="Toggle theme"
            >
              {currentTheme === "dark" ? "🌙" : "☀️"}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden px-4 py-3 flex items-center justify-between">
        <div className="text-lg font-bold text-white">🛰️ GPS Tracker</div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-2xl text-white hover:opacity-80 transition-opacity"
          aria-label="Toggle menu"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="sm:hidden bg-[#0f1729] border-t border-slate-700/30 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col divide-y divide-slate-700/30">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-cyan-600/20 text-cyan-400 border-l-4 border-cyan-400"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {mounted && (
              <button
                onClick={() => {
                  setTheme(currentTheme === "dark" ? "light" : "dark");
                  closeMenu();
                }}
                className="px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800/50 hover:text-white transition-colors flex items-center gap-2"
                aria-label="Toggle theme"
              >
                <span className="text-lg">{currentTheme === "dark" ? "🌙" : "☀️"}</span>
                {currentTheme === "dark" ? "Dark Mode" : "Light Mode"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
