'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Exam, Question } from './store';

const EXAMS_URL = 'https://script.google.com/macros/s/AKfycbxEHkCUckxUdMx713C2AZZsc6nK70EF75JOiFAMyCNEJFB5lCz7C8mn5EJc1ezS7hYc/exec';

// ── Types ────────────────────────────────────────────────────────────────────

/** One card on /certifications — sourced purely from ExamSettings row */
export interface CertificationCard {
  courseId: string;       // normalized course_id — used as URL slug
  title: string;          // exam_title from sheet
  totalQuestions: number; // total_questions from sheet (for display)
  durationMins: number;   // duration_mins
  passThreshold: number;  // pass_threshold
  hasQuestions: boolean;  // whether Questions tab has rows for this course_id
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeString(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val);
}

/** Normalize a course_id for matching: trim whitespace + lowercase */
function normalizeId(val: any): string {
  return safeString(val).trim().toLowerCase();
}

function parseNum(val: any): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

function letterToIndex(letter: string): number {
  const l = safeString(letter).toLowerCase().trim();
  if (l === 'a') return 0;
  if (l === 'b') return 1;
  if (l === 'c') return 2;
  if (l === 'd') return 3;
  return 0;
}

// ── Context ──────────────────────────────────────────────────────────────────

interface SheetExamsContextValue {
  exams: Exam[];
  certCards: CertificationCard[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const SheetExamsContext = createContext<SheetExamsContextValue | undefined>(undefined);

// ── Provider ─────────────────────────────────────────────────────────────────

export function SheetExamsProvider({ children }: { children: React.ReactNode }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [certCards, setCertCards] = useState<CertificationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL(EXAMS_URL);
      url.searchParams.set('t', Date.now().toString());

      console.log('[Korsay] Certifications exam fetch URL:', url.toString());

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      console.log('[Korsay] Raw certifications exam response:', data);

      const rawSettings: any[] = data.examSettings || [];
      const rawQuestions: any[] = data.questions || [];

      // Log all unique course_ids from both tabs
      const settingIds = rawSettings.map((r: any) => safeString(r.course_id));
      const questionIds = [...new Set(rawQuestions.map((r: any) => safeString(r.course_id)))];
      const allCourseIds = [...new Set([...settingIds, ...questionIds])];
      console.log('[Korsay] course_ids in sheet (raw):', allCourseIds);
      console.log('[Korsay] course_ids in sheet (normalized):', allCourseIds.map(id => normalizeId(id)));

      // ── Group questions by NORMALIZED course_id ──────────────────────────
      const questionsByCourse: Record<string, Question[]> = {};
      rawQuestions.forEach((qRow: any, idx: number) => {
        const courseId = normalizeId(qRow.course_id);
        if (!courseId) return;
        if (!questionsByCourse[courseId]) questionsByCourse[courseId] = [];
        questionsByCourse[courseId].push({
          id: `${courseId}-q${idx}`,
          text: safeString(qRow.question),
          options: [
            safeString(qRow.option_a),
            safeString(qRow.option_b),
            safeString(qRow.option_c),
            safeString(qRow.option_d),
          ],
          correct_answer: letterToIndex(qRow.correct_option),
        });
      });

      // ── Build Exam objects (for exam-taking pages) ────────────────────────
      const parsedExams: Exam[] = rawSettings.map((setRow: any) => {
        const courseId = normalizeId(setRow.course_id);
        return {
          id: courseId,
          course_id: courseId,
          title: safeString(setRow.exam_title) || 'Certification Exam',
          duration_mins: parseNum(setRow.duration_mins) || 15,
          pass_threshold: parseNum(setRow.pass_threshold) || 75,
          questions: questionsByCourse[courseId] || [],
        };
      });

      // ── Build CertificationCard objects (for /certifications listing) ─────
      // One card per ExamSettings row — fully independent of COURSES / sheetCourses
      const parsedCards: CertificationCard[] = rawSettings.map((setRow: any) => {
        const courseId = normalizeId(setRow.course_id);
        const questions = questionsByCourse[courseId] || [];
        const totalQuestionsFromSheet = parseNum(setRow.total_questions);
        return {
          courseId,
          title: safeString(setRow.exam_title) || 'Certification Exam',
          // Prefer sheet's total_questions for display; fall back to actual count
          totalQuestions: totalQuestionsFromSheet || questions.length,
          durationMins: parseNum(setRow.duration_mins) || 15,
          passThreshold: parseNum(setRow.pass_threshold) || 75,
          hasQuestions: questions.length > 0,
        };
      });

      setExams(parsedExams);
      setCertCards(parsedCards);

      // ── Log 7: Confirmation of rendered cards ─────────────────────────────
      console.log('[Korsay] Certification cards rendered:', parsedCards.map(c => c.courseId));
      console.log(`[Korsay] Loaded ${parsedExams.length} exams, ${parsedCards.length} certification cards`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load exam data';
      console.warn('[Korsay] Exam fetch error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SheetExamsContext.Provider value={{ exams, certCards, loading, error, refetch: fetchData }}>
      {children}
    </SheetExamsContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useSheetExams() {
  const ctx = useContext(SheetExamsContext);
  if (!ctx) throw new Error('useSheetExams must be used inside <SheetExamsProvider>');
  return ctx;
}

/** Returns all CertificationCard objects — one per ExamSettings row */
export function useCertificationCards() {
  const { certCards, loading, error } = useSheetExams();
  return { certCards, loading, error };
}

/** Returns the Exam (with questions) for a specific course slug */
export function useLiveExam(courseId: string) {
  const { exams, loading, error } = useSheetExams();

  const normalizedRouteId = normalizeId(courseId);
  const exam = exams.find((e) => normalizeId(e.course_id) === normalizedRouteId) ?? null;

  if (!loading) {
    const availableIds = exams.map(e => e.course_id);
    console.log(`[Korsay] Route is looking for course_id: "${courseId}" (normalized: "${normalizedRouteId}")`);
    console.log(`[Korsay] Available exam course_ids: [${availableIds.map(id => `"${id}"`).join(', ')}]`);
    if (exam) {
      console.log(`[Korsay] ✅ Match found for "${courseId}" → exam "${exam.title}" (${exam.questions.length} questions)`);
    } else {
      console.log(`[Korsay] ❌ No match found for "${courseId}" in`, availableIds);
    }
  }

  return { exam, loading, error };
}
