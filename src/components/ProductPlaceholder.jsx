import React from 'react';
import { placeholderImages } from '../placeholderImages';

export function ProductPlaceholder({ category }) {
  const isBag = String(category).toLowerCase() === 'bags';
  const imgUrl = isBag ? placeholderImages.emptyProductBag : placeholderImages.emptyProductJewelry;
  const label = isBag ? 'Designer Bag Curation' : 'Fine 18K Gold Jewelry';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[var(--surface)] select-none group overflow-hidden" id={`product_placeholder_${isBag ? 'bag' : 'jewelry'}`}>
      <img
        src={imgUrl}
        alt={label}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      {/* Elegant overlay */}
      <div className="absolute inset-0 bg-stone-900/5 transition-colors duration-500 group-hover:bg-stone-900/10 pointer-events-none" />
      
      {/* Decorative thin inner frame */}
      <div className="absolute inset-4 border border-white/20 pointer-events-none" />
      
      {/* Subtle background brand monogram */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem] font-serif text-white/10 pointer-events-none select-none font-light uppercase tracking-widest z-10">
        {isBag ? 'GF' : '18K'}
      </div>

      {/* Mini Label */}
      <span className="absolute bottom-6 z-10 text-[9px] font-sans font-medium uppercase tracking-[0.2em] text-white/90 drop-shadow-xs bg-stone-900/40 backdrop-blur-xs px-2.5 py-1 rounded-sm">
        {label}
      </span>
    </div>
  );
}
