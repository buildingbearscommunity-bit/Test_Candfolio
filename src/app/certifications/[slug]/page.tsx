'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useLiveExam, useCertificationCards } from '@/lib/sheetExams';
import { useKorsayStore } from '@/lib/store';
import {
  Award, MessageSquare, FileText, ArrowLeft, Play,
  HelpCircle, ChevronRight, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CertificationDetailPage({ params }: PageProps) {
  const { slug } = use(params);
  const { exam, loading: examLoading } = useLiveExam(slug);
  const { certCards, loading: cardsLoading } = useCertificationCards();
  const { getInterviewQuestionsByCourse } = useKorsayStore();

  // Find the matching card from sheet (for title / meta)
  const card = certCards.find((c) => c.courseId === slug) ?? null;

  // Overall loading state
  const loading = examLoading || cardsLoading;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // ── Not found — slug doesn't exist in ExamSettings at all ─────────────────
  if (!card && !exam) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-800">Certification not found</h2>
        <p className="text-xs text-zinc-500">This course ID doesn't exist in the certifications sheet yet.</p>
        <Link href="/certifications" className="text-accent hover:underline inline-flex items-center space-x-1 text-sm">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to certifications</span>
        </Link>
      </div>
    );
  }

  // Derive display values — prefer card (from ExamSettings), then exam, then fallbacks
  const pageTitle = card?.title ?? exam?.title ?? 'Certification Exam';
  const durationMins = card?.durationMins ?? exam?.duration_mins ?? 15;
  const passThreshold = card?.passThreshold ?? exam?.pass_threshold ?? 75;
  const totalQuestionsDisplay = exam?.questions.length ?? card?.totalQuestions ?? 0;

  // ── Interview questions (from store if available, else generic placeholders) ─
  const interviewQuestions = getInterviewQuestionsByCourse(slug);
  const displayInterviewQuestions = interviewQuestions.length > 0 ? interviewQuestions : [
    { id: `${slug}-int-1`, question: `What are the core challenges when implementing ${pageTitle} in large-scale organizations?`, category: 'Technical' },
    { id: `${slug}-int-2`, question: `Describe a scenario where you would choose one approach over another in ${pageTitle}.`, category: 'Technical' },
    { id: `${slug}-int-3`, question: `How do you stay up-to-date with emerging methodologies in ${pageTitle}?`, category: 'Behavioral' },
  ];

  const modules = [
    {
      name: 'Take exam',
      icon: Award,
      href: exam ? `/exam/${exam.id}` : '#',
      description: exam
        ? (exam.questions.length > 0 ? 'Start timed test to earn certification' : 'Questions coming soon')
        : 'Exam coming soon',
    },
    {
      name: 'Mock interview',
      icon: MessageSquare,
      href: `/interviews/${slug}`,
      description: 'Practice technical & behavioral questions',
    },
    {
      name: 'Build resume',
      icon: FileText,
      href: `/resume`,
      description: 'Add your cert credentials to your resume',
    },
  ];

  // Exam is in settings but has no questions yet
  const questionsComingSoon = exam !== null && exam.questions.length === 0;

  return (
    <div className="space-y-8 py-4">
      {/* Back button */}
      <div>
        <Link href="/certifications" className="text-zinc-500 hover:text-zinc-800 text-xs font-semibold inline-flex items-center space-x-1 transition-colors tap-active">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to certifications</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="panel p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
        <div className="p-4 bg-accent-light text-accent rounded-xl">
          <Award className="h-8 w-8 stroke-[1.5]" />
        </div>
        <div className="space-y-3 flex-grow">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-accent">Certification</span>
            {questionsComingSoon && (
              <span className="badge badge-neutral">Questions coming soon</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">{pageTitle}</h1>
          <p className="text-sm text-zinc-500 leading-relaxed font-normal max-w-2xl">
            Pass this certification exam to earn a verifiable credential you can add directly to your resume.
          </p>
        </div>
      </div>

      {/* Module Shortcuts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.name}
              href={mod.href}
              className="group card card-hover p-5 flex items-start space-x-4 tap-active"
            >
              <div className="p-2 bg-zinc-50 text-accent rounded-lg group-hover:bg-accent-light/50 transition-colors duration-150">
                <Icon className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-zinc-800 group-hover:text-accent transition-colors duration-150">{mod.name}</h4>
                <p className="text-xs text-zinc-500 font-normal leading-normal">{mod.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
        {/* Left Side: Exam detail */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">Available certification exams</h3>

          {exam && !questionsComingSoon ? (
            <div className="panel p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-800">{exam.title}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-zinc-500">
                    <span>{durationMins} mins</span>
                    <span>•</span>
                    <span>{totalQuestionsDisplay} questions</span>
                    <span>•</span>
                    <span>Pass rate {passThreshold}%</span>
                  </div>
                </div>
                <Link
                  href={`/exam/${exam.id}`}
                  className="btn-primary text-xs font-semibold py-2.5 px-4 rounded-lg tap-active inline-flex items-center space-x-2"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start exam</span>
                </Link>
              </div>

              <div className="bg-zinc-50 rounded-lg p-4 text-xs text-zinc-500 space-y-2 font-normal leading-relaxed border border-zinc-100">
                <p className="font-semibold text-zinc-700">Exam instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You must complete all questions before the timer runs out.</li>
                  <li>There is only one correct answer for each multiple choice question.</li>
                  <li>You can review and modify your answers before final submission.</li>
                  <li>A passing score will award a verifiable certificate added automatically to your resume.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="panel p-6 text-center space-y-3 flex flex-col items-center justify-center h-48">
              <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100">
                <Award className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-800">
                  {questionsComingSoon ? 'Questions coming soon' : 'Exam coming soon'}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  {questionsComingSoon
                    ? 'The exam framework is ready but questions are still being added. Check back shortly!'
                    : 'We are currently developing the certification exam for this course. Check back later!'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Interview Preview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-base font-bold text-zinc-900">Mock interview preview</h3>
            <Link
              href={`/interviews/${slug}`}
              className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors duration-150"
            >
              Practice all
            </Link>
          </div>

          <div className="space-y-3">
            {displayInterviewQuestions.map((q, idx) => (
              <div key={q.id || idx} className="card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="badge badge-neutral">Question {idx + 1}</span>
                  <span className="badge badge-accent">{q.category || 'Technical'}</span>
                </div>
                <p className="text-xs text-zinc-700 font-semibold leading-relaxed line-clamp-2">
                  {q.question}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
