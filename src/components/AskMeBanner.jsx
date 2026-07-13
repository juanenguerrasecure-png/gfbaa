import { Sparkles, ArrowRight } from 'lucide-react';
import { placeholderImages } from '../placeholderImages';

export function AskMeBanner({ onOpen }) {
  return (
    <div 
      className="mt-16 bg-accent-soft border border-accent/20 rounded-2xl p-8 md:p-10 max-w-4xl mx-auto shadow-sm relative overflow-hidden group" 
      id="ask_me_banner_container"
    >
      {/* Decorative luxury editorial background image */}
      <div className="absolute inset-0 w-full h-full opacity-5 pointer-events-none mix-blend-multiply">
        <img
          src={placeholderImages.askMeBanner}
          alt="Sourcing concierge background"
          className="w-full h-full object-cover transition-transform duration-[10s] ease-out group-hover:scale-105"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Decorative subtle ambient background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
        <div className="text-center md:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/15">
            <Sparkles size={11} className="text-accent animate-pulse" />
            <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-accent">
              Personal Shopper & Sourcing Service
            </span>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl font-light text-stone-900 tracking-tight leading-tight">
            Looking for something? <span className="font-serif italic text-accent">Lux Bag or Jewelry?</span> Ask Me!
          </h3>
          <p className="text-stone-500 text-xs max-w-xl leading-relaxed">
            Can't find your dream Hermès, Chanel, or pristine Cartier piece? We have access to global elite vaults. Describe your wishlist, and let our curated concierge find it for you.
          </p>
        </div>

        <button
          onClick={onOpen}
          type="button"
          className="px-6 py-3 bg-accent hover:bg-accent-deep text-white text-xs font-semibold tracking-wider uppercase rounded-xl transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer flex items-center gap-2 group whitespace-nowrap"
          id="ask_me_open_modal_btn"
        >
          <span>Submit Request</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
