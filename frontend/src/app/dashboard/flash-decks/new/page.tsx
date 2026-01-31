'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Plus, Trash2, CheckCircle2, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface Course {
  id: string;
  name: string;
}

export default function NewFlashDeckPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayIdFromQuery = searchParams.get('dayId') ?? '';
  const courseIdFromQuery = searchParams.get('courseId') ?? '';

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState(courseIdFromQuery);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<Array<{ question: string; answer: string }>>([
    { question: '', answer: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [collapsedCards, setCollapsedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data.data || []);
      } catch {
        setCourses([]);
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (courseIdFromQuery && !courseId) setCourseId(courseIdFromQuery);
  }, [courseIdFromQuery, courseId]);

  const addCard = () => {
    setCards([...cards, { question: '', answer: '' }]);
  };

  const removeCard = (index: number) => {
    if (cards.length <= 1) return;
    setCollapsedCards((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
    setCards(cards.filter((_, i) => i !== index));
  };

  const toggleCardCollapse = (index: number) => {
    setCollapsedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const updateCard = (index: number, field: 'question' | 'answer', value: string) => {
    const next = [...cards];
    next[index] = { ...next[index], [field]: value };
    setCards(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!courseId || !title.trim()) {
      setError('Course and deck title are required.');
      return;
    }
    const validCards = cards.filter((c) => c.question.trim() || c.answer.trim());
    if (validCards.length === 0) {
      setError('Add at least one card with question or answer.');
      return;
    }

    setLoading(true);
    try {
      const deckRes = await api.post('/flash-decks', {
        courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        cards: validCards.map((c) => ({
          question: c.question.trim() || 'Question',
          answer: c.answer.trim() || 'Answer',
        })),
      });
      const deckId = deckRes.data.data.id;

      if (dayIdFromQuery) {
        await api.post('/day-flash-decks', { dayId: dayIdFromQuery, deckId });
      }

      setShowSuccess(true);
      setLoading(false);

      const redirectUrl =
        dayIdFromQuery && courseId
          ? `/dashboard/courses/${courseId}/days/${dayIdFromQuery}/resources/new?type=FLASH_CARDS`
          : '/dashboard/courses';
      setTimeout(() => router.push(redirectUrl), 1500);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e.response?.status;
      const msg = e.response?.data?.message;
      if (status === 404 || msg?.toLowerCase().includes('not found')) {
        setError('Flash decks API is not available. Deploy the latest backend to Railway and run database migrations (see backend/DEPLOYMENT_FLASH_DECKS.md).');
      } else {
        setError(msg || 'Failed to create deck');
      }
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const fromDayContext = Boolean(dayIdFromQuery && courseIdFromQuery);
  const backUrl =
    fromDayContext && courseId
      ? `/dashboard/courses/${courseId}/days/${dayIdFromQuery}/resources/new?type=FLASH_CARDS`
      : '/dashboard/courses';

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={backUrl}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>

      {fromDayContext && (
        <p className="text-sm text-muted-foreground -mt-2">
          This deck will be added to the current day&apos;s Flash Card resource.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Deck Details
              </CardTitle>
              <CardDescription>
                Title and optional description for this flash card deck
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <select
                  id="course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                  disabled={loading || fromDayContext}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fromDayContext && (
                  <p className="text-xs text-muted-foreground">Course is set from the day you&apos;re adding this deck to.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Deck Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Day 1 Key Terms"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <CardTitle>Cards</CardTitle>
              <CardDescription>
                Add question/answer pairs. Front of card = question, back = answer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cards.map((card, index) => {
                const isCollapsed = collapsedCards.has(index);
                const preview = card.question.trim() || card.answer.trim() || 'Empty card';
                const previewText = (card.question.trim() || card.answer.trim() || 'Empty card').slice(0, 48);
                return (
                  <motion.div
                    key={index}
                    layout
                    initial={false}
                    className="rounded-xl border-2 border-border/80 bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => toggleCardCollapse(index)}
                        className="flex-1 flex items-center gap-3 min-w-0 text-left hover:bg-muted/40 rounded-lg transition-colors -m-2 p-2"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-foreground block truncate">
                            Card {index + 1}
                          </span>
                          <span className="text-xs text-muted-foreground block truncate">
                            {previewText}{preview.length > 48 ? '…' : ''}
                          </span>
                        </div>
                        {isCollapsed ? (
                          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCard(index)}
                        disabled={loading || cards.length <= 1}
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                          className="overflow-hidden border-t border-border/60"
                        >
                          <div className="p-4 pt-3 space-y-4 bg-muted/20">
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">Question (front)</Label>
                              <Input
                                value={card.question}
                                onChange={(e) => updateCard(index, 'question', e.target.value)}
                                placeholder="Question or term"
                                disabled={loading}
                                className="bg-background"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">Answer (back)</Label>
                              <Input
                                value={card.answer}
                                onChange={(e) => updateCard(index, 'answer', e.target.value)}
                                placeholder="Answer or definition"
                                disabled={loading}
                                className="bg-background"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
              <Button type="button" variant="outline" onClick={addCard} disabled={loading} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href={backUrl}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Deck'
            )}
          </Button>
        </div>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-lg border p-8 max-w-md w-full text-center"
          >
            <div className="mb-4 flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Deck Created</h2>
            <p className="text-muted-foreground text-sm">Redirecting…</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-primary" />
          </motion.div>
        </div>
      )}
    </div>
  );
}
