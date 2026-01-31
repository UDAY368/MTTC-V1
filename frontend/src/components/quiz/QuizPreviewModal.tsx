'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle2, Clock, HelpCircle, Loader2, X } from 'lucide-react';

export interface DayQuizForPreview {
  id: string;
  order: number;
  isVisible: boolean;
  quiz: {
    id: string;
    title: string;
    durationMinutes: number;
  };
}

interface QuizQuestion {
  id: string;
  text: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }[];
  order: number;
}

interface QuizData {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  questions: QuizQuestion[];
}

export function QuizPreviewModal({ dayQuiz, onClose }: {
  dayQuiz: DayQuizForPreview;
  onClose: () => void;
}) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuizDetails();
  }, [dayQuiz.quiz.id]);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/quizzes/${dayQuiz.quiz.id}`);
      const quizData = response.data.data;
      const questionsRes = await api.get(`/questions?quizId=${dayQuiz.quiz.id}`);
      const questions = questionsRes.data.data || [];
      setQuiz({
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        durationMinutes: quizData.durationMinutes,
        questions: questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order,
          })),
          order: q.order,
        })),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg border max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Preview: {dayQuiz.quiz.title}
                </CardTitle>
                {quiz && (
                  <CardDescription className="mt-2 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {quiz.durationMinutes} minutes
                    </span>
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-4 w-4" />
                      {quiz.questions.length} questions
                    </span>
                  </CardDescription>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading quiz details...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={fetchQuizDetails}>
                  Retry
                </Button>
              </div>
            ) : quiz ? (
              <div className="space-y-6">
                {quiz.description && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {quiz.description}
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  {quiz.questions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No questions in this quiz yet.
                    </div>
                  ) : (
                    quiz.questions
                      .sort((a, b) => a.order - b.order)
                      .map((question, index) => (
                        <Card key={question.id} className="border-l-4 border-l-primary">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="font-semibold text-primary">Q{index + 1}.</span>
                                  <div className="flex-1">
                                    <p className="font-medium text-base">{question.text}</p>
                                    <span className="inline-block mt-2 text-xs bg-muted px-2 py-1 rounded">
                                      {question.type === 'SINGLE_CHOICE' ? 'Single Choice' : 'Multiple Choice'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2 pl-6">
                                {question.options
                                  .sort((a, b) => a.order - b.order)
                                  .map((option, optIndex) => (
                                    <div
                                      key={option.id}
                                      className={`p-3 rounded-lg border-2 transition-colors ${
                                        option.isCorrect
                                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                          : 'border-border bg-muted/50'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2">
                                        {option.isCorrect && (
                                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        )}
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">
                                              {String.fromCharCode(65 + optIndex)}.
                                            </span>
                                            <p className="text-sm font-medium">{option.text}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
