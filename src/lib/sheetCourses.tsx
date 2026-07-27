'use client';

/**
 * sheetCourses.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches live course content ONLY from the Google Apps Script endpoint.
 * No hardcoded local fallback is used for this data.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SheetRow {
  course_id: string;
  course_name: string;
  short_description: string;
  full_description: string;
  duration: string;
  level: string;
  category: string;
  topics_covered: string; // pipe-separated
  syllabus_link: string;
  banner_link: string;
  price: string | number;
  discount: string | number;
  price_after_discount: string | number;
}

export interface LiveCourse {
  id: string;
  slug: string;
  icon: string;
  name: string;
  short_description: string;
  full_description: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  topics: string[];
  syllabus_link: string;
  banner_link: string;
  gradient: string;
  price: number | null;
  discount: number;
  price_after_discount: number | null;
  has_discount: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbz_30fOh_ZdioGb4USKcnXkG89lGgBlop57eIwK2FxcHwZXluFS2qY8vb1CdXgKlmFlGQ/exec';

const FALLBACK_SYLLABUS = '/korsay-syllabus.pdf';
const DEFAULT_GRADIENT = 'linear-gradient(135deg,#872341,#4f1426)';
const COURSE_CACHE_KEY = 'korsay:sheet-courses:v1';
const COURSE_CACHE_TTL = 1000 * 60 * 30;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeString(val: any): string {
  if (val === undefined || val === null) return '';
  return String(val);
}

function formatBannerLink(url: any): string {
  const str = safeString(url).trim();
  if (!str) return '';
  
  if (str.includes('drive.google.com')) {
    let fileId = '';
    
    // Extract file ID from formats like /file/d/ID/view
    const dMatch = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch && dMatch[1]) {
      fileId = dMatch[1];
    } else {
      // Extract file ID from formats like /uc?export=view&id=ID
      const idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      }
    }
    
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }
  
  return str;
}

function parseNum(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null || val === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function parseTopics(raw: any): string[] {
  if (!raw) return [];
  const str = safeString(raw);
  // Parse pipe-separated topics as requested, also fallback to JSON array if they somehow provide it
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.map(safeString).filter(Boolean);
  } catch {
    // ignore
  }
  return str
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function coerceLevel(raw: any): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (!raw) return 'Intermediate';
  const normalised = safeString(raw).trim();
  if (normalised === 'Beginner' || normalised === 'Intermediate' || normalised === 'Advanced') {
    return normalised;
  }
  return 'Intermediate';
}

function assignIcon(course_id: any): string {
  // Try to heuristically assign an icon based on course_id since it's dynamic
  const lower = safeString(course_id).toLowerCase();
  if (lower.includes('cloud') || lower.includes('aws') || lower.includes('azure')) return 'cloud';
  if (lower.includes('data') || lower.includes('sql') || lower.includes('analytics')) return 'database';
  if (lower.includes('code') || lower.includes('dev') || lower.includes('react')) return 'code';
  if (lower.includes('ai') || lower.includes('ml')) return 'cpu';
  if (lower.includes('security') || lower.includes('cyber')) return 'shield';
  return 'book';
}

function mapData(sheetRows: SheetRow[]): LiveCourse[] {
  return sheetRows.map((row) => {
    const price = parseNum(row.price);
    const discount = parseNum(row.discount) ?? 0;
    const priceAfter = parseNum(row.price_after_discount);
    
    const courseId = safeString(row.course_id);
    
    return {
      id: courseId,
      slug: courseId, // course_id becomes the route slug
      icon: assignIcon(courseId),
      name: safeString(row.course_name).trim() || 'Untitled Course',
      short_description: safeString(row.short_description).trim(),
      full_description: safeString(row.full_description).trim(),
      duration: safeString(row.duration).trim(),
      level: coerceLevel(row.level),
      category: safeString(row.category).trim() || 'General',
      topics: parseTopics(row.topics_covered),
      syllabus_link: safeString(row.syllabus_link).trim() || FALLBACK_SYLLABUS,
      banner_link: formatBannerLink(row.banner_link),
      gradient: DEFAULT_GRADIENT,
      price,
      discount,
      price_after_discount: priceAfter,
      has_discount: discount > 0,
    };
  });
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface SheetCoursesContextValue {
  courses: LiveCourse[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const SheetCoursesContext = createContext<SheetCoursesContextValue | undefined>(
  undefined,
);

export function SheetCoursesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [courses, setCourses] = useState<LiveCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasCoursesRef = useRef(false);

  const applyCourses = useCallback((nextCourses: LiveCourse[]) => {
    hasCoursesRef.current = nextCourses.length > 0;
    setCourses(nextCourses);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(!hasCoursesRef.current);
    setError(null);
    try {
      const res = await fetch(SHEETS_URL, { cache: 'force-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const rows: SheetRow[] = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : [];
      
      console.log(`[Korsay] Loaded ${rows.length} course(s) from sheet`);
      const mappedCourses = mapData(rows);
      applyCourses(mappedCourses);
      localStorage.setItem(
        COURSE_CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), rows }),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load course data';
      console.warn('[SheetCourses] fetch error:', msg);
      if (hasCoursesRef.current) return;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [applyCourses]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(COURSE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { savedAt?: number; rows?: SheetRow[] };
        if (
          parsed.savedAt &&
          Date.now() - parsed.savedAt < COURSE_CACHE_TTL &&
          Array.isArray(parsed.rows)
        ) {
          applyCourses(mapData(parsed.rows));
          setLoading(false);
        }
      }
    } catch {
      localStorage.removeItem(COURSE_CACHE_KEY);
    }

    fetchData();
  }, [applyCourses, fetchData]);

  return (
    <SheetCoursesContext.Provider value={{ courses, loading, error, refetch: fetchData }}>
      {children}
    </SheetCoursesContext.Provider>
  );
}

export function useSheetCourses() {
  const ctx = useContext(SheetCoursesContext);
  if (!ctx) {
    throw new Error('useSheetCourses must be used inside <SheetCoursesProvider>');
  }
  return ctx;
}

export function useLiveCourse(slugOrId: string) {
  const { courses, loading, error } = useSheetCourses();
  const course = courses.find((c) => c.slug === slugOrId || c.id === slugOrId) ?? null;
  return { course, loading, error };
}
