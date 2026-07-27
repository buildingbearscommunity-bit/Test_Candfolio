'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useKorsayStore } from '@/lib/store';
import { useLiveExam } from '@/lib/sheetExams';
import { 
  ArrowLeft, Clock, Award, CheckCircle2, AlertTriangle, 
  ChevronLeft, ChevronRight, Check, AlertCircle 
} from 'lucide-react';

interface PageProps {
  params: Promise<{ examId: string }>;
}

export default function ExamTakingPage({ params }: PageProps) {
  const { examId } = use(params);
  const router = useRouter();
  const { getCourseById, addAttempt, guestProfile } = useKorsayStore();
  const { exam, loading: examLoading } = useLiveExam(examId);
  const course = exam ? getCourseById(exam.course_id) : undefined;

  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState((exam?.duration_mins || 15) * 60);
  const [isConfirmingSubmit, setIsConfirmingSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!started || !exam || currentQuestionIndex >= exam.questions.length) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, currentQuestionIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const isQuestionAnswered = (questionId: string) => selectedAnswers[questionId] !== undefined;
  const getAnsweredCount = () => Object.keys(selectedAnswers).length;

  const handleAutoSubmit = () => submitExam(true);

  const submitExam = (forced = false) => {
    if (isSubmitting || !exam) return;
    setIsSubmitting(true);

    const questions = exam.questions;
    let correctCount = 0;

    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_answer) correctCount++;
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= exam.pass_threshold;
    const answersArray = questions.map(q =>
      selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1
    );

    const attemptId = `att-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const attemptDate = new Date().toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const attempt = {
      id: attemptId,
      exam_id: exam.id,
      user_id: guestProfile.email,
      score,
      passed,
      answers: answersArray,
      date: attemptDate,
    };

    // ── Write to localStorage SYNCHRONOUSLY before navigating ──
    // 1. Dedicated key so result page always finds it instantly
    localStorage.setItem('korsay_pending_attempt', JSON.stringify(attempt));
    // 2. Append to full attempts history
    try {
      const existing = JSON.parse(localStorage.getItem('korsay_attempts') || '[]');
      localStorage.setItem('korsay_attempts', JSON.stringify([...existing, attempt]));
    } catch (_) {}

    console.log('[Korsay] Exam submitted. Attempt saved:', attemptId, '| score:', score, '| passed:', passed);

    // Also update React context (async — result page does NOT wait for this)
    addAttempt(exam.id, score, passed, answersArray);

    // Navigate with plain attemptId — no encoding issues
    router.push(`/exam/${exam.id}/result?attemptId=${attemptId}${forced ? '&timeout=true' : ''}`);
  };

  if (examLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-4 sm:py-8 text-center animate-pulse flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-zinc-500 font-medium">Loading exam data...</div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-4 sm:py-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
        <div className="text-zinc-800 font-bold text-xl">Exam not found</div>
        <p className="text-zinc-500 text-sm">We could not find this exam. It may be coming soon.</p>
        <Link href="/certifications" className="btn-primary mt-4 inline-block px-4 py-2 text-sm text-center">
          Browse Certifications
        </Link>
      </div>
    );
  }

  const questions = exam.questions;
  const isReviewScreen = currentQuestionIndex === questions.length;
  const answeredPct = (getAnsweredCount() / questions.length) * 100;

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-4 sm:py-8">
        <div>
          <Link
            href={`/courses/${course?.slug || ''}`}
            className="text-zinc-500 hover:text-zinc-800 text-xs font-semibold inline-flex items-center space-x-1 transition-colors tap-active"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to course</span>
          </Link>
        </div>

        <div className="panel p-8 space-y-6">
          <div className="space-y-3">
            <span className="badge badge-accent">
              Certification Exam
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">{exam.title}</h1>
            <p className="text-xs text-zinc-500 leading-relaxed font-normal">
              Course: <span className="font-semibold text-zinc-700">{course?.name}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-4 border-y border-zinc-100">
            <div className="text-center space-y-1">
              <Clock className="h-5 w-5 text-accent mx-auto" />
              <p className="text-[10px] text-zinc-400 font-medium">Duration</p>
              <p className="text-sm font-semibold text-zinc-800">{exam.duration_mins} mins</p>
            </div>
            <div className="text-center space-y-1">
              <Award className="h-5 w-5 text-accent mx-auto" />
              <p className="text-[10px] text-zinc-400 font-medium">Questions</p>
              <p className="text-sm font-semibold text-zinc-800">{questions.length}</p>
            </div>
            <div className="text-center space-y-1">
              <CheckCircle2 className="h-5 w-5 text-accent mx-auto" />
              <p className="text-[10px] text-zinc-400 font-medium">Pass score</p>
              <p className="text-sm font-semibold text-zinc-800">{exam.pass_threshold}%</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-zinc-500 font-normal leading-relaxed">
            <h4 className="font-semibold text-zinc-700">Before you begin:</h4>
            <ul className="list-disc list-inside space-y-1.5">
              <li>Once you start, the countdown timer begins immediately.</li>
              <li>You cannot pause the exam or reset the timer.</li>
              <li>Leaving or refreshing the page will NOT stop the timer.</li>
              <li>Make sure you have a stable connection and a quiet environment.</li>
            </ul>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="btn-primary w-full tap-active"
          >
            Start exam
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header: Progress + Timer */}
      <div className="panel p-4 flex items-center justify-between gap-4">
        <div className="flex-grow space-y-2">
          <div className="flex justify-between text-[11px] font-semibold text-zinc-500">
            <span>
              {isReviewScreen ? 'Review' : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
            </span>
            <span>{getAnsweredCount()} of {questions.length} answered</span>
          </div>
          {/* Animated progress bar */}
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${answeredPct}%` }}
            />
          </div>
        </div>

        <div className={`flex-shrink-0 flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-colors duration-300 ${
          timeLeft < 60
            ? 'bg-rose-50 border border-rose-200 text-rose-700'
            : 'bg-zinc-50 border border-zinc-200/60 text-zinc-700'
        }`}>
          <Clock className={`h-4 w-4 ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-zinc-500'}`} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Question / Review Panel */}
      <div className="panel p-6 sm:p-8 min-h-[300px] flex flex-col justify-between">
        {!isReviewScreen ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="badge badge-accent">
                Multiple choice
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-zinc-900 leading-relaxed">
                {questions[currentQuestionIndex].text}
              </h2>
            </div>

            <div className="space-y-3">
              {questions[currentQuestionIndex].options.map((option, idx) => {
                const isSelected = selectedAnswers[questions[currentQuestionIndex].id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(questions[currentQuestionIndex].id, idx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start space-x-3 text-sm font-normal tap-active ${
                      isSelected
                        ? 'border-accent bg-accent-light/20 text-accent font-medium shadow-sm'
                        : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-150 ${
                      isSelected ? 'border-accent bg-accent text-white' : 'border-zinc-300 bg-white'
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-zinc-900">Review your answers</h2>
              <p className="text-xs text-zinc-400">Verify all questions before submitting. Click a number to jump back.</p>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
              {questions.map((q, idx) => {
                const answered = isQuestionAnswered(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-11 rounded-lg text-xs font-semibold flex items-center justify-center border transition-all duration-150 tap-active ${
                      answered
                        ? 'bg-accent/10 border-accent/30 text-accent'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {getAnsweredCount() < questions.length && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-2.5 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>{questions.length - getAnsweredCount()}</strong> question(s) unanswered. No penalty for guessing — we recommend filling them all in.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-zinc-100 mt-8">
          <button
            onClick={() => { if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1); }}
            disabled={currentQuestionIndex === 0}
            className="btn-secondary text-xs font-semibold py-2 px-4 rounded-lg tap-active disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="flex items-center space-x-1">
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </span>
          </button>

          {!isReviewScreen && (
            <span className="text-[11px] font-semibold text-zinc-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          )}

          {!isReviewScreen ? (
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              className="btn-primary text-xs font-semibold py-2 px-4 rounded-lg tap-active"
            >
              <span className="flex items-center space-x-1">
                <span>{currentQuestionIndex === questions.length - 1 ? 'Review' : 'Next'}</span>
                <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsConfirmingSubmit(true)}
              disabled={isSubmitting}
              className="btn-primary text-xs font-semibold py-2 px-5 rounded-lg tap-active disabled:opacity-60"
            >
              Submit exam
            </button>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {isConfirmingSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsConfirmingSubmit(false)} />
          <div className="relative bg-white border border-zinc-100 p-6 rounded-xl max-w-sm w-full space-y-4" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 className="text-base font-bold text-zinc-900">Submit exam?</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-normal">
              Once submitted you cannot change your answers. Are you sure?
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setIsConfirmingSubmit(false)}
                className="flex-1 text-center py-2.5 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors duration-150 tap-active"
              >
                Go back
              </button>
              <button
                onClick={() => { setIsConfirmingSubmit(false); submitExam(); }}
                disabled={isSubmitting}
                className="btn-primary flex-1 text-center py-2.5 rounded-lg text-xs font-semibold tap-active disabled:opacity-60"
              >
                Yes, submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
