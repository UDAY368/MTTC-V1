'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RotateCcw, ThumbsUp, ThumbsDown, Sparkles, Hand, ChevronRight, ChevronLeft } from 'lucide-react';
import { linkifyText } from './resource-display-utils';

export interface FlashCardItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

const SWIPE_THRESHOLD = 80;

interface FlashCardStackProps {
  title: string;
  cards: FlashCardItem[];
}

export function FlashCardStack({ title, cards }: FlashCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<number>(0);
  const [gotItCount, setGotItCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

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
      } else {
        setReviewCount((c) => c + 1);
      }
      setCurrentIndex((i) => Math.min(i + 1, total));
    },
    [total]
  );

  const goPrev = useCallback(() => {
    setFlippedId(null);
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  const resetStack = useCallback(() => {
    setCurrentIndex(0);
    setFlippedId(null);
    setGotItCount(0);
    setReviewCount(0);
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
      <div className="space-y-4">
        <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">{title}</h2>
        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative w-[30%] min-w-[200px] max-w-[280px] overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5 md:p-6 text-center shadow-xl"
          >
            <div className="flex justify-center mb-2 md:mb-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-primary/20 flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" />
              </motion.div>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1">You did it!</h3>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-3 leading-snug">
              You&apos;ve gone through all {total} cards. Review again to strengthen memory.
            </p>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={resetStack}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:px-4 md:py-2.5 md:text-sm md:gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Study again
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flash-card-container flex flex-col w-full overflow-hidden max-h-[calc(100vh-11rem)] min-h-0 gap-2 md:gap-3"
    >
      {/* Header: title + progress — single compact row */}
      <div className="flex-shrink-0 flex items-center justify-between gap-2 min-h-0 md:gap-3">
        <h2 className="text-sm font-medium text-foreground sm:text-base md:text-lg lg:text-xl truncate">{title}</h2>
        <div className="flex items-center gap-1.5 flex-shrink-0 md:gap-2">
          <span className="text-xs font-medium text-muted-foreground tabular-nums md:text-sm">
            {currentIndex + 1}/{total}
          </span>
          <div className="h-1.5 w-14 sm:w-20 md:h-2 md:w-24 lg:w-28 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={false}
              animate={{ width: `${((currentIndex + 1) / total) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      </div>

      {/* Hint — tap/swipe labels + dynamic Got it / Review counts */}
      <div className="flex-shrink-0 h-10 pt-0.5 pb-0.5 mt-5 mb-5 md:h-14 md:px-4 md:py-3 md:mt-[10px] md:mb-[30px] md:flex md:items-center md:justify-center">
        <div
          className="box-content flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:gap-x-6 md:gap-y-2 md:px-2"
          role="status"
          aria-label="Flash card controls: tap to flip, swipe right for got it, swipe left to review"
        >
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background/80 shadow-sm ring-1 ring-black/5 md:h-8 md:w-8">
              <Hand className="h-3.5 w-3.5 md:h-4 md:w-4 text-foreground/70" aria-hidden />
            </span>
            <span className="font-medium text-foreground/90">Tap to flip</span>
          </span>
          <span className="hidden sm:inline md:hidden text-muted-foreground/50 select-none" aria-hidden>·</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 shadow-sm ring-1 ring-primary/20 md:h-8 md:w-8">
              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" aria-hidden />
            </span>
            <span className="font-medium text-primary">
              Got it <span className="tabular-nums text-primary/90">({gotItCount})</span>
            </span>
          </span>
          <span className="hidden sm:inline md:hidden text-muted-foreground/50 select-none" aria-hidden>·</span>
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/15 shadow-sm ring-1 ring-amber-500/20 md:h-8 md:w-8">
              <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600 dark:text-amber-400" aria-hidden />
            </span>
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Review <span className="tabular-nums text-amber-600/90 dark:text-amber-400/90">({reviewCount})</span>
            </span>
          </span>
        </div>
      </div>

      {/* Card stack — flex-1 so it fills remaining space, no internal scroll; desktop padding to avoid overlap */}
      <div className="relative w-full flex-1 min-h-[180px] touch-none select-none flex items-center justify-center md:py-4 md:px-2">
        {/* Deck behind — stacked card look with gradient and depth */}
        {cards.slice(currentIndex + 1, currentIndex + 3).map((card, stackIndex) => (
          <motion.div
            key={card.id}
            className="absolute inset-0 flex items-center justify-center px-2"
            style={{
              zIndex: 10 - stackIndex,
              scale: 1 - (stackIndex + 1) * 0.04,
              top: (stackIndex + 1) * 8,
              opacity: 1 - (stackIndex + 1) * 0.12,
            }}
          >
            <div
              className="w-full max-w-md h-[200px] sm:h-[220px] md:h-[240px] lg:h-[260px] rounded-xl border border-border/80 bg-gradient-to-br from-card via-muted/30 to-muted/50 shadow-lg"
              style={{
                boxShadow: `0 ${4 + stackIndex * 6}px ${12 + stackIndex * 8}px -4px rgba(0,0,0,0.15), 0 ${2 + stackIndex * 4}px ${4 + stackIndex * 4}px -2px rgba(0,0,0,0.08)`,
              }}
            />
          </motion.div>
        ))}

        <AnimatePresence initial={false} mode="wait">
          {currentCard && (
            <SwipeableCard
              key={currentCard.id}
              card={currentCard}
              isFlipped={flippedId === currentCard.id}
              onFlip={() => handleFlip(currentCard.id)}
              onSwipe={goNext}
              exitDirection={exitDirection}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom row: pushed down to sit just above footer — Review / Got it + Previous */}
      <div className="flex-shrink-0 mt-[10px] flex flex-col items-center gap-2 pt-[5px] md:gap-3 md:pt-3 md:pb-4 md:px-4 md:mt-[50px] md:mb-[50px]">
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => currentCard && goNext(-1)}
            disabled={!currentCard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-2.5 md:text-sm md:gap-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs font-medium"
            aria-label="Review again"
          >
            <ThumbsDown className="w-4 h-4 flex-shrink-0 md:w-5 md:h-5" />
            <span>Review</span>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => currentCard && goNext(1)}
            disabled={!currentCard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 sm:px-4 sm:py-2 md:px-5 md:py-2.5 md:text-sm md:gap-2 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs font-medium"
            aria-label="Got it"
          >
            <ThumbsUp className="w-4 h-4 flex-shrink-0 md:w-5 md:h-5" />
            <span>Got it</span>
          </motion.button>
        </div>
        {hasPrev && (
          <button
            type="button"
            onClick={goPrev}
            className="text-[10px] sm:text-xs md:text-sm text-muted-foreground hover:text-foreground underline underline-offset-1"
          >
            ← Previous
          </button>
        )}
      </div>
    </div>
  );
}

interface SwipeableCardProps {
  card: FlashCardItem;
  isFlipped: boolean;
  onFlip: () => void;
  onSwipe: (direction: 1 | -1) => void;
  exitDirection: number;
}

function SwipeableCard({
  card,
  isFlipped,
  onFlip,
  onSwipe,
  exitDirection,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacityRight = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const opacityLeft = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    // Only treat as swipe when drag/velocity past threshold (flip is handled by click/tap)
    if (offset > SWIPE_THRESHOLD || velocity > 400) {
      onSwipe(1);
      return;
    }
    if (offset < -SWIPE_THRESHOLD || velocity < -400) {
      onSwipe(-1);
      return;
    }
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-2"
      style={{ zIndex: 20 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{
        x: exitDirection * 400,
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.25 },
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: -220, right: 220 }}
        dragElastic={0.4}
        style={{ x, rotate }}
        onDragEnd={handleDragEnd}
        className="w-full max-w-md cursor-grab active:cursor-grabbing"
        whileTap={{ scale: 1.02 }}
      >
        <motion.div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onFlip();
            }
          }}
          className="relative w-full h-[192px] sm:h-[220px] md:h-[240px] lg:h-[260px] rounded-xl border-2 border-primary/20 bg-card shadow-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ring-2 ring-primary/10"
          style={{
            perspective: 1000,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05), 0 0 40px -10px hsl(var(--primary) / 0.25)',
          }}
        >
          {/* Swipe hint overlays */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none flex items-center justify-end pr-4 md:pr-6 bg-primary/10"
            style={{ opacity: opacityRight, zIndex: 5 }}
          >
            <span className="text-primary font-bold text-sm md:text-base">Got it!</span>
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-amber-500 pointer-events-none flex items-center justify-start pl-4 md:pl-6 bg-amber-500/10"
            style={{ opacity: opacityLeft, zIndex: 5 }}
          >
            <span className="text-amber-600 dark:text-amber-400 font-bold text-sm md:text-base">Review</span>
          </motion.div>

          {/* Flip container — fills card so height scales with md/lg */}
          <motion.div
            className="absolute inset-0 w-full h-full"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front: Question — gradient highlight, no scroll, line-clamp */}
            <div
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 md:p-5 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/20 dark:from-card dark:via-background/95 dark:to-primary/15"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              <span className="text-xs md:text-sm font-medium text-primary uppercase tracking-wide mb-3">Question</span>
              <div className="text-foreground text-center text-sm sm:text-base md:text-lg font-medium leading-snug line-clamp-4 px-1">
                {linkifyText(card.question ?? '')}
              </div>
              <p className="mt-2 text-[10px] md:text-xs text-muted-foreground">Tap to reveal</p>
            </div>

            {/* Back: Answer — gradient highlight, no scroll, line-clamp */}
            <div
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 md:p-5 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/20 dark:from-primary/15 dark:via-primary/10 dark:to-primary/25"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <span className="text-[10px] md:text-xs font-medium text-primary uppercase tracking-wide mb-1">Answer</span>
              <div className="text-foreground text-center text-xs sm:text-sm md:text-base leading-snug line-clamp-4 px-1">
                {linkifyText(card.answer ?? '')}
              </div>
              <p className="mt-2 text-[10px] md:text-xs text-muted-foreground">Tap for question</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
