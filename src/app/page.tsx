'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

export default function ConstruxLanding() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* Subtle grid background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            {/* DeepMind-inspired logo */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-black border border-white/20 rounded-lg p-3 group-hover:border-white/40 transition duration-300">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 4L4 10V22L16 28L28 22V10L16 4Z" stroke="url(#gradient)" strokeWidth="2" fill="none"/>
                  <path d="M16 4V16M16 16L4 10M16 16L28 10M16 16V28M4 22L16 28M28 22L16 28" stroke="url(#gradient)" strokeWidth="1.5" strokeOpacity="0.6"/>
                  <circle cx="16" cy="16" r="3" fill="url(#gradient)"/>
                  <defs>
                    <linearGradient id="gradient" x1="4" y1="4" x2="28" y2="28">
                      <stop offset="0%" stopColor="#3B82F6"/>
                      <stop offset="100%" stopColor="#A855F7"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <span className="text-xl font-light tracking-wide">Construx</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">About</Link>
            <Link href="/login" className="px-5 py-2 text-sm text-gray-400 hover:text-white border border-white/20 rounded-lg hover:border-white/40 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 max-w-7xl mx-auto">
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Large Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
              <div className="relative bg-black border border-white/20 rounded-2xl p-6 group-hover:border-white/40 transition duration-300">
                <svg width="60" height="60" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 10L10 25V55L40 70L70 55V25L40 10Z" stroke="url(#gradientLarge)" strokeWidth="2.5" fill="none"/>
                  <path d="M40 10V40M40 40L10 25M40 40L70 25M40 40V70M10 55L40 70M70 55L40 70" stroke="url(#gradientLarge)" strokeWidth="2" strokeOpacity="0.6"/>
                  <circle cx="40" cy="40" r="6" fill="url(#gradientLarge)"/>
                  <circle cx="40" cy="40" r="6" fill="url(#gradientLarge)" opacity="0.5">
                    <animate attributeName="r" from="6" to="12" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <defs>
                    <linearGradient id="gradientLarge" x1="10" y1="10" x2="70" y2="70">
                      <stop offset="0%" stopColor="#3B82F6"/>
                      <stop offset="50%" stopColor="#8B5CF6"/>
                      <stop offset="100%" stopColor="#A855F7"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight tracking-tight">
            <span className="font-extralight">Build Better.</span>
            <br />
            <span className="font-light">Build Smarter.</span>
            <br />
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-normal">
              Build Together.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Construx is the ultimate project management solution for the modern construction industry. 
            Streamline your projects from groundbreaking to handover with traditional excellence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login" className="group px-8 py-3 bg-white text-black rounded-lg font-normal text-base hover:bg-gray-200 transform hover:scale-105 transition-all duration-300">
                <span className="flex items-center gap-2">
                    Get Started
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </span>
            </Link>
            <Link href="/about" className="px-8 py-3 border border-white/20 rounded-lg font-normal text-base hover:border-white/40 hover:bg-white/5 transform hover:scale-105 transition-all duration-300">
              Learn More
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}