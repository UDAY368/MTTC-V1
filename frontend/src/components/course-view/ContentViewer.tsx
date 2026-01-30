'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { linkifyText, getEmbedUrl } from './resource-display-utils';
import type { DayItem } from './types';

const FlashCardStack = dynamic(
  () => import('./FlashCardStack').then((m) => ({ default: m.FlashCardStack })),
  { ssr: false }
);

interface ContentViewerProps {
  courseName: string;
  selectedItem: DayItem | null;
  currentItems: DayItem[];
  onSelectItem: (item: DayItem | null) => void;
}

function ResourceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    VIDEO: 'Video',
    NOTES: 'Key Points',
    BRIEF_NOTES: 'Brief Notes',
    FLASH_CARDS: 'Flash Cards',
    SHORT_QUESTIONS: 'Short Questions',
    ASSIGNMENT: 'Assignment',
    GLOSSARY: 'Glossary',
    RECOMMENDATION: 'Recommendation',
  };
  return map[type] ?? type;
}

function ResourceContent({ item, currentItems = [] }: { item: DayItem; currentItems?: DayItem[] }) {
  const [collapsedNotes, setCollapsedNotes] = useState<Set<string>>(new Set());
  const [collapsedShort, setCollapsedShort] = useState<Set<string>>(new Set());
  const [collapsedRec, setCollapsedRec] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (item.type === 'resource') {
      const r = item.resource;
      if (r.type === 'NOTES' && r.noteParagraphs?.length) {
        setCollapsedNotes(new Set(r.noteParagraphs.slice(1).map((p) => p.id)));
      } else {
        setCollapsedNotes(new Set());
      }
      if (r.type === 'SHORT_QUESTIONS' && r.shortQuestions?.length) {
        setCollapsedShort(new Set(r.shortQuestions.slice(1).map((q) => q.id)));
      } else {
        setCollapsedShort(new Set());
      }
      if (r.type === 'RECOMMENDATION' && r.recommendations?.length) {
        setCollapsedRec(new Set(r.recommendations.slice(1).map((rec) => rec.id)));
      } else {
        setCollapsedRec(new Set());
      }
    }
  }, [item]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (item.type === 'dayQuiz') {
    const quizItems = currentItems.filter((i): i is typeof item => i.type === 'dayQuiz');
    const quizzes = quizItems.length > 0 ? quizItems : [item];

    return (
      <div className="space-y-4">
        {quizItems.length > 1 && (
          <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">Quizzes for this day</h2>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quizItem, index) => {
            const q = quizItem.dayQuiz.quiz;
            return (
              <motion.div
                key={quizItem.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.06 }}
                className="group"
              >
                <Card className="h-full overflow-hidden border-border/60 bg-card shadow-md transition-all duration-300 hover:shadow-lg hover:border-primary/20 dark:bg-card/95">
                  <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
                    <div className="flex flex-1 flex-col gap-2">
                      <h3 className="text-sm font-semibold leading-tight text-foreground sm:text-base md:text-lg">
                        {q.title}
                      </h3>
                      <p className="text-xs text-muted-foreground sm:text-sm">Quiz for this day.</p>
                    </div>
                    <Link
                      href={`/quiz/${q.uniqueUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
                    >
                      Open Quiz
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  const r = item.resource;
  const title = r.title || ResourceTypeLabel(r.type);

  if (r.type === 'VIDEO') {
    const videoUrl = (r.videoUrl ?? '').toString().trim();
    const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
    const isDirectVideo = !!videoUrl && !embedUrl && /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(videoUrl);
    return (
      <div className="min-w-0 w-full max-w-full space-y-4">
        <h2 className="text-sm font-semibold leading-snug text-foreground break-words sm:text-base md:text-lg lg:text-xl">
          {title}
        </h2>
        <div
          className="relative w-full max-w-full min-h-[180px] bg-black rounded-xl overflow-hidden shadow-2xl border border-border sm:min-h-[220px] md:min-h-[280px]"
          style={{ aspectRatio: '16/9' }}
        >
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full min-w-0 min-h-0 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={title ? `Video: ${title}` : 'Video preview'}
            />
          ) : isDirectVideo ? (
            <video
              src={videoUrl}
              controls
              playsInline
              className="absolute inset-0 w-full h-full min-w-0 min-h-0 object-contain"
            >
              Your browser does not support the video tag.
            </video>
          ) : videoUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-muted">
              <p className="text-muted-foreground text-center mb-2">
                Use a YouTube, Vimeo, or direct video link (e.g. .mp4).
              </p>
              <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm break-all">
                {videoUrl}
              </a>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-muted">
              <p className="text-muted-foreground text-center">No video URL set.</p>
            </div>
          )}
        </div>
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted hover:border-primary/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            Open video in new tab
          </a>
        )}
      </div>
    );
  }

  // BRIEF_NOTES: single rich text (blog-style)
  if (r.type === 'BRIEF_NOTES' && (r.briefNotesContent != null && r.briefNotesContent !== '')) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">{title}</h2>
        <div
          className="text-foreground rich-text-content prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: r.briefNotesContent }}
        />
      </div>
    );
  }

  // Legacy BRIEF_NOTES (noteParagraphs) or NOTES: paragraph list
  if ((r.type === 'NOTES' || r.type === 'BRIEF_NOTES') && r.noteParagraphs?.length) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">{title}</h2>
        {r.noteParagraphs.map((para, index) => {
          const isCollapsed = collapsedNotes.has(para.id);
          const displayHeading = para.heading || `Paragraph ${index + 1}`;
          return (
            <Card key={para.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
              <div className="p-0">
                <button
                  type="button"
                  onClick={() => toggle(setCollapsedNotes, para.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-muted-foreground">
                      {isCollapsed ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      )}
                    </span>
                    <h3 className="text-base font-semibold text-foreground flex-1 sm:text-lg md:text-xl">{displayHeading}</h3>
                  </div>
                </button>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 pb-4 pt-2"
                  >
                    <div
                      className="text-foreground rich-text-content prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: para.content || '' }}
                    />
                  </motion.div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  if (r.type === 'FLASH_CARDS' && r.flashCards?.length) {
    return (
      <FlashCardStack
        title={title}
        cards={r.flashCards}
      />
    );
  }

  if (r.type === 'SHORT_QUESTIONS') {
    const questions = r.shortQuestions?.length
      ? r.shortQuestions
      : r.question != null
        ? [{ id: r.id, question: r.question, answer: r.answer ?? '' }]
        : [];
    if (questions.length) {
      return (
        <div className="space-y-3">
          <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">{title}</h2>
          {questions.map((qa, index) => {
            const isCollapsed = collapsedShort.has(qa.id);
            return (
              <Card key={qa.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                <div className="p-0">
                  <button
                    type="button"
                    onClick={() => toggle(setCollapsedShort, qa.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg text-left"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-muted-foreground">
                        {isCollapsed ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        )}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-xs text-primary mb-1 sm:text-sm md:text-base">Question {index + 1}</div>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 sm:text-base md:text-lg">{qa.question}</h3>
                      </div>
                    </div>
                  </button>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 pb-4 pt-2"
                    >
                      <div className="pl-8 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground sm:text-sm md:text-base">Answer:</div>
                        <div className="text-foreground whitespace-pre-wrap">{linkifyText(qa.answer)}</div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      );
    }
  }

  if (r.type === 'ASSIGNMENT') {
    const questions = r.assignmentQuestions?.length
      ? r.assignmentQuestions
      : r.assignmentQuestion != null
        ? [{ id: r.id, question: r.assignmentQuestion, answer: '' }]
        : [];
    if (questions.length) {
      return (
        <div className="space-y-4">
          <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">{title}</h2>
          {questions.map((aq, index) => (
            <Card key={aq.id} className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-card to-card/95">
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="font-bold text-sm text-primary uppercase tracking-wide">Assignment Question {index + 1}</div>
                  </div>
                  <div className="pl-10">
                    <p className="text-foreground whitespace-pre-wrap font-semibold text-base leading-relaxed">{linkifyText(aq.question)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
  }

  if (r.type === 'GLOSSARY' && r.glossaryWords?.length) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">{title}</h2>
        <Card className="shadow-lg border-2 border-primary/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary/10 border-b-2 border-primary/20">
                    <th className="px-6 py-4 text-left text-sm font-bold text-primary uppercase tracking-wide">Word</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-primary uppercase tracking-wide">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {r.glossaryWords.map((gw, index) => (
                    <tr
                      key={gw.id}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-base text-foreground">{gw.word}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{linkifyText(gw.meaning)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (r.type === 'RECOMMENDATION' && r.recommendations?.length) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">{title}</h2>
        {r.recommendations.map((rec, index) => {
          const isCollapsed = collapsedRec.has(rec.id);
          return (
            <Card key={rec.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
              <div className="p-0">
                <button
                  type="button"
                  onClick={() => toggle(setCollapsedRec, rec.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-muted-foreground">
                      {isCollapsed ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                      )}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-primary mb-1">Recommendation {index + 1}</div>
                      <h3 className="text-base font-semibold text-foreground line-clamp-2">{rec.title}</h3>
                    </div>
                  </div>
                </button>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-4 pb-4 pt-2"
                  >
                    <div className="pl-8 space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Content:</div>
                      <div className="text-foreground whitespace-pre-wrap">{linkifyText(rec.content)}</div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      <p className="text-xs text-muted-foreground sm:text-sm md:text-base">No content to display.</p>
    </div>
  );
}

/**
 * Center panel — selected resource content; clear layout that does not overlap sidebars; premium look.
 */
export function ContentViewer({ courseName, selectedItem, currentItems, onSelectItem }: ContentViewerProps) {
  const idx = selectedItem ? currentItems.findIndex((i) => i.id === selectedItem.id && i.type === selectedItem.type) : -1;
  const prevItem = idx > 0 ? currentItems[idx - 1] : null;
  const nextItem = idx >= 0 && idx < currentItems.length - 1 ? currentItems[idx + 1] : null;

  return (
    <main
      aria-label="Content"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-lg ring-1 ring-black/5"
    >
      {/* Accent bar */}
      <div className="h-1 w-full shrink-0 rounded-t-2xl bg-gradient-to-r from-primary/50 via-primary to-primary/50" aria-hidden />
      {/* Header: course name — extra padding on mobile for visibility */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border/40 bg-card/50 px-6 py-4 sm:px-7 sm:py-3.5 md:px-8 md:py-4 md:gap-4 lg:px-9 lg:gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary md:h-10 md:w-10 lg:h-11 lg:w-11">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6" strokeWidth={1.8} />
        </span>
        <h1 className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground sm:text-base md:text-lg lg:text-xl">
          {courseName}
        </h1>
      </header>
      {/* Content area — scrollable on both mobile and desktop; touch momentum on iOS */}
      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 sm:px-7 sm:py-5 md:px-8 md:py-6 lg:px-10 lg:py-8"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <AnimatePresence mode="wait">
          {selectedItem ? (
            <motion.div
              key={selectedItem.type + selectedItem.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="mx-auto min-w-0 w-full max-w-3xl"
            >
              <ResourceContent item={selectedItem} currentItems={currentItems} />
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground sm:text-base"
            >
              Select a day from the left, then choose a resource or quiz from the right.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      {/* Footer: prev/next — compact, centered */}
      {(prevItem || nextItem) && (
        <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-border/40 bg-card/50 px-4 py-2.5 sm:px-5 sm:py-2.5 md:px-6 md:py-3 md:gap-4">
          <button
            type="button"
            onClick={() => prevItem && onSelectItem(prevItem)}
            disabled={!prevItem}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted/60 hover:border-primary/30 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:px-3 sm:py-1.5 md:px-5 md:py-2.5 md:text-base md:gap-2"
          >
            <ChevronLeft className="h-3.5 w-3.5 shrink-0 md:h-5 md:w-5" strokeWidth={2} />
            Previous
          </button>
          <button
            type="button"
            onClick={() => nextItem && onSelectItem(nextItem)}
            disabled={!nextItem}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-muted/60 hover:border-primary/30 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:px-3 sm:py-1.5 md:px-5 md:py-2.5 md:text-base md:gap-2"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5 shrink-0 md:h-5 md:w-5" strokeWidth={2} />
          </button>
        </footer>
      )}
    </main>
  );
}
