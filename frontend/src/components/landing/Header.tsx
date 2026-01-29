'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme/ThemeProvider';

/**
 * Landing Header — sticky, minimal.
 * Logo (top-left), "Dhayana Dharma Ashramam" centered, theme toggle (top-right).
 */
export function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md"
    >
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-4 md:px-6 lg:px-8">
        {/* Logo — top-left, responsive size */}
        <Link
          href="/home"
          className="flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
          aria-label="Dhayana Dharma Ashramam – Home"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-lg shrink-0 sm:h-12 sm:w-12 md:h-14 md:w-14">
            <Image
              src="/Asserts/LOGO.png"
              alt="Dhayana Dharma Ashramam"
              className="h-full w-full object-contain"
              width={56}
              height={56}
              priority
              unoptimized
            />
          </div>
        </Link>

        {/* Brand name — centered, responsive font */}
        <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-foreground leading-tight whitespace-nowrap sm:text-base md:text-lg lg:text-xl pointer-events-none">
          Dhayana Dharma Ashramam
        </p>

        {/* Theme toggle — right corner, same width as logo for balance */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-end sm:h-12 sm:w-12 md:h-14 md:w-14">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            ) : (
              <Moon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
