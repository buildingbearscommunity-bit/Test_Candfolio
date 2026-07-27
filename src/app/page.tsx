'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award, MessageSquare, FileText, ArrowRight,
  Star, Shield, Zap, ArrowUpRight, Clock, BarChart2,
  Tag, RefreshCw,
} from 'lucide-react';
import { useSheetCourses } from '@/lib/sheetCourses';
import { useCertificationCards } from '@/lib/sheetExams';
import CourseIcon from '@/components/CourseIcon';
import BrandLogoIcon from '@/components/BrandLogoIcon';
import WhyChooseKorsay from '@/components/WhyChooseKorsay';

function CourseCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-28 bg-zinc-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-zinc-200 rounded w-3/4" />
        <div className="h-3 bg-zinc-100 rounded w-full" />
        <div className="h-3 bg-zinc-100 rounded w-4/5" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 bg-zinc-100 rounded-full" />
          <div className="h-5 w-12 bg-zinc-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { courses, loading, error } = useSheetCourses();
  const { certCards, loading: certificationsLoading } = useCertificationCards();

  const modules = [
    {
      title: 'Certification exams',
      description: 'Prepare for official cloud, development, and cybersecurity certs with timed tests.',
      icon: Award,
      href: '/certifications',
      cta: 'Explore exams'
    },
    {
      title: 'Mock interviews',
      description: 'Practice real-world technical and behavioral questions with instant feedback comparisons.',
      icon: MessageSquare,
      href: '/interviews',
      cta: 'Practice questions'
    },
    {
      title: 'Resume builder',
      description: 'Generate a professional resume that automatically includes your verified Candfolio certificates.',
      icon: FileText,
      href: '/resume',
      cta: 'Build resume'
    }
  ];

  return (
    <div className="space-y-20 py-4 sm:py-8">
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/8 border border-accent/12 text-accent text-xs font-semibold">
              <BrandLogoIcon className="h-3.5 w-3.5" />
              {loading ? 'Loading online courses…' : `${courses.length} Online Courses available`}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">JOIN OUR ADVANCED COURSES</h2>
            <p className="text-sm text-zinc-500 max-w-md leading-relaxed font-normal">
              Industry-aligned programs designed to take you from learner to certified professional. Choose your path and start today.
            </p>
          </div>
          <Link
            href="/certifications"
            className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors duration-150"
          >
            Browse all certifications
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {error && !loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-50 border border-zinc-100 rounded-2xl">
            <RefreshCw className="h-8 w-8 text-zinc-300 mb-3 animate-spin-slow" />
            <h3 className="text-sm font-bold text-zinc-900">Certifications are updating</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              We're syncing our latest course catalog. Please check back shortly.
            </p>
          </div>
        ) : !loading && courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-50 border border-zinc-100 rounded-2xl">
            <BrandLogoIcon className="h-8 w-8 mb-3 opacity-45" />
            <h3 className="text-sm font-bold text-zinc-900">No certifications found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Our catalog is currently empty. Check back soon for new programs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <CourseCardSkeleton key={i} />)
              : courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/certifications/${course.slug}/enroll`}
                    className="group block card card-hover overflow-hidden tap-active"
                  >
                    <div className="relative h-28 overflow-hidden" style={{ background: course.gradient }}>
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          background:
                            'radial-gradient(ellipse 80% 60% at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 70%)',
                        }}
                      />

                      {course.banner_link && (
                        <>
                          <Image
                            src={course.banner_link}
                            alt={course.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500 z-0"
                            unoptimized
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-0" />
                        </>
                      )}
                      <div className="absolute inset-0 flex items-end justify-between p-4 z-10">
                        <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
                          <CourseIcon name={course.icon} className="h-5 w-5 text-white stroke-[1.5]" />
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                          {course.level}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 group-hover:text-accent transition-colors duration-150 leading-snug">
                          {course.name}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed line-clamp-2 font-normal">
                          {course.short_description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {course.duration && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-full">
                          <BarChart2 className="h-3 w-3" />
                          {course.category}
                        </span>
                      </div>

                      {course.price !== null && (
                        <div className="flex items-center gap-2">
                          {course.has_discount ? (
                            <>
                              <span className="text-sm font-bold text-accent">
                                ?{course.price_after_discount?.toLocaleString()}
                              </span>
                              <span className="text-xs text-zinc-400 line-through">
                                ?{course.price?.toLocaleString()}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded-full">
                                <Tag className="h-2.5 w-2.5" />
                                {course.discount}% off
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-zinc-900">
                              ?{course.price?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
                        <span className="text-[11px] font-semibold text-accent group-hover:text-accent-hover transition-colors duration-150">
                          View details
                        </span>
                        <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-150" />
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        )}
      </section>

      <WhyChooseKorsay />

      <section className="hero-accent text-center max-w-3xl mx-auto space-y-7 pt-8 sm:pt-14">
        <div className="inline-flex items-center space-x-2 bg-accent-light/60 px-3.5 py-1.5 rounded-full border border-accent/15">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-medium text-accent">Introducing guest profiles — no login required</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.15]">
          Get certified. <br />
          Practice interviews. <br />
          Build your resume.
        </h1>
        
        <p className="text-base sm:text-lg text-zinc-600 max-w-xl mx-auto font-normal leading-relaxed">
          Accelerate your career with industry-aligned certification practice, interactive AI-grade interviews, and automatic credentials integrated directly into your professional resume.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row justify-center items-center gap-3">
          <Link href="/certifications" className="btn-primary w-full sm:w-auto tap-active">
            Explore certifications
          </Link>
          <Link
            href="/resume"
            className="w-full sm:w-auto text-center bg-white text-zinc-700 px-6 py-2.5 rounded-xl font-medium border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 hover:shadow-sm transition-all duration-150 tap-active text-sm"
          >
            Create your resume
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.title} href={m.href} className="group block card card-hover p-6 sm:p-8 tap-active">
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 bg-zinc-50 text-accent rounded-lg group-hover:bg-accent-light/60 transition-colors duration-150">
                  <Icon className="h-6 w-6 stroke-[1.5]" />
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-accent group-hover:translate-x-1 transition-all duration-150" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">{m.title}</h3>
              <p className="text-sm text-zinc-500 mb-7 font-normal leading-relaxed">{m.description}</p>
              <span className="text-xs font-semibold text-accent group-hover:text-accent-hover transition-colors duration-150">
                {m.cta}
              </span>
            </Link>
          );
        })}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 tracking-wide uppercase">Popular certifications</h2>
          <Link href="/certifications" className="text-xs font-semibold text-accent hover:text-accent-hover transition-colors duration-150">
            View all certifications
          </Link>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0">
          {certificationsLoading && certCards.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-40 flex-shrink-0 animate-pulse rounded-lg bg-zinc-100" />
              ))
            : certCards.map((card) => (
                <Link
                  key={card.courseId}
                  href={`/certifications/${card.courseId}`}
                  className="flex-shrink-0 bg-white border border-zinc-100 hover:border-accent/25 text-zinc-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 tap-active hover:text-accent hover:shadow-sm"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                >
                  {card.title}
                </Link>
              ))}
        </div>
      </section>

      <section className="bg-white rounded-xl p-8 border border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-6" style={{ boxShadow: 'var(--shadow-panel)' }}>
        <div className="flex space-x-3">
          <Star className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">Industry standards</h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Exams are modeled after real AWS, Azure, Google Cloud, and Security+ syllabus requirements.</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">Verifiable credentials</h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Every exam you pass issues a public, shareable verification code to showcase to employers.</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <FileText className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">Resume sync</h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">No manual imports needed. Your passed certifications dynamically appear on your resume template.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-100 pt-12 pb-6 text-zinc-500 text-sm no-print">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 tap-active" aria-label="Candfolio home">
              <Image src="/korsay-logo-small.png" alt="Candfolio logo" width={44} height={44} className="h-11 w-11 object-contain" />
              <span className="text-2xl font-extrabold tracking-tight text-accent">Candfolio</span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
              Empowering developers and tech professionals with verified credentials, interactive mock interview training, and professional resumes.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 tracking-wider uppercase mb-3">Modules</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/certifications" className="hover:text-accent transition-colors duration-150">Practice exams</Link></li>
              <li><Link href="/interviews" className="hover:text-accent transition-colors duration-150">Mock interviews</Link></li>
              <li><Link href="/resume" className="hover:text-accent transition-colors duration-150">Resume builder</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 tracking-wider uppercase mb-3">About</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="#" className="hover:text-accent transition-colors duration-150">Company bio</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors duration-150">Privacy policy</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors duration-150">Terms of service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 tracking-wider uppercase mb-3">Contact</h4>
            <p className="text-xs text-zinc-400 mb-2 leading-relaxed">Have questions or feedback? Reach out to us.</p>
            <a href="mailto:support@candfolio.com" className="text-xs font-medium text-accent hover:underline">
              support@candfolio.com
            </a>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-zinc-400 border-t border-zinc-100 pt-6">
          <p>© {new Date().getFullYear()} Candfolio inc. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <span className="hover:text-accent transition-colors duration-150 cursor-pointer">Twitter</span>
            <span className="hover:text-accent transition-colors duration-150 cursor-pointer">GitHub</span>
            <span className="hover:text-accent transition-colors duration-150 cursor-pointer">LinkedIn</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
