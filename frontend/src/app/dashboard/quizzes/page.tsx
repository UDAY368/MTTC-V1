'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Plus, Edit, Trash2, FileText, Copy, Check, AlertTriangle, X } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  uniqueUrl: string;
  isActive: boolean;
  course: {
    id: string;
    name: string;
  };
  _count?: {
    questions: number;
    attempts: number;
  };
}

interface Course {
  id: string;
  name: string;
}

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; quiz: Quiz | null }>({
    show: false,
    quiz: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quizzesRes, coursesRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/courses'),
      ]);
      setQuizzes(quizzesRes.data.data || []);
      setCourses(coursesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = selectedCourse === 'all'
    ? quizzes
    : quizzes.filter(q => q.course.id === selectedCourse);

  const handleDeleteClick = (quiz: Quiz) => {
    setDeleteConfirm({ show: true, quiz });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.quiz) return;

    setDeleting(true);
    try {
      await api.delete(`/quizzes/${deleteConfirm.quiz.id}`);
      setDeleteConfirm({ show: false, quiz: null });
      fetchData();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, quiz: null });
  };

  const copyQuizUrl = (uniqueUrl: string) => {
    const url = `${window.location.origin}/quiz/${uniqueUrl}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(uniqueUrl);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-wide">Quizzes</h1>
          <p className="text-muted-foreground mt-2">Manage your quizzes</p>
        </div>
        <Button onClick={() => router.push('/dashboard/quizzes/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Quiz
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <Select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-64"
        >
          <option value="all">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </Select>
      </div>

      {filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quizzes yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/dashboard/quizzes/new')}
            >
              Create your first quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz, index) => (
            <motion.div
              key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{quiz.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {quiz.course.name}
                      </CardDescription>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      quiz.isActive
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <div>Duration: {quiz.durationMinutes} minutes</div>
                    <div>Questions: {quiz._count?.questions || 0}</div>
                    <div>Attempts: {quiz._count?.attempts || 0}</div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                    <code className="text-xs flex-1 truncate">
                      /quiz/{quiz.uniqueUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyQuizUrl(quiz.uniqueUrl)}
                    >
                      {copiedUrl === quiz.uniqueUrl ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/quizzes/${quiz.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(quiz)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.show && deleteConfirm.quiz && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card rounded-lg border max-w-md w-full"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <CardTitle>Delete Quiz</CardTitle>
                        <CardDescription className="mt-1">
                          This action cannot be undone
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteCancel}
                      disabled={deleting}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Are you sure you want to delete the quiz:
                    </p>
                    <p className="text-base font-semibold text-foreground">
                      "{deleteConfirm.quiz.title}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      This will also delete all associated questions and attempts.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDeleteCancel}
                      disabled={deleting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteConfirm}
                      disabled={deleting}
                      className="flex-1"
                    >
                      {deleting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="mr-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Quiz
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
