'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface AboutCourseCTAProps {
  courseId: string;
}

/**
 * CTA — "View Course" → /course/[courseId]/learn.
 * Link is the full clickable area (entire button).
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
      <Link
        href={`/course/${courseId}/learn`}
        className="inline-flex items-center justify-center whitespace-nowrap font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-11 rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm transition-all duration-300 ease-out hover:bg-primary/90 sm:px-8 sm:text-base md:py-2.5"
      >
        View Course
      </Link>
    </motion.div>
  );
}
