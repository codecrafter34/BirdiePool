"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["how-it-works", "charities", "prizes"];
      let current = "";

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Adjust threshold so that when the top of the section is near the viewport top, it becomes active.
          // 150px provides a buffer for the navbar height + some padding.
          if (rect.top <= 150 && rect.bottom >= 150) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    // Call once to set initial state
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-background/60 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black tracking-tight text-white flex items-center gap-1">
          <span className="text-primary">Birdie</span>Pool
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link 
            href="/#how-it-works" 
            className={`text-sm font-semibold tracking-wide transition-colors ${activeSection === 'how-it-works' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            HOW IT WORKS
          </Link>
          <Link 
            href="/#charities" 
            className={`text-sm font-semibold tracking-wide transition-colors ${activeSection === 'charities' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            CHARITIES
          </Link>
          <Link 
            href="/#prizes" 
            className={`text-sm font-semibold tracking-wide transition-colors ${activeSection === 'prizes' ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}
          >
            PRIZES
          </Link>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-white hover:text-primary transition-colors px-4 py-2">
            Log In
          </Link>
          <Link href="/signup" className="text-sm font-bold bg-primary text-primary-foreground px-6 py-2.5 rounded-full hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white p-2 -mr-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border/50 flex flex-col md:hidden animate-in slide-in-from-top-2">
          <div className="px-6 py-6 flex flex-col gap-6">
            <Link onClick={() => setIsOpen(false)} href="/#how-it-works" className={`text-lg font-semibold ${activeSection === 'how-it-works' ? 'text-primary' : 'text-white'}`}>How it Works</Link>
            <Link onClick={() => setIsOpen(false)} href="/#charities" className={`text-lg font-semibold ${activeSection === 'charities' ? 'text-primary' : 'text-white'}`}>Charities</Link>
            <Link onClick={() => setIsOpen(false)} href="/#prizes" className={`text-lg font-semibold ${activeSection === 'prizes' ? 'text-primary' : 'text-white'}`}>Prizes</Link>
            <hr className="border-border/50" />
            <Link onClick={() => setIsOpen(false)} href="/login" className="text-lg font-semibold text-white">Log In</Link>
            <Link onClick={() => setIsOpen(false)} href="/signup" className="text-lg font-bold text-primary">Sign Up</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
