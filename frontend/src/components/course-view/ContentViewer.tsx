'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, ExternalLink, ArrowLeft, ArrowRight, HelpCircle, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { linkifyText, getEmbedUrl } from './resource-display-utils';
import type { DayItem } from './types';
import type { FlashCardItem } from './FlashCardStack';

const FlashCardStack = dynamic(
  () => import('./FlashCardStack').then((m) => ({ default: m.FlashCardStack })),
  { ssr: false }
);

/** Desktop breakpoint: inline flash deck opens in content area instead of new page */
const DESKTOP_BREAKPOINT_PX = 1024;

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT_PX}px)`);
    const set = () => setIsDesktop(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);
  return isDesktop;
}

interface ContentViewerProps {
  courseId: string;
  courseName: string;
  selectedItem: DayItem | null;
  currentItems: DayItem[];
  onSelectItem: (item: DayItem | null) => void;
  selectedDay?: { id: string; dayQuizzes: import('./types').LearnDayQuiz[]; dayFlashCardDecks?: import('./types').LearnDayFlashCardDeck[] };
  selectedDayNumber?: number;
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
    RECOMMENDATION: 'Reference',
    QUIZ: 'Quiz',
  };
  return map[type] ?? type;
}

function ResourceContent({
  item,
  currentItems = [],
  selectedDayNumber,
  dayQuizzesForQuizResource,
  dayFlashCardDecksForFlashCardResource,
  courseId,
  selectedDayId,
  onOpenFlashDeckInline,
}: {
  item: DayItem;
  currentItems?: DayItem[];
  selectedDayNumber?: number;
  dayQuizzesForQuizResource?: import('./types').LearnDayQuiz[];
  dayFlashCardDecksForFlashCardResource?: import('./types').LearnDayFlashCardDeck[];
  courseId?: string;
  selectedDayId?: string;
  /** When set (desktop), "Open Deck" opens inline instead of navigating */
  onOpenFlashDeckInline?: (title: string, cards: FlashCardItem[]) => void;
}) {
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

  // Quiz resource: one "Quiz" item; show all day quizzes from dayQuizzesForQuizResource
  const isQuizResource = item.type === 'resource' && item.resource.type === 'QUIZ';
  const dayQuizzes = dayQuizzesForQuizResource ?? [];
  if (isQuizResource && dayQuizzes.length > 0) {
    const buildQuizUrl = (uniqueUrl: string) => {
      if (courseId && selectedDayId && item.type === 'resource') {
        const base = `/quiz/${uniqueUrl}`;
        const params = new URLSearchParams();
        params.set('returnTo', `/course/${courseId}/learn`);
        params.set('dayId', selectedDayId);
        params.set('resourceId', item.resource.id);
        return `${base}?${params.toString()}`;
      }
      return `/quiz/${uniqueUrl}`;
    };
    const quizUrl = (dq: (typeof dayQuizzes)[0]) => buildQuizUrl(dq.quiz.uniqueUrl);
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {dayQuizzes.map((dq, index) => {
            const q = dq.quiz;
            return (
              <motion.div
                key={dq.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.05 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                <Link
                  href={quizUrl(dq)}
                  className="relative flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-3.5 py-2.5 text-card-foreground shadow-sm ring-1 ring-black/[0.04] transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:ring-primary/20 dark:bg-card/90 dark:ring-white/[0.06] sm:gap-2.5 sm:px-4 sm:py-2.5 md:px-5 md:py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary/25 sm:h-8 sm:w-8">
                    <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-6 sm:pr-7">
                    <span className="truncate text-xs font-semibold text-foreground sm:text-sm">{q.title}</span>
                  </div>
                  <ArrowRight className="absolute right-2.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary sm:right-3 sm:h-4 sm:w-4" strokeWidth={2.5} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }
  if (isQuizResource && dayQuizzes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
        <p className="text-sm">No quizzes attached yet for this day.</p>
      </div>
    );
  }

  if (item.type === 'dayQuiz') {
    const quizItems = currentItems.filter((i): i is typeof item => i.type === 'dayQuiz');
    const quizzes = quizItems.length > 0 ? quizItems : [item];
    const quizResourceItem = currentItems.find((i) => i.type === 'resource' && i.resource.type === 'QUIZ');
    const quizResourceId = quizResourceItem && quizResourceItem.type === 'resource' ? quizResourceItem.resource.id : undefined;
    const buildQuizUrl = (uniqueUrl: string) => {
      if (courseId && selectedDayId && quizResourceId) {
        const base = `/quiz/${uniqueUrl}`;
        const params = new URLSearchParams();
        params.set('returnTo', `/course/${courseId}/learn`);
        params.set('dayId', selectedDayId);
        params.set('resourceId', quizResourceId);
        return `${base}?${params.toString()}`;
      }
      return `/quiz/${uniqueUrl}`;
    };
    const quizUrl = (quizItem: typeof item) => buildQuizUrl(quizItem.dayQuiz.quiz.uniqueUrl);

    return (
      <div className="space-y-3">
        {quizItems.length > 1 && (
          <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">Quizzes for this day</h2>
        )}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {quizzes.map((quizItem, index) => {
            const q = quizItem.dayQuiz.quiz;
            return (
              <motion.div
                key={quizItem.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.05 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                <Link
                  href={quizUrl(quizItem)}
                  className="relative flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-3.5 py-2.5 text-card-foreground shadow-sm ring-1 ring-black/[0.04] transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:ring-primary/20 dark:bg-card/90 dark:ring-white/[0.06] sm:gap-2.5 sm:px-4 sm:py-2.5 md:px-5 md:py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary/25 sm:h-8 sm:w-8">
                    <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-6 sm:pr-7">
                    <span className="truncate text-xs font-semibold text-foreground sm:text-sm">{q.title}</span>
                  </div>
                  <ArrowRight className="absolute right-2.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary sm:right-3 sm:h-4 sm:w-4" strokeWidth={2.5} />
                </Link>
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

  // BRIEF_NOTES: single rich text (blog-style), book-like bordered box for readability
  if (r.type === 'BRIEF_NOTES' && (r.briefNotesContent != null && r.briefNotesContent !== '')) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-medium text-foreground sm:text-lg md:text-xl">{title}</h2>
        <div
          className="text-foreground rich-text-content prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:leading-relaxed rounded-lg border border-amber-200/70 bg-amber-50/30 px-[10px] pb-5 pt-4 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.04)] sm:px-5 dark:border-amber-900/40 dark:bg-slate-900/40 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06),0_1px_2px_rgba(0,0,0,0.2)]"
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

  // FLASH_CARDS: list of decks (like Quiz) with Open -> full-screen viewer; or legacy inline cards
  const isFlashCardResource = r.type === 'FLASH_CARDS';
  const dayFlashCardDecks = dayFlashCardDecksForFlashCardResource ?? [];
  if (isFlashCardResource && dayFlashCardDecks.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {dayFlashCardDecks.map((dfd, index) => {
            const deck = dfd.deck;
            const baseFlashUrl = `/flash/${deck.uniqueUrl}`;
            const returnTo =
              courseId && selectedDayId && item.type === 'resource'
                ? `${baseFlashUrl}?returnTo=${encodeURIComponent(`/course/${courseId}/learn`)}&dayId=${encodeURIComponent(selectedDayId)}&resourceId=${encodeURIComponent(item.resource.id)}`
                : baseFlashUrl;
            const flashUrl = returnTo;
            const chipContent = (
              <>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary/25 sm:h-8 sm:w-8">
                  <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-6 sm:pr-7">
                  <span className="truncate text-xs font-semibold text-foreground sm:text-sm">{deck.title}</span>
                </div>
                <ArrowRight className="absolute right-2.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary sm:right-3 sm:h-4 sm:w-4" strokeWidth={2.5} />
              </>
            );
            return (
              <motion.div
                key={dfd.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.05 }}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group"
              >
                {onOpenFlashDeckInline ? (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenFlashDeckInline(deck.title, (deck.cards ?? []).map((c) => ({ id: c.id, question: c.question, answer: c.answer, order: c.order })))
                    }
                    className="relative flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-3.5 py-2.5 text-left text-card-foreground shadow-sm ring-1 ring-black/[0.04] transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:ring-primary/20 dark:bg-card/90 dark:ring-white/[0.06] sm:gap-2.5 sm:px-4 sm:py-2.5 md:px-5 md:py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {chipContent}
                  </button>
                ) : (
                  <Link
                    href={flashUrl}
                    className="relative flex items-center gap-2 rounded-full border border-border/60 bg-card/95 px-3.5 py-2.5 text-card-foreground shadow-sm ring-1 ring-black/[0.04] transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:ring-primary/20 dark:bg-card/90 dark:ring-white/[0.06] sm:gap-2.5 sm:px-4 sm:py-2.5 md:px-5 md:py-3"
                  >
                    {chipContent}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
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
export function ContentViewer({
  courseId,
  courseName,
  selectedItem,
  currentItems,
  onSelectItem,
  selectedDay,
  selectedDayNumber,
}: ContentViewerProps) {
  const isDesktop = useIsDesktop();
  const [inlineFlashDeck, setInlineFlashDeck] = useState<{ title: string; cards: FlashCardItem[] } | null>(null);

  useEffect(() => {
    setInlineFlashDeck(null);
  }, [selectedItem?.id, selectedItem?.type]);

  const idx = selectedItem ? currentItems.findIndex((i) => i.id === selectedItem.id && i.type === selectedItem.type) : -1;
  const prevItem = idx > 0 ? currentItems[idx - 1] : null;
  const nextItem = idx >= 0 && idx < currentItems.length - 1 ? currentItems[idx + 1] : null;

  const isFlashCardResource = selectedItem?.type === 'resource' && selectedItem.resource.type === 'FLASH_CARDS';
  const showInlineFlashDeck = isDesktop && inlineFlashDeck != null && selectedItem != null;

  return (
    <main
      aria-label="Content"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-lg ring-1 ring-black/5"
    >
      {/* Accent bar */}
      <div className="h-1 w-full shrink-0 rounded-t-2xl bg-gradient-to-r from-primary/50 via-primary to-primary/50" aria-hidden />
      {/* Header: course name + Day chip (updates with user selection) — works on mobile and desktop */}
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/40 bg-card/50 px-6 py-4 sm:gap-3 sm:px-7 sm:py-3.5 md:gap-4 md:px-8 md:py-4 lg:px-9 lg:gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary md:h-10 md:w-10 lg:h-11 lg:w-11">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 lg:h-6 lg:w-6" strokeWidth={1.8} />
        </span>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-foreground sm:text-base md:text-lg lg:text-xl">
          {courseName}
        </h1>
        {selectedDayNumber != null && (
          <span
            className="inline-flex shrink-0 items-center rounded-full bg-[#4169E1] px-2.5 py-0.5 text-xs font-bold tracking-wide text-white shadow-md sm:px-3 sm:py-1 sm:text-sm md:px-3.5 md:py-1 md:text-sm"
            aria-label={`Day ${selectedDayNumber}`}
          >
            Day {selectedDayNumber}
          </span>
        )}
      </header>
      {/* Content area — scrollable on both mobile and desktop; touch momentum on iOS */}
      <div
        className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-5 sm:px-7 sm:py-5 md:px-8 md:py-6 lg:px-10 lg:py-8 ${showInlineFlashDeck ? 'flex flex-col' : ''}`}
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <AnimatePresence mode="wait">
          {showInlineFlashDeck && inlineFlashDeck ? (
            <motion.div
              key="inline-flash-deck"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col"
            >
              <div className="min-h-[min(400px,60vh)] flex flex-1 flex-col">
                <FlashCardStack
                  title={inlineFlashDeck.title}
                  cards={inlineFlashDeck.cards}
                  onBack={() => setInlineFlashDeck(null)}
                  progressBarLeftContent={
                    <button
                      type="button"
                      onClick={() => setInlineFlashDeck(null)}
                      className="hidden md:inline-flex items-center gap-2 rounded-lg border border-slate-500/50 bg-slate-700/40 px-3 py-2 text-sm font-semibold text-slate-200 shadow-sm transition-colors hover:bg-slate-600/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                      aria-label="Back to deck list"
                    >
                      <ArrowLeft className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                      Back
                    </button>
                  }
                />
              </div>
            </motion.div>
          ) : selectedItem ? (
            <motion.div
              key={selectedItem.type + selectedItem.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="mx-auto min-w-0 w-full max-w-3xl"
            >
              <ResourceContent
                item={selectedItem}
                currentItems={currentItems}
                selectedDayNumber={selectedDayNumber}
                dayQuizzesForQuizResource={
                  selectedItem.type === 'resource' && selectedItem.resource.type === 'QUIZ'
                    ? selectedDay?.dayQuizzes
                    : undefined
                }
                dayFlashCardDecksForFlashCardResource={
                  selectedItem.type === 'resource' && selectedItem.resource.type === 'FLASH_CARDS'
                    ? selectedDay?.dayFlashCardDecks
                    : undefined
                }
                courseId={courseId}
                selectedDayId={selectedDay?.id}
                onOpenFlashDeckInline={isDesktop && isFlashCardResource ? (title, cards) => setInlineFlashDeck({ title, cards }) : undefined}
              />
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
