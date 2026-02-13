'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Plus, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

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

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.id as string;
  const courseId = searchParams.get('courseId');
  const dayId = searchParams.get('dayId');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalQuestionsInput, setTotalQuestionsInput] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());
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
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const response = await api.get(`/quizzes/${quizId}`);
      const quiz = response.data.data;
      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setTotalQuestionsInput(String(quiz.totalQuestions ?? 0));
      setDurationMinutes(quiz.durationMinutes);
      setIsActive(quiz.isActive);

      // Fetch questions and ensure textTe fields are initialized
      const questionsRes = await api.get(`/questions?quizId=${quizId}`);
      const questionsData = (questionsRes.data.data || []).map((q: any) => ({
        ...q,
        textTe: q.textTe || '',
        options: q.options.map((opt: any) => ({
          ...opt,
          textTe: opt.textTe || '',
        })),
      }));
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Failed to load quiz');
    } finally {
      setFetching(false);
    }
  };

  const addQuestion = () => {
    const ts = Date.now();
    setQuestions([
      ...questions,
      {
        id: `temp-${ts}`,
        text: '',
        textTe: '',
        type: 'SINGLE_CHOICE',
        options: [
          { id: `opt-${ts}-1`, text: '', textTe: '', isCorrect: false },
          { id: `opt-${ts}-2`, text: '', textTe: '', isCorrect: false },
          { id: `opt-${ts}-3`, text: '', textTe: '', isCorrect: false },
          { id: `opt-${ts}-4`, text: '', textTe: '', isCorrect: false },
        ],
      },
    ]);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const deleteQuestion = async (id: string) => {
    // If it's a real question (not temp), delete from API
    if (!id.startsWith('temp-')) {
      try {
        await api.delete(`/questions/${id}`);
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
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
      updateOption(questionId, optionId, 'isCorrect', !question.options.find(o => o.id === optionId)?.isCorrect);
    }
  };

  const validateQuestions = (): { isValid: boolean; errors: Array<{ questionId: string; questionIndex: number; message: string }> } => {
    const errors: Array<{ questionId: string; questionIndex: number; message: string }> = [];
    questions.forEach((question, index) => {
      const qNum = index + 1;
      if (!question.text.trim()) {
        errors.push({ questionId: question.id, questionIndex: index, message: `Question ${qNum}: English question text is required` });
      }
      if (!question.textTe.trim()) {
        errors.push({ questionId: question.id, questionIndex: index, message: `Question ${qNum}: Telugu question text (తెలుగు ప్రశ్న) is required` });
      }
      if (question.options.length < 2) {
        errors.push({ questionId: question.id, questionIndex: index, message: `Question ${qNum}: At least 2 options are required` });
      } else {
        question.options.forEach((option, oi) => {
          const optNum = oi + 1;
          if (!option.text.trim()) {
            errors.push({ questionId: question.id, questionIndex: index, message: `Question ${qNum}, Option ${optNum}: English option text is required` });
          }
          if (!option.textTe.trim()) {
            errors.push({ questionId: question.id, questionIndex: index, message: `Question ${qNum}, Option ${optNum}: Telugu option text (ఎంపిక) is required` });
          }
        });
      }
      const correctCount = question.options.filter(opt => opt.isCorrect).length;
      if (question.type === 'SINGLE_CHOICE') {
        if (correctCount < 1) {
          errors.push({ questionId: question.id, questionIndex: index, message: 'Single choice question must have at least one correct answer' });
        } else if (correctCount > 1) {
          errors.push({ questionId: question.id, questionIndex: index, message: 'Single choice question must have exactly one correct answer' });
        }
      } else {
        if (correctCount <= 1) {
          errors.push({ questionId: question.id, questionIndex: index, message: 'Multiple choice question must have more than one correct answer' });
        }
      }
    });
    return { isValid: errors.length === 0, errors };
  };

  const navigateToQuestion = (questionId: string) => {
    setShowValidationModal(false);
    setCollapsedQuestions(new Set());
    setTimeout(() => {
      const element = document.getElementById(`question-${questionId}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowValidationModal(false);
    setValidationErrors([]);

    if (!title || !durationMinutes) {
      setError('Please fill in all required fields');
      return;
    }

    if (questions.length > 0) {
      const validation = validateQuestions();
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setShowValidationModal(true);
        return;
      }
    }

    setLoading(true);

    try {
      // Update quiz
      await api.put(`/quizzes/${quizId}`, {
        title,
        description,
        totalQuestions: Math.max(0, parseInt(totalQuestionsInput, 10) || 0),
        durationMinutes,
        isActive,
      });

      // Handle questions: create new, update existing, delete removed
      const existingQuestionIds = questions.filter(q => !q.id.startsWith('temp-')).map(q => q.id);
      
      // Create new questions
      for (const question of questions) {
        if (question.id.startsWith('temp-')) {
          // New question - create it
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
        } else {
          // Existing question - update it
          await api.put(`/questions/${question.id}`, {
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
      }

      // Redirect back to day resources if opened from day context, else courses
      const redirectUrl = courseId && dayId
        ? `/dashboard/courses/${courseId}/days/${dayId}/resources/new?type=QUIZ`
        : '/dashboard/courses';
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
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

  const backUrl = courseId && dayId
    ? `/dashboard/courses/${courseId}/days/${dayId}/resources/new?type=QUIZ`
    : '/dashboard/courses';

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push(backUrl)}
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
                Update quiz information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={loading}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Active (quiz is accessible)</Label>
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
                Manage quiz questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question, qIndex) => {
                const isCollapsed = collapsedQuestions.has(question.id);
                return (
                  <motion.div
                    id={`question-${question.id}`}
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border transition-all duration-200 shadow-sm overflow-hidden ${
                      isCollapsed ? 'border-border bg-card/50' : 'border-border bg-card shadow-md ring-1 ring-black/5'
                    }`}
                  >
                    {/* Question Header - click anywhere to collapse/expand */}
                    <div
                      className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none hover:bg-muted/40 active:bg-muted/60 transition-colors border-l-4 border-l-primary/60"
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleQuestionCollapse(question.id)}
                      onKeyDown={(e) => e.key === 'Enter' && toggleQuestionCollapse(question.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Label className="text-base font-semibold shrink-0">Question {qIndex + 1}</Label>
                        {question.text && (
                          <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {question.text.length > 50 ? question.text.substring(0, 50) + '...' : question.text}
                          </span>
                        )}
                        <span className="text-xs bg-muted px-2 py-0.5 rounded shrink-0">
                          {question.options.length} options
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                        data-question-card
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 px-4 pb-4 pt-0 border-t border-border/60"
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
                              <Label className="text-sm text-muted-foreground">Telugu (తెలుగు) *</Label>
                              <Textarea
                                value={question.textTe}
                                onChange={(e) => updateQuestion(question.id, 'textTe', e.target.value)}
                                placeholder="తెలుగులో ప్రశ్నను నమోదు చేయండి"
                                rows={2}
                                disabled={loading}
                                required
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

                        {/* Options - single row: label + inputs */}
                        <div className="space-y-3">
                          <Label>Options *</Label>
                          {question.options.map((option, oIndex) => (
                            <div
                              key={option.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors"
                            >
                              <div className="flex items-center gap-2 shrink-0 sm:w-[140px]">
                                <input
                                  type={question.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                  checked={option.isCorrect}
                                  onChange={() => toggleCorrectOption(question.id, option.id)}
                                  className="h-4 w-4 shrink-0"
                                  disabled={loading}
                                />
                                <span className="text-sm font-medium whitespace-nowrap">Option {oIndex + 1}</span>
                                {option.isCorrect && (
                                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded shrink-0">Correct</span>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 min-w-0 sm:pl-2">
                                <Input
                                  data-option-input
                                  value={option.text}
                                  onChange={(e) => updateOption(question.id, option.id, 'text', e.target.value)}
                                  placeholder={`English: Option ${oIndex + 1}`}
                                  disabled={loading}
                                  className="h-9"
                                  onKeyDown={(e) => {
                                    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
                                    const card = (e.target as HTMLElement).closest('[data-question-card]');
                                    if (!card) return;
                                    const inputs = Array.from(card.querySelectorAll<HTMLInputElement>('[data-option-input]'));
                                    const idx = inputs.indexOf(e.target as HTMLInputElement);
                                    if (idx === -1) return;
                                    e.preventDefault();
                                    if (e.key === 'ArrowDown') {
                                      const next = idx < inputs.length - 1 ? idx + 1 : 0;
                                      inputs[next]?.focus();
                                    } else {
                                      const prev = idx > 0 ? idx - 1 : inputs.length - 1;
                                      inputs[prev]?.focus();
                                    }
                                  }}
                                />
                                <Input
                                  data-option-input
                                  value={option.textTe}
                                  onChange={(e) => updateOption(question.id, option.id, 'textTe', e.target.value)}
                                  placeholder={`Telugu: ఎంపిక ${oIndex + 1}`}
                                  disabled={loading}
                                  className="h-9"
                                  onKeyDown={(e) => {
                                    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
                                    const card = (e.target as HTMLElement).closest('[data-question-card]');
                                    if (!card) return;
                                    const inputs = Array.from(card.querySelectorAll<HTMLInputElement>('[data-option-input]'));
                                    const idx = inputs.indexOf(e.target as HTMLInputElement);
                                    if (idx === -1) return;
                                    e.preventDefault();
                                    if (e.key === 'ArrowDown') {
                                      const next = idx < inputs.length - 1 ? idx + 1 : 0;
                                      inputs[next]?.focus();
                                    } else {
                                      const prev = idx > 0 ? idx - 1 : inputs.length - 1;
                                      inputs[prev]?.focus();
                                    }
                                  }}
                                />
                              </div>
                              {question.options.length > 2 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => deleteOption(question.id, option.id)}
                                  disabled={loading}
                                  className="h-8 w-8 shrink-0 border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-destructive/50"
                                  aria-label="Remove option"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
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
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Quiz'
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
                  Please fill all English and Telugu fields (question and options) before updating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {validationErrors.map((err, index) => (
                    <div
                      key={index}
                      className="p-3 bg-destructive/10 border border-destructive/20 rounded-md cursor-pointer hover:bg-destructive/20 transition-colors"
                      onClick={() => navigateToQuestion(err.questionId)}
                    >
                      <div className="font-medium text-sm text-destructive">
                        Question {err.questionIndex + 1}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {err.message}
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
    </div>
  );
}
