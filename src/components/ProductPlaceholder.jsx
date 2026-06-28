import React from 'react';

export function ProductPlaceholder({ category }) {
  const isBag = String(category).toLowerCase() === 'bags';

  if (isBag) {
    return (
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F5EFE6] to-[#EAE0D5] p-6 select-none group">
        {/* Decorative thin inner frame */}
        <div className="absolute inset-4 border border-[#D9CFC1]/40 pointer-events-none" />
        
        {/* Subtle background brand monogram */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] font-serif text-[#D9CFC1]/15 pointer-events-none select-none font-light">
          GF
        </div>

        {/* Elegant Minimalist Handbag SVG Illustration */}
        <div className="relative z-10 transition-transform duration-500 ease-out group-hover:scale-105">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-[#8C7B6E]/70 drop-shadow-sm">
            {/* Bag Handle */}
            <path 
              d="M32 40 C32 18, 68 18, 68 40" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
            {/* Handle rings */}
            <circle cx="32" cy="40" r="1.5" fill="#C9A84C" stroke="currentColor" strokeWidth="1" />
            <circle cx="68" cy="40" r="1.5" fill="#C9A84C" stroke="currentColor" strokeWidth="1" />
            
            {/* Bag Body */}
            <path 
              d="M22 42 C22 40, 78 40, 78 42 L72 82 C71.5 85, 28.5 85, 28 82 Z" 
              fill="#EDE5DA" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinejoin="round" 
            />
            
            {/* Bag Flap */}
            <path 
              d="M26 42 L50 64 L74 42" 
              fill="#E3D7C7" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinejoin="round" 
            />
            
            {/* Gold Clasp */}
            <path 
              d="M47 62 H53 V67 H47 Z" 
              fill="#C9A84C" 
              stroke="currentColor" 
              strokeWidth="1.2" 
            />
            <circle cx="50" cy="64.5" r="1" fill="#FFFFFF" />
            
            {/* Stitching lines details */}
            <path 
              d="M31 80 C40 81.5, 60 81.5, 69 80" 
              stroke="currentColor" 
              strokeWidth="0.8" 
              strokeDasharray="2 2" 
            />
          </svg>
        </div>

        {/* Mini Label */}
        <span className="absolute bottom-6 text-[9px] font-sans font-medium uppercase tracking-[0.2em] text-[#8C7B6E]/60">
          Designer Bag Curation
        </span>
      </div>
    );
  }

  // Jewelry Placeholder
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F8F5F0] to-[#EFEAE2] p-6 select-none group">
      {/* Decorative thin inner frame */}
      <div className="absolute inset-4 border border-[#E3DAC9]/40 pointer-events-none" />

      {/* Subtle background brand monogram */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10rem] font-serif text-[#E3DAC9]/15 pointer-events-none select-none font-light">
        18K
      </div>

      {/* Elegant Minimalist Ring & Sparkle SVG Illustration */}
      <div className="relative z-10 transition-transform duration-500 ease-out group-hover:scale-105">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-[#8C7B6E]/70 drop-shadow-sm">
          {/* Main Ring Band */}
          <circle 
            cx="50" 
            cy="58" 
            r="18" 
            stroke="currentColor" 
            strokeWidth="2" 
          />
          <circle 
            cx="50" 
            cy="58" 
            r="15" 
            stroke="#C9A84C" 
            strokeWidth="1" 
            opacity="0.7"
          />

          {/* Diamond Crown Setting */}
          <path 
            d="M42 40 L50 43 L58 40 L55 35 H45 Z" 
            fill="#EDE5DA" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
          />

          {/* Sparkling Diamond Gemstone */}
          <path 
            d="M50 24 L56 31 L50 35 L44 31 Z" 
            fill="#FFFFFF" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinejoin="round" 
          />
          <line x1="50" y1="24" x2="50" y2="35" stroke="currentColor" strokeWidth="1" />
          <line x1="44" y1="31" x2="56" y2="31" stroke="currentColor" strokeWidth="0.8" />

          {/* Golden Sparkle Beams */}
          <path d="M50 16 L50 11" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M37 20 L33 16" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M63 20 L67 16" stroke="#C9A84C" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M34 31 L29 31" stroke="#C9A84C" strokeWidth="1" strokeLinecap="round" />
          <path d="M66 31 L71 31" stroke="#C9A84C" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>

      {/* Mini Label */}
      <span className="absolute bottom-6 text-[9px] font-sans font-medium uppercase tracking-[0.2em] text-[#8C7B6E]/60">
        Fine 18K Gold Jewelry
      </span>
    </div>
  );
}
