'use client'

import React from 'react'

export default function DnaVisual() {
  return (
    <div className="relative w-full h-full min-h-[380px] flex items-center justify-center overflow-hidden pointer-events-none">
      {/* 1. Ambient Background Glows */}
      <div className="absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-[#00D8C3]/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-16 w-80 h-80 rounded-full bg-[#22C9EE]/15 blur-[100px] pointer-events-none" />

      {/* 2. Molecular Hexagonal Wireframe Network (Matching Reference Mockup) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-30 stroke-[#00D8C3] pointer-events-none"
        fill="none"
        viewBox="0 0 400 650"
      >
        {/* Hexagon 1 top right */}
        <polygon points="310,120 338,136 338,168 310,184 282,168 282,136" strokeWidth="1.2" />
        <polygon points="310,128 330,140 330,162 310,174 290,162 290,140" strokeWidth="0.8" strokeDasharray="3 3" />
        {/* Hexagon 2 mid left */}
        <polygon points="90,260 118,276 118,308 90,324 62,308 62,276" strokeWidth="1.2" />
        {/* Hexagon 3 lower left */}
        <polygon points="95,440 123,456 123,488 95,504 67,488 67,456" strokeWidth="1.2" />
        {/* Hexagon 4 lower right */}
        <polygon points="305,480 333,496 333,528 305,544 277,528 277,496" strokeWidth="1.2" />
        {/* Subtle connecting dotted lines */}
        <line x1="118" y1="292" x2="165" y2="330" strokeWidth="0.8" strokeDasharray="2 3" />
        <line x1="90" y1="324" x2="95" y2="440" strokeWidth="0.8" strokeDasharray="2 3" />
        <line x1="277" y1="512" x2="225" y2="530" strokeWidth="0.8" strokeDasharray="2 3" />
      </svg>

      {/* 
        3. Seamless Full-Bleed 3D DNA Helix (NO Square Box, NO Border!)
        Uses radial gradient mask so edges blend 100% invisibly into the dark navy background
      */}
      <div
        className="relative w-full h-full flex items-center justify-center pointer-events-none"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 45%, transparent 95%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 45%, transparent 95%)',
        }}
      >
        {/* Glowing Luminous DNA Image - Seamlessly blended */}
        <img
          src="/images/dna-visual.jpg"
          alt="DNA Structure Visualization"
          aria-hidden="true"
          className="w-full h-full object-cover object-center opacity-90 mix-blend-screen filter drop-shadow-[0_0_40px_rgba(0,216,195,0.5)]"
          onError={(e) => {
            if (!e.currentTarget.dataset.fallback) {
              e.currentTarget.dataset.fallback = '1'
              e.currentTarget.src = '/images/dna-hero.png'
            }
          }}
        />
      </div>
    </div>
  )
}
