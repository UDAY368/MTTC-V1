'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Edit, Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { FlashCardDeckPreviewModal } from './FlashCardDeckPreviewModal';

export interface DayFlashCardDeckAttach {
  id: string;
  order: number;
  isVisible: boolean;
  deck: {
    id: string;
    title: string;
    uniqueUrl: string;
    description?: string | null;
    _count?: { cards: number };
  };
}

interface FlashCardDeckAttachViewProps {
  dayId: string;
  courseId: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function FlashCardDeckAttachView({ dayId, courseId, onSuccess, children }: FlashCardDeckAttachViewProps) {
  const router = useRouter();
  const [dayDecks, setDayDecks] = useState<DayFlashCardDeckAttach[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDeck, setPreviewDeck] = useState<DayFlashCardDeckAttach | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DayFlashCardDeckAttach | null>(null);

  const fetchDayDecks = async () => {
    try {
      const response = await api.get(`/day-flash-decks?dayId=${dayId}`);
      setDayDecks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching day flash card decks:', error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchDayDecks();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [dayId]);

  const handleToggleVisibility = async (dfd: DayFlashCardDeckAttach) => {
    try {
      await api.put(`/day-flash-decks/${dfd.id}`, { isVisible: !dfd.isVisible });
      await fetchDayDecks();
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to update visibility');
    }
  };

  const handleRemoveFromDay = async (dfd: DayFlashCardDeckAttach) => {
    try {
      await api.delete(`/day-flash-decks/${dfd.id}`);
      setDeleteConfirm(null);
      await fetchDayDecks();
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message || 'Failed to remove deck from day');
    }
  };

  const newDeckUrl = `/dashboard/flash-decks/new?courseId=${courseId}&dayId=${dayId}`;

  return (
    <>
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Add flash card decks for this day. Create a deck with question/answer cards, then it appears here.
          </p>
          <Button asChild className="shrink-0">
            <Link href={newDeckUrl} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Deck
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Decks for this day</h3>
            {dayDecks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
                <Layers className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No flash card decks yet for this day.</p>
                <Button asChild variant="outline">
                  <Link href={newDeckUrl} className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create your first deck
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dayDecks.map((dfd) => (
                  <Card key={dfd.id} className="border-border/60">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                          <CardTitle className="text-base truncate">{dfd.deck.title}</CardTitle>
                          {!dfd.isVisible && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPreviewDeck(dfd)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleVisibility(dfd)}
                            title={dfd.isVisible ? 'Hide' : 'Show'}
                          >
                            {dfd.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/dashboard/flash-decks/${dfd.deck.id}/edit`)}
                            title="Edit deck"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(dfd)}
                            title="Remove from day"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        {dfd.deck._count?.cards ?? 0} cards
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {children}

      <AnimatePresence>
        {previewDeck && (
          <FlashCardDeckPreviewModal
            dayDeck={previewDeck}
            onClose={() => setPreviewDeck(null)}
            courseId={courseId}
            dayId={dayId}
            onRemove={async (dfd) => {
              await handleRemoveFromDay(dfd);
              setPreviewDeck(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-lg border p-6 max-w-sm w-full shadow-xl"
            >
              <p className="text-sm text-muted-foreground mb-4">
                Remove &quot;{deleteConfirm.deck.title}&quot; from this day? The deck will remain in the course but won&apos;t appear in this day&apos;s content.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button variant="destructive" onClick={() => handleRemoveFromDay(deleteConfirm)}>Remove</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
