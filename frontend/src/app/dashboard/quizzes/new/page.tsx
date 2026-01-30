'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Plus, X, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';

interface Course {
  id: string;
  name: string;
}

interface Question {
  id: string;
  text: string;      // English text
  textTe: string;    // Telugu text
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options: {
    id: string;
    text: string;    // English text
    textTe: string;  // Telugu text
    isCorrect: boolean;
  }[];
}

export default function NewQuizPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuestionsInput, setTotalQuestionsInput] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{ questionId: string; questionIndex: number; message: string }>>([]);

  const toggleQuestionCollapse = (questionId: string) => {
    setCollapsedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setFetching(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `temp-${Date.now()}`,
        text: '',
        textTe: '',
        type: 'SINGLE_CHOICE',
        options: [
          { id: `opt-${Date.now()}-1`, text: '', textTe: '', isCorrect: false },
          { id: `opt-${Date.now()}-2`, text: '', textTe: '', isCorrect: false },
        ],
      },
    ]);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? {
            ...q,
            options: [
              ...q.options,
              { id: `opt-${Date.now()}`, text: '', textTe: '', isCorrect: false },
            ],
          }
        : q
    ));
  };

  const updateOption = (questionId: string, optionId: string, field: string, value: any) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? {
            ...q,
            options: q.options.map(opt =>
              opt.id === optionId ? { ...opt, [field]: value } : opt
            ),
          }
        : q
    ));
  };

  const deleteOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q =>
      q.id === questionId
        ? { ...q, options: q.options.filter(opt => opt.id !== optionId) }
        : q
    ));
  };

  const toggleCorrectOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    if (question.type === 'SINGLE_CHOICE') {
      // For single choice, only one option can be correct
      setQuestions(questions.map(q =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map(opt => ({
                ...opt,
                isCorrect: opt.id === optionId,
              })),
            }
          : q
      ));
    } else {
      // For multiple choice, toggle the option
      updateOption(questionId, optionId, 'isCorrect', !question.options.find(o => o.id === optionId)?.isCorrect);
    }
  };

  const hasCorrectAnswer = (question: Question): boolean => {
    const correctCount = question.options.filter(opt => opt.isCorrect).length;
    if (question.type === 'SINGLE_CHOICE') {
      return correctCount >= 1;
    } else {
      return correctCount > 1;
    }
  };

  const validateQuestions = (): { isValid: boolean; errors: Array<{ questionId: string; questionIndex: number; message: string }> } => {
    const errors: Array<{ questionId: string; questionIndex: number; message: string }> = [];

    questions.forEach((question, index) => {
      if (!question.text.trim()) {
        errors.push({
          questionId: question.id,
          questionIndex: index,
          message: 'Question text is required'
        });
        return;
      }

      if (question.options.length < 2) {
        errors.push({
          questionId: question.id,
          questionIndex: index,
          message: 'Question must have at least 2 options'
        });
        return;
      }

      for (const option of question.options) {
        if (!option.text.trim()) {
          errors.push({
            questionId: question.id,
            questionIndex: index,
            message: 'All options must have text'
          });
          return;
        }
      }

      const correctCount = question.options.filter(opt => opt.isCorrect).length;
      
      if (question.type === 'SINGLE_CHOICE') {
        if (correctCount < 1) {
          errors.push({
            questionId: question.id,
            questionIndex: index,
            message: 'Single choice question must have at least one correct answer'
          });
        } else if (correctCount > 1) {
          errors.push({
            questionId: question.id,
            questionIndex: index,
            message: 'Single choice question must have exactly one correct answer'
          });
        }
      } else {
        if (correctCount <= 1) {
          errors.push({
            questionId: question.id,
            questionIndex: index,
            message: 'Multiple choice question must have more than one correct answer'
          });
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowValidationModal(false);
    setValidationErrors([]);

    if (!courseId || !title || !durationMinutes) {
      setError('Please fill in all required fields');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    // Validate questions
    const validation = validateQuestions();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setShowValidationModal(true);
      // Expand the first question with error
      if (validation.errors.length > 0) {
        const firstError = validation.errors[0];
        setCollapsedQuestions(new Set());
        // Scroll to the question
        setTimeout(() => {
          const element = document.getElementById(`question-${firstError.questionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
      return;
    }

    setLoading(true);

    try {
      // Create quiz
      const quizResponse = await api.post('/quizzes', {
        courseId,
        title,
        description,
        totalQuestions: Math.max(0, parseInt(totalQuestionsInput, 10) || 0),
        durationMinutes,
      });

      const quizId = quizResponse.data.data.id;

      // Create questions with bilingual text
      for (const question of questions) {
        await api.post('/questions', {
          quizId,
          text: question.text,
          textTe: question.textTe || null,
          type: question.type,
          options: question.options.map(opt => ({
            text: opt.text,
            textTe: opt.textTe || null,
            isCorrect: opt.isCorrect,
          })),
        });
      }

      // Show success animation
      setShowSuccess(true);
      setLoading(false);
      
      // Redirect after animation
      setTimeout(() => {
        router.push('/dashboard/quizzes');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      setLoading(false);
    }
  };

  const navigateToQuestion = (questionId: string) => {
    setShowValidationModal(false);
    setCollapsedQuestions(new Set());
    setTimeout(() => {
      const element = document.getElementById(`question-${questionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
              <CardDescription>
                Basic information about the quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select
                  id="course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Day 1 Quiz"
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
                  placeholder="Quiz description (optional)"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalQuestions">Total Number of Questions</Label>
                <Input
                  id="totalQuestions"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={totalQuestionsInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || /^\d+$/.test(v)) setTotalQuestionsInput(v);
                  }}
                  placeholder="0"
                  disabled={loading}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Add questions to your quiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, qIndex) => {
                const isCollapsed = collapsedQuestions.has(question.id);
                return (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-border rounded-lg space-y-4"
                  >
                    {/* Question Header - Always visible */}
                    <div id={`question-${question.id}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Label className="text-base font-semibold">Question {qIndex + 1}</Label>
                        {question.text && (
                          <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {question.text.length > 50 ? question.text.substring(0, 50) + '...' : question.text}
                          </span>
                        )}
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {question.options.length} options
                        </span>
                        {hasCorrectAnswer(question) && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Answer selected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleQuestionCollapse(question.id)}
                          className="h-8 w-8"
                        >
                          {isCollapsed ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronUp className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteQuestion(question.id)}
                          disabled={loading}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Question Content - Collapsible */}
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        {/* Question Text - English and Telugu side by side */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-sm text-muted-foreground">English *</Label>
                              <Textarea
                                value={question.text}
                                onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                placeholder="Enter question in English"
                                rows={2}
                                disabled={loading}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-sm text-muted-foreground">Telugu (తెలుగు)</Label>
                              <Textarea
                                value={question.textTe}
                                onChange={(e) => updateQuestion(question.id, 'textTe', e.target.value)}
                                placeholder="తెలుగులో ప్రశ్నను నమోదు చేయండి"
                                rows={2}
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Question Type *</Label>
                          <Select
                            value={question.type}
                            onChange={(e) => {
                              const newType = e.target.value as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
                              updateQuestion(question.id, 'type', newType);
                              // Reset correct answers when changing type
                              if (newType === 'SINGLE_CHOICE') {
                                updateQuestion(question.id, 'options', question.options.map(opt => ({ ...opt, isCorrect: false })));
                              }
                            }}
                            disabled={loading}
                          >
                            <option value="SINGLE_CHOICE">Single Choice (Radio)</option>
                            <option value="MULTIPLE_CHOICE">Multiple Choice (Checkbox)</option>
                          </Select>
                        </div>

                        {/* Options - English and Telugu side by side */}
                        <div className="space-y-3">
                          <Label>Options *</Label>
                          {question.options.map((option, oIndex) => (
                            <div key={option.id} className="p-3 bg-muted/30 rounded-md space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type={question.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                  checked={option.isCorrect}
                                  onChange={() => toggleCorrectOption(question.id, option.id)}
                                  className="h-4 w-4"
                                  disabled={loading}
                                />
                                <span className="text-sm font-medium">Option {oIndex + 1}</span>
                                {option.isCorrect && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Correct</span>
                                )}
                                {question.options.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteOption(question.id, option.id)}
                                    disabled={loading}
                                    className="ml-auto h-6 w-6"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6">
                                <Input
                                  value={option.text}
                                  onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                                  placeholder={`English: Option ${oIndex + 1}`}
                                  disabled={loading}
                                />
                                <Input
                                  value={option.textTe}
                                  onChange={(e) => updateOption(question.id, option.id, 'textTe', e.target.value)}
                                  placeholder={`Telugu: ఎంపిక ${oIndex + 1}`}
                                  disabled={loading}
                                />
                              </div>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(question.id)}
                            disabled={loading}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Option
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}

              {questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No questions yet. Click "Add Question" below to get started.</p>
                </div>
              )}

              <div className="flex justify-start border-t border-border/60 pt-4 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                  disabled={loading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || questions.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Quiz'
            )}
          </Button>
        </div>
      </form>

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card rounded-lg border max-w-md w-full"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <CardTitle>Validation Errors</CardTitle>
                </div>
                <CardDescription>
                  Please fix the following issues before creating the quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {validationErrors.map((error, index) => (
                    <div
                      key={index}
                      className="p-3 bg-destructive/10 border border-destructive/20 rounded-md cursor-pointer hover:bg-destructive/20 transition-colors"
                      onClick={() => navigateToQuestion(error.questionId)}
                    >
                      <div className="font-medium text-sm text-destructive">
                        Question {error.questionIndex + 1}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {error.message}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setShowValidationModal(false)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-card rounded-lg border p-8 max-w-md w-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-4 flex justify-center"
              >
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2"
              >
                Quiz Created!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Your quiz has been successfully created and saved.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4"
              >
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
