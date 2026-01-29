export interface LearnDay {
  id: string;
  title: string;
  order: number;
  resources: LearnResource[];
  dayQuizzes: LearnDayQuiz[];
}

export interface LearnResource {
  id: string;
  type: string;
  title: string | null;
  order: number;
  videoUrl?: string | null;
  question?: string | null;
  answer?: string | null;
  assignmentQuestion?: string | null;
  noteParagraphs?: { id: string; heading: string | null; content: string; order: number }[];
  flashCards?: { id: string; question: string; answer: string; order: number }[];
  shortQuestions?: { id: string; question: string; answer: string; order: number }[];
  assignmentQuestions?: { id: string; question: string; answer: string; order: number }[];
  glossaryWords?: { id: string; word: string; meaning: string; order: number }[];
  recommendations?: { id: string; title: string; content: string; order: number }[];
}

export interface LearnDayQuiz {
  id: string;
  order: number;
  quiz: { id: string; title: string; uniqueUrl: string };
}

export interface LearnData {
  id: string;
  name: string;
  days: LearnDay[];
}

export type DayItem =
  | { type: 'resource'; id: string; order: number; resource: LearnResource }
  | { type: 'dayQuiz'; id: string; order: number; dayQuiz: LearnDayQuiz };
