'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RotateCcw, MessageSquare } from 'lucide-react';
import { linkifyText } from '@/components/course-view/resource-display-utils';
import type { FlashCardData } from './flashcard.types';

interface FlashCardBackProps {
  card: FlashCardData;
  onGotIt: () => void;
  onReview: () => void;
  disabled?: boolean;
}

export function FlashCardBack({ card, onGotIt, onReview, disabled }: FlashCardBackProps) {
  return (
    <div className="flex h-full w-full flex-col rounded-[20px] border border-blue-500/30 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 p-5 shadow-lg shadow-blue-900/25 sm:rounded-[22px] sm:p-6 md:rounded-[24px] md:p-7">
      <div className="flex shrink-0 items-center gap-2 self-start">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#38BDF8]/20 text-[#7DD3FC] md:h-9 md:w-9">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-[#7DD3FC] sm:text-sm md:text-base">
          Answer
        </span>
      </div>
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center text-center">
        <div className="text-[14px] font-bold leading-snug text-[#FFFFFF] line-clamp-6 sm:text-[15px] sm:leading-relaxed md:text-[17px] md:leading-relaxed md:line-clamp-[8] lg:text-lg">
          {linkifyText(card.answer ?? '')}
        </div>
      </div>
      <div className="mt-4 flex shrink-0 gap-2 sm:gap-3">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onReview();
          }}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-teal-400/50 bg-teal-500/20 py-2.5 text-xs font-semibold text-teal-300 transition-colors hover:bg-teal-500/30 disabled:opacity-50 sm:py-3 sm:text-sm md:text-base"
        >
          <RotateCcw className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
          Review
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => {
            e.stopPropagation();
            onGotIt();
          }}
          disabled={disabled}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-400/60 bg-amber-500/25 py-2.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/35 disabled:opacity-50 sm:py-3 sm:text-sm md:text-base"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
          Got it
        </motion.button>
      </div>
    </div>
  );
}
