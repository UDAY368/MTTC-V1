'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { FlashCardStack, type FlashCardItem } from '@/components/course-view/FlashCardStack';
import { ArrowLeft, Loader2, Layers } from 'lucide-react';

interface DeckCard {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface Deck {
  id: string;
  title: string;
  description?: string | null;
  cards: DeckCard[];
}

export default function FlashDeckPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const uniqueUrl = params.uniqueUrl as string;
  const returnTo = searchParams.get('returnTo');
  const dayId = searchParams.get('dayId');
  const resourceId = searchParams.get('resourceId');

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uniqueUrl) {
      setLoading(false);
      setError('Invalid deck URL');
      return;
    }
    let cancelled = false;
    api
      .get<{ success: boolean; data: Deck }>(`/public/flash/${uniqueUrl}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setDeck({
            ...d,
            cards: (d.cards || []).sort((a, b) => a.order - b.order),
          });
        } else {
          setError('Deck not found');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load deck');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [uniqueUrl]);

  const deckCards: FlashCardItem[] = (deck?.cards ?? []).map((c) => ({
    id: c.id,
    question: c.question,
    answer: c.answer,
    order: c.order,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading deck…</p>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Deck not found</h1>
          <p className="text-muted-foreground text-sm mb-4">{error || 'This flash card deck may have been removed.'}</p>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => {
              if (returnTo) {
                const params = new URLSearchParams();
                if (dayId) params.set('dayId', dayId);
                if (resourceId) params.set('resourceId', resourceId);
                const qs = params.toString();
                router.push(qs ? `${returnTo}?${qs}` : returnTo);
              } else if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold truncate flex-1 text-center">{deck.title}</h1>
          <div className="w-20" />
        </div>
      </header>
      <main className="flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto px-3 py-3 sm:px-4 sm:py-6">
        <div className="flex-1 min-h-0 flex flex-col">
          <FlashCardStack title={deck.title} cards={deckCards} />
        </div>
      </main>
    </div>
  );
}
