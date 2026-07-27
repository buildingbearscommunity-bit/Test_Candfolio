'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  Clock,
  Download,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Tag,
  User,
} from 'lucide-react';
import { useLiveCourse } from '@/lib/sheetCourses';
import CourseIcon from '@/components/CourseIcon';
import BrandLogoIcon from '@/components/BrandLogoIcon';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const LEVEL_COLOR: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  Intermediate: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  Advanced: 'bg-rose-50 text-rose-700 border border-rose-200/60',
};

const FALLBACK_SYLLABUS = '/korsay-syllabus.pdf';
const GOOGLE_FORM_RESPONSE_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScqU237DgFUCyq8T22AvdS8VE6dunFUmoone0r-RfzDmjQPXw/formResponse';
const COURSE_OPTIONS = [
  'Data Analytics',
  'Power BI And SQL',
  'Power BI',
  'SQL',
  'Python',
  'Advanced Excel',
];

type ReservationForm = {
  name: string;
  email: string;
  phone: string;
  selectedCourse: string;
  location: string;
  referral: string;
  comments: string;
};

function EnrollSkeleton() {
  return (
    <div className="space-y-8 py-4 animate-pulse">
      <div className="h-4 w-28 bg-zinc-200 rounded" />
      <div className="h-56 bg-zinc-200 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-zinc-100 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-zinc-100 rounded-xl" />
        </div>
        <div className="lg:col-span-2">
          <div className="h-80 bg-zinc-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function EnrollPage({ params }: PageProps) {
  const { slug } = use(params);
  const { course, loading, error } = useLiveCourse(slug);
  const [formData, setFormData] = useState<ReservationForm>({
    name: '',
    email: '',
    phone: '',
    selectedCourse: '',
    location: '',
    referral: '',
    comments: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof ReservationForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof ReservationForm, string>> = {};
    if (!formData.name.trim()) nextErrors.name = 'Name is required.';
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!/^[\d\s+\-()]{6,20}$/.test(formData.phone)) {
      nextErrors.phone = 'Enter a valid phone number.';
    }
    if (!formData.selectedCourse) nextErrors.selectedCourse = 'Please select a course.';
    if (!formData.referral.trim()) nextErrors.referral = 'Please tell us how you know Candfolio.';
    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Submit started");

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      console.log("Validation failed", nextErrors);
      setErrors(nextErrors);
      return;
    }
    console.log("Validation passed");

    const formUrl = GOOGLE_FORM_RESPONSE_URL;
    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const course = formData.selectedCourse;
    const location = formData.location.trim();
    const source = formData.referral.trim();
    const comments = formData.comments.trim();
    const data = new URLSearchParams();

    data.append("entry.2005620554", name);
    data.append("entry.1045781291", email);
    data.append("entry.1166974658", phone.replace(/\s+/g, ""));
    data.append("entry.1662236019", course);
    data.append("entry.1899680570", location);
    data.append("entry.1722600922", source);
    data.append("entry.839337160", comments);

    console.log("Payload:", data.toString());

    setSubmitting(true);
    try {
      console.log("Before fetch");
      await fetch(formUrl, {
        method: "POST",
        mode: "no-cors",
        body: data
      });
      console.log("Fetch completed");
      setSubmitted(true);
    } catch (error) {
      console.error("Fetch failed:", error);
      setErrors((prev) => ({
        ...prev,
        comments: 'Something went wrong while submitting. Please try again.',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <EnrollSkeleton />;

  if (error && !course) {
    return (
      <div className="text-center py-20 space-y-4">
        <RefreshCw className="h-12 w-12 text-zinc-300 mx-auto animate-spin-slow" />
        <h2 className="text-lg font-bold text-zinc-800">Certifications are updating</h2>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          We&apos;re syncing our latest course catalog. Please check back shortly.
        </p>
        <Link href="/certifications" className="text-accent hover:underline inline-flex items-center gap-1.5 text-sm mt-2">
          <ArrowLeft className="h-4 w-4" />
          Back to certifications
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertCircle className="h-12 w-12 text-zinc-300 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-800">Certification not found</h2>
        <Link href="/certifications" className="text-accent hover:underline inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Back to certifications
        </Link>
      </div>
    );
  }

  const syllabusUrl = course.syllabus_link || FALLBACK_SYLLABUS;
  const topics = course.topics;
  const hasImage = Boolean(course.banner_link);

  return (
    <div className="space-y-0 py-4">
      <div className="mb-6">
        <Link
          href="/"
          className="text-zinc-500 hover:text-zinc-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors tap-active"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>

      <div className="relative rounded-2xl overflow-hidden mb-8" style={{ background: course.gradient }}>
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            backgroundSize: '256px 256px',
          }}
        />

        <div className="relative h-56 sm:h-72">
          {hasImage && (
            <>
              <Image
                src={course.banner_link}
                alt={course.name}
                fill
                sizes="(max-width: 768px) 100vw, 90vw"
                className="object-cover z-0"
                priority
                unoptimized
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10 z-0" />
            </>
          )}
        </div>

        <div className="absolute inset-0 flex items-end">
          <div className="p-8 sm:p-12 flex flex-col sm:flex-row items-start gap-6 w-full">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex-shrink-0">
              <CourseIcon name={course.icon} className="h-10 w-10 text-white stroke-[1.5]" />
            </div>
            <div className="space-y-3 flex-grow">
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${LEVEL_COLOR[course.level] ?? LEVEL_COLOR.Intermediate}`}>
                  {course.level}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">
                  <Clock className="h-3 w-3" />
                  {course.duration}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/20">
                  <BrandLogoIcon className="h-3 w-3" />
                  {course.category}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight">
                {course.name}
              </h1>
              <p className="text-sm text-white/75 leading-relaxed max-w-2xl font-normal">
                {course.full_description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Clock, label: 'Duration', value: course.duration || '-' },
              { icon: BarChart2, label: 'Level', value: course.level },
              { icon: BrandLogoIcon, label: 'Topics covered', value: `${topics.length} modules` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="card p-4 text-center space-y-1.5">
                <Icon className="h-5 w-5 text-accent mx-auto" />
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-zinc-900">{value}</p>
              </div>
            ))}
          </div>

          {course.price !== null && (
            <div
              className="rounded-xl p-5 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(135,35,65,0.04) 0%, rgba(135,35,65,0.02) 100%)',
                borderColor: 'rgba(135,35,65,0.14)',
              }}
            >
              <div>
                <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Certification fee</p>
                {course.has_discount ? (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-2xl font-bold text-accent">
                      Rs {course.price_after_discount?.toLocaleString()}
                    </span>
                    <span className="text-base text-zinc-400 line-through">
                      Rs {course.price?.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                      <Tag className="h-3 w-3" />
                      {course.discount}% off
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-zinc-900">
                    Rs {course.price?.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 sm:text-right leading-relaxed max-w-xs">
                Fill out the reservation form to reserve your seat. Our team will confirm your enrolment.
              </p>
            </div>
          )}

          {topics.length > 0 && (
            <div className="card p-6 sm:p-8 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">What you&apos;ll cover</h2>
                <p className="text-xs text-zinc-500 mt-1">Core topics and learning objectives included in this course</p>
              </div>
              <ul className="space-y-3">
                {topics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full text-white text-[10px] font-bold mt-0.5"
                      style={{ background: 'var(--accent)' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-zinc-700 leading-relaxed">{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            className="rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border"
            style={{
              background: 'linear-gradient(135deg, rgba(135,35,65,0.04) 0%, rgba(135,35,65,0.02) 100%)',
              borderColor: 'rgba(135,35,65,0.14)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent-light rounded-lg">
                <Download className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Certification Syllabus</p>
                <p className="text-xs text-zinc-500">Download the full topic breakdown as a PDF</p>
              </div>
            </div>
            <a
              href={syllabusUrl}
              download={`korsay-${slug}-syllabus.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 px-4 flex-shrink-0 inline-flex items-center gap-2 tap-active"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </a>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-6 overflow-hidden rounded-2xl border border-[#872341]/10 bg-white shadow-[0_24px_70px_rgba(135,35,65,0.14)]">
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(240,237,229,0.22),transparent_34%),linear-gradient(135deg,#872341,#9f2a4d)] p-6 text-white sm:p-8">
              <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-[#F0EDE5]/10" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F0EDE5]/70">Limited seats</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Reserve your spot</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/72">
                Share a few details and our admissions team will help you choose the right learning path.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#872341]/20 bg-[#F0EDE5]">
                  <CheckCircle2 className="h-8 w-8 text-[#872341]" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-zinc-900">Thanks for submitting your contact info!</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
                  We&apos;ve received your enquiry for <strong className="text-zinc-700">{formData.selectedCourse}</strong>. Our team will contact you soon.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      selectedCourse: '',
                      location: '',
                      referral: '',
                      comments: '',
                    });
                  }}
                  className="mt-6 text-xs font-semibold text-accent hover:text-accent-hover"
                >
                  Submit another enquiry
                </button>
              </div>
            ) : (
              <>
              <form
                onSubmit={handleSubmit}
                className="space-y-4 p-6 sm:p-8"
                noValidate
              >
                <div className="space-y-1.5">
                  <label htmlFor="reserve-name" className="text-xs font-bold text-zinc-700">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="reserve-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Your full name"
                      className={`w-full rounded-xl border bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-white ${errors.name ? 'border-rose-300 focus:border-rose-400' : 'border-zinc-200 focus:border-accent'}`}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="reserve-email" className="text-xs font-bold text-zinc-700">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="reserve-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="you@email.com"
                        className={`w-full rounded-xl border bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-white ${errors.email ? 'border-rose-300 focus:border-rose-400' : 'border-zinc-200 focus:border-accent'}`}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-rose-600">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="reserve-phone" className="text-xs font-bold text-zinc-700">
                      Phone number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="reserve-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className={`w-full rounded-xl border bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-white ${errors.phone ? 'border-rose-300 focus:border-rose-400' : 'border-zinc-200 focus:border-accent'}`}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-rose-600">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reserve-course" className="text-xs font-bold text-zinc-700">
                    Select Course <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <BrandLogoIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-55" />
                    <select
                      id="reserve-course"
                      value={formData.selectedCourse}
                      onChange={(e) => handleChange('selectedCourse', e.target.value)}
                      className={`w-full appearance-none rounded-xl border bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-white ${errors.selectedCourse ? 'border-rose-300 focus:border-rose-400' : 'border-zinc-200 focus:border-accent'}`}
                    >
                      <option value="">Choose a course</option>
                      {COURSE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.selectedCourse && <p className="text-xs text-rose-600">{errors.selectedCourse}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reserve-location" className="text-xs font-bold text-zinc-700">
                    Where are you from?
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="reserve-location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="City, country"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-accent focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reserve-referral" className="text-xs font-bold text-zinc-700">
                    How do you know Candfolio? <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <HelpCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="reserve-referral"
                      type="text"
                      value={formData.referral}
                      onChange={(e) => handleChange('referral', e.target.value)}
                      placeholder="Instagram, friend, Google, LinkedIn..."
                      className={`w-full rounded-xl border bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-white ${errors.referral ? 'border-rose-300 focus:border-rose-400' : 'border-zinc-200 focus:border-accent'}`}
                    />
                  </div>
                  {errors.referral && <p className="text-xs text-rose-600">{errors.referral}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reserve-comments" className="text-xs font-bold text-zinc-700">
                    Comments
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                    <textarea
                      id="reserve-comments"
                      value={formData.comments}
                      onChange={(e) => handleChange('comments', e.target.value)}
                      placeholder="Tell us your goals or preferred batch timing."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-accent focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#872341] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(135,35,65,0.22)] transition hover:bg-[#9f2a4d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit reservation
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] leading-relaxed text-zinc-400">
                  We&apos;ll use these details only to contact you about your course enquiry.
                </p>
              </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
