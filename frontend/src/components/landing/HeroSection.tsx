'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

/** Premium image frame: glow, border, ring, shadow. Reused for both hero photos. Single-row responsive sizes. */
function HeroImageFrame({
  src,
  alt,
  delay = 0.1,
  x = 0,
  className = '',
}: {
  src: string;
  alt: string;
  delay?: number;
  x?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay }}
      className={`shrink-0 ${className}`}
    >
      <div className="relative">
        {/* Soft glow behind image */}
        <div
          className="absolute -inset-2 rounded-2xl opacity-20 blur-xl sm:-inset-3 sm:rounded-3xl sm:blur-2xl"
          style={{ background: 'radial-gradient(circle, hsl(142,76%,36%) 15%, transparent 65%)' }}
          aria-hidden
        />
        {/* Premium frame — responsive so row fits on all screens */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-card/80 shadow-2xl shadow-black/40 ring-2 ring-primary/20 ring-offset-2 ring-offset-background h-32 w-32 sm:h-44 sm:w-44 md:h-52 md:w-52 lg:h-64 lg:w-64 xl:h-72 xl:w-72">
          <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5 pointer-events-none sm:rounded-2xl" aria-hidden />
          <Image
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            width={288}
            height={288}
            unoptimized
          />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Hero — Pathriji (left), text (center), Ramu_Master (right).
 * Premium gradient background, balanced three-column layout, refined typography.
 */
export function HeroSection() {
  return (
    <section aria-label="Hero" className="relative overflow-hidden">
      {/* Layered gradient background */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/60"
        aria-hidden
      />
      {/* Central ambient glow */}
      <div
        className="absolute left-1/2 top-2/5 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(142,76%,36%) 0%, transparent 65%)' }}
        aria-hidden
      />
      {/* Subtle vignette edges */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_40%,hsl(var(--background)/0.4)_100%)] pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl flex-col items-center justify-center gap-4 px-3 py-12 sm:min-h-[75vh] sm:gap-5 sm:px-4 sm:py-16 md:flex-row md:flex-nowrap md:gap-6 md:px-6 lg:min-h-[80vh] lg:gap-8 lg:px-8 lg:py-24 xl:gap-12 xl:py-28">
        {/* Left: Pathriji image — always first in row */}
        <HeroImageFrame
          src="/assets/Pathriji.jpeg"
          alt="Pathriji"
          delay={0.1}
          x={-24}
          className="order-1"
        />

        {/* Center: Text block — always middle in row */}
        <div className="order-2 min-w-0 flex-1 basis-0 space-y-3 text-center sm:space-y-4 md:space-y-5 lg:space-y-6 md:px-4 lg:max-w-xl lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
            className="space-y-4 sm:space-y-5"
          >
            <h1 className="text-xl font-light tracking-tight text-foreground sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-[3.5rem] leading-[1.15]">
              Meditation Teacher Training Course
            </h1>
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <p className="text-[10px] font-medium tracking-[0.28em] uppercase text-muted-foreground sm:text-xs md:text-sm">
                By Nlight Spiritual Science Academy
              </p>
              <span className="h-px w-16 bg-gradient-to-r from-transparent via-primary/70 to-transparent sm:w-20 md:w-24" aria-hidden />
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1], delay: 0.35 }}
            className="text-sm leading-relaxed text-muted-foreground max-w-md mx-auto sm:text-base md:text-lg lg:text-xl"
          >
            A transformative journey into inner stillness and the art of guiding others in meditation.
          </motion.p>
        </div>

        {/* Right: Ramu_Master image — always third in row */}
        <HeroImageFrame
          src="/assets/Ramu_Master.jpg"
          alt="Instructor"
          delay={0.15}
          x={24}
          className="order-3"
        />
      </div>
    </section>
  );
}
