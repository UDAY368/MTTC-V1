'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Loader2, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { QuizResourceAttachView } from '@/components/quiz/QuizResourceAttachView';
import { FlashCardDeckAttachView } from '@/components/flash-cards/FlashCardDeckAttachView';

type ResourceType = 'VIDEO' | 'NOTES' | 'BRIEF_NOTES' | 'FLASH_CARDS' | 'SHORT_QUESTIONS' | 'ASSIGNMENT' | 'GLOSSARY' | 'RECOMMENDATION' | 'QUIZ';

const DEFAULT_TITLE_BY_TYPE: Record<ResourceType, string> = {
  VIDEO: 'Video',
  NOTES: 'Key Summary',
  BRIEF_NOTES: 'Brief Notes',
  FLASH_CARDS: 'Flash Cards',
  SHORT_QUESTIONS: 'Short Questions',
  ASSIGNMENT: 'Assignments',
  GLOSSARY: 'Glossary',
  RECOMMENDATION: 'Recommendations',
  QUIZ: 'Question Bank',
};

export default function NewResourcePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params.id as string;
  const dayId = params.dayId as string;
  const resourceType = (searchParams.get('type') || 'VIDEO') as ResourceType;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // QUIZ: ensure Quiz resource exists, then show attach-quiz page
  const [quizResourceReady, setQuizResourceReady] = useState(false);
  const [quizResourceError, setQuizResourceError] = useState('');
  const [quizResourceLoading, setQuizResourceLoading] = useState(resourceType === 'QUIZ');
  const [creatingQuizResource, setCreatingQuizResource] = useState(false);
  const [quizResourceCreatedSuccess, setQuizResourceCreatedSuccess] = useState(false);

  // FLASH_CARDS: ensure one Flash Cards resource exists, then show deck attach page
  const [flashCardResourceReady, setFlashCardResourceReady] = useState(false);
  const [flashCardResourceError, setFlashCardResourceError] = useState('');
  const [flashCardResourceLoading, setFlashCardResourceLoading] = useState(resourceType === 'FLASH_CARDS');
  const [creatingFlashCardResource, setCreatingFlashCardResource] = useState(false);
  const [flashCardResourceCreatedSuccess, setFlashCardResourceCreatedSuccess] = useState(false);

  // Common fields — default title by resource type (user can edit)
  const [title, setTitle] = useState(() => DEFAULT_TITLE_BY_TYPE[resourceType] ?? resourceType.replace(/_/g, ' '));

  // VIDEO fields
  const [videoUrl, setVideoUrl] = useState('');

  // NOTES fields (paragraphs)
  const [noteParagraphs, setNoteParagraphs] = useState<Array<{ heading: string; content: string }>>([
    { heading: '', content: '' }
  ]);
  const [collapsedParagraphs, setCollapsedParagraphs] = useState<Set<number>>(new Set());

  // BRIEF_NOTES: single rich text (blog-style)
  const [briefNotesContent, setBriefNotesContent] = useState('');

  // FLASH_CARDS fields
  const [flashCards, setFlashCards] = useState<Array<{ question: string; answer: string }>>([
    { question: '', answer: '' }
  ]);
  const [collapsedFlashCards, setCollapsedFlashCards] = useState<Set<number>>(new Set());

  // SHORT_QUESTIONS fields
  const [shortQuestions, setShortQuestions] = useState<Array<{ question: string; answer: string }>>([
    { question: '', answer: '' }
  ]);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<number>>(new Set());

  // ASSIGNMENT fields
  const [assignmentQuestions, setAssignmentQuestions] = useState<Array<{ question: string }>>([
    { question: '' }
  ]);
  const [collapsedAssignments, setCollapsedAssignments] = useState<Set<number>>(new Set());

  // GLOSSARY fields
  const [glossaryWords, setGlossaryWords] = useState<Array<{ word: string; meaning: string }>>([
    { word: '', meaning: '' }
  ]);
  const [collapsedGlossary, setCollapsedGlossary] = useState<Set<number>>(new Set());

  // RECOMMENDATION fields
  const [recommendations, setRecommendations] = useState<Array<{ title: string; content: string }>>([
    { title: '', content: '' }
  ]);
  const [collapsedRecommendations, setCollapsedRecommendations] = useState<Set<number>>(new Set());

  const addNoteParagraph = () => {
    setNoteParagraphs([...noteParagraphs, { heading: '', content: '' }]);
  };

  const removeNoteParagraph = (index: number) => {
    setNoteParagraphs(noteParagraphs.filter((_, i) => i !== index));
    // Remove from collapsed set if it exists
    const newCollapsed = new Set(collapsedParagraphs);
    newCollapsed.delete(index);
    // Adjust indices for remaining items
    const adjustedCollapsed = new Set<number>();
    newCollapsed.forEach(i => {
      if (i > index) {
        adjustedCollapsed.add(i - 1);
      } else {
        adjustedCollapsed.add(i);
      }
    });
    setCollapsedParagraphs(adjustedCollapsed);
  };

  const updateNoteParagraph = (index: number, field: 'heading' | 'content', value: string) => {
    const updated = [...noteParagraphs];
    updated[index][field] = value;
    setNoteParagraphs(updated);
  };

  const toggleParagraphCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedParagraphs);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedParagraphs(newCollapsed);
  };

  const addFlashCard = () => {
    setFlashCards([...flashCards, { question: '', answer: '' }]);
  };

  const removeFlashCard = (index: number) => {
    setFlashCards(flashCards.filter((_, i) => i !== index));
    // Remove from collapsed set if it exists
    const newCollapsed = new Set(collapsedFlashCards);
    newCollapsed.delete(index);
    // Adjust indices for remaining items
    const adjustedCollapsed = new Set<number>();
    newCollapsed.forEach(i => {
      if (i > index) {
        adjustedCollapsed.add(i - 1);
      } else {
        adjustedCollapsed.add(i);
      }
    });
    setCollapsedFlashCards(adjustedCollapsed);
  };

  const updateFlashCard = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...flashCards];
    updated[index][field] = value;
    setFlashCards(updated);
  };

  const toggleFlashCardCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedFlashCards);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedFlashCards(newCollapsed);
  };

  const addShortQuestion = () => {
    setShortQuestions([...shortQuestions, { question: '', answer: '' }]);
  };

  const removeShortQuestion = (index: number) => {
    setShortQuestions(shortQuestions.filter((_, i) => i !== index));
    // Remove from collapsed set if it exists
    const newCollapsed = new Set(collapsedQuestions);
    newCollapsed.delete(index);
    // Adjust indices for remaining items
    const adjustedCollapsed = new Set<number>();
    newCollapsed.forEach(i => {
      if (i > index) {
        adjustedCollapsed.add(i - 1);
      } else {
        adjustedCollapsed.add(i);
      }
    });
    setCollapsedQuestions(adjustedCollapsed);
  };

  const updateShortQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...shortQuestions];
    updated[index][field] = value;
    setShortQuestions(updated);
  };

  const toggleQuestionCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedQuestions);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedQuestions(newCollapsed);
  };

  const addAssignmentQuestion = () => {
    setAssignmentQuestions([...assignmentQuestions, { question: '' }]);
  };

  const removeAssignmentQuestion = (index: number) => {
    setAssignmentQuestions(assignmentQuestions.filter((_, i) => i !== index));
    // Remove from collapsed set if it exists
    const newCollapsed = new Set(collapsedAssignments);
    newCollapsed.delete(index);
    // Adjust indices for remaining items
    const adjustedCollapsed = new Set<number>();
    newCollapsed.forEach(i => {
      if (i > index) {
        adjustedCollapsed.add(i - 1);
      } else {
        adjustedCollapsed.add(i);
      }
    });
    setCollapsedAssignments(adjustedCollapsed);
  };

  const updateAssignmentQuestion = (index: number, value: string) => {
    const updated = [...assignmentQuestions];
    updated[index].question = value;
    setAssignmentQuestions(updated);
  };

  const toggleAssignmentCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedAssignments);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedAssignments(newCollapsed);
  };

  const addGlossaryWord = () => {
    setGlossaryWords([...glossaryWords, { word: '', meaning: '' }]);
  };

  const removeGlossaryWord = (index: number) => {
    setGlossaryWords(glossaryWords.filter((_, i) => i !== index));
    // Remove from collapsed set if it exists
    const newCollapsed = new Set(collapsedGlossary);
    newCollapsed.delete(index);
    // Adjust indices for remaining items
    const adjustedCollapsed = new Set<number>();
    newCollapsed.forEach(i => {
      if (i > index) {
        adjustedCollapsed.add(i - 1);
      } else {
        adjustedCollapsed.add(i);
      }
    });
    setCollapsedGlossary(adjustedCollapsed);
  };

  const updateGlossaryWord = (index: number, field: 'word' | 'meaning', value: string) => {
    const updated = [...glossaryWords];
    updated[index][field] = value;
    setGlossaryWords(updated);
  };

  const toggleGlossaryCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedGlossary);
    if (newCollapsed.has(index)) {
      newCollapsed.delete(index);
    } else {
      newCollapsed.add(index);
    }
    setCollapsedGlossary(newCollapsed);
  };

  const addRecommendation = () => {
    setRecommendations([...recommendations, { title: '', content: '' }]);
  };

  const removeRecommendation = (index: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
    const newCollapsed = new Set(collapsedRecommendations);
    newCollapsed.delete(index);
    const adjustedCollapsed = new Set<number>();
    newCollapsed.forEach(i => {
      if (i > index) adjustedCollapsed.add(i - 1);
      else adjustedCollapsed.add(i);
    });
    setCollapsedRecommendations(adjustedCollapsed);
  };

  const updateRecommendation = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...recommendations];
    updated[index][field] = value;
    setRecommendations(updated);
  };

  const toggleRecommendationCollapse = (index: number) => {
    const newCollapsed = new Set(collapsedRecommendations);
    if (newCollapsed.has(index)) newCollapsed.delete(index);
    else newCollapsed.add(index);
    setCollapsedRecommendations(newCollapsed);
  };

  // QUIZ: ensure Quiz resource exists for this day, then show attach-quiz UI
  useEffect(() => {
    if (resourceType !== 'QUIZ') return;
    let cancelled = false;
    (async () => {
      setQuizResourceLoading(true);
      setQuizResourceError('');
      try {
        const res = await api.get(`/resources?dayId=${dayId}`);
        const resources = res.data?.data ?? [];
        const hasQuiz = resources.some((r: { type: string }) => r.type === 'QUIZ');
        if (hasQuiz) {
          if (!cancelled) setQuizResourceReady(true);
          return;
        }
        await api.post('/resources', { dayId, type: 'QUIZ' });
        if (!cancelled) setQuizResourceReady(true);
      } catch (err: any) {
        if (!cancelled) {
          setQuizResourceError(err.response?.data?.message || 'Could not create Quiz resource. Ensure migrations are run on the server.');
        }
      } finally {
        if (!cancelled) setQuizResourceLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resourceType, dayId]);

  // FLASH_CARDS: ensure one Flash Cards resource exists for this day
  useEffect(() => {
    if (resourceType !== 'FLASH_CARDS') return;
    let cancelled = false;
    (async () => {
      setFlashCardResourceLoading(true);
      setFlashCardResourceError('');
      try {
        const res = await api.get(`/resources?dayId=${dayId}`);
        const resources = res.data?.data ?? [];
        const hasFlashCards = resources.some((r: { type: string }) => r.type === 'FLASH_CARDS');
        if (hasFlashCards) {
          if (!cancelled) setFlashCardResourceReady(true);
          return;
        }
        await api.post('/resources', { dayId, type: 'FLASH_CARDS' });
        if (!cancelled) setFlashCardResourceReady(true);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } };
        if (!cancelled) {
          setFlashCardResourceError(e.response?.data?.message || 'Could not create Flash Cards resource.');
        }
      } finally {
        if (!cancelled) setFlashCardResourceLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [resourceType, dayId]);

  const createFlashCardResource = async () => {
    setCreatingFlashCardResource(true);
    setFlashCardResourceError('');
    setFlashCardResourceCreatedSuccess(false);
    try {
      await api.post('/resources', { dayId, type: 'FLASH_CARDS' });
      setFlashCardResourceReady(true);
      setFlashCardResourceError('');
      setFlashCardResourceCreatedSuccess(true);
      setTimeout(() => setFlashCardResourceCreatedSuccess(false), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setFlashCardResourceError(e.response?.data?.message || 'Could not create Flash Cards resource. Try again.');
    } finally {
      setCreatingFlashCardResource(false);
    }
  };

  const createQuizResource = async () => {
    setCreatingQuizResource(true);
    setQuizResourceError('');
    setQuizResourceCreatedSuccess(false);
    try {
      await api.post('/resources', { dayId, type: 'QUIZ' });
      setQuizResourceReady(true);
      setQuizResourceError('');
      setQuizResourceCreatedSuccess(true);
      setTimeout(() => setQuizResourceCreatedSuccess(false), 4000);
    } catch (err: any) {
      setQuizResourceError(err.response?.data?.message || 'Could not create Quiz resource. Run migrations and try again.');
    } finally {
      setCreatingQuizResource(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        dayId,
        type: resourceType,
        title: title.trim() || undefined,
      };

      switch (resourceType) {
        case 'VIDEO':
          if (!videoUrl.trim()) {
            setError('Video URL is required');
            setLoading(false);
            return;
          }
          payload.videoUrl = videoUrl.trim();
          break;

        case 'NOTES':
          if (noteParagraphs.length === 0 || noteParagraphs.some(p => !p.content.trim())) {
            setError('At least one paragraph with content is required');
            setLoading(false);
            return;
          }
          payload.noteParagraphs = noteParagraphs.filter(p => p.content.trim());
          break;
        case 'BRIEF_NOTES':
          if (!briefNotesContent.trim()) {
            setError('Content is required for Brief Notes');
            setLoading(false);
            return;
          }
          payload.briefNotesContent = briefNotesContent.trim();
          break;

        case 'FLASH_CARDS':
          if (flashCards.length === 0 || flashCards.some(c => !c.question.trim() || !c.answer.trim())) {
            setError('At least one flash card with both question and answer is required');
            setLoading(false);
            return;
          }
          payload.flashCards = flashCards.filter(c => c.question.trim() && c.answer.trim());
          break;

        case 'SHORT_QUESTIONS':
          if (shortQuestions.length === 0 || shortQuestions.some(q => !q.question.trim() || !q.answer.trim())) {
            setError('At least one question with both question and answer is required');
            setLoading(false);
            return;
          }
          // Send all questions as array
          payload.shortQuestions = shortQuestions.filter(q => q.question.trim() && q.answer.trim());
          break;

        case 'ASSIGNMENT':
          if (assignmentQuestions.length === 0 || assignmentQuestions.some(aq => !aq.question.trim())) {
            setError('At least one assignment question is required');
            setLoading(false);
            return;
          }
          // Send all questions as array
          payload.assignmentQuestions = assignmentQuestions.filter(aq => aq.question.trim());
          break;

        case 'GLOSSARY':
          if (glossaryWords.length === 0 || glossaryWords.some(gw => !gw.word.trim() || !gw.meaning.trim())) {
            setError('At least one glossary word with word and meaning is required');
            setLoading(false);
            return;
          }
          payload.glossaryWords = glossaryWords.filter(gw => gw.word.trim() && gw.meaning.trim());
          break;

        case 'RECOMMENDATION':
          if (recommendations.length === 0 || recommendations.some(r => !r.title.trim() || !r.content.trim())) {
            setError('At least one recommendation with title and content is required');
            setLoading(false);
            return;
          }
          payload.recommendations = recommendations.filter(r => r.title.trim() && r.content.trim());
          break;
      }

      const response = await api.post('/resources', payload);
      if (response.data.success) {
        // Show success animation
        setShowSuccess(true);
        setLoading(false);
        
        // Redirect after animation
        setTimeout(() => {
          router.push(`/dashboard/courses/${courseId}/days/${dayId}`);
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to create resource');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      setLoading(false);
    }
  };

  // QUIZ: full-page attach-quiz UI (like other resource types open a page)
  if (resourceType === 'QUIZ') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/courses/${courseId}/days/${dayId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to day
          </Link>
        </Button>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quiz Resource
            </CardTitle>
            <CardDescription>
              Add and manage quizzes for this day. Use “New Quiz” to create a quiz; it will be linked to this day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {quizResourceLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {quizResourceCreatedSuccess && (
                  <div className="mb-6 p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Quiz resource created successfully. You can now add quizzes for this day below.</p>
                  </div>
                )}
                <QuizResourceAttachView
                  dayId={dayId}
                  courseId={courseId}
                  children={
                    <div className="border-t pt-4 mt-6 flex justify-between items-center">
                      <Button
                        type="button"
                        onClick={createQuizResource}
                        disabled={creatingQuizResource}
                      >
                        {creatingQuizResource ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating…
                          </>
                        ) : (
                          'Create Resource'
                        )}
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/dashboard/courses/${courseId}/days/${dayId}`}>Back to day</Link>
                      </Button>
                    </div>
                  }
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // FLASH_CARDS: full-page deck attach UI (like Quiz Resource)
  if (resourceType === 'FLASH_CARDS') {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/dashboard/courses/${courseId}/days/${dayId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to day
          </Link>
        </Button>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Flash Card Resource
            </CardTitle>
            <CardDescription>
              Add and manage flash card decks for this day. Create a deck with question/answer cards; it will be linked to this day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {flashCardResourceLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {flashCardResourceCreatedSuccess && (
                  <div className="mb-6 p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Flash Card resource created. You can add decks below.</p>
                  </div>
                )}
                <FlashCardDeckAttachView
                  dayId={dayId}
                  courseId={courseId}
                  children={
                    <div className="border-t pt-4 mt-6 flex justify-between items-center">
                      <Button
                        type="button"
                        onClick={createFlashCardResource}
                        disabled={creatingFlashCardResource}
                      >
                        {creatingFlashCardResource ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating…
                          </>
                        ) : (
                          'Create Resource'
                        )}
                      </Button>
                      <Button asChild variant="outline">
                        <Link href={`/dashboard/courses/${courseId}/days/${dayId}`}>Back to day</Link>
                      </Button>
                    </div>
                  }
                />
              </>
            )}
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
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Create {resourceType === 'VIDEO' ? 'Video' : resourceType === 'NOTES' ? 'Key Points' : resourceType === 'BRIEF_NOTES' ? 'Brief Notes' : resourceType === 'SHORT_QUESTIONS' ? 'Short Questions' : resourceType === 'ASSIGNMENT' ? 'Assignment' : resourceType === 'GLOSSARY' ? 'Glossary' : resourceType === 'RECOMMENDATION' ? 'Recommendation' : 'Resource'} Resource</CardTitle>
            <CardDescription>
              Add a new {(resourceType === 'NOTES' ? 'key points' : resourceType === 'BRIEF_NOTES' ? 'brief notes' : resourceType.toLowerCase().replace(/_/g, ' '))} resource to this day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Common: Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Introduction Video, Day 1 Notes"
                  disabled={loading}
                />
              </div>

              {/* VIDEO */}
              {resourceType === 'VIDEO' && (
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL *</Label>
                  <Input
                    id="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports YouTube, Vimeo, or any external video URL
                  </p>
                </div>
              )}

              {/* NOTES: multiple paragraphs */}
              {resourceType === 'NOTES' && (
                <div className="space-y-4">
                  <Label>Note Paragraphs *</Label>
                  {noteParagraphs.map((para, index) => {
                    const isCollapsed = collapsedParagraphs.has(index);
                    return (
                      <Card key={index} className="border-l-4 border-l-primary overflow-hidden">
                        <div className="p-4">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleParagraphCollapse(index)}
                            onKeyDown={(e) => e.key === 'Enter' && toggleParagraphCollapse(index)}
                            className="flex items-center justify-between mb-3 cursor-pointer select-none rounded-lg py-1 -mx-1 px-1 hover:bg-muted/50 active:bg-muted/70 transition-colors duration-200"
                            aria-expanded={!isCollapsed}
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                                {isCollapsed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </span>
                              <Label className="text-sm font-semibold cursor-pointer">
                                Paragraph {index + 1}
                              </Label>
                            </div>
                            {noteParagraphs.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNoteParagraph(index);
                                }}
                                className="h-8 w-8 shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}
                          >
                            <div className="space-y-3 pl-10">
                              <Input
                                placeholder="Heading (optional)"
                                value={para.heading}
                                onChange={(e) => updateNoteParagraph(index, 'heading', e.target.value)}
                                disabled={loading}
                              />
                              <div>
                                <Label className="text-sm mb-2 block">Content *</Label>
                                <RichTextEditor
                                  value={para.content}
                                  onChange={(value) => updateNoteParagraph(index, 'content', value)}
                                  placeholder="Enter content with rich text formatting..."
                                  disabled={loading}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addNoteParagraph}
                    disabled={loading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Paragraph
                  </Button>
                </div>
              )}

              {/* BRIEF_NOTES: single rich text (blog-style) */}
              {resourceType === 'BRIEF_NOTES' && (
                <div className="space-y-4">
                  <Label>Content *</Label>
                  <p className="text-sm text-muted-foreground">
                    Write your brief notes in one rich text block. Format with headings, lists, and tables as needed.
                  </p>
                  <RichTextEditor
                    value={briefNotesContent}
                    onChange={setBriefNotesContent}
                    placeholder="Enter your brief notes content..."
                    disabled={loading}
                  />
                </div>
              )}

              {/* SHORT_QUESTIONS */}
              {resourceType === 'SHORT_QUESTIONS' && (
                <div className="space-y-4">
                  <Label>Short Questions *</Label>
                  {shortQuestions.map((qa, index) => {
                    const isCollapsed = collapsedQuestions.has(index);
                    return (
                      <Card key={index} className="border-l-4 border-l-primary overflow-hidden">
                        <div className="p-4">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleQuestionCollapse(index)}
                            onKeyDown={(e) => e.key === 'Enter' && toggleQuestionCollapse(index)}
                            className="flex items-center justify-between mb-3 cursor-pointer select-none rounded-lg py-1 -mx-1 px-1 hover:bg-muted/50 active:bg-muted/70 transition-colors duration-200"
                            aria-expanded={!isCollapsed}
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                                {isCollapsed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </span>
                              <Label className="text-sm font-semibold cursor-pointer">
                                Question {index + 1}
                              </Label>
                            </div>
                            {shortQuestions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeShortQuestion(index);
                                }}
                                className="h-8 w-8 shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}
                          >
                            <div className="space-y-3 pl-10">
                              <div className="space-y-2">
                                <Label htmlFor={`question-${index}`}>Question *</Label>
                                <Textarea
                                  id={`question-${index}`}
                                  value={qa.question}
                                  onChange={(e) => updateShortQuestion(index, 'question', e.target.value)}
                                  placeholder="Enter the question"
                                  rows={3}
                                  required
                                  disabled={loading}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`answer-${index}`}>Answer *</Label>
                                <Textarea
                                  id={`answer-${index}`}
                                  value={qa.answer}
                                  onChange={(e) => updateShortQuestion(index, 'answer', e.target.value)}
                                  placeholder="Enter the answer"
                                  rows={4}
                                  required
                                  disabled={loading}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addShortQuestion}
                    disabled={loading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Question
                  </Button>
                </div>
              )}

              {/* ASSIGNMENT */}
              {resourceType === 'ASSIGNMENT' && (
                <div className="space-y-4">
                  <Label>Assignment Questions *</Label>
                  {assignmentQuestions.map((aq, index) => {
                    const isCollapsed = collapsedAssignments.has(index);
                    return (
                      <Card key={index} className="border-l-4 border-l-primary overflow-hidden">
                        <div className="p-4">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleAssignmentCollapse(index)}
                            onKeyDown={(e) => e.key === 'Enter' && toggleAssignmentCollapse(index)}
                            className="flex items-center justify-between mb-3 cursor-pointer select-none rounded-lg py-1 -mx-1 px-1 hover:bg-muted/50 active:bg-muted/70 transition-colors duration-200"
                            aria-expanded={!isCollapsed}
                          >
                            <div className="flex items-center gap-2">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                                {isCollapsed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </span>
                              <Label className="text-sm font-semibold cursor-pointer">
                                Assignment Question {index + 1}
                              </Label>
                            </div>
                            {assignmentQuestions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAssignmentQuestion(index);
                                }}
                                className="h-8 w-8 shrink-0"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          <div
                            className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}
                          >
                            <div className="space-y-2 pl-10">
                              <Label htmlFor={`assignment-${index}`}>Question *</Label>
                              <Textarea
                                id={`assignment-${index}`}
                                value={aq.question}
                                onChange={(e) => updateAssignmentQuestion(index, e.target.value)}
                                placeholder="Enter the assignment question or instructions"
                                rows={6}
                                required
                                disabled={loading}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addAssignmentQuestion}
                    disabled={loading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Assignment Question
                  </Button>
                </div>
              )}

              {resourceType === 'GLOSSARY' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {glossaryWords.map((gw, index) => {
                      const isCollapsed = collapsedGlossary.has(index);
                      return (
                        <Card key={index} className="border-l-4 border-l-primary overflow-hidden">
                          <div className="p-4">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleGlossaryCollapse(index)}
                              onKeyDown={(e) => e.key === 'Enter' && toggleGlossaryCollapse(index)}
                              className="flex items-center justify-between mb-2 cursor-pointer select-none rounded-lg py-1 -mx-1 px-1 hover:bg-muted/50 active:bg-muted/70 transition-colors duration-200"
                              aria-expanded={!isCollapsed}
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                                  {isCollapsed ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronUp className="h-4 w-4" />
                                  )}
                                </span>
                                <Label className="text-base font-semibold cursor-pointer">Word {index + 1}</Label>
                              </div>
                              {glossaryWords.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeGlossaryWord(index);
                                  }}
                                  className="h-10 w-10 shrink-0"
                                >
                                  <Trash2 className="h-6 w-6 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-10">
                                <div className="space-y-2">
                                  <Label htmlFor={`glossary-word-${index}`}>Word *</Label>
                                  <Input
                                    id={`glossary-word-${index}`}
                                    value={gw.word}
                                    onChange={(e) => updateGlossaryWord(index, 'word', e.target.value)}
                                    placeholder="Enter the word or term"
                                    required
                                    disabled={loading}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`glossary-meaning-${index}`}>Meaning *</Label>
                                  <Textarea
                                    id={`glossary-meaning-${index}`}
                                    value={gw.meaning}
                                    onChange={(e) => updateGlossaryWord(index, 'meaning', e.target.value)}
                                    placeholder="Enter the meaning or definition"
                                    rows={4}
                                    required
                                    disabled={loading}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addGlossaryWord}
                    disabled={loading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Word
                  </Button>
                </div>
              )}

              {resourceType === 'RECOMMENDATION' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => {
                      const isCollapsed = collapsedRecommendations.has(index);
                      return (
                        <Card key={index} className="border-l-4 border-l-primary overflow-hidden">
                          <div className="p-4">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleRecommendationCollapse(index)}
                              onKeyDown={(e) => e.key === 'Enter' && toggleRecommendationCollapse(index)}
                              className="flex items-center justify-between mb-2 cursor-pointer select-none rounded-lg py-1 -mx-1 px-1 hover:bg-muted/50 active:bg-muted/70 transition-colors duration-200"
                              aria-expanded={!isCollapsed}
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                                  {isCollapsed ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronUp className="h-4 w-4" />
                                  )}
                                </span>
                                <Label className="text-base font-semibold cursor-pointer">Recommendation {index + 1}</Label>
                              </div>
                              {recommendations.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeRecommendation(index);
                                  }}
                                  className="h-10 w-10 shrink-0"
                                >
                                  <Trash2 className="h-6 w-6 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <div
                              className={`overflow-hidden transition-all duration-300 ease-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}
                            >
                              <div className="space-y-3 pl-10">
                                <div className="space-y-2">
                                  <Label htmlFor={`rec-title-${index}`}>Title *</Label>
                                  <Input
                                    id={`rec-title-${index}`}
                                    value={rec.title}
                                    onChange={(e) => updateRecommendation(index, 'title', e.target.value)}
                                    placeholder="Enter recommendation title"
                                    required
                                    disabled={loading}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`rec-content-${index}`}>Content *</Label>
                                  <Textarea
                                    id={`rec-content-${index}`}
                                    value={rec.content}
                                    onChange={(e) => updateRecommendation(index, 'content', e.target.value)}
                                    placeholder="Enter recommendation content"
                                    rows={5}
                                    required
                                    disabled={loading}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRecommendation}
                    disabled={loading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Recommendation
                  </Button>
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/courses/${courseId}/days/${dayId}`)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Resource'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

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
                Resource Created!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Your {resourceType === 'VIDEO' ? 'video' : resourceType === 'NOTES' ? 'key points' : resourceType === 'BRIEF_NOTES' ? 'brief notes' : resourceType === 'SHORT_QUESTIONS' ? 'short questions' : resourceType === 'ASSIGNMENT' ? 'assignment' : resourceType === 'GLOSSARY' ? 'glossary' : resourceType === 'RECOMMENDATION' ? 'recommendation' : 'resource'} resource has been successfully created and saved.
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
