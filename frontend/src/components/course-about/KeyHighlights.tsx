'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  Layers,
  MessageSquare,
  PenSquare,
  Sparkles,
  Star,
  StickyNote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KeyHighlightsProps {
  highlights: string[];
  compact?: boolean;
}

/** Maps highlight text (case-insensitive, partial) to a premium icon. */
function getIconForHighlight(text: string): LucideIcon {
  const lower = text.toLowerCase();
  if (lower.includes('complete notes') || lower.includes('notes')) return StickyNote;
  if (lower.includes('daywise') || lower.includes('short answer') || lower.includes('questions')) return MessageSquare;
  if (lower.includes('flash card')) return Layers;
  if (lower.includes('glossary')) return BookOpen;
  if (lower.includes('daily quiz') || lower.includes('quizes') || lower.includes('quizzes')) return FileQuestion;
  if (lower.includes('assignment')) return PenSquare;
  if (lower.includes('recommendation')) return Star;
  if (lower.includes('clipboard') || lower.includes('checklist')) return ClipboardList;
  return CheckCircle2;
}

/**
 * Key highlights — compact card, width fits content (max word length), premium look with meaningful icons per item.
 */
export function KeyHighlights({ highlights, compact }: KeyHighlightsProps) {
  if (!highlights?.length) return null;

  return (
    <section aria-label="Key highlights" className={compact ? 'flex h-full min-h-0 flex-col py-6 lg:py-8' : 'py-12 lg:py-16'}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className={compact ? 'min-h-0 w-full flex-1' : 'w-fit max-w-full'}
      >
        <div className="h-full rounded-2xl border border-border/50 bg-card/80 shadow-xl shadow-black/20 backdrop-blur-sm overflow-hidden ring-1 ring-white/5">
          {/* Accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" aria-hidden />
          <div className={compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'}>
            <div className={compact ? 'mb-4 flex items-center gap-2' : 'mb-5 flex items-center gap-2'}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg md:text-xl">
                Key highlights
              </h2>
            </div>
            <ul className={compact ? 'space-y-2' : 'space-y-2.5 sm:space-y-3'}>
              {highlights.map((text, i) => {
                const Icon = getIconForHighlight(text);
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-16px' }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.04 }}
                    className="flex items-center gap-3 rounded-xl border border-transparent py-2 pr-3 pl-2 transition-all hover:border-border/40 hover:bg-muted/30 sm:gap-3.5 sm:py-2.5 sm:pr-3.5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 sm:h-9 sm:w-9">
                      <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={1.8} />
                    </span>
                    <span className="text-xs font-medium text-foreground sm:text-sm md:text-base">{text}</span>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
