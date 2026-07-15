import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Users, X, Sliders, Settings, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

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
  const { visits, updateVisitsValue } = useStore();
  const { isAdmin } = useAuth();
  
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('gf_visits_banner_dismissed') === 'true';
  });
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('gf_visits_banner_collapsed') === 'true';
  });
  const [showStats, setShowStats] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const val = parseInt(customValue, 10);
    if (isNaN(val) || val < 0) {
      setErrorMsg('Please enter a valid positive number');
      return;
    }
    const res = await updateVisitsValue(val);
    if (res.ok) {
      setSuccessMsg(`Successfully set counter to ${val}`);
      setCustomValue('');
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setErrorMsg(res.error || 'Failed to update visits counter');
    }
  };

  if (isDismissed && !isAdmin) return null;

  // We show a floating recovery trigger for admins or users if dismissed
  if (isDismissed) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <button 
          onClick={() => {
            setIsDismissed(false);
            localStorage.removeItem('gf_visits_banner_dismissed');
          }}
          className="bg-stone-900 text-[var(--gold)] border border-stone-800 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full shadow-lg hover:bg-stone-850 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Users size={12} />
          Show Counter ({visits})
        </button>
      </div>
    );
  }

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

              {/* Admin Tools Button (If logged in as Admin) */}
              {isAdmin && (
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className={`text-stone-500 hover:text-stone-900 p-1 rounded hover:bg-stone-100 transition-all cursor-pointer ${adminOpen ? 'text-[var(--gold)] bg-stone-100' : ''}`}
                  title="Admin Counter Override"
                >
                  <Settings size={14} />
                </button>
              )}

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

        {/* Expandable Admin Override Form */}
        <AnimatePresence>
          {isAdmin && adminOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-stone-200 mt-2 pt-3 pb-2">
                <form onSubmit={handleAdminUpdate} className="flex flex-wrap items-center gap-3">
                  <div className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={13} className="text-[var(--gold)]" />
                    Admin Counter Override:
                  </div>
                  
                  <div className="flex items-center gap-1.5 min-w-[200px]">
                    <input
                      type="number"
                      value={customValue}
                      onChange={e => setCustomValue(e.target.value)}
                      placeholder={`e.g. ${visits + 100}`}
                      className="bg-white border border-stone-300 rounded px-2.5 py-1 text-xs outline-none focus:border-[var(--gold)] w-full font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-stone-900 text-white hover:bg-stone-800 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </div>

                  {errorMsg && <span className="text-red-600 text-xs font-medium">{errorMsg}</span>}
                  {successMsg && <span className="text-emerald-700 text-xs font-medium">{successMsg}</span>}
                  
                  <span className="text-[10px] text-stone-400 ml-auto italic">
                    Useful for syncing historical offline visits or restoring counters.
                  </span>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
