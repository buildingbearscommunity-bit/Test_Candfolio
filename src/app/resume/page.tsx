'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useKorsayStore } from '@/lib/store';
import { 
  User, Briefcase, GraduationCap, Star, Award, 
  ChevronDown, ChevronUp, Plus, Trash2, Printer, 
  Check, Eye, Edit3, AlertCircle, FileText,
  ShieldCheck, ChevronRight, LayoutTemplate, Zap, AlertTriangle, CheckCircle2, X, Upload, UploadCloud
} from 'lucide-react';
import CourseIcon from '@/components/CourseIcon';

// ─── Template definitions ─────────────────────────────────────────────────────
type TemplateCategoryId = 'minimal' | 'modern' | 'classic';
type TemplateVariantId =
  | 'minimal-light' | 'minimal-bold' | 'minimal-compact'
  | 'modern-sidebar' | 'modern-twocol' | 'modern-accent'
  | 'classic-serif' | 'classic-formal' | 'classic-timeline';

interface TemplateCategory {
  id: TemplateCategoryId;
  label: string;
  description: string;
  variants: { id: TemplateVariantId; label: string; description: string }[];
}

const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Clean, whitespace-forward layouts',
    variants: [
      { id: 'minimal-light',   label: 'Minimal Light',   description: 'Ultra-clean single column, section dividers only' },
      { id: 'minimal-bold',    label: 'Minimal Bold',    description: 'Strong typography, name at full width with teal underline' },
      { id: 'minimal-compact', label: 'Minimal Compact', description: 'Density-optimized for fitting more content per page' },
    ]
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Accent-driven contemporary styles',
    variants: [
      { id: 'modern-sidebar',  label: 'Modern Sidebar',   description: 'Left sidebar for skills/contact, main area for experience' },
      { id: 'modern-twocol',   label: 'Modern Two-Column', description: 'Skills and education in right column beside experience' },
      { id: 'modern-accent',   label: 'Modern Accent',     description: 'Full-width teal header bar, name reversed on accent' },
    ]
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Serif, formal layouts for traditional industries',
    variants: [
      { id: 'classic-serif',    label: 'Classic Serif',    description: 'Centered header, serif body, traditional formatting' },
      { id: 'classic-formal',   label: 'Classic Formal',   description: 'Double-rule dividers, inline skills, letter-style layout' },
      { id: 'classic-timeline', label: 'Classic Timeline', description: 'Left-border timeline for experience, hierarchical structure' },
    ]
  }
];

// ─── ATS Checker ─────────────────────────────────────────────────────────────
interface ATSFlag { severity: 'warn' | 'ok'; label: string; detail: string; points: number }
interface ATSResult { score: number; flags: ATSFlag[]; suggestions: string[] }

function runATSCheck(resume: any, variantId: TemplateVariantId, allCertifications: string[]): ATSResult {
  const flags: ATSFlag[] = [];
  let totalPoints = 0;
  let earned = 0;

  // 1. Contact info
  totalPoints += 15;
  const hasEmail = !!resume.personal_info.email?.includes('@');
  const hasPhone = resume.personal_info.phone?.replace(/\D/g, '').length >= 7;
  const hasName  = resume.personal_info.name?.trim().length > 1;
  if (hasEmail && hasPhone && hasName) {
    earned += 15;
    flags.push({ severity: 'ok', label: 'Contact info complete', detail: 'Name, email, and phone are all present.', points: 15 });
  } else {
    const missing = [!hasName && 'name', !hasEmail && 'email', !hasPhone && 'phone'].filter(Boolean);
    flags.push({ severity: 'warn', label: 'Incomplete contact info', detail: `Missing: ${missing.join(', ')}. ATS systems need all three to match your identity.`, points: 0 });
  }

  // 2. Summary / objective
  totalPoints += 10;
  if (resume.personal_info.summary?.trim().length >= 30) {
    earned += 10;
    flags.push({ severity: 'ok', label: 'Professional summary present', detail: 'A summary helps ATS systems rank you for relevant roles.', points: 10 });
  } else {
    flags.push({ severity: 'warn', label: 'Summary missing or too short', detail: 'Add a 2–3 sentence professional summary targeting your desired role.', points: 0 });
  }

  // 3. Work experience
  totalPoints += 20;
  if (resume.experience.length >= 1) {
    const hasDateFormat = resume.experience.every((e: any) => e.startDate && e.endDate);
    const hasDescriptions = resume.experience.every((e: any) => e.description?.trim().length > 20);
    if (hasDateFormat && hasDescriptions) {
      earned += 20;
      flags.push({ severity: 'ok', label: 'Work experience well-structured', detail: 'Roles, companies, dates, and descriptions are present.', points: 20 });
    } else if (hasDateFormat) {
      earned += 12;
      flags.push({ severity: 'warn', label: 'Experience descriptions are thin', detail: 'Add 2–3 bullet points per role describing outcomes and tools used.', points: 12 });
    } else {
      earned += 8;
      flags.push({ severity: 'warn', label: 'Missing date ranges in experience', detail: 'ATS systems parse start/end dates to calculate tenure. Fill them in.', points: 8 });
    }
  } else {
    flags.push({ severity: 'warn', label: 'No work experience added', detail: 'Add at least one role to be considered for most job postings.', points: 0 });
  }

  // 4. Education
  totalPoints += 10;
  if (resume.education.length >= 1) {
    earned += 10;
    flags.push({ severity: 'ok', label: 'Education section present', detail: 'Degree and institution listed.', points: 10 });
  } else {
    flags.push({ severity: 'warn', label: 'Education missing', detail: 'Many ATS filters require an education entry. Add your highest qualification.', points: 0 });
  }

  // 5. Skills (keyword density)
  totalPoints += 20;
  if (resume.skills.length >= 8) {
    earned += 20;
    flags.push({ severity: 'ok', label: 'Strong skill keywords', detail: `${resume.skills.length} skills listed — good keyword density for ATS matching.`, points: 20 });
  } else if (resume.skills.length >= 4) {
    earned += 12;
    flags.push({ severity: 'warn', label: 'Skill keywords could be stronger', detail: `Only ${resume.skills.length} skills listed. Aim for 8–15 relevant technical keywords.`, points: 12 });
  } else {
    earned += 4;
    flags.push({ severity: 'warn', label: 'Too few skill keywords', detail: 'Add more technology and role-specific skills to improve keyword matching.', points: 4 });
  }

  // 6. Certifications
  totalPoints += 10;
  if (allCertifications.length >= 1) {
    earned += 10;
    flags.push({ severity: 'ok', label: 'Certifications verified', detail: `${allCertifications.length} certification(s) listed — great for ATS scoring.`, points: 10 });
  } else {
    flags.push({ severity: 'warn', label: 'No certifications', detail: 'Pass a Candfolio exam to automatically add verified credentials.', points: 0 });
  }

  // 7. Multi-column layout penalty
  totalPoints += 10;
  const isMultiCol = variantId === 'modern-sidebar' || variantId === 'modern-twocol';
  if (isMultiCol) {
    earned += 3;
    flags.push({ severity: 'warn', label: 'Multi-column layout detected', detail: 'Sidebar and two-column templates can confuse many ATS parsers. Consider single-column for critical applications.', points: 3 });
  } else {
    earned += 10;
    flags.push({ severity: 'ok', label: 'ATS-safe single-column layout', detail: 'Linear layouts are parsed accurately by all major ATS systems.', points: 10 });
  }

  // 8. Standard section headers
  totalPoints += 5;
  // Minimal and classic use "Experience", "Education" — Modern uses custom names
  const usesCustomHeaders = variantId.startsWith('modern');
  if (!usesCustomHeaders) {
    earned += 5;
    flags.push({ severity: 'ok', label: 'Standard section header names', detail: '"Experience", "Education", "Skills" are used — ATS-recognized terms.', points: 5 });
  } else {
    earned += 2;
    flags.push({ severity: 'warn', label: 'Custom section header names', detail: 'Modern templates use "Professional Background" and "Skill Inventory" — some ATS may not recognise these. Minimal or Classic templates score higher here.', points: 2 });
  }

  const score = Math.round((earned / totalPoints) * 100);

  // Generate top 3 actionable suggestions
  const suggestions: string[] = [];
  const warnFlags = flags.filter(f => f.severity === 'warn');
  if (resume.skills.length < 8) suggestions.push('Add more technical skills (aim for 8–15) to improve keyword matching — include frameworks, tools, and platforms relevant to your target role.');
  if (!resume.personal_info.summary || resume.personal_info.summary.length < 30) suggestions.push('Write a 2–3 sentence professional summary that includes your job title, years of experience, and one key achievement.');
  if (isMultiCol) suggestions.push('For high-stakes applications, switch to Minimal Light or Classic Serif — single-column formats have the highest ATS parse accuracy.');
  if (allCertifications.length === 0) suggestions.push('Complete a Candfolio exam to add verified credentials — many ATS systems boost candidates with relevant certifications.');
  if (resume.experience.length === 0) suggestions.push('Add at least one work experience entry. Even internship or project-based experience helps ATS filters qualify your profile.');
  if (!resume.personal_info.email?.includes('@')) suggestions.push('Add a valid email address to your profile — it\'s required for ATS identity matching.');

  return { score, flags, suggestions: suggestions.slice(0, 3) };
}

// ─── Resume renderers ─────────────────────────────────────────────────────────
// All renderers accept the same props for consistency
interface ResumeProps {
  resume: any;
  allCertifications: string[];
  forPrint?: boolean;
}

function MinimalLight({ resume, allCertifications, forPrint }: ResumeProps) {
  const c = forPrint ? 'text-black' : 'text-zinc-800';
  return (
    <div className={`space-y-5 font-sans text-xs ${c}`}>
      <div className="border-b border-zinc-200 pb-4 space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900 leading-tight">{resume.personal_info.name}</h1>
        <p className="text-xs font-semibold text-accent uppercase tracking-wider">{resume.personal_info.title}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400 font-normal pt-1 text-[11px]">
          <span>{resume.personal_info.email}</span>
          <span>•</span><span>{resume.personal_info.phone}</span>
          <span>•</span><span>{resume.personal_info.website}</span>
        </div>
      </div>
      {resume.personal_info.summary && (
        <div className="space-y-1">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Professional Summary</h4>
          <p className="text-zinc-600 leading-relaxed font-normal">{resume.personal_info.summary}</p>
        </div>
      )}
      {resume.experience.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-1">Experience</h4>
          <div className="space-y-4">
            {resume.experience.map((exp: any) => (
              <div key={exp.id} className="space-y-1">
                <div className="flex justify-between items-start">
                  <div><span className="font-bold text-zinc-900">{exp.role}</span><span className="text-zinc-400"> at </span><span className="font-bold text-zinc-700">{exp.company}</span></div>
                  <span className="text-zinc-400 font-medium text-[10px] whitespace-nowrap ml-2">{exp.startDate} – {exp.endDate}</span>
                </div>
                <p className="text-zinc-600 leading-relaxed font-normal whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {resume.education.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-1">Education</h4>
          {resume.education.map((edu: any) => (
            <div key={edu.id} className="flex justify-between items-start">
              <div><span className="font-bold text-zinc-900">{edu.degree}</span><span className="text-zinc-400"> from </span><span className="font-semibold text-zinc-700">{edu.school}</span></div>
              <span className="text-zinc-400 font-medium text-[10px] whitespace-nowrap ml-2">{edu.startDate} – {edu.endDate}</span>
            </div>
          ))}
        </div>
      )}
      {resume.skills.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-1">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((s: string) => <span key={s} className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[10px] font-semibold">{s}</span>)}
          </div>
        </div>
      )}
      {allCertifications.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-1">Certifications</h4>
          <div className="grid grid-cols-2 gap-1 text-[10px] font-semibold text-zinc-700">
            {allCertifications.map(c => <div key={c} className="flex items-center space-x-1.5"><span className="h-1.5 w-1.5 bg-accent rounded-full flex-shrink-0" /><span>{c}</span></div>)}
          </div>
        </div>
      )}
    </div>
  );
}

function MinimalBold({ resume, allCertifications, forPrint }: ResumeProps) {
  return (
    <div className={`space-y-5 font-sans text-xs ${forPrint ? 'text-black' : 'text-zinc-800'}`}>
      <div className="pb-4">
        <div className="border-b-4 border-accent pb-3">
          <h1 className="text-3xl font-extrabold text-zinc-900 leading-none tracking-tight">{resume.personal_info.name}</h1>
          <p className="text-sm font-bold text-accent mt-1">{resume.personal_info.title}</p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-zinc-500 font-medium pt-2 text-[11px]">
          <span>{resume.personal_info.email}</span>
          <span>{resume.personal_info.phone}</span>
          <span>{resume.personal_info.website}</span>
        </div>
      </div>
      {resume.personal_info.summary && (
        <div><p className="text-zinc-600 leading-relaxed font-normal border-l-2 border-accent pl-3">{resume.personal_info.summary}</p></div>
      )}
      {resume.experience.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">Experience</h4>
          {resume.experience.map((exp: any) => (
            <div key={exp.id} className="space-y-1 pl-3 border-l border-zinc-200">
              <div className="flex justify-between"><span className="font-bold text-zinc-900">{exp.role} <span className="font-semibold text-zinc-500">@ {exp.company}</span></span><span className="text-zinc-400 text-[10px] whitespace-nowrap">{exp.startDate} – {exp.endDate}</span></div>
              <p className="text-zinc-600 leading-relaxed font-normal whitespace-pre-wrap">{exp.description}</p>
            </div>
          ))}
        </div>
      )}
      {resume.education.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">Education</h4>
          {resume.education.map((edu: any) => (
            <div key={edu.id} className="flex justify-between"><div><span className="font-bold">{edu.degree}</span> <span className="text-zinc-500">· {edu.school}</span></div><span className="text-zinc-400 text-[10px] whitespace-nowrap">{edu.startDate} – {edu.endDate}</span></div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 pt-1">
        {resume.skills.length > 0 && (
          <div><h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-2">Skills</h4>
          <div className="flex flex-wrap gap-1.5">{resume.skills.map((s: string) => <span key={s} className="bg-accent/10 text-accent px-2 py-0.5 rounded text-[10px] font-bold">{s}</span>)}</div></div>
        )}
        {allCertifications.length > 0 && (
          <div><h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 mb-2">Certifications</h4>
          {allCertifications.map(c => <div key={c} className="flex items-center space-x-1.5 text-[10px] mb-1"><span className="h-1.5 w-1.5 bg-accent rounded-full flex-shrink-0" /><span className="font-semibold text-zinc-700">{c}</span></div>)}</div>
        )}
      </div>
    </div>
  );
}

function MinimalCompact({ resume, allCertifications, forPrint }: ResumeProps) {
  return (
    <div className={`space-y-3 font-sans text-[10px] ${forPrint ? 'text-black' : 'text-zinc-800'}`}>
      <div className="flex justify-between items-end border-b border-zinc-200 pb-2">
        <div><h1 className="text-lg font-bold text-zinc-900">{resume.personal_info.name}</h1><p className="text-[10px] font-semibold text-accent">{resume.personal_info.title}</p></div>
        <div className="text-right text-[10px] text-zinc-500 space-y-0.5">
          <p>{resume.personal_info.email}</p><p>{resume.personal_info.phone}</p><p>{resume.personal_info.website}</p>
        </div>
      </div>
      {resume.personal_info.summary && <p className="text-zinc-600 leading-relaxed">{resume.personal_info.summary}</p>}
      {resume.experience.length > 0 && (
        <div><p className="font-bold uppercase tracking-wider text-zinc-500 text-[9px] mb-1">EXPERIENCE</p>
        {resume.experience.map((exp: any) => (
          <div key={exp.id} className="mb-2">
            <div className="flex justify-between"><span className="font-bold text-zinc-900">{exp.role}</span><span className="text-zinc-400 text-[9px]">{exp.startDate} – {exp.endDate}</span></div>
            <span className="text-zinc-600">{exp.company}</span>
            <p className="text-zinc-600 leading-snug mt-0.5 whitespace-pre-wrap">{exp.description}</p>
          </div>
        ))}</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {resume.education.length > 0 && (
          <div><p className="font-bold uppercase tracking-wider text-zinc-500 text-[9px] mb-1">EDUCATION</p>
          {resume.education.map((edu: any) => <div key={edu.id} className="mb-1"><p className="font-bold text-zinc-800">{edu.degree}</p><p className="text-zinc-500">{edu.school} · {edu.startDate}–{edu.endDate}</p></div>)}</div>
        )}
        <div className="space-y-2">
          {resume.skills.length > 0 && <div><p className="font-bold uppercase tracking-wider text-zinc-500 text-[9px] mb-1">SKILLS</p><p className="text-zinc-700 leading-relaxed">{resume.skills.join(' · ')}</p></div>}
          {allCertifications.length > 0 && <div><p className="font-bold uppercase tracking-wider text-zinc-500 text-[9px] mb-1">CERTS</p>{allCertifications.map(c => <p key={c} className="text-zinc-700">{c}</p>)}</div>}
        </div>
      </div>
    </div>
  );
}

function ModernSidebar({ resume, allCertifications, forPrint }: ResumeProps) {
  const accentBg = forPrint ? '#872341' : '#872341';
  return (
    <div className={`font-sans text-xs flex gap-0 min-h-full ${forPrint ? 'text-black' : 'text-zinc-800'}`} style={{ minHeight: '600px' }}>
      {/* Left sidebar */}
      <div className="w-36 flex-shrink-0 bg-[#872341] text-white p-4 space-y-4 rounded-l-sm">
        <div className="space-y-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Contact</p>
          <p className="text-[10px] break-all">{resume.personal_info.email}</p>
          <p className="text-[10px]">{resume.personal_info.phone}</p>
          <p className="text-[10px] break-all">{resume.personal_info.website}</p>
        </div>
        {resume.skills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Skills</p>
            {resume.skills.map((s: string) => <p key={s} className="text-[10px] text-white/90 font-medium">{s}</p>)}
          </div>
        )}
        {allCertifications.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Certs</p>
            {allCertifications.map(c => <p key={c} className="text-[10px] text-white/90 font-medium leading-tight">{c}</p>)}
          </div>
        )}
      </div>
      {/* Main area */}
      <div className="flex-1 p-5 space-y-4 border border-zinc-200 border-l-0">
        <div className="border-b border-zinc-200 pb-3">
          <h1 className="text-xl font-bold text-zinc-900 leading-tight">{resume.personal_info.name}</h1>
          <p className="text-xs font-semibold text-accent uppercase tracking-wider">{resume.personal_info.title}</p>
        </div>
        {resume.personal_info.summary && <p className="text-zinc-600 leading-relaxed font-normal">{resume.personal_info.summary}</p>}
        {resume.experience.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent mb-2">Experience</h4>
            <div className="space-y-3">
              {resume.experience.map((exp: any) => (
                <div key={exp.id} className="space-y-0.5">
                  <div className="flex justify-between"><span className="font-bold text-zinc-900">{exp.role}</span><span className="text-zinc-400 text-[9px] whitespace-nowrap">{exp.startDate}–{exp.endDate}</span></div>
                  <p className="text-zinc-600 font-medium">{exp.company}</p>
                  <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {resume.education.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent mb-2">Education</h4>
            {resume.education.map((edu: any) => (
              <div key={edu.id} className="flex justify-between"><div><span className="font-bold">{edu.degree}</span><span className="text-zinc-500"> · {edu.school}</span></div><span className="text-zinc-400 text-[9px] whitespace-nowrap">{edu.startDate}–{edu.endDate}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModernTwoCol({ resume, allCertifications, forPrint }: ResumeProps) {
  return (
    <div className={`font-sans text-xs ${forPrint ? 'text-black' : 'text-zinc-800'}`}>
      {/* Header */}
      <div className="border-l-4 border-accent pl-4 py-2 mb-5">
        <h1 className="text-2xl font-bold text-zinc-900 leading-tight">{resume.personal_info.name}</h1>
        <p className="text-xs font-semibold text-accent uppercase tracking-wider">{resume.personal_info.title}</p>
        <div className="flex flex-wrap gap-x-4 mt-1 text-zinc-500 text-[10px]">
          <span>{resume.personal_info.email}</span><span>{resume.personal_info.phone}</span><span>{resume.personal_info.website}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {/* Left 2/3: summary + experience */}
        <div className="col-span-2 space-y-4">
          {resume.personal_info.summary && <p className="text-zinc-600 leading-relaxed">{resume.personal_info.summary}</p>}
          {resume.experience.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent border-b border-accent/20 pb-1 mb-2">Professional Background</h4>
              {resume.experience.map((exp: any) => (
                <div key={exp.id} className="mb-3">
                  <div className="flex justify-between"><span className="font-bold text-zinc-900">{exp.role}</span><span className="text-zinc-400 text-[9px]">{exp.startDate}–{exp.endDate}</span></div>
                  <p className="text-accent font-semibold">{exp.company}</p>
                  <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right 1/3: education + skills + certs */}
        <div className="space-y-4">
          {resume.education.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent border-b border-accent/20 pb-1 mb-2">Education</h4>
              {resume.education.map((edu: any) => (
                <div key={edu.id} className="mb-2"><p className="font-bold text-zinc-900">{edu.degree}</p><p className="text-zinc-600">{edu.school}</p><p className="text-zinc-400 text-[9px]">{edu.startDate}–{edu.endDate}</p></div>
              ))}
            </div>
          )}
          {resume.skills.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent border-b border-accent/20 pb-1 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1">{resume.skills.map((s: string) => <span key={s} className="bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[9px] font-semibold">{s}</span>)}</div>
            </div>
          )}
          {allCertifications.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent border-b border-accent/20 pb-1 mb-2">Certifications</h4>
              {allCertifications.map(c => <p key={c} className="text-[9px] font-semibold text-zinc-700 mb-1">{c}</p>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModernAccent({ resume, allCertifications, forPrint }: ResumeProps) {
  return (
    <div className={`font-sans text-xs ${forPrint ? 'text-black' : 'text-zinc-800'}`}>
      {/* Full-width accent header */}
      <div className="bg-[#872341] text-white px-6 py-4 -mx-1 mb-5 rounded-sm">
        <h1 className="text-2xl font-bold leading-tight">{resume.personal_info.name}</h1>
        <p className="text-sm font-semibold text-white/80 mt-0.5">{resume.personal_info.title}</p>
        <div className="flex flex-wrap gap-x-5 mt-2 text-white/70 text-[10px]">
          <span>{resume.personal_info.email}</span><span>{resume.personal_info.phone}</span><span>{resume.personal_info.website}</span>
        </div>
      </div>
      {resume.personal_info.summary && <p className="text-zinc-600 leading-relaxed mb-4">{resume.personal_info.summary}</p>}
      {resume.experience.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#872341] mb-2">Work Experience</h4>
          {resume.experience.map((exp: any) => (
            <div key={exp.id} className="mb-3 pl-2 border-l-2 border-accent/30">
              <div className="flex justify-between"><span className="font-bold text-zinc-900">{exp.role} <span className="font-normal text-zinc-500">at {exp.company}</span></span><span className="text-zinc-400 text-[9px]">{exp.startDate}–{exp.endDate}</span></div>
              <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap mt-0.5">{exp.description}</p>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-3 gap-4 pt-3 border-t border-zinc-200">
        {resume.education.length > 0 && (
          <div><h4 className="text-[9px] font-black uppercase tracking-widest text-[#872341] mb-1.5">Education</h4>
          {resume.education.map((edu: any) => <div key={edu.id} className="mb-1.5"><p className="font-bold text-zinc-800 leading-tight">{edu.degree}</p><p className="text-zinc-500">{edu.school}</p><p className="text-zinc-400 text-[9px]">{edu.startDate}–{edu.endDate}</p></div>)}</div>
        )}
        {resume.skills.length > 0 && (
          <div><h4 className="text-[9px] font-black uppercase tracking-widest text-[#872341] mb-1.5">Skills</h4>
          <div className="flex flex-wrap gap-1">{resume.skills.map((s: string) => <span key={s} className="bg-[#872341]/10 text-[#872341] px-1.5 py-0.5 rounded text-[9px] font-semibold">{s}</span>)}</div></div>
        )}
        {allCertifications.length > 0 && (
          <div><h4 className="text-[9px] font-black uppercase tracking-widest text-[#872341] mb-1.5">Certifications</h4>
          {allCertifications.map(c => <p key={c} className="text-[9px] text-zinc-700 font-semibold mb-1 leading-tight">{c}</p>)}</div>
        )}
      </div>
    </div>
  );
}

function ClassicSerif({ resume, allCertifications, forPrint }: ResumeProps) {
  return (
    <div className={`space-y-5 font-serif text-xs ${forPrint ? 'text-black' : 'text-zinc-800'}`}>
      <div className="text-center space-y-1 border-b-2 border-zinc-800 pb-3">
        <h1 className="text-2xl font-bold tracking-wide text-zinc-900 uppercase">{resume.personal_info.name}</h1>
        <p className="font-semibold text-zinc-600 not-italic">{resume.personal_info.title}</p>
        <div className="flex justify-center items-center gap-2 text-[10px] text-zinc-500 font-medium">
          <span>{resume.personal_info.email}</span><span>|</span><span>{resume.personal_info.phone}</span><span>|</span><span>{resume.personal_info.website}</span>
        </div>
      </div>
      {resume.personal_info.summary && (
        <div><h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 text-center italic border-b border-zinc-200 pb-0.5 mb-1">Professional Statement</h4>
        <p className="text-zinc-600 leading-relaxed">{resume.personal_info.summary}</p></div>
      )}
      {resume.experience.length > 0 && (
        <div><h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 text-center italic border-b border-zinc-200 pb-0.5 mb-2">Employment History</h4>
        {resume.experience.map((exp: any) => (
          <div key={exp.id} className="mb-3 space-y-0.5">
            <div className="flex justify-between items-baseline font-bold text-zinc-900">
              <div><span>{exp.role}</span><span className="font-normal italic"> — {exp.company}</span></div>
              <span className="font-normal text-zinc-500 text-[10px] whitespace-nowrap ml-2">{exp.startDate} – {exp.endDate}</span>
            </div>
            <p className="text-zinc-600 leading-relaxed italic whitespace-pre-wrap">{exp.description}</p>
          </div>
        ))}</div>
      )}
      {resume.education.length > 0 && (
        <div><h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 text-center italic border-b border-zinc-200 pb-0.5 mb-2">Education & Credentials</h4>
        {resume.education.map((edu: any) => (
          <div key={edu.id} className="flex justify-between items-baseline font-semibold text-zinc-800 mb-1">
            <div><span>{edu.degree}</span><span className="font-normal italic">, {edu.school}</span></div>
            <span className="font-normal text-zinc-500 text-[10px] whitespace-nowrap ml-2">{edu.startDate} – {edu.endDate}</span>
          </div>
        ))}</div>
      )}
      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-zinc-200">
        {resume.skills.length > 0 && <div className="flex gap-2 text-[10px]"><span className="font-bold uppercase tracking-wider flex-shrink-0 text-zinc-900">Key Competencies:</span><span className="text-zinc-700 leading-relaxed">{resume.skills.join(', ')}</span></div>}
        {allCertifications.length > 0 && <div className="flex gap-2 text-[10px]"><span className="font-bold uppercase tracking-wider flex-shrink-0 text-zinc-900">Certifications:</span><span className="text-zinc-700 leading-relaxed">{allCertifications.join('; ')}</span></div>}
      </div>
    </div>
  );
}

function ClassicFormal({ resume, allCertifications, forPrint }: ResumeProps) {
  return (
    <div className={`space-y-4 font-serif text-xs ${forPrint ? 'text-black' : 'text-zinc-800'}`}>
      <div className="text-center pb-3">
        <div className="border-t-2 border-b-2 border-zinc-800 py-2">
          <h1 className="text-xl font-bold tracking-widest uppercase text-zinc-900">{resume.personal_info.name}</h1>
        </div>
        <p className="mt-1.5 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">{resume.personal_info.title}</p>
        <div className="flex justify-center gap-3 mt-1 text-[10px] text-zinc-500">
          <span>{resume.personal_info.email}</span><span>·</span><span>{resume.personal_info.phone}</span><span>·</span><span>{resume.personal_info.website}</span>
        </div>
      </div>
      {resume.personal_info.summary && (
        <div className="border-t border-zinc-300 pt-2">
          <p className="text-zinc-600 leading-relaxed text-center italic">{resume.personal_info.summary}</p>
        </div>
      )}
      {resume.experience.length > 0 && (
        <div className="border-t border-zinc-300 pt-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-center text-zinc-800 mb-2">Professional Experience</h4>
          {resume.experience.map((exp: any) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-start"><span className="font-bold text-zinc-900">{exp.role}</span><span className="text-zinc-500 text-[10px] whitespace-nowrap">{exp.startDate}–{exp.endDate}</span></div>
              <p className="italic text-zinc-600 mb-0.5">{exp.company}</p>
              <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
            </div>
          ))}
        </div>
      )}
      {resume.education.length > 0 && (
        <div className="border-t border-zinc-300 pt-2">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-center text-zinc-800 mb-2">Academic Background</h4>
          {resume.education.map((edu: any) => (
            <div key={edu.id} className="flex justify-between mb-1">
              <div><span className="font-bold">{edu.degree}</span><span className="italic text-zinc-600">, {edu.school}</span></div>
              <span className="text-zinc-500 text-[10px]">{edu.startDate}–{edu.endDate}</span>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-zinc-300 pt-2 space-y-1.5 text-[10px]">
        {resume.skills.length > 0 && (
          <div className="flex flex-wrap gap-x-1">
            <span className="font-bold uppercase tracking-wider text-zinc-900 mr-1">Competencies:</span>
            {resume.skills.map((s: string, i: number) => <span key={s} className="text-zinc-700">{s}{i < resume.skills.length - 1 ? ' ·' : ''}</span>)}
          </div>
        )}
        {allCertifications.length > 0 && (
          <div><span className="font-bold uppercase tracking-wider text-zinc-900 mr-1">Certifications:</span><span className="text-zinc-700 italic">{allCertifications.join('; ')}</span></div>
        )}
      </div>
    </div>
  );
}

function ClassicTimeline({ resume, allCertifications, forPrint }: ResumeProps) {
  return (
    <div className={`space-y-5 font-serif text-xs ${forPrint ? 'text-black' : 'text-zinc-800'}`}>
      <div className="border-b border-zinc-800 pb-3">
        <h1 className="text-2xl font-bold text-zinc-900">{resume.personal_info.name}</h1>
        <p className="text-xs font-semibold text-zinc-600 not-italic">{resume.personal_info.title}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-zinc-500 text-[10px] mt-1">
          <span>{resume.personal_info.email}</span><span>{resume.personal_info.phone}</span><span>{resume.personal_info.website}</span>
        </div>
      </div>
      {resume.personal_info.summary && <p className="text-zinc-600 leading-relaxed">{resume.personal_info.summary}</p>}
      {resume.experience.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-800 border-b border-zinc-300 pb-0.5 mb-3">Work History</h4>
          <div className="relative pl-5 border-l-2 border-zinc-300 space-y-4">
            {resume.experience.map((exp: any) => (
              <div key={exp.id} className="relative">
                <span className="absolute -left-[22px] top-0.5 h-3 w-3 rounded-full bg-zinc-800 border-2 border-white" />
                <div className="flex justify-between"><span className="font-bold text-zinc-900">{exp.role}</span><span className="text-zinc-400 text-[10px] whitespace-nowrap ml-2">{exp.startDate} – {exp.endDate}</span></div>
                <p className="italic text-zinc-600 mb-0.5">{exp.company}</p>
                <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-200">
        {resume.education.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-800 mb-2">Education</h4>
            {resume.education.map((edu: any) => (
              <div key={edu.id} className="mb-1.5 pl-3 border-l border-zinc-300">
                <p className="font-bold text-zinc-900">{edu.degree}</p>
                <p className="text-zinc-600 italic">{edu.school}</p>
                <p className="text-zinc-400 text-[9px]">{edu.startDate} – {edu.endDate}</p>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-3">
          {resume.skills.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-800 mb-1.5">Skills</h4>
              <div className="flex flex-wrap gap-1">{resume.skills.map((s: string) => <span key={s} className="border border-zinc-300 text-zinc-700 px-1.5 py-0.5 rounded text-[9px]">{s}</span>)}</div>
            </div>
          )}
          {allCertifications.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-800 mb-1.5">Certifications</h4>
              {allCertifications.map(c => <div key={c} className="flex items-start space-x-1 text-[9px] mb-1"><span className="text-zinc-400 font-bold mt-0.5">▸</span><span className="text-zinc-700 font-semibold">{c}</span></div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResumeRenderer({ variantId, resume, allCertifications, forPrint }: { variantId: TemplateVariantId; resume: any; allCertifications: string[]; forPrint?: boolean }) {
  const props = { resume, allCertifications, forPrint };
  switch (variantId) {
    case 'minimal-light':   return <MinimalLight {...props} />;
    case 'minimal-bold':    return <MinimalBold {...props} />;
    case 'minimal-compact': return <MinimalCompact {...props} />;
    case 'modern-sidebar':  return <ModernSidebar {...props} />;
    case 'modern-twocol':   return <ModernTwoCol {...props} />;
    case 'modern-accent':   return <ModernAccent {...props} />;
    case 'classic-serif':   return <ClassicSerif {...props} />;
    case 'classic-formal':  return <ClassicFormal {...props} />;
    case 'classic-timeline':return <ClassicTimeline {...props} />;
    default: return <MinimalLight {...props} />;
  }
}

// ─── ATS score ring ───────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 36, circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#059669' : score >= 55 ? '#C9A227' : '#dc2626';
  const dash = (score / 100) * circ;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="flex-shrink-0">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#f4dbe5" strokeWidth="8" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
      />
      <text x="48" y="48" textAnchor="middle" dominantBaseline="central" fontSize="18" fontWeight="800" fill={color}>{score}</text>
      <text x="48" y="63" textAnchor="middle" fontSize="9" fill="#a1a1aa" fontWeight="600">/ 100</text>
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ResumePage() {
  const { resumes, updateResume, certificates, getCourseById } = useKorsayStore();

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [expandedSection, setExpandedSection] = useState<string | null>('personal');

  // Two-level template selection
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategoryId>('minimal');
  const [selectedVariant, setSelectedVariant] = useState<TemplateVariantId>('minimal-light');

  const [newSkill, setNewSkill] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // ATS state
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const [atsRunning, setAtsRunning] = useState(false);
  const [atsOpen, setAtsOpen] = useState(false);

  // Entry mode state
  const [entryMode, setEntryMode] = useState<'choice' | 'builder' | 'upload' | 'preview' | 'analysis'>('builder');
  const [parsedResume, setParsedResume] = useState<any>(null);
  const [rawExtractedText, setRawExtractedText] = useState('');
  const [uploadedFilePreviewUrl, setUploadedFilePreviewUrl] = useState('');
  const [uploadedFileKind, setUploadedFileKind] = useState<'pdf' | 'docx' | ''>('');
  const [docxPreviewHtml, setDocxPreviewHtml] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    return () => {
      if (uploadedFilePreviewUrl) URL.revokeObjectURL(uploadedFilePreviewUrl);
    };
  }, [uploadedFilePreviewUrl]);

  useEffect(() => {
    if (hydrated && resumes.length > 0) {
      const r = resumes[0];
      if (!r.personal_info.name && r.experience.length === 0 && entryMode === 'builder') {
        setEntryMode('choice');
      }
    }
  }, [hydrated, resumes, entryMode]);

  const resume = resumes.length > 0 ? resumes[0] : null;

  if (!resume) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="h-12 w-12 text-zinc-400 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-800">Resume profile not found</h2>
      </div>
    );
  }

  const earnedCerts = certificates.map(cert => {
    const course = getCourseById(cert.course_id);
    return `${course ? course.name : 'Unknown Course'} Certification`;
  });
  const allCertifications = Array.from(new Set([...resume.certifications, ...earnedCerts]));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    setDocxPreviewHtml('');

    if (uploadedFilePreviewUrl) URL.revokeObjectURL(uploadedFilePreviewUrl);
    const previewUrl = URL.createObjectURL(file);
    const isPdfUpload = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setUploadedFilePreviewUrl(previewUrl);
    setUploadedFileKind(isPdfUpload ? 'pdf' : 'docx');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-resume', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse');

      // Merge parsed resume into the store so experience is available for ATS
      updateResume({
        ...resume,
        ...data.resume,
      });
      setParsedResume(data.resume);
      setRawExtractedText(data.rawText || 'No text could be extracted.');
      setDocxPreviewHtml(data.previewHtml || '');
      console.log('[Korsay] Full extracted resume text from upload:', data.rawText || '');
      setEntryMode('preview');
      // Do not run ATS check here. We run it when user clicks "Analyze" from the preview.
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunAnalysis = () => {
    if (parsedResume) {
      const result = runATSCheck(parsedResume, 'minimal-light', allCertifications);
      setAtsResult(result);
      setEntryMode('analysis');
    }
  };

  if (entryMode === 'choice') {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">How would you like to start?</h1>
          <p className="text-zinc-500">Choose to build your resume from scratch or upload an existing one for ATS analysis.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => setEntryMode('builder')} className="p-8 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-accent hover:ring-1 hover:ring-accent transition-all text-left group">
            <div className="h-12 w-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/10">
              <Edit3 className="h-6 w-6 text-zinc-600 group-hover:text-accent" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Build from Scratch</h3>
            <p className="text-sm text-zinc-500">Use our guided builder to create a perfectly formatted, ATS-friendly resume step by step.</p>
          </button>
          <button onClick={() => setEntryMode('upload')} className="p-8 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-accent hover:ring-1 hover:ring-accent transition-all text-left group">
            <div className="h-12 w-12 bg-zinc-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/10">
              <UploadCloud className="h-6 w-6 text-zinc-600 group-hover:text-accent" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Upload Existing Resume</h3>
            <p className="text-sm text-zinc-500">Upload a PDF or Word document. We'll parse it, run an ATS check, and suggest improvements.</p>
          </button>
        </div>
      </div>
    );
  }

  if (entryMode === 'upload') {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-6">
        <button onClick={() => setEntryMode('choice')} className="flex items-center text-sm font-semibold text-zinc-500 hover:text-zinc-900"><ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back</button>
        <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-12 text-center">
          <Upload className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Upload your resume</h2>
          <p className="text-sm text-zinc-500 mb-6">We accept PDF and DOCX files up to 5MB.</p>
          <label className="relative cursor-pointer bg-accent text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-accent-hover transition-colors shadow-sm inline-block">
            {isUploading ? 'Parsing document...' : 'Select File'}
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={handleFileUpload} disabled={isUploading} />
          </label>
          {uploadError && <p className="text-rose-600 text-sm mt-4 font-semibold">{uploadError}</p>}
        </div>
      </div>
    );
  }

  if (entryMode === 'preview') {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <button onClick={() => setEntryMode('upload')} className="flex items-center text-sm font-semibold text-zinc-500 hover:text-zinc-900"><ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Re-upload</button>
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Extraction Preview</h2>
          <p className="text-sm text-zinc-500 mb-6">
            First verify the captured layout, then inspect the full extracted text below. The complete extracted text is also logged to the browser console.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Document layout preview</h3>
              <div className="bg-zinc-100 border border-zinc-200 rounded-xl overflow-hidden min-h-[560px]">
                {uploadedFileKind === 'pdf' && uploadedFilePreviewUrl ? (
                  <iframe
                    src={uploadedFilePreviewUrl}
                    title="Uploaded resume PDF preview"
                    className="w-full h-[560px] bg-white"
                  />
                ) : docxPreviewHtml ? (
                  <div
                    className="resume-docx-preview bg-white min-h-[560px] p-8 overflow-auto text-sm leading-relaxed text-zinc-800"
                    dangerouslySetInnerHTML={{ __html: docxPreviewHtml }}
                  />
                ) : (
                  <div className="min-h-[560px] flex items-center justify-center text-xs text-zinc-500 p-8 text-center">
                    Layout preview is unavailable for this file, but extracted text is shown on the right.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Full extracted text</h3>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 h-[560px] overflow-y-auto">
                <pre className="text-xs text-zinc-100 whitespace-pre-wrap font-mono">{rawExtractedText}</pre>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Experience entries</p>
              <p className="text-lg font-bold text-zinc-900">{parsedResume?.experience?.length ?? 0}</p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Education entries</p>
              <p className="text-lg font-bold text-zinc-900">{parsedResume?.education?.length ?? 0}</p>
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Skills captured</p>
              <p className="text-lg font-bold text-zinc-900">{parsedResume?.skills?.length ?? 0}</p>
            </div>
          </div>

          <div className="flex justify-end">
             <button onClick={handleRunAnalysis} className="bg-accent text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-accent-hover shadow-sm">
               Run ATS Analysis
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (entryMode === 'analysis' && atsResult) {
    const expCount = parsedResume?.experience?.length || 0;
    const recs = expCount > 3 ? ['minimal-compact', 'modern-sidebar'] : ['minimal-light', 'classic-serif'];
    
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Analysis Results</h1>
            <p className="text-sm text-zinc-500">We've parsed your resume and ran it through our ATS scanner.</p>
          </div>
          <button onClick={() => setEntryMode('builder')} className="bg-white border border-zinc-200 text-zinc-700 px-5 py-2.5 rounded-lg font-bold text-sm hover:border-zinc-300 shadow-sm">
            Exit to Builder
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm text-center">
               <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">ATS Match Score</h3>
               <div className="flex justify-center mb-4"><ScoreRing score={atsResult.score} /></div>
               <p className="text-sm text-zinc-600 font-medium">Your resume scored <span className="text-zinc-900 font-bold">{atsResult.score} out of 100</span>.</p>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center"><LayoutTemplate className="h-4 w-4 mr-2 text-accent" /> Recommended Templates</h3>
              <p className="text-xs text-indigo-700 mb-4">Based on your content length, we recommend these ATS-optimized templates:</p>
              <div className="space-y-2">
                {recs.map(rId => {
                   const variant = TEMPLATE_CATEGORIES.flatMap(c => c.variants).find(v => v.id === rId);
                   return variant ? (
                     <div key={rId} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                       <p className="font-bold text-xs text-zinc-900">{variant.label}</p>
                       <p className="text-[10px] text-zinc-500">{variant.description}</p>
                     </div>
                   ) : null;
                })}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center"><AlertTriangle className="h-4 w-4 mr-2 text-rose-500" /> Detected Issues</h3>
              <div className="space-y-3">
                {atsResult.flags.filter(f => f.severity === 'warn').length > 0 ? (
                  atsResult.flags.filter(f => f.severity === 'warn').map((f, i) => (
                    <div key={i} className="flex gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                      <div className="mt-0.5"><AlertCircle className="h-4 w-4 text-rose-500" /></div>
                      <div><p className="text-sm font-bold text-rose-900">{f.label}</p><p className="text-xs text-rose-700 mt-1">{f.detail}</p></div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium"><CheckCircle2 className="h-4 w-4" /> No major ATS warnings detected!</div>
                )}
              </div>
            </div>
            
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center"><Zap className="h-4 w-4 mr-2 text-amber-500" /> Actionable Suggestions</h3>
              <ul className="space-y-3">
                {atsResult.suggestions.length > 0 ? atsResult.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-zinc-700"><span className="text-amber-500 font-bold mt-0.5">•</span> <span>{s}</span></li>
                )) : (
                  <li className="text-sm text-zinc-500">Your resume looks great! Review it in the builder to make final tweaks.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Current category variants
  const currentCategory = TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)!;

  // Auto-select first variant when category changes
  const handleCategorySelect = (catId: TemplateCategoryId) => {
    setSelectedCategory(catId);
    const cat = TEMPLATE_CATEGORIES.find(c => c.id === catId)!;
    setSelectedVariant(cat.variants[0].id);
    setAtsResult(null);
  };

  // Handlers
  const handlePersonalUpdate = (field: string, value: string) => {
    updateResume({ ...resume, personal_info: { ...resume.personal_info, [field]: value } });
  };
  const handleAddExperience = () => {
    updateResume({ ...resume, experience: [...resume.experience, { id: `exp-${Date.now()}`, company: 'New Company', role: 'Software Engineer', startDate: '2025-01', endDate: 'Present', description: 'Describe your achievements and duties here.' }] });
  };
  const handleExperienceChange = (id: string, field: string, value: string) => {
    updateResume({ ...resume, experience: resume.experience.map((e: any) => e.id === id ? { ...e, [field]: value } : e) });
  };
  const handleDeleteExperience = (id: string) => {
    updateResume({ ...resume, experience: resume.experience.filter((e: any) => e.id !== id) });
  };
  const handleAddEducation = () => {
    updateResume({ ...resume, education: [...resume.education, { id: `edu-${Date.now()}`, school: 'University Name', degree: 'B.S. Computer Science', startDate: '2021-09', endDate: '2025-05' }] });
  };
  const handleEducationChange = (id: string, field: string, value: string) => {
    updateResume({ ...resume, education: resume.education.map((e: any) => e.id === id ? { ...e, [field]: value } : e) });
  };
  const handleDeleteEducation = (id: string) => {
    updateResume({ ...resume, education: resume.education.filter((e: any) => e.id !== id) });
  };
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !resume.skills.includes(newSkill.trim())) {
      updateResume({ ...resume, skills: [...resume.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };
  const handleDeleteSkill = (skill: string) => {
    updateResume({ ...resume, skills: resume.skills.filter((s: string) => s !== skill) });
  };
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  const triggerPrint = () => { if (typeof window !== 'undefined') window.print(); };

  const handleRunATS = () => {
    setAtsRunning(true);
    setAtsOpen(true);
    setTimeout(() => {
      const result = runATSCheck(resume, selectedVariant, allCertifications);
      setAtsResult(result);
      setAtsRunning(false);
    }, 900);
  };

  const personalStatus = resume.personal_info.name && resume.personal_info.email ? 'complete' : 'not-started';
  const experienceCount = resume.experience.length;
  const educationCount = resume.education.length;
  const skillsCount = resume.skills.length;
  const certsCount = allCertifications.length;

  return (
    <div className="space-y-8 py-4">
      {/* Header and Toggle (no-print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-4 no-print">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Resume builder</h1>
          <p className="text-sm text-zinc-500">
            {activeTab === 'edit'
              ? 'Fill in your professional history and auto-populate earned certifications.'
              : 'Preview your formatted resume, check ATS compatibility, and download as PDF.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 self-start sm:self-auto">
          <div className="bg-zinc-50 p-1 border border-zinc-200/50 rounded-lg flex items-center">
            <button onClick={() => setActiveTab('edit')} className={`px-4 py-2 rounded-md text-xs font-semibold select-none flex items-center space-x-1.5 transition-all duration-150 tap-active ${activeTab === 'edit' ? 'bg-white text-accent shadow-sm border border-zinc-100' : 'text-zinc-500 hover:text-zinc-800'}`}>
              <Edit3 className="h-3.5 w-3.5" /><span>Edit profile</span>
            </button>
            <button onClick={() => setActiveTab('preview')} className={`px-4 py-2 rounded-md text-xs font-semibold select-none flex items-center space-x-1.5 transition-all duration-150 tap-active ${activeTab === 'preview' ? 'bg-white text-accent shadow-sm border border-zinc-100' : 'text-zinc-500 hover:text-zinc-800'}`}>
              <Eye className="h-3.5 w-3.5" /><span>Live preview</span>
            </button>
          </div>
          <button onClick={() => setEntryMode('upload')} className="bg-white border border-zinc-200 px-4 py-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-accent hover:border-accent shadow-sm transition-all tap-active">
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload & Analyze</span>
          </button>
        </div>
      </div>

      {/* ─── EDIT TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'edit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
          {/* Left Accordion Column */}
          <div className="lg:col-span-2 space-y-4">

            {/* 1. Personal Info */}
            <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => toggleSection('personal')} className="w-full p-5 flex items-center justify-between font-semibold text-sm text-zinc-800 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-zinc-400" />
                  <span>Personal information</span>
                  {personalStatus === 'complete' ? (
                    <span className="badge badge-success">Completed</span>
                  ) : (
                    <span className="badge badge-neutral">Pending</span>
                  )}
                </div>
                {expandedSection === 'personal' ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </button>
              {expandedSection === 'personal' && (
                <div className="p-6 border-t border-zinc-50 bg-zinc-50/10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Full name</label>
                      <input type="text" value={resume.personal_info.name} onChange={e => handlePersonalUpdate('name', e.target.value)} className="w-full bg-white border border-zinc-200 px-3 py-2 rounded-lg text-xs font-normal focus:outline-none focus:border-accent transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Email address</label>
                      <input type="email" value={resume.personal_info.email} onChange={e => handlePersonalUpdate('email', e.target.value)} className="w-full bg-white border border-zinc-200 px-3 py-2 rounded-lg text-xs font-normal focus:outline-none focus:border-accent transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Professional title</label>
                      <input type="text" value={resume.personal_info.title} onChange={e => handlePersonalUpdate('title', e.target.value)} className="w-full bg-white border border-zinc-200 px-3 py-2 rounded-lg text-xs font-normal focus:outline-none focus:border-accent transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Phone number</label>
                      <input type="text" value={resume.personal_info.phone} onChange={e => handlePersonalUpdate('phone', e.target.value)} className="w-full bg-white border border-zinc-200 px-3 py-2 rounded-lg text-xs font-normal focus:outline-none focus:border-accent transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Website/Portfolio</label>
                      <input type="text" value={resume.personal_info.website} onChange={e => handlePersonalUpdate('website', e.target.value)} className="w-full bg-white border border-zinc-200 px-3 py-2 rounded-lg text-xs font-normal focus:outline-none focus:border-accent transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Professional summary</label>
                    <textarea value={resume.personal_info.summary} onChange={e => handlePersonalUpdate('summary', e.target.value)} rows={3} className="w-full bg-white border border-zinc-200 px-3 py-2 rounded-lg text-xs font-normal focus:outline-none focus:border-accent leading-relaxed transition-colors" />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Work Experience */}
            <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => toggleSection('experience')} className="w-full p-5 flex items-center justify-between font-semibold text-sm text-zinc-800 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-4 w-4 text-zinc-400" />
                  <span>Work experience</span>
                  <span className="badge badge-neutral">{experienceCount} job{experienceCount !== 1 ? 's' : ''}</span>
                </div>
                {expandedSection === 'experience' ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </button>
              {expandedSection === 'experience' && (
                <div className="p-6 border-t border-zinc-50 bg-zinc-50/10 space-y-6">
                  {resume.experience.map((exp: any, idx: number) => (
                    <div key={exp.id} className="relative bg-white border border-zinc-200 p-4 rounded-xl space-y-4">
                      <button onClick={() => handleDeleteExperience(exp.id)} className="absolute top-4 right-4 text-zinc-400 hover:text-rose-600 transition-colors tap-active"><Trash2 className="h-4 w-4" /></button>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Role #{idx + 1}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Company</label><input type="text" value={exp.company} onChange={e => handleExperienceChange(exp.id, 'company', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-normal focus:outline-none focus:border-accent" /></div>
                        <div className="space-y-1"><label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Job title</label><input type="text" value={exp.role} onChange={e => handleExperienceChange(exp.id, 'role', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-normal focus:outline-none focus:border-accent" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Start date</label><input type="text" placeholder="YYYY-MM" value={exp.startDate} onChange={e => handleExperienceChange(exp.id, 'startDate', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-normal focus:outline-none focus:border-accent" /></div>
                        <div className="space-y-1"><label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">End date</label><input type="text" placeholder="YYYY-MM or Present" value={exp.endDate} onChange={e => handleExperienceChange(exp.id, 'endDate', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-normal focus:outline-none focus:border-accent" /></div>
                      </div>
                      <div className="space-y-1"><label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Description & duties</label><textarea value={exp.description} onChange={e => handleExperienceChange(exp.id, 'description', e.target.value)} rows={3} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-normal focus:outline-none focus:border-accent leading-relaxed" /></div>
                    </div>
                  ))}
                  <button onClick={handleAddExperience} className="w-full flex items-center justify-center space-x-1.5 border border-dashed border-zinc-300 py-3 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors tap-active">
                    <Plus className="h-4 w-4" /><span>Add work history</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Education */}
            <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => toggleSection('education')} className="w-full p-5 flex items-center justify-between font-semibold text-sm text-zinc-800 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="h-4 w-4 text-zinc-400" />
                  <span>Education</span>
                  <span className="badge badge-neutral">{educationCount} entr{educationCount !== 1 ? 'ies' : 'y'}</span>
                </div>
                {expandedSection === 'education' ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </button>
              {expandedSection === 'education' && (
                <div className="p-6 border-t border-zinc-50 bg-zinc-50/10 space-y-6">
                  {resume.education.map((edu: any, idx: number) => (
                    <div key={edu.id} className="relative bg-white border border-zinc-200 p-4 rounded-xl space-y-4">
                      <button onClick={() => handleDeleteEducation(edu.id)} className="absolute top-4 right-4 text-zinc-400 hover:text-rose-600 transition-colors tap-active"><Trash2 className="h-4 w-4" /></button>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Education #{idx + 1}</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">School/University</label><input type="text" value={edu.school} onChange={e => handleEducationChange(edu.id, 'school', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-normal focus:outline-none focus:border-accent" /></div>
                        <div className="space-y-1"><label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Degree/Major</label><input type="text" value={edu.degree} onChange={e => handleEducationChange(edu.id, 'degree', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-normal focus:outline-none focus:border-accent" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1"><label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Start date</label><input type="text" placeholder="YYYY-MM" value={edu.startDate} onChange={e => handleEducationChange(edu.id, 'startDate', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-normal focus:outline-none focus:border-accent" /></div>
                        <div className="space-y-1"><label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">End date</label><input type="text" placeholder="YYYY-MM" value={edu.endDate} onChange={e => handleEducationChange(edu.id, 'endDate', e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-normal focus:outline-none focus:border-accent" /></div>
                      </div>
                    </div>
                  ))}
                  <button onClick={handleAddEducation} className="w-full flex items-center justify-center space-x-1.5 border border-dashed border-zinc-300 py-3 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors tap-active">
                    <Plus className="h-4 w-4" /><span>Add education</span>
                  </button>
                </div>
              )}
            </div>

            {/* 4. Skills */}
            <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => toggleSection('skills')} className="w-full p-5 flex items-center justify-between font-semibold text-sm text-zinc-800 hover:bg-zinc-50/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Star className="h-4 w-4 text-zinc-400" />
                  <span>Skills</span>
                  <span className="badge badge-neutral">{skillsCount} tech</span>
                </div>
                {expandedSection === 'skills' ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
              </button>
              {expandedSection === 'skills' && (
                <div className="p-6 border-t border-zinc-50 bg-zinc-50/10 space-y-6">
                  <form onSubmit={handleAddSkill} className="flex gap-2">
                    <input type="text" placeholder="Add tech skill (e.g. Node.js)" value={newSkill} onChange={e => setNewSkill(e.target.value)} className="flex-grow bg-white border border-zinc-200 px-3 py-2 rounded-lg text-xs font-normal focus:outline-none focus:border-accent" />
                    <button type="submit" className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent-hover tap-active shadow-sm">Add</button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {resume.skills.map((skill: string) => (
                      <span key={skill} className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                        <span>{skill}</span>
                        <button type="button" onClick={() => handleDeleteSkill(skill)} className="text-zinc-400 hover:text-rose-600 font-semibold">&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Certifications */}
            <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => toggleSection('certifications')} className="w-full p-5 flex items-center justify-between font-semibold text-sm text-indigo-900 hover:bg-indigo-50/40 transition-colors">
                <div className="flex items-center space-x-3">
                  <Award className="h-4 w-4 text-accent" />
                  <span>Candfolio credentials</span>
                  <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full font-bold">{certsCount} active</span>
                </div>
                {expandedSection === 'certifications' ? <ChevronUp className="h-4 w-4 text-accent" /> : <ChevronDown className="h-4 w-4 text-accent" />}
              </button>
              {expandedSection === 'certifications' && (
                <div className="p-6 border-t border-indigo-100 bg-white space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100/50 p-4 rounded-lg text-xs text-indigo-800 font-normal leading-relaxed">
                    <p className="font-semibold text-accent mb-0.5">Automated certification synchronization</p>
                    These entries are pulled dynamically from your passed Candfolio exam certificates. Earning new certificates will automatically insert them into your live resume templates.
                  </div>
                  {allCertifications.length > 0 ? (
                    <div className="space-y-2">
                      {allCertifications.map(cert => (
                        <div key={cert} className="flex items-center space-x-3 p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs font-semibold text-zinc-700">
                          <div className="h-5 w-5 bg-accent-light text-accent rounded-full flex items-center justify-center flex-shrink-0"><Check className="h-3 w-3 stroke-[3]" /></div>
                          <span>{cert}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-zinc-200 rounded-lg text-zinc-500">
                      <Award className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No certification credentials active</p>
                      <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Go to <Link href="/courses" className="text-accent underline font-bold">Courses</Link> to practice and pass an exam first!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Information Column */}
          <div className="space-y-6">
            <div className="bg-white border border-zinc-100 p-5 rounded-xl space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Sync status</h3>
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-zinc-50 pb-2"><span className="text-zinc-400">Guest identity</span><span className="font-bold text-zinc-700">{resume.personal_info.email}</span></div>
                <div className="flex items-center justify-between border-b border-zinc-50 pb-2"><span className="text-zinc-400">Total skills</span><span className="font-bold text-zinc-700">{skillsCount} added</span></div>
                <div className="flex items-center justify-between pb-1"><span className="text-zinc-400">Passed exams</span><span className="font-bold text-accent">{certificates.length} verified</span></div>
              </div>
              <button onClick={() => setActiveTab('preview')} className="w-full text-center bg-zinc-900 text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors tap-active">Go to preview</button>
            </div>
            <div className="bg-zinc-50 border border-zinc-100 p-5 rounded-xl space-y-3.5">
              <div className="flex items-center space-x-2 text-zinc-700"><Printer className="h-4 w-4 text-zinc-500" /><h4 className="text-xs font-semibold">Print layouts</h4></div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">When you are ready to export, toggle to <strong>Live preview</strong>, pick a stylesheet template, and click <strong>Print or Save PDF</strong>.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── PREVIEW TAB ───────────────────────────────────────────────── */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Toolbar row (no-print) */}
          <div className="no-print space-y-4">
            {/* Category selector */}
            <div className="bg-white border border-zinc-100 rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Category chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-zinc-500 mr-1 flex items-center gap-1.5"><LayoutTemplate className="h-3.5 w-3.5" />Style:</span>
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize select-none transition-all duration-150 tap-active border ${
                        selectedCategory === cat.id
                          ? 'bg-accent border-accent text-white shadow-sm'
                          : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:border-zinc-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                {/* Print trigger */}
                <button onClick={triggerPrint} className="inline-flex items-center justify-center space-x-2 bg-zinc-900 text-white px-5 py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors tap-active shadow-sm self-start sm:self-auto">
                  <Printer className="h-4 w-4" /><span>Print or Save PDF</span>
                </button>
              </div>

              {/* Variant row */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs font-semibold text-zinc-400 mr-1 self-center">Variant:</span>
                {currentCategory.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVariant(v.id); setAtsResult(null); }}
                    title={v.description}
                    className={`flex flex-col items-start px-3.5 py-2.5 rounded-xl text-left border transition-all duration-150 tap-active min-w-[110px] ${
                      selectedVariant === v.id
                        ? 'bg-accent/8 border-accent/40 shadow-sm'
                        : 'bg-zinc-50 border-zinc-200 hover:bg-white hover:border-zinc-300'
                    }`}
                    style={{ background: selectedVariant === v.id ? 'rgba(135,35,65,0.06)' : undefined }}
                  >
                    <span className={`text-xs font-bold ${selectedVariant === v.id ? 'text-accent' : 'text-zinc-700'}`}>{v.label}</span>
                    <span className="text-[10px] text-zinc-400 font-normal leading-tight mt-0.5 line-clamp-2">{v.description}</span>
                  </button>
                ))}
              </div>

              {/* ATS check button */}
              <div className="border-t border-zinc-100 pt-3 flex items-center gap-3">
                <button
                  onClick={handleRunATS}
                  disabled={atsRunning}
                  className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 tap-active ${
                    atsRunning ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-accent/10 text-accent hover:bg-accent/15 border border-accent/20'
                  }`}
                >
                  {atsRunning ? (
                    <><div className="h-3.5 w-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" /><span>Scanning…</span></>
                  ) : (
                    <><ShieldCheck className="h-3.5 w-3.5" /><span>Check ATS compatibility</span></>
                  )}
                </button>
                {atsResult && (
                  <span className={`text-xs font-bold ${atsResult.score >= 80 ? 'text-emerald-600' : atsResult.score >= 55 ? 'text-amber-600' : 'text-rose-600'}`}>
                    Current score: {atsResult.score}/100
                  </span>
                )}
                <span className="text-[11px] text-zinc-400 ml-auto hidden sm:block">Score is based on content completeness, keyword density, layout parse-ability, and section headers</span>
              </div>
            </div>

            {/* ATS results panel */}
            {atsOpen && atsResult && (
              <div className="bg-white border border-zinc-100 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    <h3 className="text-sm font-bold text-zinc-900">ATS Compatibility Report</h3>
                    <span className={`badge ${atsResult.score >= 80 ? 'badge-success' : atsResult.score >= 55 ? 'badge-amber' : 'badge-danger'}`}>
                      {atsResult.score >= 80 ? 'Good' : atsResult.score >= 55 ? 'Fair' : 'Needs work'}
                    </span>
                  </div>
                  <button onClick={() => setAtsOpen(false)} className="text-zinc-400 hover:text-zinc-600 tap-active p-1 rounded-md hover:bg-zinc-50">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Score ring */}
                  <div className="flex flex-col items-center justify-center gap-3">
                    <ScoreRing score={atsResult.score} />
                    <div className="text-center">
                      <p className="text-xs font-bold text-zinc-800">
                        {atsResult.score >= 80 ? 'ATS Optimised' : atsResult.score >= 55 ? 'Partially Optimised' : 'Needs Improvement'}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">for {currentCategory.variants.find(v => v.id === selectedVariant)?.label}</p>
                    </div>
                  </div>

                  {/* Flag breakdown */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Checks</h4>
                    {atsResult.flags.map((flag, i) => (
                      <div key={i} className={`flex items-start space-x-2 p-2.5 rounded-lg text-xs ${flag.severity === 'ok' ? 'bg-emerald-50/50' : 'bg-amber-50/50'}`}>
                        {flag.severity === 'ok'
                          ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                        <div>
                          <p className={`font-semibold ${flag.severity === 'ok' ? 'text-emerald-800' : 'text-amber-800'}`}>{flag.label}</p>
                          <p className={`text-[10px] mt-0.5 leading-relaxed ${flag.severity === 'ok' ? 'text-emerald-700' : 'text-amber-700'}`}>{flag.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">Top suggestions</h4>
                    {atsResult.suggestions.length > 0 ? atsResult.suggestions.map((s, i) => (
                      <div key={i} className="flex items-start space-x-2.5 p-3 bg-accent/5 border border-accent/15 rounded-lg">
                        <span className="flex-shrink-0 h-5 w-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        <p className="text-xs text-zinc-700 leading-relaxed">{s}</p>
                      </div>
                    )) : (
                      <div className="p-4 bg-emerald-50 rounded-lg text-xs text-emerald-700 font-medium">
                        🎉 Your resume is well optimised! No critical improvements needed.
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-400 leading-relaxed pt-1">Scores are rule-based estimates. Real ATS results vary by system and job description.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Paper */}
          <div className="bg-zinc-100/50 p-4 sm:p-8 rounded-xl border border-zinc-200/50 overflow-x-auto no-print">
            <div className={`print-container bg-white border border-zinc-200 rounded-lg text-left max-w-2xl mx-auto shadow-sm min-h-[842px] overflow-hidden ${selectedVariant === 'modern-sidebar' ? 'p-0' : 'p-8 sm:p-12'}`} style={{ aspectRatio: '1/1.414' }}>
              <ResumeRenderer variantId={selectedVariant} resume={resume} allCertifications={allCertifications} />
            </div>
          </div>

          {/* HIDDEN PRINT-ONLY element */}
          <div className="print-only hidden">
            <ResumeRenderer variantId={selectedVariant} resume={resume} allCertifications={allCertifications} forPrint />
          </div>
        </div>
      )}
    </div>
  );
}
