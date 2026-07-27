'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderCode,
  Globe2,
  GraduationCap,
  Handshake,
  Infinity,
  Laptop,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';

const SLIDE_MS = 3500;

const trustStats = [
  { label: 'Years Experience', value: 10, suffix: '+' },
  { label: 'Students Trained', value: 10000, suffix: '+' },
  { label: 'Hiring Partners', value: 200, suffix: '+' },
  { label: 'Placement Assistance', value: 1, text: 'Placement Assistance' },
  { label: 'Student Satisfaction', value: 4.9, suffix: '/5' },
];

const slides = [
  {
    title: '10+ Years of Industry Experience',
    description:
      'A decade of excellence in training students and helping professionals build successful careers in Data Analytics and Business Intelligence.',
    icon: Trophy,
  },
  {
    title: 'Certified & Experienced Trainers',
    description:
      'Learn from certified industry experts with real-world experience, practical knowledge, and mentorship.',
    icon: GraduationCap,
  },
  {
    title: '200+ Hiring Partner Companies',
    description:
      'Strong hiring partnerships with leading startups, product companies, and multinational organizations.',
    icon: Building2,
  },
  {
    title: 'Interview Calls & Placement Assistance',
    description:
      'Receive dedicated placement support, interview scheduling, and career guidance until you get hired.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Internship Opportunities in MNCs',
    description:
      'Gain real-world experience through internship opportunities with reputed multinational companies.',
    icon: Globe2,
  },
  {
    title: 'Real-Time Projects & Case Studies',
    description:
      'Build practical experience by working on industry projects and portfolio-ready case studies.',
    icon: FolderCode,
  },
  {
    title: 'Resume & LinkedIn Building',
    description:
      'Create an ATS-friendly resume and optimize your LinkedIn profile to attract recruiters.',
    icon: FileText,
  },
  {
    title: 'Mock Interviews & Career Guidance',
    description:
      'Practice with HR and technical mock interviews to build confidence before real interviews.',
    icon: Users,
  },
  {
    title: 'Industry-Relevant Curriculum',
    description:
      'Learn the latest tools, technologies, and best practices used by leading companies.',
    icon: BookOpen,
  },
  {
    title: 'Course Completion Certificate',
    description:
      'Receive a professional certificate after successful completion to showcase your expertise.',
    icon: BadgeCheck,
  },
  {
    title: 'Lifetime Learning Support',
    description:
      'Get continued access to learning resources, recordings, and mentor guidance even after course completion.',
    icon: Infinity,
  },
  {
    title: 'Affordable Fees with High ROI',
    description:
      'Invest in your future with high-quality training at an affordable price and excellent career returns.',
    icon: TrendingUp,
  },
];

function formatStat(stat: (typeof trustStats)[number], animatedValue: number) {
  if ('text' in stat && stat.text) return stat.text;
  const value =
    stat.value % 1 === 0
      ? Math.round(animatedValue).toLocaleString()
      : animatedValue.toFixed(1);
  return `${value}${stat.suffix ?? ''}`;
}

export default function WhyChooseKorsay() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [animatedStats, setAnimatedStats] = useState(() => trustStats.map(() => 0));
  const sectionRef = useRef<HTMLElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  const activeSlide = slides[activeIndex];
  const ActiveIcon = activeSlide.icon;

  const nextSlide = () => setActiveIndex((current) => (current + 1) % slides.length);
  const prevSlide = () => setActiveIndex((current) => (current - 1 + slides.length) % slides.length);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasEntered(true);
      },
      { threshold: 0.3 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEntered) return;

    let animationFrame = 0;
    const startedAt = performance.now();
    const duration = 1200;

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedStats(trustStats.map((stat) => stat.value * eased));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [hasEntered]);

  useEffect(() => {
    if (isPaused) return;
    const interval = window.setInterval(nextSlide, SLIDE_MS);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  const previewSlides = useMemo(() => {
    return [1, 2, 3].map((offset) => slides[(activeIndex + offset) % slides.length]);
  }, [activeIndex]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prevSlide();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextSlide();
    }
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - clientX;
    if (Math.abs(delta) > 40) {
      if (delta > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden rounded-[20px] border border-[#872341]/10 bg-white/70 px-4 py-8 shadow-[0_24px_80px_rgba(135,35,65,0.12)] backdrop-blur-xl sm:px-6 sm:py-10 lg:px-10"
      aria-labelledby="why-korsay-heading"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="pointer-events-none absolute -left-24 top-8 h-52 w-52 rounded-full bg-[#872341]/12 blur-3xl why-korsay-float" />
      <div className="pointer-events-none absolute -right-24 bottom-4 h-60 w-60 rounded-full bg-[#C9A227]/18 blur-3xl why-korsay-float-delayed" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(240,237,229,0.78),rgba(255,255,255,0.52),rgba(135,35,65,0.04))]" />

      <div className="relative z-10 space-y-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#C9A227]/25 bg-[#C9A227]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--foreground)]">
            <Award className="h-3.5 w-3.5" />
            Trusted career accelerator
          </div>
          <h2 id="why-korsay-heading" className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
            Why Students Choose Candfolio
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">
            Empowering careers through industry-focused training, practical learning, and dedicated placement support.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {trustStats.map((stat, index) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-white/80 bg-white/72 p-4 text-center shadow-[0_10px_30px_rgba(135,35,65,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#C9A227]/35 hover:shadow-[0_18px_42px_rgba(135,35,65,0.13)]"
            >
              <p className="text-lg font-extrabold text-[#872341] sm:text-xl">
                {formatStat(stat, animatedStats[index])}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div
            className="group relative min-h-[320px] overflow-hidden rounded-[20px] border border-[#872341]/12 bg-[#872341] p-6 text-white shadow-[0_28px_70px_rgba(135,35,65,0.24)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_34px_90px_rgba(135,35,65,0.30)] sm:p-8"
            role="region"
            aria-roledescription="carousel"
            aria-label="Why choose Candfolio reasons"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              handleTouchEnd(event.changedTouches[0]?.clientX ?? 0);
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.28),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_42%)]" />
            <div className="pointer-events-none absolute -bottom-20 -right-12 h-48 w-48 rounded-full border border-white/10" />

            <div key={activeIndex} className="relative z-10 flex h-full flex-col justify-between gap-10 why-korsay-slide">
              <div>
                <div className="mb-7 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-white/18 bg-white/12 text-[#F0EDE5] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-md transition duration-500 group-hover:scale-105 group-hover:text-[#C9A227]">
                  <ActiveIcon className="h-10 w-10 stroke-[1.6]" aria-hidden="true" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C9A227]">
                  Reason {String(activeIndex + 1).padStart(2, '0')} / {slides.length}
                </p>
                <h3 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {activeSlide.title}
                </h3>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
                  {activeSlide.description}
                </p>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2" aria-label="Carousel pagination">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative h-2.5 rounded-full transition-all duration-300 ${
                        index === activeIndex ? 'w-10 bg-white/25' : 'w-2.5 bg-white/25 hover:bg-white/45'
                      }`}
                      aria-label={`Show slide ${index + 1}: ${slide.title}`}
                      aria-current={index === activeIndex ? 'true' : undefined}
                    >
                      {index === activeIndex && (
                        <span key={activeIndex} className="absolute inset-y-0 left-0 rounded-full bg-[#C9A227] why-korsay-dot" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                    aria-label="Previous trust slide"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/18 focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                    aria-label="Next trust slide"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            {previewSlides.map((slide, index) => {
              const Icon = slide.icon;
              return (
                <button
                  key={`${slide.title}-${activeIndex}`}
                  type="button"
                  onClick={() => setActiveIndex((activeIndex + index + 1) % slides.length)}
                  className="group flex items-center gap-4 rounded-2xl border border-[#872341]/8 bg-white/72 p-4 text-left shadow-[0_12px_32px_rgba(135,35,65,0.08)] transition duration-300 hover:-translate-y-1 hover:border-[#C9A227]/40 hover:bg-white hover:shadow-[0_18px_44px_rgba(135,35,65,0.14)] focus:outline-none focus:ring-2 focus:ring-[#C9A227]/60"
                >
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#F0EDE5] text-[#872341] transition duration-300 group-hover:scale-105 group-hover:text-[#C9A227]">
                    <Icon className="h-6 w-6 stroke-[1.7]" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold leading-snug text-zinc-900">{slide.title}</span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-zinc-500">{slide.description}</span>
                  </span>
                </button>
              );
            })}

            <div className="hidden rounded-2xl border border-[#C9A227]/25 bg-[#C9A227]/10 p-4 text-sm text-[#872341] shadow-[0_12px_32px_rgba(201,162,39,0.10)] lg:block">
              <div className="flex items-center gap-3">
                <Handshake className="h-6 w-6 text-[#C9A227]" />
                <p className="font-semibold">Practical training, career support, and hiring access in one focused learning journey.</p>
              </div>
            </div>

            <div className="hidden rounded-2xl border border-[#872341]/10 bg-white/60 p-4 text-sm text-zinc-600 shadow-[0_12px_32px_rgba(135,35,65,0.07)] lg:block">
              <div className="flex items-center gap-3">
                <Laptop className="h-6 w-6 text-[#872341]" />
                <p className="font-semibold">Built for students, freshers, and professionals who want job-ready skills.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
