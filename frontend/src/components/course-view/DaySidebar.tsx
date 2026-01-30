'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { DayItem, LearnDay } from './types';

export interface DayWithItems extends LearnDay {
  items: DayItem[];
}

const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 56;

/** Collapsed day number button with portal tooltip (only when collapsed). */
function CollapsedDayButton({
  day,
  dayNumber,
  isActive,
  onSelectDay,
}: {
  day: DayWithItems;
  dayNumber: number;
  isActive: boolean;
  onSelectDay: (dayId: string) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipRect, setTooltipRect] = useState({ x: 0, y: 0 });

  const updateRect = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTooltipRect({ x: r.right + 8, y: r.top + r.height / 2 });
  }, []);

  const handleMouseEnter = useCallback(() => {
    updateRect();
    setShowTooltip(true);
  }, [updateRect]);

  const handleMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  useEffect(() => {
    if (!showTooltip || !buttonRef.current) return;
    const el = buttonRef.current;
    const onScrollOrResize = () => {
      updateRect();
    };
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [showTooltip, updateRect]);

  // Avoid duplicate "Day N": strip leading "Day N : " or "Day N" from title
  const titleOnly = day.title.replace(/^Day\s*\d+\s*(:\s*)?/i, '').trim() || day.title;
  const tooltipLabel = `Day ${dayNumber} : ${titleOnly}`;

  const tooltipEl =
    typeof document !== 'undefined' && showTooltip
      ? createPortal(
          <div
            role="tooltip"
            className="fixed z-[9999] max-w-[220px] -translate-y-1/2 rounded-xl border border-border/60 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xl ring-1 ring-black/5"
            style={{ left: tooltipRect.x, top: tooltipRect.y }}
          >
            <span className="line-clamp-2 block">{tooltipLabel}</span>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <motion.li
        initial={false}
        animate={{ opacity: 1 }}
        className="w-full flex justify-center"
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={() => onSelectDay(day.id)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isActive
              ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30'
              : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
          }`}
          aria-label={tooltipLabel}
          title={tooltipLabel}
          aria-current={isActive ? 'true' : undefined}
        >
          {dayNumber}
        </button>
      </motion.li>
      {tooltipEl}
    </>
  );
}

interface DaySidebarProps {
  days: DayWithItems[];
  selectedDayId: string | null;
  onSelectDay: (dayId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Left panel — persistent days nav. Expanded: full labels + collapse arrow.
 * Collapsed: day numbers (1,2,3…) + expand arrow. Premium styling, solid bg on mobile.
 */
export function DaySidebar({
  days,
  selectedDayId,
  onSelectDay,
  collapsed,
  onToggleCollapse,
}: DaySidebarProps) {
  return (
    <aside
      aria-label="Course days"
      className={`flex h-full w-full flex-col overflow-hidden border-r border-border/60 lg:bg-card/95 ${
        collapsed ? 'bg-transparent shadow-none sm:bg-card sm:shadow-sm' : 'bg-card shadow-sm'
      }`}
    >
      {/* Header: "Days" + collapse arrow (expanded) or only expand arrow (collapsed) */}
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-2 py-2.5 sm:px-3 sm:py-3">
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Expand days menu"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="truncate text-sm font-semibold text-foreground">Days</span>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Minimize days menu"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" aria-label="Course days">
        <ul className={collapsed ? 'flex flex-col items-center gap-1 px-1.5 py-1 pt-3' : 'space-y-0.5 px-2'}>
          {days.map((day, index) => {
            const isActive = selectedDayId === day.id;
            const dayNumber = index + 1;

            if (collapsed) {
              return (
                <CollapsedDayButton
                  key={day.id}
                  day={day}
                  dayNumber={dayNumber}
                  isActive={isActive}
                  onSelectDay={onSelectDay}
                />
              );
            }

            const titleOnly = day.title.replace(/^Day\s*\d+\s*(:\s*)?/i, '').trim() || day.title;
            const dayTooltipLabel = `Day ${dayNumber} : ${titleOnly}`;
            return (
              <motion.li
                key={day.id}
                initial={false}
                className="w-full"
              >
                <button
                  type="button"
                  onClick={() => onSelectDay(day.id)}
                  title={dayTooltipLabel}
                  aria-label={dayTooltipLabel}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                    isActive
                      ? 'bg-primary/15 font-semibold text-foreground ring-1 ring-primary/20'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="line-clamp-2">{day.title}</span>
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED };

/** Mobile-only: day strip above content — numbers + tooltip, collapsible down arrow (collapse mode only). */
function MobileDayButton({
  day,
  dayNumber,
  isActive,
  onSelectDay,
}: {
  day: DayWithItems;
  dayNumber: number;
  isActive: boolean;
  onSelectDay: (dayId: string) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipRect, setTooltipRect] = useState({ x: 0, y: 0 });

  const updateRect = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTooltipRect({ x: r.left + r.width / 2, y: r.top - 8 });
  }, []);

  const handleOpen = useCallback(() => {
    updateRect();
    setShowTooltip(true);
  }, [updateRect]);

  const handleClose = useCallback(() => {
    setShowTooltip(false);
  }, []);

  useEffect(() => {
    if (!showTooltip || !buttonRef.current) return;
    const onScrollOrResize = () => updateRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [showTooltip, updateRect]);

  // Avoid duplicate "Day N": strip leading "Day N : " or "Day N" from title
  const titleOnly = day.title.replace(/^Day\s*\d+\s*(:\s*)?/i, '').trim() || day.title;
  const tooltipLabel = `Day ${dayNumber} : ${titleOnly}`;

  const tooltipEl =
    typeof document !== 'undefined' && showTooltip
      ? createPortal(
          <div
            role="tooltip"
            className="fixed z-[9999] max-w-[220px] -translate-x-1/2 -translate-y-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xl ring-1 ring-black/5"
            style={{ left: tooltipRect.x, top: tooltipRect.y }}
          >
            <span className="line-clamp-2 block">{tooltipLabel}</span>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          onSelectDay(day.id);
          setShowTooltip((v) => !v);
        }}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30'
            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
        }`}
        aria-label={tooltipLabel}
        title={tooltipLabel}
        aria-current={isActive ? 'true' : undefined}
      >
        {dayNumber}
      </button>
      {tooltipEl}
    </>
  );
}

export interface DayStripMobileProps {
  days: DayWithItems[];
  selectedDayId: string | null;
  onSelectDay: (dayId: string) => void;
}

/**
 * Mobile-only day strip: placed above ContentViewer. Day numbers + tooltip; down arrow collapses to numbers-only row, up arrow expands.
 */
export function DayStripMobile({ days, selectedDayId, onSelectDay }: DayStripMobileProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div
      className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-card/95 px-3 py-2 lg:hidden"
      aria-label="Course days"
    >
      <div
        className={`flex flex-1 items-center justify-start gap-1 overflow-y-hidden py-1 ${collapsed ? 'overflow-x-auto' : 'min-w-0 flex-wrap'}`}
      >
        {days.map((day, index) => {
          const isActive = selectedDayId === day.id;
          return (
            <MobileDayButton
              key={day.id}
              day={day}
              dayNumber={index + 1}
              isActive={isActive}
              onSelectDay={onSelectDay}
            />
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={collapsed ? 'Expand days' : 'Collapse days'}
        title={collapsed ? 'Expand days' : 'Collapse days'}
      >
        {collapsed ? (
          <ChevronUp className="h-5 w-5" strokeWidth={2} />
        ) : (
          <ChevronDown className="h-5 w-5" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
