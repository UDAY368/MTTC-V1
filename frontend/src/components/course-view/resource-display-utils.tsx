'use client';

import React from 'react';

/** Parses text and renders URLs as links that open in a new tab. */
export function linkifyText(text: string): React.ReactNode {
  if (!text || typeof text !== 'string') return text;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      const href = part.replace(/[.,;:!?)]+$/, '');
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline font-medium hover:opacity-80 break-all"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export type EmbedProvider = 'youtube' | 'vimeo';

export interface EmbedInfo {
  url: string;
  provider: EmbedProvider;
}

/**
 * Converts video URLs to embeddable format (YouTube, Vimeo).
 * Mirrors Admin → Course → Day → Video preview getEmbedUrl exactly.
 * Returns null for direct video files (handled with <video>).
 */
export function getEmbedUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const u = url.trim();
  const ytWatch = /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/i;
  const ytEmbed = /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i;
  const ytShort = /youtu\.be\/([a-zA-Z0-9_-]{11})/i;
  const ytMatch = u.match(ytWatch) || u.match(ytEmbed) || u.match(ytShort);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = u.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  if (/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)(\?.*)?$/i.test(u)) return null;
  return null;
}

/** Returns embed URL + provider. Uses same URL logic as Admin Video preview. */
export function getEmbedInfo(url: string): EmbedInfo | null {
  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) return null;
  const u = (url ?? '').toString().trim();
  const vimeoMatch = u.match(/(?:vimeo\.com\/)(\d+)/);
  return { url: embedUrl, provider: vimeoMatch ? 'vimeo' : 'youtube' };
}
