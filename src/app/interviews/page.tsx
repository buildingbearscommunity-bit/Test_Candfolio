'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, MessageSquare, Filter, Loader2 } from 'lucide-react';
import { useInterviewCards } from '@/lib/sheetInterviews';

export default function InterviewsHubPage() {
  const { interviewCards, loading, error } = useInterviewCards();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = interviewCards.filter((card) =>
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.courseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-10 py-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Mock interviews</h1>
        <p className="text-sm text-zinc-500 max-w-xl leading-relaxed">
          Select a course domain to begin mock interview practice. Test your understanding under time pressure or review sample expert answers.
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white p-4 rounded-xl border border-zinc-100" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search domains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 pl-10 pr-4 py-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:border-accent focus:bg-white transition-all duration-150"
          />
        </div>
        <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5 flex-shrink-0">
          <Filter className="h-3.5 w-3.5" />
          {loading ? 'Loading…' : `${interviewCards.length} domains`}
        </span>
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse space-y-4">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 bg-zinc-100 rounded-lg" />
                <div className="h-5 w-20 bg-zinc-100 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-3 bg-zinc-100 rounded w-full" />
                <div className="h-3 bg-zinc-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-xl space-y-3">
          <MessageSquare className="h-8 w-8 text-zinc-300 mx-auto" />
          <h3 className="text-sm font-semibold text-zinc-700">Could not load interview domains</h3>
          <p className="text-xs text-zinc-400">Please check your connection and try again.</p>
        </div>
      )}

      {/* Cards grid */}
      {!loading && !error && (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((card) => (
              <Link
                key={card.courseId}
                href={`/interviews/${card.courseId}`}
                className="group block card card-hover p-6 tap-active"
              >
                {/* Icon + badge */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="p-3 bg-zinc-50 text-accent rounded-lg group-hover:bg-accent-light/50 transition-colors duration-150">
                    <MessageSquare className="h-6 w-6 stroke-[1.5]" />
                  </div>
                  <span className="badge badge-neutral mt-0.5">Interview</span>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-zinc-950 mb-1.5 group-hover:text-accent transition-colors duration-150">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-zinc-500 font-normal leading-relaxed mb-6 line-clamp-2">
                  {card.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-50 text-zinc-400 text-[11px] font-medium">
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                    <span>
                      {card.totalQuestions > 0
                        ? `${card.totalQuestions} practice question${card.totalQuestions !== 1 ? 's' : ''} available`
                        : 'Questions coming soon'}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-accent group-hover:translate-x-1 transition-all duration-150" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-dashed border-zinc-200 rounded-xl">
            <Search className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-700">No interview domains found</h3>
            <p className="text-xs text-zinc-400 mt-1">Try adjusting your search terms.</p>
          </div>
        )
      )}
    </div>
  );
}
