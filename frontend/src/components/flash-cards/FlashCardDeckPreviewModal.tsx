'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Loader2, X } from 'lucide-react';
import { FlashCardStack, type FlashCardItem } from '@/components/course-view/FlashCardStack';
import type { DayFlashCardDeckAttach } from './FlashCardDeckAttachView';

interface FlashCardDeckPreviewModalProps {
  dayDeck: DayFlashCardDeckAttach;
  onClose: () => void;
}

interface DeckWithCards {
  id: string;
  title: string;
  description?: string | null;
  cards: { id: string; question: string; answer: string; order: number }[];
}

export function FlashCardDeckPreviewModal({ dayDeck, onClose }: FlashCardDeckPreviewModalProps) {
  const [deck, setDeck] = useState<DeckWithCards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg border max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
      >
        <Card className="border-0 shadow-none flex flex-col flex-1 min-h-0">
          <CardHeader className="shrink-0 border-b flex flex-row items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="truncate">Preview: {dayDeck.deck.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {deck ? `${deck.cards.length} cards` : 'Loading…'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-auto p-4">
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
