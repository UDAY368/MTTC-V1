'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { Header } from '@/components/landing/Header';
import { CourseViewLayout } from '@/components/course-view/CourseViewLayout';
import type { LearnData } from '@/components/course-view/types';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const SCROLL_THRESHOLD = 300;

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SCROLL_THRESHOLD);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25, duration: 0.2 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/20 transition-shadow hover:shadow-xl hover:ring-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Scroll to top"
        >
          <ChevronUp className="h-6 w-6" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/**
 * Inner content that uses useSearchParams (must be in Suspense for Next.js).
 */
function CourseLearnContent({ data }: { data: LearnData }) {
  const searchParams = useSearchParams();
  const initialDayId = searchParams.get('dayId') ?? undefined;
  const initialResourceId = searchParams.get('resourceId') ?? undefined;
  return (
    <>
      <CourseViewLayout
        courseId={data.id}
        courseName={data.name}
        days={data.days}
        initialDayId={initialDayId}
        initialResourceId={initialResourceId}
      />
      <BackToTopButton />
    </>
  );
}

/**
 * COURSE VIEW (Consumption experience)
 * Route: /course/[courseId]/learn
 *
 * Reached when user clicks "View Course" on the About Course page.
 * Three-panel layout: DaySidebar | ContentViewer | ResourceRail
 * Default: first day open, first resource/item open.
 */
export default function CourseLearnPage() {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : '';
  const [data, setData] = useState<LearnData | null>(null);
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
      .get<{ success: boolean; data: LearnData }>(`/public/courses/${courseId}/learn`)
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
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
        <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8 md:gap-10 lg:gap-12">
            <div className="min-w-0 flex-1 space-y-4 sm:space-y-5 md:space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-4 w-full max-w-lg" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>
            <div className="hidden sm:block">
              <Skeleton className="h-64 w-56 rounded-xl" />
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
          <div className="mt-8 space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-muted-foreground">Course not found.</p>
          <Link
            href="/home"
            className="text-primary underline underline-offset-4 hover:no-underline"
          >
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Suspense
        fallback={
          <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8 lg:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8 md:gap-10 lg:gap-12">
              <div className="min-w-0 flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-full max-w-xl" />
              </div>
            </div>
          </main>
        }
      >
        <CourseLearnContent data={data} />
      </Suspense>
    </div>
  );
}
