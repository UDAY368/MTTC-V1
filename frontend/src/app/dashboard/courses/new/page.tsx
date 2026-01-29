'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

export default function NewCoursePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [aboutInstructor, setAboutInstructor] = useState('');
  const [highlights, setHighlights] = useState<string[]>(['']);
  const [syllabus, setSyllabus] = useState<Array<{ title: string; description: string }>>([{ title: '', description: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const addHighlight = () => setHighlights((h) => [...h, '']);
  const removeHighlight = (index: number) => {
    if (highlights.length <= 1) return;
    setHighlights((h) => h.filter((_, i) => i !== index));
  };
  const updateHighlight = (index: number, value: string) => {
    setHighlights((h) => {
      const next = [...h];
      next[index] = value;
      return next;
    });
  };

  const addSyllabusModule = () => setSyllabus((s) => [...s, { title: '', description: '' }]);
  const removeSyllabusModule = (index: number) => {
    if (syllabus.length <= 1) return;
    setSyllabus((s) => s.filter((_, i) => i !== index));
  };
  const updateSyllabusModule = (index: number, field: 'title' | 'description', value: string) => {
    setSyllabus((s) => {
      const next = [...s];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        duration: duration.trim() || undefined,
        instructorName: instructorName.trim() || undefined,
        aboutInstructor: aboutInstructor.trim() || undefined,
        highlights: highlights.filter((t) => t.trim()).length ? highlights.filter((t) => t.trim()) : undefined,
        syllabus: syllabus.some((m) => m.title.trim())
          ? syllabus.filter((m) => m.title.trim()).map((m) => ({ title: m.title.trim(), description: m.description?.trim() || undefined }))
          : undefined,
      };

      const response = await api.post('/courses', payload);
      if (response.data.success) {
        setShowSuccess(true);
        setLoading(false);
        setTimeout(() => router.push('/dashboard/courses'), 2000);
      } else {
        setError(response.data.message || 'Failed to create course');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create New Course</CardTitle>
            <CardDescription>Add a new meditation course to your program</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Meditation Teacher Training Program"
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
                  placeholder="Course description (optional)"
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 6 weeks, 40 hours"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructorName">Instructor Name</Label>
                <Input
                  id="instructorName"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="Instructor name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aboutInstructor">About Instructor</Label>
                <Textarea
                  id="aboutInstructor"
                  value={aboutInstructor}
                  onChange={(e) => setAboutInstructor(e.target.value)}
                  placeholder="Brief bio or description of the instructor"
                  rows={3}
                  disabled={loading}
                />
              </div>

              <div className="space-y-3">
                <Label>Key Highlights</Label>
                <p className="text-sm text-muted-foreground">Add multiple highlights one by one.</p>
                {highlights.map((text, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={text}
                      onChange={(e) => updateHighlight(index, e.target.value)}
                      placeholder={`Highlight ${index + 1}`}
                      disabled={loading}
                      className="flex-1"
                    />
                    {highlights.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeHighlight(index)}
                        disabled={loading}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addHighlight} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Highlight
                </Button>
              </div>

              <div className="space-y-3">
                <Label>Syllabus</Label>
                <p className="text-sm text-muted-foreground">Add multiple modules. Each module has a title and description.</p>
                {syllabus.map((mod, index) => (
                  <Card key={index} className="border-l-4 border-l-primary p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Module {index + 1}</span>
                      {syllabus.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSyllabusModule(index)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`syllabus-title-${index}`} className="text-xs">Module Title</Label>
                      <Input
                        id={`syllabus-title-${index}`}
                        value={mod.title}
                        onChange={(e) => updateSyllabusModule(index, 'title', e.target.value)}
                        placeholder="Module title"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`syllabus-desc-${index}`} className="text-xs">Description</Label>
                      <RichTextEditor
                        value={mod.description}
                        onChange={(value) => updateSyllabusModule(index, 'description', value)}
                        placeholder="Module description (optional). Use bullet points, bold, lists, etc."
                        disabled={loading}
                        className="min-h-[120px]"
                      />
                    </div>
                  </Card>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSyllabusModule} disabled={loading}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Course'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-card rounded-lg border p-8 max-w-md w-full text-center shadow-xl"
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
                Course created successfully
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Your course has been created and saved. Redirecting to courses…
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
