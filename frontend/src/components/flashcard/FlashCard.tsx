'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FlashCardFront } from './FlashCardFront';
import { FlashCardBack } from './FlashCardBack';
import type { FlashCardData } from './flashcard.types';

const FLIP_EASING = [0.4, 0.2, 0.2, 1] as const;
const PERSPECTIVE = 1200;

interface FlashCardProps {
  card: FlashCardData;
  cardNumber: number;
  total: number;
  isFlipped: boolean;
  onFlip: () => void;
  onGotIt: () => void;
  onReview: () => void;
  disabled?: boolean;
}

export function FlashCard({
  card,
  cardNumber,
  total,
  isFlipped,
  onFlip,
  onGotIt,
  onReview,
  disabled,
}: FlashCardProps) {
  return (
    <motion.div
      className="w-full max-w-[328px] sm:max-w-[360px] md:max-w-[420px] cursor-pointer select-none"
      style={{ perspective: PERSPECTIVE }}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'tween', duration: 0.2 }}
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
        className="relative h-[260px] w-full sm:h-[280px] sm:rounded-[22px] md:h-[280px] md:rounded-[24px] rounded-[20px]"
        style={{ transformStyle: 'preserve-3d', perspective: PERSPECTIVE }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.6,
          ease: FLIP_EASING,
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <FlashCardFront card={card} cardNumber={cardNumber} total={total} />
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <FlashCardBack
            card={card}
            onGotIt={onGotIt}
            onReview={onReview}
            disabled={disabled}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
