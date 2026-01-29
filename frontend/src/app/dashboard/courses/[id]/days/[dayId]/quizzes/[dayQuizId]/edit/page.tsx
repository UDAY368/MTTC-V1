'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';

export default function EditDayQuizPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const dayId = params.dayId as string;
  const dayQuizId = params.dayQuizId as string;

  const [dayQuiz, setDayQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDayQuiz();
  }, [dayQuizId]);

  const fetchDayQuiz = async () => {
    try {
      setFetching(true);
      const response = await api.get(`/day-quizzes/${dayQuizId}`);
      setDayQuiz(response.data.data);
    } catch (error: any) {
      console.error('Error fetching day quiz:', error);
      setError(error.response?.data?.message || 'Failed to load quiz attachment');
    } finally {
      setFetching(false);
    }
  };

  const handleToggleVisibility = async () => {
    setLoading(true);
    try {
      await api.put(`/day-quizzes/${dayQuizId}`, {
        isVisible: !dayQuiz.isVisible,
      });
      fetchDayQuiz();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update visibility');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !dayQuiz) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/courses/${courseId}/days/${dayId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error || 'Quiz attachment not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/dashboard/courses/${courseId}/days/${dayId}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Quiz Settings</CardTitle>
            <CardDescription>
              Manage quiz attachment for this day
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Quiz Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Title: </span>
                  <span>{dayQuiz.quiz.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration: </span>
                  <span>{dayQuiz.quiz.durationMinutes} minutes</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Public URL: </span>
                  <span className="font-mono text-xs">{dayQuiz.quiz.uniqueUrl}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant={dayQuiz.isVisible ? 'default' : 'outline'}
                  onClick={handleToggleVisibility}
                  disabled={loading}
                >
                  {dayQuiz.isVisible ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      Hidden
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {dayQuiz.isVisible
                    ? 'This quiz is visible to end users'
                    : 'This quiz is hidden from end users'}
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/courses/${courseId}/days/${dayId}`)}
                disabled={loading}
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
