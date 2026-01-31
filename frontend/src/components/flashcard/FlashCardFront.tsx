'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { linkifyText } from '@/components/course-view/resource-display-utils';
import type { FlashCardData } from './flashcard.types';

interface FlashCardFrontProps {
  card: FlashCardData;
  cardNumber: number;
  total: number;
}

export function FlashCardFront({ card, cardNumber, total }: FlashCardFrontProps) {
  return (
    <div className="flex h-full w-full flex-col rounded-[20px] bg-gradient-to-br from-[#1E3A8A]/10 via-white to-[#38BDF8]/10 p-5 shadow-lg dark:from-[#1E3A8A]/20 dark:via-[#0F172A] dark:to-[#38BDF8]/10 sm:rounded-[22px] sm:p-6 md:rounded-[24px] md:p-7">
      <div className="flex shrink-0 items-center gap-2 self-start">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A]/15 text-[#1E3A8A] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] md:h-9 md:w-9">
          <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-[#1E3A8A] dark:text-[#38BDF8] sm:text-sm md:text-base">
          Question
        </span>
      </div>
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center text-center">
        <div className="text-[14px] font-medium leading-snug text-[#0F172A] line-clamp-6 dark:text-white sm:text-[15px] sm:leading-relaxed md:text-[17px] md:leading-relaxed md:line-clamp-[8] lg:text-lg">
          {linkifyText(card.question ?? '')}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-[#1E3A8A]/10 pt-3 dark:border-white/10">
        <span className="inline-flex items-center rounded-full border border-[#1E3A8A]/25 bg-[#1E3A8A]/10 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#1E3A8A] shadow-sm dark:border-[#38BDF8]/30 dark:bg-[#38BDF8]/15 dark:text-[#7DD3FC] md:text-xs">
          {cardNumber}/{total}
        </span>
        <span className="rounded-md bg-[#1E3A8A]/10 px-2 py-0.5 text-[12px] font-medium text-[#1E3A8A] dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] md:text-sm">
          +10 XP
        </span>
      </div>
    </div>
  );
}
