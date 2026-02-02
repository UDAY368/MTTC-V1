'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, CalendarDays, Award, Building2 } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Default course ID for the landing CTA — no API dependency. Set in production for instant "About Course" link. */
const DEFAULT_COURSE_ID = typeof process.env.NEXT_PUBLIC_DEFAULT_COURSE_ID === 'string' && process.env.NEXT_PUBLIC_DEFAULT_COURSE_ID.trim()
  ? process.env.NEXT_PUBLIC_DEFAULT_COURSE_ID.trim()
  : null;

interface Course {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  instructorName?: string;
  highlights?: { text: string }[];
  syllabus?: { title: string; description?: string }[];
}

/** Premium icon + text row for course meta */
function MetaRow({
  icon: Icon,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay }}
      className="flex items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm md:text-base"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <span>{children}</span>
    </motion.div>
  );
}

/**
 * Course card — premium look, course/calendar/master icons, smooth animations.
 * Name, description, duration, instructor, academy, "About Course".
 */
export function CourseCardSection() {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  // When env is not set, one minimal request gives us the CTA link quickly (no dependency on full /public/courses)
  const [defaultIdFromApi, setDefaultIdFromApi] = useState<string | null>(null);

  // Fast path: when no env default, fetch only the first course ID so "About Course" link works with minimal latency
  useEffect(() => {
    if (DEFAULT_COURSE_ID) return;
    let cancelled = false;
    api
      .get<{ success: boolean; data: { id: string } | null }>('/public/default-course-id')
      .then((res) => {
        if (cancelled) return;
        const id = res.data?.data?.id;
        if (id) setDefaultIdFromApi(id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Full course data for card display (name, duration, instructor) — non-blocking for CTA
  useEffect(() => {
    let cancelled = false;
    api
      .get<{ success: boolean; data: Course[] }>('/public/courses')
      .then((res) => {
        if (cancelled) return;
        const list = res.data?.data;
        if (Array.isArray(list) && list.length > 0) {
          setCourse(list[0]);
        }
      })
      .catch(() => {
        if (!cancelled) setCourse(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const academyName = 'Nlight Spiritual Science Academy';
  const displayName = course?.name ?? 'Meditation Teacher Training Program';
  const displayDesc = course?.description ?? 'A transformative program for deepening practice and learning to guide others in meditation.';
  const displayDuration = course?.duration ?? '';
  const displayInstructor = course?.instructorName ?? '';

  // CTA works: immediately when env is set; or as soon as default-course-id returns; or when full course list returns
  const effectiveCourseId = course?.id ?? DEFAULT_COURSE_ID ?? defaultIdFromApi;
  const showAboutCourseLink = Boolean(effectiveCourseId);

  return (
    <section aria-label="Course card" className="px-4 py-12 sm:px-6 sm:py-16 md:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="max-w-2xl lg:max-w-3xl"
        >
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-full"
          >
            <Card
              className="relative overflow-hidden border border-border/50 bg-card/95 shadow-xl shadow-black/20 backdrop-blur-md ring-1 ring-white/5 transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/15 hover:ring-primary/10"
              style={{ borderRadius: '1.25rem' }}
            >
              {/* Top accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" aria-hidden />
              {/* Subtle premium gradient overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                  background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary)) 0%, transparent 60%)',
                }}
                aria-hidden
              />
              <div className="relative">
                <CardHeader className="space-y-2 px-6 pb-2 pt-5 sm:px-7 sm:pt-6">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <BookOpen className="h-5 w-5" strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl font-light tracking-wide text-foreground sm:text-2xl md:text-3xl lg:text-[2rem]">
                        {displayName}
                      </CardTitle>
                      <CardDescription className="my-4 rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base">
                        {displayDesc}
                      </CardDescription>
                    </div>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-5 px-6 pb-6 pt-2 sm:px-7 sm:pb-7">
                  {(displayDuration || displayInstructor) && (
                    <div className="flex flex-col gap-y-2">
                      {displayDuration && (
                        <MetaRow icon={CalendarDays} delay={0.15}>
                          {displayDuration}
                        </MetaRow>
                      )}
                      {displayInstructor && (
                        <MetaRow icon={Award} delay={0.2}>
                          {displayInstructor}
                        </MetaRow>
                      )}
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.25 }}
                    className="flex items-center gap-2.5 text-xs font-medium uppercase tracking-widest text-muted-foreground"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Building2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </span>
                    <span>By {academyName}</span>
                  </motion.div>
                  {/* About Course CTA: never blocked when NEXT_PUBLIC_DEFAULT_COURSE_ID is set; link always shown when we have an effective course ID */}
                  {showAboutCourseLink ? (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.3 }}
                      className="mt-3"
                    >
                      <Link
                        href={`/course/${effectiveCourseId}`}
                        prefetch={true}
                        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-base font-semibold tracking-wide text-primary-foreground shadow-lg shadow-primary/25 ring-offset-background transition-all duration-300 ease-out hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-14 sm:text-lg"
                      >
                        About Course
                      </Link>
                    </motion.div>
                  ) : loading ? (
                    <Skeleton className="mt-3 h-12 w-full max-w-md rounded-xl" />
                  ) : (
                    <Button variant="outline" size="lg" className="mt-3 h-12 w-full rounded-xl text-base sm:h-14 sm:text-lg" disabled>
                      <span>About Course</span>
                    </Button>
                  )}
                </CardContent>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
