import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Users, X, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';

const MILESTONES = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

export function getMilestoneInfo(visits) {
  const reachedMilestones = MILESTONES.filter(m => visits >= m);
  const currentMilestone = reachedMilestones.length > 0 ? reachedMilestones[reachedMilestones.length - 1] : 0;
  const nextMilestone = MILESTONES.find(m => m > visits) || MILESTONES[MILESTONES.length - 1];
  
  const prevMilestoneVal = currentMilestone;
  const range = nextMilestone - prevMilestoneVal || 1;
  const progressVal = visits - prevMilestoneVal;
  const percentage = Math.min(100, Math.max(0, Math.round((progressVal / range) * 100)));
  
  return {
    currentMilestone,
    nextMilestone,
    percentage,
    remaining: Math.max(0, nextMilestone - visits),
    reachedMilestones
  };
}

export function WebsiteVisitBanner() {
  const { visits } = useStore();
  const { theme } = useTheme() || {};
  
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('gf_visits_banner_dismissed') === 'true';
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('gf_visits_banner_collapsed') === 'true';
  });
  const [showStats, setShowStats] = useState(false);

  const milestoneInfo = getMilestoneInfo(visits);
  const reachedLatestMilestone = milestoneInfo.currentMilestone > 0;

  // Track if a brand new milestone was just achieved to trigger animation effect
  const [celebrateMilestone, setCelebrateMilestone] = useState(null);

  useEffect(() => {
    if (reachedLatestMilestone) {
      // Check if we already celebrated this particular milestone
      const celebrated = localStorage.getItem(`gf_celebrated_milestone_${milestoneInfo.currentMilestone}`);
      if (!celebrated) {
        setCelebrateMilestone(milestoneInfo.currentMilestone);
        // Automatically open details or expand
        setIsCollapsed(false);
      }
    }
  }, [visits, milestoneInfo.currentMilestone, reachedLatestMilestone]);

  const handleDismissCelebration = () => {
    if (celebrateMilestone) {
      localStorage.setItem(`gf_celebrated_milestone_${celebrateMilestone}`, 'true');
      setCelebrateMilestone(null);
    }
  };

  const handleDismissBanner = () => {
    setIsDismissed(true);
    localStorage.setItem('gf_visits_banner_dismissed', 'true');
  };

  // Dedicated New Look announcement bar (31px height, #151713 near black bg, #B8B4AA / #F4F0E8 text)
  if (theme === 'editorial') {
    return (
      <div className="w-full bg-[#151713] text-[#F4F0E8] select-none h-[31px] min-h-[31px] flex items-center justify-between px-4 sm:px-8 border-b border-[#33372E] relative z-40" id="website_announcement_bar">
        <div className="flex-1 text-center font-sans font-light text-[7.5px] uppercase tracking-[0.3em] text-[#B8B4AA] line-clamp-1">
          WORLDWIDE SOURCING &nbsp;·&nbsp; CAREFULLY AUTHENTICATED &nbsp;·&nbsp; PRIVATE CLIENT SERVICE
        </div>
        <button 
          onClick={() => setShowStats(!showStats)} 
          className="text-[8px] uppercase font-mono font-medium tracking-wider text-[#C4A269] hover:text-[#F4F0E8] transition-colors ml-3 shrink-0 cursor-pointer"
          title="Click to toggle visit statistics"
        >
          {visits} VISITS
        </button>
      </div>
    );
  }

  if (isDismissed) return null;

  return (
    <div className="relative w-full border-b border-[#E5DFD8] bg-[#FAF8F5] select-none text-stone-800 z-40" id="website_visits_banner">
      {/* Sparkly particles backdrop for high milestones */}
      {celebrateMilestone && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden bg-amber-500/5 mix-blend-color-burn">
          <div className="absolute inset-0 opacity-40 animate-pulse bg-radial-[circle_at_center,_var(--tw-gradient-stops)] from-[#C9A84C]/30 via-transparent to-transparent" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Left Block: Milestone Alert or Default Counter */}
          <div className="flex items-center gap-2.5 min-w-0">
            {celebrateMilestone ? (
              <div className="flex items-center gap-2 bg-[#C9A84C]/10 text-[#8C7B6E] border border-[#C9A84C]/30 px-2.5 py-1 rounded-lg animate-bounce">
                <Trophy size={14} className="text-[var(--gold)] shrink-0" />
                <span className="text-xs font-semibold tracking-tight">
                  Milestone Reached! We hit <strong className="text-stone-950 font-bold">{celebrateMilestone}</strong> luxury acquisitions! 🎉
                </span>
              </div>
            ) : reachedLatestMilestone ? (
              <div className="flex items-center gap-2 text-stone-700">
                <Sparkles size={14} className="text-[var(--gold)] shrink-0 animate-pulse" />
                <span className="text-xs font-medium">
                  Celebrating <strong className="text-[#C9A84C] font-semibold">{milestoneInfo.currentMilestone}+</strong> visits of curated luxury
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-stone-600">
                <Users size={14} className="text-stone-400 shrink-0" />
                <span className="text-xs font-medium">
                  Welcome! Tracking curated storefront visits
                </span>
              </div>
            )}

            {/* Total Visits Pill */}
            <button 
              onClick={() => setShowStats(!showStats)}
              className="inline-flex items-center gap-1 bg-stone-900 text-[var(--gold)] font-mono text-[10px] font-bold px-2 py-0.5 rounded-md hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer shrink-0"
              title="Click to view next milestone progress"
            >
              <span>{visits.toLocaleString()}</span>
              <span className="text-[9px] text-stone-400 font-sans font-normal uppercase tracking-wider ml-0.5">Visits</span>
            </button>
          </div>

          {/* Right Block: Progress & Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-4 min-w-0">
            {/* Simple progress summary */}
            {!isCollapsed && (
              <div className="hidden md:flex items-center gap-2.5 text-xs text-stone-500">
                <span className="font-sans">Progress to {milestoneInfo.nextMilestone} visits:</span>
                <div className="w-24 bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-stone-700 to-[var(--gold)] h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${milestoneInfo.percentage}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] font-bold text-stone-700">{milestoneInfo.percentage}%</span>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {/* Detailed Stats Button */}
              <button
                onClick={() => setShowStats(!showStats)}
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded transition-all cursor-pointer ${showStats ? 'bg-stone-200 text-stone-900' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'}`}
              >
                Stats
              </button>

              {/* Dismiss Celebration/Banner Buttons */}
              {celebrateMilestone ? (
                <button 
                  onClick={handleDismissCelebration}
                  className="bg-stone-900 text-[#FAF8F5] text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded hover:bg-stone-950 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Check size={11} /> Celebrate
                </button>
              ) : (
                <button 
                  onClick={handleDismissBanner}
                  className="text-stone-400 hover:text-stone-600 p-1 transition-all cursor-pointer"
                  title="Dismiss banner"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Stats Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-stone-200/80 mt-2 pt-3 pb-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stat 1: Total & Milestone progress */}
                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-stone-200/60 shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 block mb-1">Curation Milestone Status</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-serif font-semibold text-stone-900">{visits}</span>
                    <span className="text-xs text-stone-400">/ {milestoneInfo.nextMilestone} visits</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2">
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200/50">
                      <div 
                        className="bg-gradient-to-r from-stone-800 to-[var(--gold)] h-full transition-all duration-1000" 
                        style={{ width: `${milestoneInfo.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[9px] text-stone-500 font-mono">
                      <span>{milestoneInfo.currentMilestone}</span>
                      <span className="font-sans font-medium text-[var(--gold)]">{milestoneInfo.remaining} visits remaining</span>
                      <span>{milestoneInfo.nextMilestone}</span>
                    </div>
                  </div>
                </div>

                {/* Stat 2: Active Milestone list */}
                <div className="bg-white/80 backdrop-blur-xs p-3 rounded-lg border border-stone-200/60 shadow-2xs">
                  <span className="text-[9px] uppercase tracking-wider text-stone-400 block mb-1">Milestones Achieved</span>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-[50px] overflow-y-auto pr-1">
                    {MILESTONES.map(m => {
                      const reached = visits >= m;
                      return (
                        <span 
                          key={m} 
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 border ${
                            reached 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : 'bg-stone-50 text-stone-300 border-stone-200 line-through'
                          }`}
                        >
                          {reached && <Trophy size={8} />}
                          {m}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Stat 3: Aesthetic Thank you note */}
                <div className="bg-gradient-to-br from-[#FAF8F5] to-stone-100 p-3 rounded-lg border border-stone-200/60 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#C9A84C] font-bold block mb-0.5">A Curation Milestone</span>
                    <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                      Thank you for visiting Good Finds by AA. We measure our growth by our community of luxury enthusiasts. Every visit helps us elevate our seasonal curations!
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
