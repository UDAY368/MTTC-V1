'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  FileText,
  Video,
  BookOpen,
  HelpCircle,
  ClipboardList,
  GripVertical
} from 'lucide-react';

interface Course {
  id: string;
  name: string;
  description?: string;
}

interface Day {
  id: string;
  title: string;
  description?: string;
  order: number;
  _count?: {
    resources: number;
    dayQuizzes: number;
  };
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourseAndDays();
  }, [courseId]);

  const fetchCourseAndDays = async () => {
    try {
      setLoading(true);
      const [courseRes, daysRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/days?courseId=${courseId}`)
      ]);
      
      setCourse(courseRes.data.data);
      setDays(daysRes.data.data || []);
    } catch (error: any) {
      console.error('Error fetching course data:', error);
      setError(error.response?.data?.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('Are you sure you want to delete this day? This will also delete all resources and quizzes attached to it.')) {
      return;
    }

    try {
      await api.delete(`/days/${dayId}`);
      fetchCourseAndDays();
    } catch (error: any) {
      console.error('Error deleting day:', error);
      alert(error.response?.data?.message || 'Failed to delete day');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/courses')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error || 'Course not found'}</p>
          </CardContent>
        </Card>
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
            onClick={() => router.push('/dashboard/courses')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-light tracking-wide">{course.name}</h1>
            <p className="text-muted-foreground mt-2">
              {course.description || 'Manage days and resources for this course'}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/courses/${courseId}/days/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Day
        </Button>
      </div>

      {/* Days List */}
      {days.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No days yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first day to start building the course content
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/courses/${courseId}/days/new`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Day
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {days.map((day, index) => (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                          {day.title}
                        </CardTitle>
                        {day.description && (
                          <CardDescription className="mt-1">
                            {day.description}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>{day._count?.resources || 0} resources</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{day._count?.dayQuizzes || 0} quizzes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/courses/${courseId}/days/${day.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDay(day.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
