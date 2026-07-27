'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const INTERVIEWS_URL = '/api/interviews';

// ── Types ────────────────────────────────────────────────────────────────────

/** One card on /interviews — sourced purely from InterviewSettings row */
export interface InterviewCard {
  courseId: string;        // normalized course_id — used as URL slug
  title: string;           // title from sheet
  description: string;     // description from sheet
  totalQuestions: number;  // total_questions from sheet
  hasQuestions: boolean;   // whether Questions tab has rows for this course_id
}

/** One interview question from the Questions tab */
export interface InterviewQuestion {
  id: string;
  courseId: string;
  question: string;
  sampleAnswer: string;
  category: 'Technical' | 'Behavioral' | string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeString(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val);
}

function normalizeId(val: any): string {
  return safeString(val).trim().toLowerCase();
}

function parseNum(val: any): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function titleFromCourseId(courseId: string): string {
  return courseId
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// ── Context ──────────────────────────────────────────────────────────────────

interface SheetInterviewsContextValue {
  interviewCards: InterviewCard[];
  questionsByCourse: Record<string, InterviewQuestion[]>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const SheetInterviewsContext = createContext<SheetInterviewsContextValue | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

export function SheetInterviewsProvider({ children }: { children: React.ReactNode }) {
  const [interviewCards, setInterviewCards] = useState<InterviewCard[]>([]);
  const [questionsByCourse, setQuestionsByCourse] = useState<Record<string, InterviewQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(INTERVIEWS_URL, { cache: 'no-store' });
      if (!res.ok) {
        console.error(`[Korsay] Interviews fetch FAILED — status: ${res.status} ${res.statusText}`);
        throw new Error(`HTTP ${res.status}`);
      }
      console.log(`[Korsay] Interviews fetch succeeded — status: ${res.status}`);
      const data = await res.json();

      console.log('[Korsay] Raw interviews response:', data);

      const rawSettings: any[] = Array.isArray(data?.interviewSettings)
        ? data.interviewSettings
        : [];
      const rawQuestions: any[] = Array.isArray(data?.questions)
        ? data.questions
        : [];

      // Log all unique course_ids from both tabs
      const settingIds = rawSettings.map((r: any) => safeString(r.course_id));
      const questionIds = [...new Set(rawQuestions.map((r: any) => safeString(r.course_id)))];
      console.log('[Korsay] InterviewSettings course_ids (raw):', settingIds);
      console.log('[Korsay] Questions course_ids (raw):', questionIds);

      // ── Group questions by NORMALIZED course_id ──────────────────────────
      const byCourseMutable: Record<string, InterviewQuestion[]> = {};
      rawQuestions.forEach((qRow: any, idx: number) => {
        const courseId = normalizeId(qRow.course_id);
        if (!courseId) return;
        if (!byCourseMutable[courseId]) byCourseMutable[courseId] = [];
        const cat = safeString(qRow.category);
        byCourseMutable[courseId].push({
          id: `${courseId}-iq${idx}`,
          courseId,
          question: safeString(qRow.question),
          sampleAnswer: safeString(qRow.sample_answer),
          category: cat === 'Behavioral' ? 'Behavioral' : 'Technical',
        });
      });

      // ── Build InterviewCard objects (for /interviews listing) ─────────────
      const settingsRows =
        rawSettings.length > 0
          ? rawSettings
          : Object.keys(byCourseMutable).map((courseId) => ({
              course_id: courseId,
              title: `${titleFromCourseId(courseId)} Interview Practice`,
              description: 'Practice technical and behavioral interview questions.',
              total_questions: byCourseMutable[courseId].length,
            }));

      const parsedCards: InterviewCard[] = settingsRows.map((setRow: any) => {
        const courseId = normalizeId(setRow.course_id);
        const questions = byCourseMutable[courseId] || [];
        return {
          courseId,
          title: safeString(setRow.title) || 'Interview Practice',
          description: safeString(setRow.description) || 'Practice technical and behavioral interview questions.',
          totalQuestions: parseNum(setRow.total_questions) || questions.length,
          hasQuestions: questions.length > 0,
        };
      });

      setInterviewCards(parsedCards);
      setQuestionsByCourse(byCourseMutable);

      // ── Confirmation log ─────────────────────────────────────────────────
      console.log('[Korsay] Interview cards rendered:', parsedCards.map(c => c.courseId));
      console.log(`[Korsay] Loaded ${parsedCards.length} interview cards`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load interview data';
      console.warn('[Korsay] Interviews fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SheetInterviewsContext.Provider value={{ interviewCards, questionsByCourse, loading, error, refetch: fetchData }}>
      {children}
    </SheetInterviewsContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useSheetInterviews() {
  const ctx = useContext(SheetInterviewsContext);
  if (!ctx) throw new Error('useSheetInterviews must be used inside <SheetInterviewsProvider>');
  return ctx;
}

/** Returns all InterviewCard objects — one per InterviewSettings row */
export function useInterviewCards() {
  const { interviewCards, loading, error } = useSheetInterviews();
  return { interviewCards, loading, error };
}

/** Returns questions for a specific course slug */
export function useInterviewQuestions(courseId: string) {
  const { interviewCards, questionsByCourse, loading, error } = useSheetInterviews();
  const normalizedId = normalizeId(courseId);
  const questions = questionsByCourse[normalizedId] || [];
  const card = interviewCards.find(c => c.courseId === normalizedId) ?? null;
  return { questions, card, loading, error };
}
