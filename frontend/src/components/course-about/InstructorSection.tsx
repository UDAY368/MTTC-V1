'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ramuMasterImage from '@/assets/Ramu_Master_New.png';

interface InstructorSectionProps {
  instructorName?: string;
  aboutInstructor?: string;
  compact?: boolean;
}

const HIGHLIGHT_PHRASES = [
  'Pyramid Spiritual Society Movement (PSSM)',
  'Mind Programming, Karma Siddhantam, and Manifestation',
  'Subhash Patriji',
  'NLightTV',
];

/** Splits text into segments and wraps matching phrases in highlighted spans. Preserves original casing. */
function highlightPhrases(text: string): React.ReactNode {
  if (!text) return text;
  const phraseMatches: { start: number; end: number; snippet: string }[] = [];
  for (const phrase of HIGHLIGHT_PHRASES) {
    let pos = 0;
    const lower = text.toLowerCase();
    const needle = phrase.toLowerCase();
    while (pos < text.length) {
      const i = lower.indexOf(needle, pos);
      if (i === -1) break;
      phraseMatches.push({ start: i, end: i + phrase.length, snippet: text.slice(i, i + phrase.length) });
      pos = i + 1;
    }
  }
  phraseMatches.sort((a, b) => a.start - b.start);
  const nonOverlapping: typeof phraseMatches = [];
  for (const m of phraseMatches) {
    if (nonOverlapping.length && m.start < nonOverlapping[nonOverlapping.length - 1].end) continue;
    nonOverlapping.push(m);
  }
  const parts: React.ReactNode[] = [];
  let idx = 0;
  for (const m of nonOverlapping) {
    if (idx < m.start) parts.push(text.slice(idx, m.start));
    parts.push(
      <span key={`${m.start}-${m.end}`} className="font-semibold text-primary">
        {m.snippet}
      </span>
    );
    idx = m.end;
  }
  if (idx < text.length) parts.push(text.slice(idx));
  return <>{parts}</>;
}

/**
 * Instructor — single-column card: heading, circular photo, name, about.
 * Optional compact for side-by-side layout (less spacing, smaller photo).
 */
export function InstructorSection({ instructorName, aboutInstructor, compact }: InstructorSectionProps) {
  const name = instructorName || 'Instructor';
  const about =
    aboutInstructor ||
    'Our lead instructor guides this program with depth and presence, supporting your journey into meditation and teaching.';

  return (
    <section aria-label="Instructor" className={compact ? 'flex h-full min-h-0 flex-col py-6 lg:py-8' : 'py-12 lg:py-16'}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className={compact ? 'min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-xl shadow-black/20 backdrop-blur-sm ring-1 ring-white/5' : 'overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-xl shadow-black/20 backdrop-blur-sm ring-1 ring-white/5'}
      >
        <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" aria-hidden />
        <div
          className={
            compact
              ? 'flex flex-col items-center px-4 pb-4 pt-4 sm:px-5 sm:pt-5'
              : 'flex flex-col items-center px-6 pb-6 pt-6 sm:px-8 sm:pt-8'
          }
        >
          <h2
            className={
              compact 
                ? 'mb-4 text-base font-semibold tracking-tight text-foreground sm:text-lg md:text-xl text-center' 
                : 'mb-6 text-lg font-semibold tracking-tight text-foreground sm:text-xl md:text-2xl text-center'
            }
          >
            About Instructor
          </h2>
          {/* Circular photo — padding on top, image shifted down in frame */}
          <div className={`relative mb-4 pt-4 sm:pt-5 md:pt-6 ${compact ? '' : 'mb-6'}`}>
            <div
              className="absolute -inset-2 rounded-full opacity-25 blur-xl"
              style={{ background: 'radial-gradient(circle, hsl(142,76%,36%) 25%, transparent 65%)' }}
              aria-hidden
            />
            <div
              className={
                compact
                  ? 'relative overflow-hidden rounded-full border border-white/10 bg-card/80 shadow-2xl shadow-black/25 ring-2 ring-primary/20 ring-offset-2 ring-offset-card h-32 w-32 sm:h-36 sm:w-36 md:h-40 md:w-40'
                  : 'relative overflow-hidden rounded-full border border-white/10 bg-card/80 shadow-2xl shadow-black/25 ring-2 ring-primary/20 ring-offset-2 ring-offset-card h-36 w-36 sm:h-40 sm:w-40 md:h-44 md:w-44'
              }
            >
              <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/5 pointer-events-none" aria-hidden />
              <Image
                src={ramuMasterImage}
                alt={name}
                className="h-full w-full object-cover"
                style={{ objectPosition: 'center 22%', transform: 'scale(1.4)' }}
                width={compact ? 160 : 176}
                height={compact ? 160 : 176}
                unoptimized
              />
            </div>
          </div>
          <h3 className={`${compact ? 'mb-2 text-sm font-semibold text-foreground sm:text-base md:text-lg' : 'mb-3 text-base font-semibold text-foreground sm:text-lg md:text-xl'} text-center`}>
            {name}
          </h3>
          <p
            className={
              compact
                ? 'max-w-full text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base text-left'
                : 'max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg text-left'
            }
          >
            {highlightPhrases(about)}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
