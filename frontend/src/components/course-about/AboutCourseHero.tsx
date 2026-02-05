'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CalendarDays, UserRound, BookOpen } from 'lucide-react';
import courseImage from '@/assets/Course_Image.png';

interface AboutCourseHeroProps {
  name: string;
  description?: string;
  duration?: string;
  instructorName?: string;
  courseId?: string;
}

/**
 * About Course hero — Udemy-style single row: title, stats, description left; premium course image right.
 */
export function AboutCourseHero({
  name,
  description,
  duration,
  instructorName,
  courseId,
}: AboutCourseHeroProps) {
  return (
    <section aria-label="About course hero" className="relative overflow-hidden py-8 sm:py-10 md:py-12 lg:py-16">
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(142,76%,36%) 0%, transparent 65%)' }}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8 md:gap-10 lg:gap-12"
      >
        {/* Left: title, stats, description — Udemy-style content block */}
        <div className="min-w-0 flex-1 space-y-4 sm:space-y-5 md:space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
              <BookOpen className="h-3.5 w-3.5" strokeWidth={2} />
              Course
            </span>
          </div>
          <h1 className="text-xl font-medium tracking-tight text-foreground sm:text-2xl md:text-3xl lg:text-4xl xl:text-[2.5rem] 2xl:text-[2.75rem] leading-tight">
            {name}
          </h1>
          {(duration || instructorName) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:gap-x-6 sm:text-sm md:text-base">
              {duration && (
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary/80 sm:h-4 sm:w-4" strokeWidth={1.8} />
                  {duration}
                </span>
              )}
              {instructorName && (
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <UserRound className="h-3.5 w-3.5 shrink-0 text-primary/80 sm:h-4 sm:w-4" strokeWidth={1.8} />
                  {instructorName}
                </span>
              )}
            </div>
          )}
          {description && (
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base lg:text-lg">
              {description}
            </p>
          )}
          {courseId && (
            <div className="flex justify-center pt-1 sm:justify-start">
              <Link
                href={`/course/${courseId}/learn`}
                className="inline-flex items-center rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5 sm:py-2.5 sm:text-sm md:text-base"
              >
                Start learning
              </Link>
            </div>
          )}
        </div>

        {/* Right: premium course image — single row */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
          className="relative flex shrink-0 justify-center sm:justify-end"
        >
          <div className="relative h-52 w-full max-w-md sm:h-64 sm:max-w-sm lg:h-72 lg:max-w-md">
            <div
              className="absolute -inset-1 rounded-2xl opacity-30 blur-lg"
              style={{ background: 'radial-gradient(circle, hsl(142,76%,36%) 20%, transparent 60%)' }}
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/90 shadow-2xl shadow-black/30 ring-2 ring-primary/20 ring-offset-2 ring-offset-background h-full w-full">
              <Image
                src={courseImage}
                alt=""
                className="h-full w-full object-cover"
                width={384}
                height={288}
                unoptimized
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
