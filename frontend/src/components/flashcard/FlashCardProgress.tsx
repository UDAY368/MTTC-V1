'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Flame, CheckCircle2, BookOpen } from 'lucide-react';

interface FlashCardProgressProps {
  xp: number;
  streak: number;
  currentIndex: number;
  total: number;
  gotItCount: number;
  reviewCount: number;
  /** Optional content at the left of the bar (e.g. Back button, desktop inline only) */
  leftContent?: React.ReactNode;
}

export function FlashCardProgress({
  xp,
  streak,
  currentIndex,
  total,
  gotItCount,
  reviewCount,
  leftContent,
}: FlashCardProgressProps) {
  const completedPercent = total > 0 ? (gotItCount / total) * 100 : 0;
  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (completedPercent / 100) * circumference;

  return (
    <div
      className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 px-3 py-2.5 shadow-lg shadow-blue-900/25 backdrop-blur-sm sm:mt-0 sm:px-4 sm:py-3"
      role="status"
      aria-label={`Flash card progress: ${xp} XP, streak ${streak}, card ${currentIndex + 1} of ${total}, got it ${gotItCount}, review ${reviewCount}`}
    >
      <div className="flex flex-wrap items-center gap-3 md:min-w-0 md:flex-1 md:justify-evenly">
        {leftContent != null ? <div className="flex shrink-0 items-center">{leftContent}</div> : null}
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-amber-400 md:h-5 md:w-5" aria-hidden />
          <span className="text-xs font-semibold tabular-nums text-slate-100 sm:text-sm md:text-base">{xp} XP</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-400 md:h-5 md:w-5" aria-hidden />
          <span className="text-xs font-semibold tabular-nums text-slate-100 sm:text-sm md:text-base">{streak}</span>
        </div>
        <span className="hidden text-[10px] text-slate-300 tabular-nums sm:inline sm:text-xs md:text-sm">
          {currentIndex + 1}/{total}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-300 sm:text-sm md:text-base">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400 md:h-5 md:w-5" aria-hidden />
          <span className="tabular-nums text-slate-100"><span className="sm:hidden">Got</span><span className="hidden sm:inline">Got it</span> ({gotItCount})</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-300 sm:text-sm md:text-base">
          <BookOpen className="h-4 w-4 shrink-0 text-teal-400 md:h-5 md:w-5" aria-hidden />
          <span className="tabular-nums text-slate-100"><span className="sm:hidden">R</span><span className="hidden sm:inline">Review</span> ({reviewCount})</span>
        </span>
      </div>
      <div className="relative h-7 w-7 flex-shrink-0 sm:h-10 sm:w-10 md:h-11 md:w-11">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 40 40" aria-hidden>
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            className="stroke-slate-600"
            strokeWidth="3"
          />
          <motion.circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            className="stroke-sky-400"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: [0.4, 0.2, 0.2, 1] }}
          />
        </svg>
      </div>
    </div>
  );
}
