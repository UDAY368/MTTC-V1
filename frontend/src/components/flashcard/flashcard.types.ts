/**
 * Flash card types for gamified LMS.
 * Compatible with existing FlashCardItem (id, question, answer, order).
 */

export interface FlashCardData {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export type LevelBadge = 'Beginner' | 'Pro' | 'Master';

export const XP_PER_GOT_IT = 10;
export const LEVEL_THRESHOLDS = { Beginner: 0, Pro: 50, Master: 150 } as const;

export function getLevelFromXP(xp: number): LevelBadge {
  if (xp >= LEVEL_THRESHOLDS.Master) return 'Master';
  if (xp >= LEVEL_THRESHOLDS.Pro) return 'Pro';
  return 'Beginner';
}
