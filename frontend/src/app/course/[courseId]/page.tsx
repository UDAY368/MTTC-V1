'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/landing/Header';
import { AboutCourseHero } from '@/components/course-about/AboutCourseHero';
import { KeyHighlights } from '@/components/course-about/KeyHighlights';
import { InstructorSection } from '@/components/course-about/InstructorSection';
import { SyllabusSection } from '@/components/course-about/SyllabusSection';
import { AboutCourseCTA } from '@/components/course-about/AboutCourseCTA';
import api from '@/lib/api';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export interface AboutCourseData {
  id: string;
  name: string;
  description?: string | null;
  duration?: string | null;
  instructorName?: string | null;
  aboutInstructor?: string | null;
  highlights: { text: string }[];
  syllabus: { title: string; description?: string | null }[];
}

/**
 * ABOUT COURSE PAGE
 * Route: /course/[courseId]
 *
 * Reached when user clicks "About Course" on the landing course card.
 * Composes: Header, AboutCourseHero, KeyHighlights, InstructorSection, SyllabusSection, AboutCourseCTA.
 */
export default function AboutCoursePage() {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : '';
  const [course, setCourse] = useState<AboutCourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      setError(true);
      return;
    }
    let cancelled = false;
    api
      .get<{ success: boolean; data: AboutCourseData }>(`/public/courses/${courseId}`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && res.data?.data) {
          setCourse(res.data.data);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-9 w-3/4 max-w-md" />
              <Skeleton className="h-5 w-full max-w-2xl" />
              <Skeleton className="h-5 w-5/6 max-w-xl" />
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/40 px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
                <div className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-6 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <div className="mt-8 space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
            <div className="flex justify-center">
              <Skeleton className="h-12 w-40 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <p className="text-muted-foreground">Course not found.</p>
            <Link
              href="/home"
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              Back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8 lg:py-10">
        <AboutCourseHero
          name={course.name}
          description={course.description ?? undefined}
          duration={course.duration ?? undefined}
          instructorName={course.instructorName ?? undefined}
          courseId={course.id}
        />
        <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:px-8 lg:py-2">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2 lg:gap-8 lg:items-stretch">
            <KeyHighlights highlights={course.highlights.map((h) => h.text)} compact />
            <InstructorSection
              instructorName={course.instructorName ?? undefined}
              aboutInstructor={course.aboutInstructor ?? undefined}
              compact
            />
          </div>
          <SyllabusSection syllabus={course.syllabus} />
        </div>
        <AboutCourseCTA courseId={course.id} />
      </main>
    </div>
  );
}
