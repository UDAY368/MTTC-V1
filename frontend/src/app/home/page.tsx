'use client';

import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { CourseCardSection } from '@/components/landing/CourseCardSection';

/**
 * LANDING PAGE (User-facing home)
 * Route: /home
 *
 * Composes: Header, HeroSection, CourseCardSection
 * Design: Premium, calm, spiritual, dark-first
 */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <CourseCardSection />
      </main>
    </div>
  );
}
