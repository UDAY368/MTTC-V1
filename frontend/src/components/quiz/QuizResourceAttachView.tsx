'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Edit, Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { QuizPreviewModal, type DayQuizForPreview } from './QuizPreviewModal';

export interface DayQuizAttach {
  id: string;
  order: number;
  isVisible: boolean;
  quiz: {
    id: string;
    title: string;
    durationMinutes: number;
  };
}

interface QuizResourceAttachViewProps {
  dayId: string;
  courseId: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function QuizResourceAttachView({ dayId, courseId, onSuccess, children }: QuizResourceAttachViewProps) {
  const router = useRouter();
  const [dayQuizzes, setDayQuizzes] = useState<DayQuizAttach[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewQuiz, setPreviewQuiz] = useState<DayQuizAttach | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DayQuizAttach | null>(null);

  const fetchDayQuizzes = async () => {
    try {
      const response = await api.get(`/day-quizzes?dayId=${dayId}`);
      setDayQuizzes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching day quizzes:', error);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchDayQuizzes();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [dayId]);

  const handleToggleVisibility = async (dq: DayQuizAttach) => {
    try {
      await api.put(`/day-quizzes/${dq.id}`, { isVisible: !dq.isVisible });
      await fetchDayQuizzes();
      onSuccess?.();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update visibility');
    }
  };

  const handleRemoveFromDay = async (dq: DayQuizAttach) => {
    try {
      await api.delete(`/day-quizzes/${dq.id}`);
      setDeleteConfirm(null);
      await fetchDayQuizzes();
      onSuccess?.();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove quiz from day');
    }
  };

  const dayQuizForPreview = (dq: DayQuizAttach): DayQuizForPreview => ({
    id: dq.id,
    order: dq.order,
    isVisible: dq.isVisible,
    quiz: { id: dq.quiz.id, title: dq.quiz.title, durationMinutes: dq.quiz.durationMinutes },
  });

  const newQuizUrl = `/dashboard/quizzes/new?courseId=${courseId}&dayId=${dayId}`;

  return (
    <>
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Add quizzes for this day. Each quiz is created and linked to this day only.
          </p>
          <Button asChild className="shrink-0">
            <Link href={newQuizUrl} className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Quiz
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quizzes for this day</h3>
            {dayQuizzes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No quizzes yet for this day.</p>
                <Button asChild variant="outline">
                  <Link href={newQuizUrl} className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add your first quiz
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dayQuizzes.map((dq) => (
                  <Card key={dq.id} className="border-border/60">
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                          <CardTitle className="text-base truncate">{dq.quiz.title}</CardTitle>
                          {!dq.isVisible && (
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
                            onClick={() => setPreviewQuiz(dq)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleVisibility(dq)}
                            title={dq.isVisible ? 'Hide' : 'Show'}
                          >
                            {dq.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/dashboard/quizzes/${dq.quiz.id}/edit`)}
                            title="Edit quiz"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(dq)}
                            title="Remove from day"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="text-xs">
                        {dq.quiz.durationMinutes} min
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
        {previewQuiz && (
          <QuizPreviewModal
            dayQuiz={dayQuizForPreview(previewQuiz)}
            onClose={() => setPreviewQuiz(null)}
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
                Remove &quot;{deleteConfirm.quiz.title}&quot; from this day? The quiz will remain in the course but won’t appear in this day’s content.
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
