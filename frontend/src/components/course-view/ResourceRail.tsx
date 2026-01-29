'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
import type { DayItem } from './types';

const RAIL_WIDTH_EXPANDED = 220;
const RAIL_WIDTH_COLLAPSED = 56;

interface ResourceRailProps {
  items: DayItem[];
  selectedItem: DayItem | null;
  onSelectItem: (item: DayItem | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function itemLabel(item: DayItem): string {
  if (item.type === 'dayQuiz') return item.dayQuiz.quiz.title;
  const r = item.resource;
  return r.title || typeLabel(r.type);
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    VIDEO: 'Video',
    NOTES: 'Key Points',
    BRIEF_NOTES: 'Brief Notes',
    FLASH_CARDS: 'Flash Cards',
    SHORT_QUESTIONS: 'Short Questions',
    ASSIGNMENT: 'Assignment',
    GLOSSARY: 'Glossary',
    RECOMMENDATION: 'Recommendation',
  };
  return map[type] ?? type;
}

function TypeIcon({ type, className = 'h-5 w-5' }: { type: string; className?: string }) {
  const base = `shrink-0 text-muted-foreground ${className}`;
  if (type === 'dayQuiz') {
    return (
      <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    );
  }
  switch (type) {
    case 'VIDEO':
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case 'NOTES':
    case 'BRIEF_NOTES':
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'FLASH_CARDS':
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'SHORT_QUESTIONS':
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'ASSIGNMENT':
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'GLOSSARY':
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'RECOMMENDATION':
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    default:
      return (
        <svg className={base} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
  }
}

/** Collapsed resource icon button with portal tooltip (only when collapsed). */
function CollapsedResourceButton({
  item,
  isActive,
  onSelectItem,
}: {
  item: DayItem;
  isActive: boolean;
  onSelectItem: (item: DayItem) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipRect, setTooltipRect] = useState({ x: 0, y: 0 });

  const type = item.type === 'dayQuiz' ? 'dayQuiz' : item.resource.type;
  const label = itemLabel(item);

  const updateRect = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTooltipRect({ x: r.left - 8, y: r.top + r.height / 2 });
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
    const onScrollOrResize = () => updateRect();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [showTooltip, updateRect]);

  const tooltipEl =
    typeof document !== 'undefined' && showTooltip
      ? createPortal(
          <div
            role="tooltip"
            className="fixed z-[9999] max-w-[220px] -translate-y-1/2 rounded-xl border border-border/60 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xl ring-1 ring-black/5"
            style={{ left: tooltipRect.x, top: tooltipRect.y, transform: 'translate(-100%, -50%)' }}
          >
            <span className="line-clamp-2 block">{label}</span>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <motion.li initial={false} animate={{ opacity: 1 }} className="flex w-full justify-center">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => onSelectItem(item)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isActive
              ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30'
              : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
          }`}
          aria-label={label}
          aria-current={isActive ? 'true' : undefined}
        >
          <TypeIcon type={type} className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : ''}`} />
        </button>
      </motion.li>
      {tooltipEl}
    </>
  );
}

/**
 * Right panel — persistent resources nav. Expanded: full list with icons + labels + collapse arrow.
 * Collapsed: icon strip + expand arrow. Portal tooltip on hover when collapsed. Premium styling.
 */
export function ResourceRail({
  items,
  selectedItem,
  onSelectItem,
  collapsed,
  onToggleCollapse,
}: ResourceRailProps) {
  return (
    <aside
      aria-label="Resources"
      className={`flex h-full w-full flex-col overflow-hidden border-l border-border/60 ${collapsed ? 'bg-transparent shadow-none sm:bg-card sm:shadow-sm' : 'bg-card shadow-sm'} lg:bg-card/95`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-2 py-2.5 sm:px-3 sm:py-3">
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Expand resources"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderOpen className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="truncate text-sm font-semibold text-foreground">Resources</span>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Minimize resources"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" aria-label="Resource list">
        {items.length === 0 ? (
          <p className="px-2.5 py-3 text-[10px] text-muted-foreground sm:px-3 sm:py-4 sm:text-xs md:text-sm">
            No resources for this day.
          </p>
        ) : collapsed ? (
          <ul className="flex flex-col items-center gap-1 px-1.5 py-1 pt-3">
            {items.map((item) => {
              const isActive =
                selectedItem &&
                ((item.type === 'resource' && selectedItem.type === 'resource' && selectedItem.id === item.id) ||
                  (item.type === 'dayQuiz' && selectedItem.type === 'dayQuiz' && selectedItem.id === item.id));
              return (
                <CollapsedResourceButton
                  key={item.type + item.id}
                  item={item}
                  isActive={!!isActive}
                  onSelectItem={onSelectItem}
                />
              );
            })}
          </ul>
        ) : (
          <ul className="space-y-0.5 px-2">
            {items.map((item) => {
              const type = item.type === 'dayQuiz' ? 'dayQuiz' : item.resource.type;
              const isActive =
                selectedItem &&
                ((item.type === 'resource' && selectedItem.type === 'resource' && selectedItem.id === item.id) ||
                  (item.type === 'dayQuiz' && selectedItem.type === 'dayQuiz' && selectedItem.id === item.id));
              return (
                <motion.li key={item.type + item.id} initial={false}>
                  <button
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:gap-3 ${
                      isActive
                        ? 'bg-primary/15 font-semibold text-foreground ring-1 ring-primary/20'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <TypeIcon type={type} className={`h-5 w-5 shrink-0 ${isActive ? 'text-foreground' : ''}`} />
                    <span className="truncate">{itemLabel(item)}</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}

export { RAIL_WIDTH_COLLAPSED, RAIL_WIDTH_EXPANDED };

/** Mobile-only: resource icon button with portal tooltip (above strip). */
function MobileResourceButton({
  item,
  isActive,
  onSelectItem,
}: {
  item: DayItem;
  isActive: boolean;
  onSelectItem: (item: DayItem) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipRect, setTooltipRect] = useState({ x: 0, y: 0 });
  const type = item.type === 'dayQuiz' ? 'dayQuiz' : item.resource.type;
  const label = itemLabel(item);

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

  const tooltipEl =
    typeof document !== 'undefined' && showTooltip
      ? createPortal(
          <div
            role="tooltip"
            className="fixed z-[9999] max-w-[220px] -translate-x-1/2 -translate-y-full rounded-xl border border-border/60 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xl ring-1 ring-black/5"
            style={{ left: tooltipRect.x, top: tooltipRect.y }}
          >
            <span className="line-clamp-2 block">{label}</span>
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
          onSelectItem(item);
          setShowTooltip((v) => !v);
        }}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isActive
            ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30'
            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
        }`}
        aria-label={label}
        title={label}
        aria-current={isActive ? 'true' : undefined}
      >
        <TypeIcon type={type} className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : ''}`} />
      </button>
      {tooltipEl}
    </>
  );
}

export interface ResourceStripMobileProps {
  items: DayItem[];
  selectedItem: DayItem | null;
  onSelectItem: (item: DayItem | null) => void;
}

/**
 * Mobile-only resource strip: placed below Day strip, above ContentViewer. Icons left-aligned + tooltip; down arrow collapses to single row, up arrow expands.
 */
export function ResourceStripMobile({ items, selectedItem, onSelectItem }: ResourceStripMobileProps) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div
      className="flex shrink-0 items-start justify-between gap-2 border-b border-border/40 bg-card/95 px-3 py-2 mt-[10px] mb-[30px] lg:hidden"
      aria-label="Resources"
    >
      <div
        className={`flex min-w-0 flex-1 items-center justify-start gap-1.5 py-1 ${
          collapsed ? 'overflow-x-auto overflow-y-hidden' : 'flex-wrap gap-y-1.5'
        }`}
      >
        {items.length === 0 ? (
          <p className="py-1 text-[10px] text-muted-foreground sm:text-xs">No resources for this day.</p>
        ) : (
          items.map((item) => {
            const isActive =
              selectedItem &&
              ((item.type === 'resource' && selectedItem.type === 'resource' && selectedItem.id === item.id) ||
                (item.type === 'dayQuiz' && selectedItem.type === 'dayQuiz' && selectedItem.id === item.id));
            return (
              <MobileResourceButton
                key={item.type + item.id}
                item={item}
                isActive={!!isActive}
                onSelectItem={(i) => onSelectItem(i)}
              />
            );
          })
        )}
      </div>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={collapsed ? 'Expand resources' : 'Collapse resources'}
        title={collapsed ? 'Expand resources' : 'Collapse resources'}
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
