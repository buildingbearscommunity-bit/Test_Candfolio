'use client';

import React, { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useKorsayStore, COURSES, type Attempt } from '@/lib/store';
import { useLiveExam } from '@/lib/sheetExams';
import {
  Award, RefreshCw, CheckCircle2, XCircle,
  FileText, Copy, ArrowLeft, Check, AlertCircle, Download
} from 'lucide-react';

interface PageProps {
  params: Promise<{ examId: string }>;
}

function buildCertCode(attempt: Attempt) {
  const ts = attempt.id.split('-')[1] || Date.now().toString();
  const user = attempt.user_id.split('@')[0].toUpperCase().slice(0, 4);
  return `KOR-${ts}-${user}`;
}

export default function ExamResultPage({ params }: PageProps) {
  const { examId } = use(params);
  const searchParams = useSearchParams();
  const isTimeout = searchParams.get('timeout') === 'true';

  const { getCourseById, guestProfile, resumes, updateResume } = useKorsayStore();

  const [addedToResume, setAddedToResume] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const attemptId = searchParams.get('attemptId');
    console.log('[Korsay] Result page — attemptId from URL:', attemptId);

    // ── Priority 1: dedicated pending key written synchronously on submit ──
    try {
      const raw = localStorage.getItem('korsay_pending_attempt');
      if (raw) {
        const parsed: Attempt = JSON.parse(raw);
        if (!attemptId || parsed.id === attemptId) {
          console.log('[Korsay] Found via pending key — id:', parsed.id, 'score:', parsed.score, 'passed:', parsed.passed, 'exam_id:', parsed.exam_id);
          setAttempt(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('[Korsay] Error reading pending attempt:', e);
    }

    // ── Priority 2: full attempts array ──
    if (attemptId) {
      try {
        const raw = localStorage.getItem('korsay_attempts');
        if (raw) {
          const all: Attempt[] = JSON.parse(raw);
          const found = all.find(a => a.id === attemptId);
          if (found) {
            console.log('[Korsay] Found via attempts array — id:', found.id, 'score:', found.score);
            setAttempt(found);
            return;
          }
        }
      } catch (e) {
        console.error('[Korsay] Error reading attempts array:', e);
      }
    }

    console.warn('[Korsay] No attempt found for attemptId:', attemptId);
    setNoData(true);
  }, []);

  // ── Derive exam metadata from EXAMS list or attempt.exam_id ──
  // Never block rendering on this — attempt data is the source of truth
  // ── Derive exam metadata from live data ──
  const liveExamCourseId = useMemo(() => {
    if (!attempt) return examId;
    if (attempt.exam_id === 'fs-exam-1') return 'full-stack-dev';
    if (attempt.exam_id.startsWith('exam-')) return attempt.exam_id.replace('exam-', '');
    return attempt.exam_id;
  }, [attempt, examId]);

  const { exam } = useLiveExam(liveExamCourseId);

  // Derive course — try multiple paths
  const course = useMemo(() => {
    if (!attempt) return null;
    const courseId = exam?.course_id || attempt.exam_id.replace(/^exam-/, '');
    return (
      getCourseById(courseId) ||
      getCourseById(examId) ||
      COURSES.find(c => c.id === courseId || c.slug === courseId) ||
      null
    );
  }, [attempt, exam, examId]);

  const verificationCode = useMemo(
    () => (attempt ? buildCertCode(attempt) : ''),
    [attempt]
  );

  const shareUrl = hydrated
    ? `${window.location.origin}/certificate/${verificationCode}`
    : `/certificate/${verificationCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToResume = () => {
    const certName = `${course?.name ?? 'Certification'} Certification`;
    if (resumes.length === 0) return;
    const primary = resumes[0];
    if (!primary.certifications.includes(certName)) {
      updateResume({ ...primary, certifications: [...primary.certifications, certName] });
    }
    setAddedToResume(true);
  };

  // ── Loading spinner (single frame before useEffect) ──
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── True error: no attempt data in storage at all ──
  if (noData || !attempt) {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-5">
        <div className="h-14 w-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-800">Result not found</h2>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
            This happens when you navigate directly to this page without completing an exam, or when your browser storage was cleared.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center space-x-1.5 bg-accent text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors tap-active"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Browse courses</span>
        </Link>
      </div>
    );
  }

  // Attempt is present — render results regardless of whether exam/course metadata loaded
  const examTitle = exam?.title ?? 'Certification Exam';
  const passThreshold = exam?.pass_threshold ?? 75;
  const courseName = course?.name ?? 'this course';
  const courseSlug = course?.slug ?? examId;
  const retakeHref = `/exam/${attempt.exam_id}`;

  const correctCount = exam
    ? exam.questions.reduce((acc, q, idx) =>
        acc + (attempt.answers[idx] === q.correct_answer ? 1 : 0), 0)
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Back link */}
      <Link
        href={`/courses/${courseSlug}`}
        className="text-zinc-500 hover:text-zinc-800 text-xs font-semibold inline-flex items-center space-x-1 transition-colors tap-active"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to {courseName}</span>
      </Link>

      {/* ── Score Banner ── */}
      <div className="panel p-6 sm:p-8 text-center space-y-5">
        {isTimeout && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-w-sm mx-auto text-xs text-amber-800 font-semibold flex items-center justify-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <span>Time ran out — your exam was automatically submitted.</span>
          </div>
        )}

        <div className="space-y-1">
          <span className="badge badge-neutral">
            Exam results
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-2">{examTitle}</h1>
        </div>

        {/* Score */}
        <div>
          <span className={`text-7xl font-extrabold tracking-tight ${attempt.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
            {attempt.score}%
          </span>
          <p className="text-xs text-zinc-400 font-semibold mt-2">
            {correctCount !== null
              ? `${correctCount} of ${exam!.questions.length} correct · `
              : ''}
            Passing score {passThreshold}%
          </p>
        </div>

        {/* Pass / Fail badge — pill shaped */}
        {attempt.passed ? (
          <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Exam passed</span>
          </div>
        ) : (
          <div className="inline-flex items-center space-x-2 bg-rose-50 text-rose-800 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider">
            <XCircle className="h-4 w-4 text-rose-400" />
            <span>Exam failed</span>
          </div>
        )}

        <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
          {attempt.passed
            ? 'Congratulations! Your certificate is ready below — download it or add it to your resume.'
            : `You scored ${attempt.score}% but needed ${passThreshold}%. Review the answers below and retake when ready.`}
        </p>

        {/* Action buttons */}
        <div className="flex justify-center gap-3 flex-wrap pt-1">
          <Link
            href={retakeHref}
            className="inline-flex items-center space-x-2 border border-zinc-200 bg-white text-zinc-700 px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150 tap-active"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retake exam</span>
          </Link>

          {/* Download certificate — only when passed */}
          {attempt.passed && (
            <Link
              href={`/certificate/${verificationCode}`}
              className="btn-primary inline-flex items-center space-x-2 text-xs font-semibold py-2.5 px-4 rounded-lg tap-active"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download certificate</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Lower grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Answers review — only when we have exam questions to compare against */}
        {exam && (
          <div className="panel p-6 space-y-5">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center space-x-2 border-b border-zinc-100 pb-3">
              <CheckCircle2 className="h-4 w-4 text-zinc-400" />
              <span>Answers review</span>
            </h3>

            <div className="space-y-5">
              {exam.questions.map((q, idx) => {
                const userIdx = attempt.answers[idx];
                const isCorrect = userIdx === q.correct_answer;
                return (
                  <div key={idx} className="space-y-2 border-b border-zinc-50 pb-4 last:border-0 last:pb-0">
                    <p className="text-xs font-semibold text-zinc-800 leading-relaxed">
                      <span className="text-zinc-400 mr-1.5">{idx + 1}.</span>
                      {q.text}
                    </p>
                    <div className="space-y-1.5 pl-5">
                      <div className="flex items-start space-x-2">
                        <div className="mt-0.5 flex-shrink-0">
                          {isCorrect
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            : <XCircle className="h-3.5 w-3.5 text-rose-500" />}
                        </div>
                        <div className="text-xs">
                          <span className="text-zinc-400 mr-1">Your answer:</span>
                          <span className={isCorrect ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                            {userIdx !== undefined && userIdx >= 0 && q.options[userIdx]
                              ? q.options[userIdx]
                              : 'No answer selected'}
                          </span>
                        </div>
                      </div>
                      {!isCorrect && (
                        <div className="flex items-start space-x-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs">
                            <span className="text-zinc-400 mr-1">Correct answer:</span>
                            <span className="text-emerald-700 font-medium">{q.options[q.correct_answer]}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Certificate card + actions — ONLY when passed=true, never shown when failed */}
        {attempt.passed && (
          <div className="space-y-4">
            {/* Certificate preview */}
            <div className="panel overflow-hidden" style={{ border: '2px solid rgba(135,35,65,0.1)' }}>
              <div className="h-1.5 bg-accent w-full" />
              <div className="p-6 space-y-5 text-center">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Verifiable credential</p>
                  <h3 className="text-base font-bold text-zinc-800 mt-0.5">Certificate of Completion</h3>
                </div>

                <div className="space-y-0.5 text-xs">
                  <p className="text-zinc-400">Proudly awarded to</p>
                  <p className="text-sm font-bold text-zinc-800 border-b border-zinc-100 pb-2 max-w-[180px] mx-auto">
                    {guestProfile.name}
                  </p>
                </div>

                <div className="space-y-0.5 text-xs">
                  <p className="text-zinc-400">For completing the program</p>
                  <p className="text-sm font-bold text-zinc-800">{courseName}</p>
                </div>

                <div className="flex justify-between text-[10px] text-zinc-400 border-t border-zinc-50 pt-4">
                  <div className="text-left">
                    <p>Issue date</p>
                    <p className="font-semibold text-zinc-700">{attempt.date}</p>
                  </div>
                  <div className="text-right">
                    <p>Verification code</p>
                    <p className="font-semibold text-zinc-700">{verificationCode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate action buttons */}
            <div className="panel p-4 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleAddToResume}
                  disabled={addedToResume}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 tap-active border ${
                    addedToResume
                      ? 'bg-zinc-50 border-zinc-200 text-zinc-400 cursor-not-allowed'
                      : 'bg-white border-accent text-accent hover:bg-accent-light/30'
                  }`}
                >
                  {addedToResume
                    ? <><Check className="h-3.5 w-3.5 text-emerald-600" /><span>Added to resume</span></>
                    : <><FileText className="h-3.5 w-3.5" /><span>Add to resume</span></>}
                </button>

                <Link
                  href={`/certificate/${verificationCode}`}
                  className="flex-1 flex items-center justify-center space-x-2 bg-accent text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors tap-active"
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>View certificate</span>
                </Link>
              </div>

              {/* Shareable link */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Shareable link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-grow bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-500 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-600 px-3 rounded-lg flex items-center justify-center tap-active"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
