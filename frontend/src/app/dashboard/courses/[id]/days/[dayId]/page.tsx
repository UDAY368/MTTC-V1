'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  BookOpen,
  GripVertical,
  Play,
  X,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface Day {
  id: string;
  title: string;
  description?: string;
  course: {
    id: string;
    name: string;
  };
  resources: Resource[];
  dayQuizzes: DayQuiz[];
}

interface Resource {
  id: string;
  type: 'VIDEO' | 'NOTES' | 'BRIEF_NOTES' | 'FLASH_CARDS' | 'SHORT_QUESTIONS' | 'ASSIGNMENT' | 'GLOSSARY' | 'RECOMMENDATION';
  title?: string;
  order: number;
  isVisible: boolean;
  videoUrl?: string;
  question?: string; // Legacy: single Q&A for SHORT_QUESTIONS
  answer?: string; // Legacy: single Q&A for SHORT_QUESTIONS
  assignmentQuestion?: string;
  noteParagraphs?: NoteParagraph[];
  flashCards?: FlashCard[];
  shortQuestions?: Array<{ id: string; question: string; answer: string; order: number }>;
  assignmentQuestions?: Array<{ id: string; question: string; order: number }>;
  glossaryWords?: Array<{ id: string; word: string; meaning: string; order: number }>;
  recommendations?: Array<{ id: string; title: string; content: string; order: number }>;
}

interface NoteParagraph {
  id: string;
  heading?: string;
  content: string;
  order: number;
}

interface FlashCard {
  id: string;
  question: string;
  answer: string;
  order: number;
}

interface DayQuiz {
  id: string;
  order: number;
  isVisible: boolean;
  quiz: {
    id: string;
    title: string;
    uniqueUrl: string;
    durationMinutes: number;
  };
}

/** Parses text and renders URLs as highlighted links that open in a new tab. */
function linkifyText(text: string): React.ReactNode {
  if (!text || typeof text !== 'string') return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      const href = part.replace(/[.,;:!?)]+$/, '');
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline font-medium hover:opacity-80 break-all"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export default function DayDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const dayId = params.dayId as string;

  const [day, setDay] = useState<Day | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<DayQuiz | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    type: 'resource' | 'quiz' | null;
    item: Resource | DayQuiz | null;
    itemId: string;
  }>({
    show: false,
    type: null,
    item: null,
    itemId: '',
  });
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchDay();
  }, [dayId]);

  const fetchDay = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/days/${dayId}`);
      setDay(response.data.data);
    } catch (error: any) {
      console.error('Error fetching day:', error);
      setError(error.response?.data?.message || 'Failed to load day');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = (resource: Resource) => {
    setDeleteConfirm({
      show: true,
      type: 'resource',
      item: resource,
      itemId: resource.id,
    });
  };

  const handleDeleteResourceConfirm = async () => {
    if (!deleteConfirm.itemId || deleteConfirm.type !== 'resource') return;

    setDeleting(true);
    try {
      await api.delete(`/resources/${deleteConfirm.itemId}`);
      setDeleteConfirm({ show: false, type: null, item: null, itemId: '' });
      fetchDay();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete resource');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleVisibility = async (resourceId: string, currentVisibility: boolean) => {
    try {
      await api.put(`/resources/${resourceId}/visibility`, {
        isVisible: !currentVisibility,
      });
      fetchDay();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update visibility');
    }
  };

  const handleDeleteQuiz = (dayQuiz: DayQuiz) => {
    setDeleteConfirm({
      show: true,
      type: 'quiz',
      item: dayQuiz,
      itemId: dayQuiz.id,
    });
  };

  const handleDeleteQuizConfirm = async () => {
    if (!deleteConfirm.itemId || deleteConfirm.type !== 'quiz') return;

    setDeleting(true);
    try {
      await api.delete(`/day-quizzes/${deleteConfirm.itemId}`);
      setDeleteConfirm({ show: false, type: null, item: null, itemId: '' });
      fetchDay();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove quiz');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, type: null, item: null, itemId: '' });
  };

  const handleToggleQuizVisibility = async (dayQuizId: string, currentVisibility: boolean) => {
    try {
      await api.put(`/day-quizzes/${dayQuizId}`, {
        isVisible: !currentVisibility,
      });
      fetchDay();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update visibility');
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !day) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeIndex = allItems.findIndex(
      item => (item.type === 'resource' ? item.data.id : `quiz-${item.data.id}`) === activeId
    );
    const overIndex = allItems.findIndex(
      item => (item.type === 'resource' ? item.data.id : `quiz-${item.data.id}`) === overId
    );

    if (activeIndex === -1 || overIndex === -1) return;

    // Reorder full list (resources + quizzes) – any item can move to any position
    const newItems = arrayMove(allItems, activeIndex, overIndex);

    // Build payload and optimistic state: assign global order 1, 2, 3, ...
    const itemsPayload = newItems.map((item) => ({
      type: item.type === 'resource' ? ('resource' as const) : ('dayQuiz' as const),
      id: item.data.id,
    }));
    const reorderedResources = newItems
      .filter((item): item is typeof item & { type: 'resource' } => item.type === 'resource')
      .map((item) => ({ ...item.data, order: newItems.indexOf(item) + 1 })) as Resource[];
    const reorderedQuizzes = newItems
      .filter((item): item is typeof item & { type: 'quiz' } => item.type === 'quiz')
      .map((item) => ({ ...item.data, order: newItems.indexOf(item) + 1 })) as DayQuiz[];

    setDay(prev =>
      prev
        ? { ...prev, resources: reorderedResources, dayQuizzes: reorderedQuizzes }
        : null
    );

    api
      .put(`/days/${dayId}/reorder-items`, { items: itemsPayload })
      .catch((err: any) => {
        console.error('Error reordering items:', err);
        alert(err.response?.data?.message || 'Failed to save order');
        fetchDay();
      });
  };

  const getResourceIcon = (type: Resource['type']) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="h-5 w-5" />;
      case 'NOTES':
        return <FileText className="h-5 w-5" />;
      case 'BRIEF_NOTES':
        return <FileText className="h-5 w-5" />;
      case 'FLASH_CARDS':
        return <HelpCircle className="h-5 w-5" />;
      case 'SHORT_QUESTIONS':
        return <HelpCircle className="h-5 w-5" />;
      case 'ASSIGNMENT':
        return <ClipboardList className="h-5 w-5" />;
      case 'GLOSSARY':
        return <BookOpen className="h-5 w-5" />;
      case 'RECOMMENDATION':
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getResourceTypeLabel = (type: Resource['type']) => {
    switch (type) {
      case 'VIDEO':
        return 'Video';
      case 'NOTES':
        return 'Key Points';
      case 'BRIEF_NOTES':
        return 'Brief Notes';
      case 'FLASH_CARDS':
        return 'Flash Cards';
      case 'SHORT_QUESTIONS':
        return 'Short Questions';
      case 'ASSIGNMENT':
        return 'Assignment';
      case 'GLOSSARY':
        return 'Glossary';
      case 'RECOMMENDATION':
        return 'Recommendation';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !day) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/courses/${courseId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error || 'Day not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Combine resources and quizzes, sorted by order
  const allItems = [
    ...day.resources.map(r => ({ type: 'resource' as const, data: r })),
    ...day.dayQuizzes.map(q => ({ type: 'quiz' as const, data: q }))
  ].sort((a, b) => {
    const orderA = a.type === 'resource' ? a.data.order : a.data.order;
    const orderB = b.type === 'resource' ? b.data.order : b.data.order;
    return orderA - orderB;
  });

  // SortableItem component for drag and drop
  interface SortableItemProps {
    item: typeof allItems[0];
    index: number;
    getResourceIcon: (type: Resource['type']) => React.ReactNode;
    getResourceTypeLabel: (type: Resource['type']) => string;
    onPreview: (item: typeof allItems[0]) => void;
    onToggleVisibility: (id: string, isVisible: boolean) => void;
    onEdit: (item: typeof allItems[0]) => void;
    onDelete: (item: typeof allItems[0]) => void;
  }

  function SortableItem({ item, index, getResourceIcon, getResourceTypeLabel, onPreview, onToggleVisibility, onEdit, onDelete }: SortableItemProps) {
    const itemId = item.type === 'resource' ? item.data.id : `quiz-${item.data.id}`;
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: itemId }); // Both resources and quizzes are draggable

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className={`hover:border-primary/50 transition-colors ${!item.data.isVisible ? 'opacity-60' : ''} ${isDragging ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="mt-1 cursor-grab active:cursor-grabbing hover:text-primary"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {item.type === 'resource' ? (
                        <>
                          {getResourceIcon(item.data.type)}
                          <CardTitle className="text-lg">
                            {item.data.title || getResourceTypeLabel(item.data.type)}
                          </CardTitle>
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-5 w-5" />
                          <CardTitle className="text-lg">
                            {item.data.quiz.title}
                          </CardTitle>
                        </>
                      )}
                      {!item.data.isVisible && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Hidden
                        </span>
                      )}
                    </div>
                    {item.type === 'resource' && (
                      <CardDescription className="mt-1">
                        {getResourceTypeLabel(item.data.type)}
                        {item.data.type === 'VIDEO' && item.data.videoUrl && (
                          <span className="ml-2 text-xs">• {item.data.videoUrl}</span>
                        )}
                      </CardDescription>
                    )}
                    {item.type === 'quiz' && (
                      <CardDescription className="mt-1">
                        Quiz • {item.data.quiz.durationMinutes} minutes
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPreview(item)}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleVisibility(item.data.id, item.data.isVisible)}
                    title={item.data.isVisible ? 'Hide' : 'Show'}
                  >
                    {item.data.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/courses/${courseId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-light tracking-wide">{day.title}</h1>
            <p className="text-muted-foreground mt-2">
              {day.description || 'Manage resources and quizzes for this day'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAddQuiz(true)}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Attach Quiz
          </Button>
          <Button onClick={() => setShowAddResource(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Resources and Quizzes List */}
      {allItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No resources yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add resources or quizzes to build the day content
            </p>
            <Button
              variant="outline"
              onClick={() => setShowAddResource(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Resource
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allItems.map(item => item.type === 'resource' ? item.data.id : `quiz-${item.data.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {allItems.map((item, index) => (
                <SortableItem
                  key={item.type === 'resource' ? item.data.id : `quiz-${item.data.id}`}
                  item={item}
                  index={index}
                  getResourceIcon={getResourceIcon}
                  getResourceTypeLabel={getResourceTypeLabel}
                  onPreview={(item) => {
                    if (item.type === 'resource') {
                      setPreviewResource(item.data);
                    } else if (item.type === 'quiz') {
                      setPreviewQuiz(item.data);
                    }
                  }}
                  onToggleVisibility={(id, isVisible) => {
                    if (item.type === 'resource') {
                      handleToggleVisibility(id, isVisible);
                    } else {
                      handleToggleQuizVisibility(id, isVisible);
                    }
                  }}
                  onEdit={(item) => {
                    if (item.type === 'resource') {
                      router.push(`/dashboard/courses/${courseId}/days/${dayId}/resources/${item.data.id}/edit`);
                    } else {
                      router.push(`/dashboard/quizzes/${item.data.quiz.id}/edit`);
                    }
                  }}
                  onDelete={(item) => {
                    if (item.type === 'resource') {
                      handleDeleteResource(item.data);
                    } else {
                      handleDeleteQuiz(item.data);
                    }
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Resource Modal */}
      <AnimatePresence>
        {showAddResource && (
          <AddResourceModal
            dayId={dayId}
            courseId={courseId}
            onClose={() => setShowAddResource(false)}
            onSuccess={() => {
              setShowAddResource(false);
              fetchDay();
            }}
          />
        )}
      </AnimatePresence>

      {/* Add Quiz Modal */}
      <AnimatePresence>
        {showAddQuiz && (
          <AddQuizModal
            dayId={dayId}
            courseId={courseId}
            onClose={() => setShowAddQuiz(false)}
            onSuccess={() => {
              setShowAddQuiz(false);
              fetchDay();
            }}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewResource && (
          <ResourcePreviewModal
            resource={previewResource}
            onClose={() => setPreviewResource(null)}
          />
        )}
      </AnimatePresence>

      {/* Quiz Preview Modal */}
      <AnimatePresence>
        {previewQuiz && (
          <QuizPreviewModal
            dayQuiz={previewQuiz}
            onClose={() => setPreviewQuiz(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm.show && deleteConfirm.item && (
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
                        <CardTitle>
                          Delete {deleteConfirm.type === 'resource' ? 'Resource' : 'Quiz'}
                        </CardTitle>
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
                      Are you sure you want to delete:
                    </p>
                    <p className="text-base font-semibold text-foreground">
                      {deleteConfirm.type === 'resource' 
                        ? `"${(deleteConfirm.item as Resource).title || getResourceTypeLabel((deleteConfirm.item as Resource).type)}"`
                        : `"${(deleteConfirm.item as DayQuiz).quiz.title}"`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {deleteConfirm.type === 'resource' 
                        ? 'This will permanently delete this resource and all its content.'
                        : 'This will remove the quiz from this day. The quiz itself will not be deleted.'
                      }
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
                      onClick={deleteConfirm.type === 'resource' ? handleDeleteResourceConfirm : handleDeleteQuizConfirm}
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
                          Delete
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

// Add Resource Modal Component (simplified - will be expanded)
function AddResourceModal({ dayId, courseId, onClose, onSuccess }: {
  dayId: string;
  courseId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card rounded-lg border max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Add Resource</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Choose a resource type to add</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {(['VIDEO', 'NOTES', 'BRIEF_NOTES', 'FLASH_CARDS', 'SHORT_QUESTIONS', 'ASSIGNMENT', 'GLOSSARY', 'RECOMMENDATION'] as const).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => {
                    router.push(`/dashboard/courses/${courseId}/days/${dayId}/resources/new?type=${type}`);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3">
                    {type === 'VIDEO' && <Video className="h-5 w-5" />}
                    {type === 'NOTES' && <FileText className="h-5 w-5" />}
                    {type === 'BRIEF_NOTES' && <FileText className="h-5 w-5" />}
                    {type === 'FLASH_CARDS' && <HelpCircle className="h-5 w-5" />}
                    {type === 'SHORT_QUESTIONS' && <HelpCircle className="h-5 w-5" />}
                    {type === 'ASSIGNMENT' && <ClipboardList className="h-5 w-5" />}
                    {type === 'GLOSSARY' && <BookOpen className="h-5 w-5" />}
                    {type === 'RECOMMENDATION' && <Lightbulb className="h-5 w-5" />}
                    <div className="text-left">
                      <div className="font-medium">
                        {type === 'VIDEO' && 'Video'}
                        {type === 'NOTES' && 'Key Points'}
                        {type === 'BRIEF_NOTES' && 'Brief Notes'}
                        {type === 'FLASH_CARDS' && 'Flash Cards'}
                        {type === 'SHORT_QUESTIONS' && 'Short Questions'}
                        {type === 'ASSIGNMENT' && 'Assignment'}
                        {type === 'GLOSSARY' && 'Glossary'}
                        {type === 'RECOMMENDATION' && 'Recommendation'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {type === 'VIDEO' && 'Add a video URL (YouTube/Vimeo)'}
                        {type === 'NOTES' && 'Add key points with multiple paragraphs'}
                        {type === 'BRIEF_NOTES' && 'Add brief notes with tables and rich formatting'}
                        {type === 'FLASH_CARDS' && 'Create flip cards (Q&A pairs)'}
                        {type === 'SHORT_QUESTIONS' && 'Add a simple Q&A pair'}
                        {type === 'ASSIGNMENT' && 'Add an assignment question'}
                        {type === 'GLOSSARY' && 'Add words and their meanings'}
                        {type === 'RECOMMENDATION' && 'Add multiple recommendations (title + content)'}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Add Quiz Modal Component
function AddQuizModal({ dayId, courseId, onClose, onSuccess }: {
  dayId: string;
  courseId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await api.get(`/quizzes?courseId=${courseId}`);
      setQuizzes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuizId) return;

    setSubmitting(true);
    try {
      await api.post('/day-quizzes', {
        dayId,
        quizId: selectedQuizId,
      });
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to attach quiz');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
              <CardTitle>Attach Quiz</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>Select a quiz to attach to this day</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : quizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No quizzes available. Create a quiz first.
                </p>
              ) : (
                <div className="space-y-2">
                  {quizzes.map((quiz) => (
                    <label
                      key={quiz.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    >
                      <input
                        type="radio"
                        name="quiz"
                        value={quiz.id}
                        checked={selectedQuizId === quiz.id}
                        onChange={(e) => setSelectedQuizId(e.target.value)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{quiz.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {quiz.durationMinutes} minutes
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!selectedQuizId || submitting || quizzes.length === 0}
                >
                  {submitting ? 'Attaching...' : 'Attach Quiz'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Resource Preview Modal Component
function ResourcePreviewModal({ resource, onClose }: {
  resource: Resource;
  onClose: () => void;
}) {
  const [collapsedPreviewParagraphs, setCollapsedPreviewParagraphs] = useState<Set<string>>(new Set());
  const [collapsedPreviewQuestions, setCollapsedPreviewQuestions] = useState<Set<string>>(new Set());
  const [collapsedPreviewRecommendations, setCollapsedPreviewRecommendations] = useState<Set<string>>(new Set());

  // Initialize collapsed states: all collapsed except the first item
  useEffect(() => {
    // For Notes / Brief Notes paragraphs: collapse all except first
    if ((resource.type === 'NOTES' || resource.type === 'BRIEF_NOTES') && resource.noteParagraphs && resource.noteParagraphs.length > 0) {
      const allIdsExceptFirst = resource.noteParagraphs
        .slice(1)
        .map(para => para.id);
      setCollapsedPreviewParagraphs(new Set(allIdsExceptFirst));
    }

    // For Short Questions: collapse all except first
    if (resource.type === 'SHORT_QUESTIONS' && resource.shortQuestions && resource.shortQuestions.length > 0) {
      const allIdsExceptFirst = resource.shortQuestions
        .slice(1)
        .map(qa => qa.id);
      setCollapsedPreviewQuestions(new Set(allIdsExceptFirst));
    }

    // For Recommendations: collapse all except first
    if (resource.type === 'RECOMMENDATION' && resource.recommendations && resource.recommendations.length > 0) {
      const allIdsExceptFirst = resource.recommendations
        .slice(1)
        .map(r => r.id);
      setCollapsedPreviewRecommendations(new Set(allIdsExceptFirst));
    }
  }, [resource]);

  const togglePreviewParagraph = (paraId: string) => {
    setCollapsedPreviewParagraphs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paraId)) {
        newSet.delete(paraId);
      } else {
        newSet.add(paraId);
      }
      return newSet;
    });
  };

  const togglePreviewQuestion = (questionId: string) => {
    setCollapsedPreviewQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const togglePreviewRecommendation = (id: string) => {
    setCollapsedPreviewRecommendations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Function to convert video URLs to embeddable format
  const getEmbedUrl = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;
    const u = url.trim();
    // YouTube: watch, embed, youtu.be
    const ytWatch = /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/i;
    const ytEmbed = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i;
    const ytShort = /youtu\.be\/([a-zA-Z0-9_-]{11})/i;
    const ytMatch = u.match(ytWatch) || u.match(ytEmbed) || u.match(ytShort);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = u.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    // Direct video files: use <video>
    if (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(u)) return null;
    return null;
  };

  const videoUrl = resource.type === 'VIDEO' ? (resource.videoUrl ?? '').toString().trim() : '';
  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;
  const isDirectVideo = !!videoUrl && !embedUrl && /\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(videoUrl);

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
              <CardTitle>Preview: {resource.title || 'Resource'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Preview content based on resource type */}
            {resource.type === 'VIDEO' && (
              <div className="space-y-4">
                <div
                  className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl border border-border"
                  style={{ aspectRatio: '16/9', minHeight: 280 }}
                >
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      title={resource.title ? `Video: ${resource.title}` : 'Video preview'}
                    />
                  ) : isDirectVideo ? (
                    <video
                      src={videoUrl}
                      controls
                      className="absolute inset-0 w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : videoUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-muted">
                      <Video className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center mb-2">
                        Use a YouTube, Vimeo, or direct video link (e.g. .mp4).
                      </p>
                      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm break-all">
                        {videoUrl}
                      </a>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-muted">
                      <Video className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">No video URL set.</p>
                    </div>
                  )}
                </div>
                {videoUrl && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Video URL: </span>
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {videoUrl}
                    </a>
                  </div>
                )}
              </div>
            )}
            {(resource.type === 'NOTES' || resource.type === 'BRIEF_NOTES') && resource.noteParagraphs && (
              <div className="space-y-3">
                <style jsx global>{`
                  .rich-text-content {
                    line-height: 1.75;
                  }
                  .rich-text-content h1,
                  .rich-text-content h2,
                  .rich-text-content h3,
                  .rich-text-content h4,
                  .rich-text-content h5,
                  .rich-text-content h6 {
                    font-weight: 600;
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                  }
                  .rich-text-content h1 { font-size: 2em; }
                  .rich-text-content h2 { font-size: 1.5em; }
                  .rich-text-content h3 { font-size: 1.25em; }
                  .rich-text-content h4 { font-size: 1.1em; }
                  .rich-text-content p {
                    margin-bottom: 1em;
                  }
                  .rich-text-content ul,
                  .rich-text-content ol {
                    margin-left: 1.5em;
                    margin-bottom: 1em;
                  }
                  .rich-text-content li {
                    margin-bottom: 0.5em;
                  }
                  .rich-text-content strong {
                    font-weight: 600;
                  }
                  .rich-text-content em {
                    font-style: italic;
                  }
                  .rich-text-content u {
                    text-decoration: underline;
                  }
                  .rich-text-content blockquote {
                    border-left: 4px solid hsl(var(--border));
                    padding-left: 1em;
                    margin: 1em 0;
                    font-style: italic;
                  }
                  .rich-text-content a {
                    color: hsl(var(--primary));
                    text-decoration: underline;
                  }
                  .rich-text-content a:hover {
                    text-decoration: none;
                  }
                  .rich-text-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.375rem;
                    margin: 1em 0;
                  }
                  .rich-text-content table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 1em 0;
                  }
                  .rich-text-content td,
                  .rich-text-content th {
                    border: 1px solid hsl(var(--border));
                    padding: 0.5em 0.75em;
                    vertical-align: top;
                  }
                  .rich-text-content th {
                    font-weight: 600;
                    background: hsl(var(--muted) / 0.5);
                  }
                `}</style>
                {resource.noteParagraphs.map((para, index) => {
                  const isCollapsed = collapsedPreviewParagraphs.has(para.id);
                  const displayHeading = para.heading || `Paragraph ${index + 1}`;
                  
                  return (
                    <Card key={para.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-0">
                        <button
                          type="button"
                          onClick={() => togglePreviewParagraph(para.id)}
                          className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
                        >
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <div className="flex-shrink-0">
                              {isCollapsed ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                            <h3 className="text-lg font-semibold text-foreground flex-1">
                              {displayHeading}
                            </h3>
                          </div>
                        </button>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="px-4 pb-4 pt-2"
                          >
                            <div
                              className="text-foreground rich-text-content prose prose-sm max-w-none dark:prose-invert"
                              dangerouslySetInnerHTML={{ __html: para.content || '' }}
                            />
                          </motion.div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
            {resource.type === 'FLASH_CARDS' && resource.flashCards && (
              <div className="space-y-3">
                {resource.flashCards.map((card) => (
                  <Card key={card.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="font-medium">Q: {linkifyText(card.question)}</div>
                        <div className="text-sm text-muted-foreground">A: {linkifyText(card.answer)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {resource.type === 'SHORT_QUESTIONS' && (
              <div className="space-y-3">
                {resource.shortQuestions && resource.shortQuestions.length > 0 ? (
                  resource.shortQuestions.map((qa, index) => {
                    const isCollapsed = collapsedPreviewQuestions.has(qa.id);
                    return (
                      <Card key={qa.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-0">
                          <button
                            type="button"
                            onClick={() => togglePreviewQuestion(qa.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
                          >
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className="flex-shrink-0">
                                {isCollapsed ? (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-primary mb-1">Question {index + 1}</div>
                                <h3 className="text-base font-semibold text-foreground line-clamp-2">
                                  {qa.question}
                                </h3>
                              </div>
                            </div>
                          </button>
                          {!isCollapsed && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-4 pb-4 pt-2"
                            >
                              <div className="pl-8 space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Answer:</div>
                                <div className="text-foreground whitespace-pre-wrap">
                                  {linkifyText(qa.answer)}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                ) : resource.question && resource.answer ? (
                  // Legacy format: single Q&A
                  <Card className="border-l-4 border-l-primary shadow-sm">
                    <div className="p-0">
                      <div className="p-4">
                        <div className="space-y-2">
                          <div className="font-semibold text-sm text-primary mb-1">Question 1</div>
                          <div className="font-medium">Q: {resource.question}</div>
                          <div className="text-muted-foreground">A: {linkifyText(resource.answer)}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="text-muted-foreground text-center py-4">
                    No questions available
                  </div>
                )}
              </div>
            )}
            {resource.type === 'ASSIGNMENT' && (
              <div className="space-y-4">
                {resource.assignmentQuestions && resource.assignmentQuestions.length > 0 ? (
                  resource.assignmentQuestions.map((aq, index) => (
                    <Card key={aq.id} className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-card to-card/95">
                      <CardContent className="p-5">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div className="font-bold text-sm text-primary uppercase tracking-wide">Assignment Question {index + 1}</div>
                          </div>
                          <div className="pl-10">
                            <p className="text-foreground whitespace-pre-wrap font-semibold text-base leading-relaxed">{linkifyText(aq.question)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : resource.assignmentQuestion ? (
                  // Legacy format: single question
                  <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-card to-card/95">
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            1
                          </div>
                          <div className="font-bold text-sm text-primary uppercase tracking-wide">Assignment Question 1</div>
                        </div>
                        <div className="pl-10">
                          <p className="text-foreground whitespace-pre-wrap font-semibold text-base leading-relaxed">{linkifyText(resource.assignmentQuestion)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-muted-foreground text-center py-4">
                    No assignment questions available
                  </div>
                )}
              </div>
            )}
            {resource.type === 'GLOSSARY' && (
              <div className="space-y-4">
                {resource.glossaryWords && resource.glossaryWords.length > 0 ? (
                  <Card className="shadow-lg border-2 border-primary/20">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-primary/10 border-b-2 border-primary/20">
                              <th className="px-6 py-4 text-left text-sm font-bold text-primary uppercase tracking-wide">Word</th>
                              <th className="px-6 py-4 text-left text-sm font-bold text-primary uppercase tracking-wide">Meaning</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resource.glossaryWords.map((gw, index) => (
                              <tr 
                                key={gw.id} 
                                className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                                  index % 2 === 0 ? 'bg-card' : 'bg-muted/10'
                                }`}
                              >
                                <td className="px-6 py-4">
                                  <span className="font-bold text-base text-foreground">{gw.word}</span>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">{linkifyText(gw.meaning)}</p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-muted-foreground text-center py-4">
                    No glossary words available
                  </div>
                )}
              </div>
            )}
            {resource.type === 'RECOMMENDATION' && (
              <div className="space-y-3">
                {resource.recommendations && resource.recommendations.length > 0 ? (
                  resource.recommendations.map((rec, index) => {
                    const isCollapsed = collapsedPreviewRecommendations.has(rec.id);
                    return (
                      <Card key={rec.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-0">
                          <button
                            type="button"
                            onClick={() => togglePreviewRecommendation(rec.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg"
                          >
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <div className="flex-shrink-0">
                                {isCollapsed ? (
                                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-primary mb-1">Recommendation {index + 1}</div>
                                <h3 className="text-base font-semibold text-foreground line-clamp-2">
                                  {rec.title}
                                </h3>
                              </div>
                            </div>
                          </button>
                          {!isCollapsed && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="px-4 pb-4 pt-2"
                            >
                              <div className="pl-8 space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Content:</div>
                                <div className="text-foreground whitespace-pre-wrap">{linkifyText(rec.content)}</div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </Card>
                    );
                  })
                ) : (
                  <div className="text-muted-foreground text-center py-4">
                    No recommendations available
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Quiz Preview Modal Component
interface QuizQuestion {
  id: string;
  text: string;
  textTe?: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
  options: {
    id: string;
    text: string;
    textTe?: string;
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

function QuizPreviewModal({ dayQuiz, onClose }: {
  dayQuiz: DayQuiz;
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
      
      // Fetch questions
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
          textTe: q.textTe || '',
          type: q.type,
          options: q.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            textTe: opt.textTe || '',
            isCorrect: opt.isCorrect,
            order: opt.order,
          })),
          order: q.order,
        })),
      });
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      setError(error.response?.data?.message || 'Failed to load quiz details');
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
                              {/* Question */}
                              <div>
                                <div className="flex items-start gap-2 mb-2">
                                  <span className="font-semibold text-primary">
                                    Q{index + 1}.
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium text-base">
                                      {question.text}
                                    </p>
                                    {question.textTe && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {question.textTe}
                                      </p>
                                    )}
                                    <span className="inline-block mt-2 text-xs bg-muted px-2 py-1 rounded">
                                      {question.type === 'SINGLE_CHOICE' ? 'Single Choice' : 'Multiple Choice'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Options */}
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
                                            <p className="text-sm font-medium">
                                              {option.text}
                                            </p>
                                          </div>
                                          {option.textTe && (
                                            <p className="text-xs text-muted-foreground mt-1 ml-6">
                                              {option.textTe}
                                            </p>
                                          )}
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
