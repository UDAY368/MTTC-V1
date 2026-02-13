'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DaySidebar, DayStripMobile, SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED } from './DaySidebar';
import { ContentViewer } from './ContentViewer';
import { ResourceRail, ResourceStripMobile, RAIL_WIDTH_COLLAPSED, RAIL_WIDTH_EXPANDED } from './ResourceRail';
import type { DayItem, LearnDay, LearnDayQuiz, LearnResource } from './types';

export type { DayItem } from './types';

export interface CourseViewLayoutProps {
  courseId: string;
  courseName: string;
  days: LearnDay[];
  /** When coming back from flash deck, restore this day and resource */
  initialDayId?: string;
  initialResourceId?: string;
}

// Only resources (Quiz is one resource; day quizzes shown inside it)
function mergeDayItems(day: LearnDay): DayItem[] {
  const items: DayItem[] = day.resources
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((r) => ({ type: 'resource' as const, id: r.id, order: r.order, resource: r }));
  return items;
}

/**
 * Three-panel layout: DaySidebar | ContentViewer | ResourceRail.
 * Day sidebar and resource rail are always visible (persistent); both can be minimized to icon/number strips.
 */
export function CourseViewLayout({ courseId, courseName, days, initialDayId, initialResourceId }: CourseViewLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [railCollapsed, setRailCollapsed] = useState(true);

  const daysWithItems = useMemo(
    () => days.map((d) => ({ ...d, items: mergeDayItems(d) })),
    [days]
  );

  const firstDay = daysWithItems[0];
  const firstItem = firstDay?.items[0];

  const [selectedDayId, setSelectedDayId] = useState<string | null>(() => firstDay?.id ?? null);
  const [selectedItem, setSelectedItem] = useState<DayItem | null>(() => firstItem ?? null);

  // Restore day + resource when returning from flash deck (Back button)
  useEffect(() => {
    if (!initialDayId || !initialResourceId || daysWithItems.length === 0) return;
    const day = daysWithItems.find((d) => d.id === initialDayId);
    if (!day) return;
    const resourceItem = day.items.find(
      (i) => i.type === 'resource' && i.resource.id === initialResourceId
    );
    if (!resourceItem) return;
    setSelectedDayId(initialDayId);
    setSelectedItem(resourceItem);
  }, [initialDayId, initialResourceId, daysWithItems]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarCollapsed(false);
      setRailCollapsed(false);
    }
  }, []);

  const selectedDay = daysWithItems.find((d) => d.id === selectedDayId) ?? firstDay;
  const currentItems = selectedDay?.items ?? [];

  const selectDay = (dayId: string) => {
    const day = daysWithItems.find((d) => d.id === dayId);
    if (!day) return;
    setSelectedDayId(dayId);
    const first = day.items[0];
    setSelectedItem(first ?? null);
  };

  const selectItem = (item: DayItem | null) => {
    setSelectedItem(item);
  };

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
  const railWidth = railCollapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH_EXPANDED;
  const sidebarTransition = { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as const };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] overflow-x-hidden">
      {/* Left sidebar: fixed on lg so it stays visible on page scroll; desktop only */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
        }}
        transition={sidebarTransition}
        className={`fixed left-0 z-30 hidden h-[calc(100vh-4rem)] shrink-0 overflow-hidden lg:block lg:bg-card/95 ${
          sidebarCollapsed ? 'bg-transparent shadow-none sm:bg-card sm:shadow-sm' : 'bg-card shadow-sm'
        }`}
        style={{ top: '4rem' }}
      >
        <DaySidebar
          days={daysWithItems}
          selectedDayId={selectedDayId}
          onSelectDay={selectDay}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </motion.aside>

      {/* Spacer so main content is not under the fixed sidebar on lg */}
      <motion.div
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={sidebarTransition}
        className="hidden shrink-0 lg:block"
        aria-hidden
      />

      <main className="flex min-w-0 flex-1 flex-col px-4 py-3 sm:px-5 sm:py-3 md:px-6 md:py-3">
        {/* Mobile only: day strip above content (numbers + tooltip, collapsible down arrow) */}
        <DayStripMobile
          days={daysWithItems}
          selectedDayId={selectedDayId}
          onSelectDay={selectDay}
        />
        {/* Mobile only: resource strip below day strip (icons + tooltip, collapsible down arrow) */}
        <ResourceStripMobile
          items={currentItems}
          selectedItem={selectedItem}
          onSelectItem={selectItem}
        />
        <div className="min-h-0 flex-1 min-w-0">
          <ContentViewer
            courseId={courseId}
            courseName={courseName}
            selectedItem={selectedItem}
            currentItems={currentItems}
            onSelectItem={selectItem}
            selectedDay={selectedDay}
            selectedDayNumber={selectedDay ? daysWithItems.findIndex((d) => d.id === selectedDay.id) + 1 : undefined}
          />
        </div>
      </main>

      {/* Spacer so main content is not under the fixed rail on lg */}
      <motion.div
        initial={false}
        animate={{ width: railWidth }}
        transition={sidebarTransition}
        className="hidden shrink-0 lg:block"
        aria-hidden
      />

      {/* Right rail: fixed on lg so it stays visible on page scroll; desktop only */}
      <motion.aside
        initial={false}
        animate={{ width: railWidth }}
        transition={sidebarTransition}
        className={`fixed right-0 z-30 hidden h-[calc(100vh-4rem)] shrink-0 overflow-hidden lg:block lg:bg-card/95 ${
          railCollapsed ? 'bg-transparent shadow-none sm:bg-card sm:shadow-sm' : 'bg-card shadow-sm'
        }`}
        style={{ top: '4rem' }}
      >
        <ResourceRail
          items={currentItems}
          selectedItem={selectedItem}
          onSelectItem={selectItem}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed((v) => !v)}
        />
      </motion.aside>
    </div>
  );
}
