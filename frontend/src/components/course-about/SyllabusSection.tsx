'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SyllabusItem {
  title: string;
  description?: string | null;
}

interface SyllabusSectionProps {
  syllabus: SyllabusItem[];
}

/**
 * Syllabus — accordion: module title + content, smooth expand/collapse.
 */
export function SyllabusSection({ syllabus }: SyllabusSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!syllabus?.length) return null;

  return (
    <section aria-label="Syllabus" className="py-12 lg:py-16">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="mb-6 text-lg font-light tracking-wide text-foreground sm:mb-8 sm:text-xl md:text-2xl"
      >
        Syllabus
      </motion.h2>
      <ul className="space-y-2">
        {syllabus.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-16px' }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.04 }}
              className="overflow-hidden rounded-xl border border-border/60 bg-card/40"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                aria-expanded={isOpen}
                aria-controls={`syllabus-content-${i}`}
                id={`syllabus-trigger-${i}`}
              >
                <span className="text-xs font-medium text-foreground sm:text-sm md:text-base">{item.title}</span>
                <span
                  className="shrink-0 text-muted-foreground transition-transform duration-300"
                  aria-hidden
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`syllabus-content-${i}`}
                    role="region"
                    aria-labelledby={`syllabus-trigger-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/40 px-5 py-4">
                      <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base">
                        {item.description || '—'}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
