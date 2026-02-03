'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { FlashCardStack, type FlashCardItem } from '@/components/course-view/FlashCardStack';
import type { DayFlashCardDeckAttach } from './FlashCardDeckAttachView';

interface FlashCardDeckPreviewModalProps {
  dayDeck: DayFlashCardDeckAttach;
  onClose: () => void;
  /** When provided, Edit / Remove and "Create another deck" are shown */
  courseId?: string;
  dayId?: string;
  onRemove?: (dayDeck: DayFlashCardDeckAttach) => Promise<void>;
}

interface DeckWithCards {
  id: string;
  title: string;
  description?: string | null;
  cards: { id: string; question: string; answer: string; order: number }[];
}

export function FlashCardDeckPreviewModal({ dayDeck, onClose, courseId, dayId, onRemove }: FlashCardDeckPreviewModalProps) {
  const router = useRouter();
  const [deck, setDeck] = useState<DeckWithCards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.get(`/flash-decks/${dayDeck.deck.id}`);
        const data = response.data.data;
        if (!cancelled) {
          setDeck({
            id: data.id,
            title: data.title,
            description: data.description,
            cards: (data.cards || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order),
          });
        }
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        if (!cancelled) setError(e.response?.data?.message || 'Failed to load deck');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dayDeck.deck.id]);

  const cards: FlashCardItem[] = (deck?.cards ?? []).map((c) => ({
    id: c.id,
    question: c.question,
    answer: c.answer,
    order: c.order,
  }));

  const handleEdit = () => {
    onClose();
    const editUrl = courseId && dayId
      ? `/dashboard/flash-decks/${dayDeck.deck.id}/edit?courseId=${courseId}&dayId=${dayId}`
      : `/dashboard/flash-decks/${dayDeck.deck.id}/edit`;
    router.push(editUrl);
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove(dayDeck);
      onClose();
    } finally {
      setRemoving(false);
    }
  };

  const newDeckUrl = courseId && dayId ? `/dashboard/flash-decks/new?courseId=${courseId}&dayId=${dayId}` : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-xl border shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <Card className="border-0 shadow-none flex flex-col flex-1 min-h-0 rounded-xl">
          <CardHeader className="shrink-0 border-b space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Layers className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="truncate">{dayDeck.deck.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {deck ? `${deck.cards.length} cards` : 'Loading…'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            {courseId != null && dayId != null && (
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleEdit} className="gap-1.5">
                  <Pencil className="h-4 w-4" />
                  Edit deck
                </Button>
                {onRemove && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemove}
                    disabled={removing}
                    className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Remove from day
                  </Button>
                )}
                {newDeckUrl && (
                  <Button variant="secondary" size="sm" asChild className="gap-1.5 ml-auto">
                    <Link href={newDeckUrl}>
                      <Plus className="h-4 w-4" />
                      New deck
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-auto p-6 pt-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading deck…</p>
              </div>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : deck && cards.length > 0 ? (
              <div className="max-h-[60vh] overflow-hidden">
                <FlashCardStack title={deck.title} cards={cards} />
              </div>
            ) : deck ? (
              <p className="text-muted-foreground text-center py-8">No cards in this deck yet.</p>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
