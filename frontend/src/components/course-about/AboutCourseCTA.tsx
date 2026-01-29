'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface AboutCourseCTAProps {
  courseId: string;
}

/**
 * CTA — "View Course" → /course/[courseId]/learn.
 */
export function AboutCourseCTA({ courseId }: AboutCourseCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-wrap items-center justify-center gap-3 py-8 sm:gap-4 sm:py-10 md:py-12 lg:py-16"
    >
      <Button
        asChild
        size="lg"
        className="rounded-lg px-6 py-2 text-sm transition-all duration-300 ease-out hover:bg-primary/90 sm:px-8 sm:text-base md:py-2.5"
      >
        <Link href={`/course/${courseId}/learn`}>View Course</Link>
      </Button>
    </motion.div>
  );
}
