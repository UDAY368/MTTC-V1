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
export function CourseViewLayout({ courseId, courseName, days }: CourseViewLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [railCollapsed, setRailCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarCollapsed(false);
      setRailCollapsed(false);
    }
  }, []);

  const daysWithItems = useMemo(
    () => days.map((d) => ({ ...d, items: mergeDayItems(d) })),
    [days]
  );

  const firstDay = daysWithItems[0];
  const firstItem = firstDay?.items[0];

  const [selectedDayId, setSelectedDayId] = useState<string | null>(() => firstDay?.id ?? null);
  const [selectedItem, setSelectedItem] = useState<DayItem | null>(() => firstItem ?? null);

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

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] overflow-x-hidden">
      {/* Left sidebar: desktop (lg) only — hidden on mobile; day strip is above content on mobile */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
        }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        className={`absolute left-0 top-0 z-30 hidden h-full shrink-0 overflow-hidden lg:relative lg:z-auto lg:block lg:bg-card/95 ${
          sidebarCollapsed ? 'bg-transparent shadow-none sm:bg-card sm:shadow-sm' : 'bg-card shadow-sm'
        }`}
      >
        <DaySidebar
          days={daysWithItems}
          selectedDayId={selectedDayId}
          onSelectDay={selectDay}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </motion.aside>

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
            courseName={courseName}
            selectedItem={selectedItem}
            currentItems={currentItems}
            onSelectItem={selectItem}
            selectedDay={selectedDay}
            selectedDayNumber={selectedDay ? daysWithItems.findIndex((d) => d.id === selectedDay.id) + 1 : undefined}
          />
        </div>
      </main>

      {/* Right rail: desktop (lg) only — hidden on mobile; resource strip is below day strip on mobile */}
      <motion.aside
        initial={false}
        animate={{
          width: railCollapsed ? RAIL_WIDTH_COLLAPSED : RAIL_WIDTH_EXPANDED,
        }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        className={`absolute right-0 top-0 z-30 hidden h-full shrink-0 overflow-hidden lg:relative lg:z-auto lg:block lg:bg-card/95 ${
          railCollapsed ? 'bg-transparent shadow-none sm:bg-card sm:shadow-sm' : 'bg-card shadow-sm'
        }`}
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
