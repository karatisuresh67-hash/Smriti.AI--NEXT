import React from 'react';
import { Sparkles } from 'lucide-react';

export function RobotMascot() {
  return (
    <div className="relative flex flex-col items-center justify-center select-none py-2">
      {/* Ambient background glow */}
      <div className="absolute w-48 h-48 rounded-full bg-gradient-to-tr from-violet-600/30 via-indigo-600/20 to-cyan-400/30 blur-2xl pointer-events-none animate-pulse" />
      
      {/* 3D Hologram Floating Aura Rings */}
      <div className="absolute w-56 h-56 rounded-full border border-cyan-400/20 animate-spin pointer-events-none" style={{ animationDuration: '18s' }} />
      <div className="absolute w-44 h-44 rounded-full border border-violet-400/25 animate-spin pointer-events-none" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />

      {/* Futuristic 3D AI Robot Mascot SVG */}
      <div className="relative z-10 transition-transform duration-300 hover:scale-105 filter drop-shadow-[0_10px_25px_rgba(99,102,241,0.5)]">
        <svg
          width="160"
          height="160"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="animate-bounce"
          style={{ animationDuration: '4s' }}
        >
          {/* Head & Antenna */}
          <path d="M100 24V40" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="20" r="7" fill="#38BDF8" className="animate-ping" style={{ animationDuration: '2.5s' }} />
          <circle cx="100" cy="20" r="5" fill="#E0F2FE" />

          {/* Outer Helmet / Head Frame */}
          <rect x="52" y="42" width="96" height="84" rx="30" fill="url(#robotHeadGrad)" stroke="#6366F1" strokeWidth="3" />
          
          {/* Screen Visor Face */}
          <rect x="64" y="56" width="72" height="56" rx="20" fill="#070C1E" stroke="#1E293B" strokeWidth="2" />
          
          {/* Glowing Eyes (Cyan expressive LED) */}
          <g className="animate-pulse" style={{ animationDuration: '2s' }}>
            <circle cx="84" cy="80" r="8" fill="#38BDF8" filter="url(#eyeGlow)" />
            <circle cx="84" cy="80" r="4" fill="#FFFFFF" />
            
            <circle cx="116" cy="80" r="8" fill="#38BDF8" filter="url(#eyeGlow)" />
            <circle cx="116" cy="80" r="4" fill="#FFFFFF" />
          </g>

          {/* Friendly LED Smile Wave */}
          <path d="M88 98 Q100 106 112 98" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />

          {/* Ear Audio Sensors */}
          <rect x="42" y="66" width="10" height="26" rx="5" fill="#4F46E5" stroke="#38BDF8" strokeWidth="1.5" />
          <rect x="148" y="66" width="10" height="26" rx="5" fill="#4F46E5" stroke="#38BDF8" strokeWidth="1.5" />

          {/* Neck Joint */}
          <rect x="88" y="126" width="24" height="12" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="2" />

          {/* Floating High-Tech Shoulders & Body */}
          <path d="M58 144 C58 136 142 136 142 144 L150 178 C150 186 50 186 50 178 Z" fill="url(#robotBodyGrad)" stroke="#6366F1" strokeWidth="2.5" />
          
          {/* Heart Core / Energy Reactor */}
          <circle cx="100" cy="160" r="10" fill="#070C1E" stroke="#38BDF8" strokeWidth="2" />
          <polygon points="100,154 105,163 95,163" fill="#38BDF8" className="animate-pulse" />

          {/* Left and Right Arm Pods */}
          <circle cx="44" cy="154" r="12" fill="#4338CA" stroke="#818CF8" strokeWidth="2" />
          <circle cx="156" cy="154" r="12" fill="#4338CA" stroke="#818CF8" strokeWidth="2" />

          {/* Gradients and Filters */}
          <defs>
            <linearGradient id="robotHeadGrad" x1="52" y1="42" x2="148" y2="126" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E1B4B" />
              <stop offset="0.5" stopColor="#312E81" />
              <stop offset="1" stopColor="#4338CA" />
            </linearGradient>
            <linearGradient id="robotBodyGrad" x1="50" y1="138" x2="150" y2="182" gradientUnits="userSpaceOnUse">
              <stop stopColor="#312E81" />
              <stop offset="1" stopColor="#1E1B4B" />
            </linearGradient>
            <filter id="eyeGlow" x="70" y="66" width="28" height="28" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* Floating Status Tag */}
      <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#0B1024]/90 border border-cyan-500/30 text-[11px] font-semibold text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>Smriti AI • Online & Grounded</span>
      </div>
    </div>
  );
}
