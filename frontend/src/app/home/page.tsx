'use client';

import { useEffect } from 'react';
import { Header } from '@/components/landing/Header';
import { HeroSection } from '@/components/landing/HeroSection';
import { CourseCardSection } from '@/components/landing/CourseCardSection';
import { trackPageVisit } from '@/lib/analytics';

/**
 * LANDING PAGE (User-facing home)
 * Route: /home
 *
 * Composes: Header, HeroSection, CourseCardSection
 * Design: Premium, calm, spiritual, dark-first
 */
export default function HomePage() {
  useEffect(() => {
    trackPageVisit({ pageUrl: '/home', pageType: 'home' });
  }, []);

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
