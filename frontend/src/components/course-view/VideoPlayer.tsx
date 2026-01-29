'use client';

import { useState, useCallback, useEffect } from 'react';
import type { EmbedInfo } from './resource-display-utils';

interface VideoPlayerProps {
  embedInfo: EmbedInfo;
  title: string;
  fallbackUrl?: string;
}

const LOAD_REVEAL_MS = 2500; // Hide loading overlay after this if onLoad never fires

/**
 * Video player: iframe visible immediately; loading overlay hides on iframe onLoad or after timeout.
 */
export function VideoPlayer({ embedInfo, title, fallbackUrl }: VideoPlayerProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setError(false);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), LOAD_REVEAL_MS);
    return () => clearTimeout(t);
  }, [embedInfo.url]);

  return (
    <div
      className="relative w-full bg-black rounded-xl overflow-hidden border border-border shadow-2xl"
      style={{ aspectRatio: '16/9', minHeight: 280 }}
    >
      {/* iframe: always visible so it can load; loading overlay sits on top until loaded */}
      <iframe
        key={embedInfo.url}
        src={embedInfo.url}
        className="absolute inset-0 w-full h-full border-0 bg-black"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        title={title}
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Loading overlay: hides as soon as loaded is true or after timeout */}
      {!loaded && !error && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-muted/95 transition-opacity duration-300"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="h-10 w-10 rounded-full border-2 border-primary/40 border-t-primary animate-spin"
            aria-hidden
          />
          <p className="text-sm font-medium text-muted-foreground">Loading video…</p>
        </div>
      )}

      {/* Error / fallback */}
      {error && fallbackUrl && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-muted/95 p-6">
          <p className="text-sm text-muted-foreground text-center">Video could not be loaded in the player.</p>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Open in {embedInfo.provider === 'youtube' ? 'YouTube' : 'Vimeo'}
          </a>
        </div>
      )}
    </div>
  );
}
