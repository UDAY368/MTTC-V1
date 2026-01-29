'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  const quizId = params.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !durationMinutes) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Update quiz
      await api.put(`/quizzes/${quizId}`, {
        title,
        description,
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

      router.push('/dashboard/quizzes');
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    Manage quiz questions
                  </CardDescription>
                </div>
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
                    <div className="flex items-center justify-between">
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
                  <p>No questions yet. Click "Add Question" to get started.</p>
                </div>
              )}
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
    </div>
  );
}
