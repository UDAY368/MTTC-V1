'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function EditResourcePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const dayId = params.dayId as string;
  const resourceId = params.resourceId as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  // Common fields
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState<string>('');

  // VIDEO fields
  const [videoUrl, setVideoUrl] = useState('');

  // NOTES fields
  const [noteParagraphs, setNoteParagraphs] = useState<Array<{ heading: string; content: string }>>([]);
  const [collapsedParagraphs, setCollapsedParagraphs] = useState<Set<number>>(new Set());

  // FLASH_CARDS fields
  const [flashCards, setFlashCards] = useState<Array<{ question: string; answer: string }>>([]);
  const [collapsedFlashCards, setCollapsedFlashCards] = useState<Set<number>>(new Set());

  // SHORT_QUESTIONS fields
  const [shortQuestions, setShortQuestions] = useState<Array<{ question: string; answer: string }>>([]);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<number>>(new Set());

  // ASSIGNMENT fields
  const [assignmentQuestions, setAssignmentQuestions] = useState<Array<{ question: string }>>([]);
  const [collapsedAssignments, setCollapsedAssignments] = useState<Set<number>>(new Set());

  // GLOSSARY fields
  const [glossaryWords, setGlossaryWords] = useState<Array<{ word: string; meaning: string }>>([]);
  const [collapsedGlossary, setCollapsedGlossary] = useState<Set<number>>(new Set());

  // RECOMMENDATION fields
  const [recommendations, setRecommendations] = useState<Array<{ title: string; content: string }>>([]);
  const [collapsedRecommendations, setCollapsedRecommendations] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchResource();
  }, [resourceId]);

  const fetchResource = async () => {
    try {
      setFetching(true);
      const response = await api.get(`/resources/${resourceId}`);
      const resource = response.data.data;

      setTitle(resource.title || '');
      setResourceType(resource.type);

      switch (resource.type) {
        case 'VIDEO':
          setVideoUrl(resource.videoUrl || '');
          break;
        case 'NOTES':
        case 'BRIEF_NOTES':
          setNoteParagraphs(
            resource.noteParagraphs?.map((p: any) => ({
              heading: p.heading || '',
              content: p.content,
            })) || []
          );
          break;
        case 'FLASH_CARDS':
          setFlashCards(
            resource.flashCards?.map((c: any) => ({
              question: c.question,
              answer: c.answer,
            })) || []
          );
          break;
        case 'SHORT_QUESTIONS':
          // For existing resources, check if we have shortQuestions array or legacy single Q&A
          if (resource.shortQuestions && Array.isArray(resource.shortQuestions) && resource.shortQuestions.length > 0) {
            setShortQuestions(
              resource.shortQuestions.map((qa: any) => ({
                question: qa.question || '',
                answer: qa.answer || '',
              }))
            );
          } else if (resource.question && resource.answer) {
            // Legacy format: single Q&A
            setShortQuestions([{ question: resource.question, answer: resource.answer }]);
          } else {
            setShortQuestions([{ question: '', answer: '' }]);
          }
          break;
        case 'ASSIGNMENT':
          // For existing resources, check if we have assignmentQuestions array or legacy single question
          if (resource.assignmentQuestions && Array.isArray(resource.assignmentQuestions) && resource.assignmentQuestions.length > 0) {
            setAssignmentQuestions(
              resource.assignmentQuestions.map((aq: any) => ({
                question: aq.question || '',
              }))
            );
          } else if (resource.assignmentQuestion) {
            // Legacy format: single question
            setAssignmentQuestions([{ question: resource.assignmentQuestion }]);
          } else {
            setAssignmentQuestions([{ question: '' }]);
          }
          break;
        case 'GLOSSARY':
          if (resource.glossaryWords && Array.isArray(resource.glossaryWords) && resource.glossaryWords.length > 0) {
            setGlossaryWords(
              resource.glossaryWords.map((gw: any) => ({
                word: gw.word || '',
                meaning: gw.meaning || '',
              }))
            );
          } else {
            setGlossaryWords([{ word: '', meaning: '' }]);
          }
          break;
        case 'RECOMMENDATION':
          if (resource.recommendations && Array.isArray(resource.recommendations) && resource.recommendations.length > 0) {
            setRecommendations(
              resource.recommendations.map((r: any) => ({
                title: r.title || '',
                content: r.content || '',
              }))
            );
          } else {
            setRecommendations([{ title: '', content: '' }]);
          }
          break;
      }
    } catch (error: any) {
      console.error('Error fetching resource:', error);
      setError(error.response?.data?.message || 'Failed to load resource');
    } finally {
      setFetching(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
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
        case 'BRIEF_NOTES':
          if (noteParagraphs.length === 0 || noteParagraphs.some(p => !p.content.trim())) {
            setError('At least one paragraph with content is required');
            setLoading(false);
            return;
          }
          payload.noteParagraphs = noteParagraphs.filter(p => p.content.trim());
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
          // Send all words as array
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

      const response = await api.put(`/resources/${resourceId}`, payload);
      if (response.data.success) {
        router.push(`/dashboard/courses/${courseId}/days/${dayId}`);
      } else {
        setError(response.data.message || 'Failed to update resource');
      }
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
            <CardTitle>Edit Resource</CardTitle>
            <CardDescription>
              Update {(resourceType === 'NOTES' ? 'key points' : resourceType === 'BRIEF_NOTES' ? 'brief notes' : resourceType?.toLowerCase().replace(/_/g, ' '))} resource
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
                </div>
              )}

              {/* NOTES and BRIEF_NOTES */}
              {(resourceType === 'NOTES' || resourceType === 'BRIEF_NOTES') && (
                <div className="space-y-4">
                  <Label>{resourceType === 'BRIEF_NOTES' ? 'Brief Note Sections *' : 'Note Paragraphs *'}</Label>
                  {noteParagraphs.map((para, index) => {
                    const isCollapsed = collapsedParagraphs.has(index);
                    return (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleParagraphCollapse(index)}
                                className="h-8 w-8"
                              >
                                {isCollapsed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </Button>
                              <Label className="text-sm font-semibold">
                                Paragraph {index + 1}
                              </Label>
                            </div>
                            {noteParagraphs.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeNoteParagraph(index)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          {!isCollapsed && (
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
                          )}
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

              {/* FLASH_CARDS */}
              {resourceType === 'FLASH_CARDS' && (
                <div className="space-y-4">
                  <Label>Flash Cards *</Label>
                  {flashCards.map((card, index) => {
                    const isCollapsed = collapsedFlashCards.has(index);
                    return (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleFlashCardCollapse(index)}
                                className="h-8 w-8"
                              >
                                {isCollapsed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </Button>
                              <Label className="text-sm font-semibold">
                                Card {index + 1}
                              </Label>
                            </div>
                            {flashCards.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFlashCard(index)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          {!isCollapsed && (
                            <div className="space-y-3 pl-10">
                              <Input
                                placeholder="Question (front of card) *"
                                value={card.question}
                                onChange={(e) => updateFlashCard(index, 'question', e.target.value)}
                                required
                                disabled={loading}
                              />
                              <Textarea
                                placeholder="Answer (back of card) *"
                                value={card.answer}
                                onChange={(e) => updateFlashCard(index, 'answer', e.target.value)}
                                rows={3}
                                required
                                disabled={loading}
                              />
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFlashCard}
                    disabled={loading}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Flash Card
                  </Button>
                </div>
              )}

              {/* SHORT_QUESTIONS */}
              {resourceType === 'SHORT_QUESTIONS' && (
                <div className="space-y-4">
                  <Label>Short Questions *</Label>
                  {shortQuestions.map((qa, index) => {
                    const isCollapsed = collapsedQuestions.has(index);
                    return (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleQuestionCollapse(index)}
                                className="h-8 w-8"
                              >
                                {isCollapsed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </Button>
                              <Label className="text-sm font-semibold">
                                Question {index + 1}
                              </Label>
                            </div>
                            {shortQuestions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeShortQuestion(index)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          {!isCollapsed && (
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
                          )}
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
                      <Card key={index} className="border-l-4 border-l-primary">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleAssignmentCollapse(index)}
                                className="h-8 w-8"
                              >
                                {isCollapsed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </Button>
                              <Label className="text-sm font-semibold">
                                Assignment Question {index + 1}
                              </Label>
                            </div>
                            {assignmentQuestions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAssignmentQuestion(index)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                          {!isCollapsed && (
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
                          )}
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
                        <Card key={index} className="border-l-4 border-l-primary">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleGlossaryCollapse(index)}
                                  className="p-1 hover:bg-muted rounded"
                                >
                                  {isCollapsed ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                                <Label className="text-base font-semibold">Word {index + 1}</Label>
                              </div>
                              {glossaryWords.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeGlossaryWord(index)}
                                  className="h-10 w-10"
                                >
                                  <Trash2 className="h-6 w-6 text-destructive" />
                                </Button>
                              )}
                            </div>
                            {!isCollapsed && (
                              <div className="space-y-3 pl-10">
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
                            )}
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
                        <Card key={index} className="border-l-4 border-l-primary">
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleRecommendationCollapse(index)}
                                  className="p-1 hover:bg-muted rounded"
                                >
                                  {isCollapsed ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                                <Label className="text-base font-semibold">Recommendation {index + 1}</Label>
                              </div>
                              {recommendations.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRecommendation(index)}
                                  className="h-10 w-10"
                                >
                                  <Trash2 className="h-6 w-6 text-destructive" />
                                </Button>
                              )}
                            </div>
                            {!isCollapsed && (
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
                            )}
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
                      Updating...
                    </>
                  ) : (
                    'Update Resource'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
