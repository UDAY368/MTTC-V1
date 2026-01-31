'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { FlashCard, FlashCardProgress } from '@/components/flashcard';

export interface FlashCardItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface FlashCardStackProps {
  title: string;
  cards: FlashCardItem[];
  /** Optional content at the left of the progress bar (e.g. Back to deck list, desktop inline only) */
  progressBarLeftContent?: React.ReactNode;
}

export function FlashCardStack({ title, cards, progressBarLeftContent }: FlashCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<number>(0);
  const [gotItCount, setGotItCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  const currentCard = cards[currentIndex];
  const total = cards.length;
  const isComplete = total > 0 && currentIndex >= total;
  const hasNext = currentIndex < total - 1;
  const hasPrev = currentIndex > 0;

  const goNext = useCallback(
    (direction: 1 | -1) => {
      setFlippedId(null);
      setExitDirection(direction);
      if (direction === 1) {
        setGotItCount((c) => c + 1);
        setXp((x) => x + 10);
        setStreak((s) => s + 1);
      } else {
        setReviewCount((c) => c + 1);
        setStreak(0);
      }
      setCurrentIndex((i) => Math.min(i + 1, total));
    },
    [total]
  );

  const goPrev = useCallback(() => {
    setFlippedId(null);
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToNextCard = useCallback(() => {
    setFlippedId(null);
    setCurrentIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const resetStack = useCallback(() => {
    setCurrentIndex(0);
    setFlippedId(null);
    setGotItCount(0);
    setReviewCount(0);
    setXp(0);
    setStreak(0);
  }, []);

  const handleFlip = useCallback(
    (cardId: string) => {
      setFlippedId((id) => (id === cardId ? null : cardId));
    },
    []
  );

  if (cards.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">{title}</h2>
        <p className="text-muted-foreground text-sm">No flash cards to display.</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="relative w-full max-w-[320px] overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 p-6 text-center shadow-lg shadow-blue-900/25 sm:p-8 md:max-w-[360px] md:p-8"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 20 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-400/40 sm:h-16 sm:w-16"
            >
              <Sparkles className="h-7 w-7 text-amber-400 sm:h-8 sm:w-8" />
            </motion.div>
          </div>
          <h3 className="mb-2 text-lg font-bold text-white sm:text-xl md:text-2xl">You did it!</h3>
          <p className="mb-5 text-sm leading-snug text-slate-300 sm:text-base">
            You&apos;ve gone through all {total} cards. Review again to strengthen memory.
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetStack}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-500/25 px-4 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 sm:px-5 sm:py-3 sm:text-base"
          >
            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
            Study again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="flash-card-container flex flex-col w-full overflow-hidden min-h-0 gap-2 md:gap-3 flex-1 max-h-full md:flex-none md:max-h-[calc(100vh-11rem)]"
    >
      {/* Progress: XP, streak, card position (2/10), Got it, Review, ring — single bar; optional leftContent (desktop inline Back) */}
      <FlashCardProgress
        xp={xp}
        streak={streak}
        currentIndex={currentIndex}
        total={total}
        gotItCount={gotItCount}
        reviewCount={reviewCount}
        leftContent={progressBarLeftContent}
      />

      {/* Card stack — flex row: [Left arrow] [Card] [Right arrow] so arrows sit beside card */}
      <div className="relative w-full flex-1 min-h-[260px] touch-none select-none flex items-center justify-center gap-2 py-1 md:py-4 md:gap-3 md:px-2">
        {/* Left arrow — previous card; in flow beside card, vertically centered */}
        <motion.button
          type="button"
          onClick={goPrev}
          disabled={!hasPrev}
          whileHover={hasPrev ? { scale: 1.12, x: -3 } : {}}
          whileTap={hasPrev ? { scale: 0.92 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex-shrink-0 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A]/95 text-white shadow-lg ring-2 ring-white/20 backdrop-blur-md transition-colors hover:bg-[#1E3A8A] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] disabled:pointer-events-none disabled:opacity-30 sm:h-12 sm:w-12 md:h-14 md:w-14"
          aria-label="Previous card"
        >
          <motion.div
            animate={hasPrev ? { x: [0, -2, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <ChevronLeft className="h-4 w-4 sm:h-7 sm:w-7 md:h-8 md:w-8" strokeWidth={2.5} />
          </motion.div>
        </motion.button>

        {/* Center: deck behind + current card (same DOM path as card container) */}
        <div className="relative flex-1 min-w-0 flex items-center justify-center px-1 md:px-2 self-stretch min-h-[260px]">
          {/* Deck behind — stacked card look */}
          {cards.slice(currentIndex + 1, currentIndex + 3).map((card, stackIndex) => (
            <motion.div
              key={card.id}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                zIndex: 10 - stackIndex,
                scale: 1 - (stackIndex + 1) * 0.04,
                top: (stackIndex + 1) * 8,
                opacity: 1 - (stackIndex + 1) * 0.12,
              }}
            >
              <div
                className="w-full max-w-[328px] sm:max-w-[360px] md:max-w-[420px] h-[260px] sm:h-[280px] md:h-[280px] rounded-[20px] sm:rounded-[22px] md:rounded-[24px] border border-border/80 bg-gradient-to-br from-card via-muted/30 to-muted/50 shadow-lg"
                style={{
                  boxShadow: `0 ${4 + stackIndex * 6}px ${12 + stackIndex * 8}px -4px rgba(0,0,0,0.15), 0 ${2 + stackIndex * 4}px ${4 + stackIndex * 4}px -2px rgba(0,0,0,0.08)`,
                }}
              />
            </motion.div>
          ))}

          <AnimatePresence initial={false} mode="wait">
            {currentCard && (
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ zIndex: 20 }}
              >
                <FlashCard
                  card={currentCard}
                  cardNumber={currentIndex + 1}
                  total={total}
                  isFlipped={flippedId === currentCard.id}
                  onFlip={() => handleFlip(currentCard.id)}
                  onGotIt={() => goNext(1)}
                  onReview={() => goNext(-1)}
                  disabled={!currentCard}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right arrow — next card; in flow beside card, vertically centered */}
        <motion.button
          type="button"
          onClick={goToNextCard}
          disabled={currentIndex >= total - 1}
          whileHover={currentIndex < total - 1 ? { scale: 1.12, x: 3 } : {}}
          whileTap={currentIndex < total - 1 ? { scale: 0.92 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex-shrink-0 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-[#0F172A]/95 text-white shadow-lg ring-2 ring-white/20 backdrop-blur-md transition-colors hover:bg-[#1E3A8A] hover:shadow-[0_0_20px_rgba(59,130,246,0.35)] disabled:pointer-events-none disabled:opacity-30 sm:h-12 sm:w-12 md:h-14 md:w-14"
          aria-label="Next card"
        >
          <motion.div
            animate={currentIndex < total - 1 ? { x: [0, 2, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <ChevronRight className="h-4 w-4 sm:h-7 sm:w-7 md:h-8 md:w-8" strokeWidth={2.5} />
          </motion.div>
        </motion.button>
      </div>

    </div>
  );
}

