'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useInterviewQuestions } from '@/lib/sheetInterviews';
import {
  ArrowLeft, Eye, Check, AlertCircle, RefreshCw,
  MessageSquare, Timer, Sparkles, Loader2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function InterviewPracticePage({ params }: PageProps) {
  const { slug } = use(params);
  const { questions, card, loading, error } = useInterviewQuestions(slug);

  const [mode, setMode] = useState<'practice' | 'mock'>('practice');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [practicePage, setPracticePage] = useState(0);

  // Timer for Mock Mode
  useEffect(() => {
    if (mode !== 'mock' || !timerRunning || showFeedback) return;
    const timer = setInterval(() => setSecondsElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [mode, timerRunning, showFeedback, currentQuestionIndex]);

  // Reset timer on question change
  useEffect(() => {
    setSecondsElapsed(0);
    setTimerRunning(true);
  }, [currentQuestionIndex, mode]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleNext = () => {
    setShowFeedback(false);
    setUserAnswer('');
    setCurrentQuestionIndex(prev =>
      prev < questions.length - 1 ? prev + 1 : 0
    );
  };

  const handleShowAnswer = () => {
    setShowFeedback(true);
    setTimerRunning(false);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-zinc-500 font-medium">Loading interview questions...</p>
      </div>
    );
  }

  // ── Fetch error ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-5 bg-white border border-zinc-100 p-6 rounded-xl shadow-2xs mt-8">
        <div className="h-12 w-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6 text-rose-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-850">Connection Error</h2>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
            We couldn't load the interview questions. {error}
          </p>
        </div>
        <Link
          href="/interviews"
          className="inline-flex items-center space-x-1.5 bg-accent text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors tap-active shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to interviews</span>
        </Link>
      </div>
    );
  }

  // ── Not found — slug doesn't exist in InterviewSettings ──────────────────
  if (!card) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-800">Domain not found</h2>
        <p className="text-xs text-zinc-500">This interview domain doesn't exist in the sheet yet.</p>
        <Link href="/interviews" className="text-accent hover:underline inline-flex items-center space-x-1 text-sm">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to interviews</span>
        </Link>
      </div>
    );
  }

  // ── Questions coming soon ─────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-5 bg-white border border-zinc-100 p-6 rounded-xl shadow-2xs mt-8">
        <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center mx-auto">
          <MessageSquare className="h-6 w-6 text-zinc-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-bold text-zinc-800">Questions coming soon</h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
            Interview questions for <strong>{card.title}</strong> are being added. Check back shortly!
          </p>
        </div>
        <Link
          href="/interviews"
          className="inline-flex items-center space-x-1.5 bg-accent text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors tap-active shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to interviews</span>
        </Link>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Back button */}
      <div>
        <Link href="/interviews" className="text-zinc-500 hover:text-zinc-800 text-xs font-semibold inline-flex items-center space-x-1 transition-colors tap-active">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to hub</span>
        </Link>
      </div>

      {/* Course Info Banner */}
      <div className="bg-white border border-zinc-100 p-4 sm:p-6 rounded-xl shadow-2xs flex justify-between items-center flex-wrap gap-4">
        <div>
          <span className="text-[10px] font-semibold text-accent bg-accent-light/50 px-2 py-0.5 rounded-md uppercase">
            Mock Interview Practice
          </span>
          <h1 className="text-lg font-bold text-zinc-900 mt-1.5">{card.title}</h1>
        </div>

        {/* Mode Toggle */}
        <div className="bg-zinc-50 p-1 border border-zinc-200/50 rounded-lg flex items-center space-x-1">
          <button
            onClick={() => { setMode('practice'); setShowFeedback(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold select-none transition-all duration-150 tap-active ${
              mode === 'practice'
                ? 'bg-white text-accent shadow-2xs border border-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Practice mode
          </button>
          <button
            onClick={() => { setMode('mock'); setShowFeedback(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold select-none transition-all duration-150 tap-active ${
              mode === 'mock'
                ? 'bg-white text-accent shadow-2xs border border-zinc-100'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Mock mode
          </button>
        </div>
      </div>

      {/* Main Panel */}
      {mode === 'practice' ? (
        <div className="space-y-6">
          {/* Paginated Question Cards list */}
          <div className="space-y-4">
            {questions.slice(practicePage * 10, (practicePage + 1) * 10).map((q, idx) => {
              const globalIndex = practicePage * 10 + idx;
              return (
                <div key={q.id || globalIndex} className="bg-white border border-zinc-100 p-6 rounded-xl shadow-2xs space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded uppercase">
                      Question {globalIndex + 1} of {questions.length}
                    </span>
                    <span className="text-[9px] font-bold text-accent bg-accent-light/50 px-2 py-0.5 rounded uppercase">
                      {q.category}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-semibold text-zinc-950 leading-relaxed">
                    {q.question}
                  </h2>
                  <div className="space-y-2 p-4 rounded-xl border bg-zinc-50/50 border-zinc-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                        Ideal structure
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-850 font-normal leading-relaxed whitespace-pre-wrap">
                      {q.sampleAnswer || 'No sample answer provided yet.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="bg-white border border-zinc-100 p-4 rounded-xl shadow-2xs flex items-center justify-between">
            <button
              onClick={() => setPracticePage(prev => Math.max(0, prev - 1))}
              disabled={practicePage === 0}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors duration-150 tap-active"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-zinc-500">
              Page {practicePage + 1} of {Math.ceil(questions.length / 10)}
            </span>
            <button
              onClick={() => setPracticePage(prev => prev + 1)}
              disabled={(practicePage + 1) * 10 >= questions.length}
              className="px-4 py-2 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors duration-150 tap-active"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main Question Panel for Mock Mode */}
          <div className="bg-white border border-zinc-100 p-6 sm:p-8 rounded-xl shadow-2xs space-y-6">
            {/* Question Header */}
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-bold text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded uppercase">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <span className="text-[9px] font-bold text-accent bg-accent-light/50 px-2 py-0.5 rounded uppercase">
                    {currentQuestion.category}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-zinc-950 leading-relaxed pt-2">
                  {currentQuestion.question}
                </h2>
              </div>

              <div className="flex-shrink-0 flex items-center space-x-1.5 bg-zinc-50 border border-zinc-200/50 px-2.5 py-1.5 rounded-lg text-xs font-bold text-zinc-600">
                <Timer className="h-3.5 w-3.5 text-zinc-400" />
                <span>{formatTimer(secondsElapsed)}</span>
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Your answer (required to compare)
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={showFeedback}
                placeholder='Type your answer here. Once you are finished, click "Submit & compare" to review against the expert sample.'
                rows={5}
                className="w-full bg-zinc-50 p-4 text-sm rounded-xl border border-zinc-200 focus:outline-none focus:border-accent focus:bg-white transition-all duration-150 disabled:bg-zinc-50/50 disabled:text-zinc-500 font-normal leading-relaxed"
              />
            </div>

            {/* Action Row */}
            <div className="flex justify-between items-center pt-4 border-t border-zinc-50">
              <div className="flex gap-2">
                <button
                  onClick={handleShowAnswer}
                  disabled={showFeedback || !userAnswer.trim()}
                  className="inline-flex items-center space-x-1.5 bg-accent text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors disabled:bg-zinc-100 disabled:text-zinc-400 tap-active shadow-2xs"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Submit &amp; compare</span>
                </button>
              </div>

              <button
                onClick={handleNext}
                className="inline-flex items-center space-x-1.5 bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors tap-active"
              >
                <span>Next question</span>
              </button>
            </div>
          </div>

          {/* Comparison / Feedback */}
          {showFeedback && (
            <div className="bg-white border border-zinc-100 p-6 sm:p-8 rounded-xl shadow-2xs space-y-6 animate-fade-in">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-50 pb-2 uppercase tracking-wider">
                Comparison &amp; Sample Answer
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Your Answer</span>
                  <p className="text-xs text-zinc-700 font-normal leading-relaxed whitespace-pre-wrap">
                    {userAnswer || 'No response typed.'}
                  </p>
                  <div className="text-[10px] text-zinc-400 font-semibold pt-4">
                    Response length: {userAnswer.trim().split(/\s+/).length} words · Time: {formatTimer(secondsElapsed)}
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-xl border bg-indigo-50/20 border-indigo-100">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Expert Sample Answer</span>
                    <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Ideal structure
                    </span>
                  </div>
                  <p className="text-xs text-zinc-800 font-normal leading-relaxed whitespace-pre-wrap">
                    {currentQuestion.sampleAnswer || 'No sample answer provided yet.'}
                  </p>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-lg p-3 text-[11px] text-zinc-500 font-normal leading-relaxed flex items-start space-x-2">
                <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  Compare your answer with the expert response. Assess if you covered the main technical points, explained the trade-offs, and maintained a confident behavioral structure.
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
