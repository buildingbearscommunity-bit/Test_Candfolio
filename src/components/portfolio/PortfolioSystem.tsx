'use client';

import React, { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUp,
  Award,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  Copy,
  Code2,
  Download,
  Eye,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Lock,
  Mail,
  Moon,
  Phone,
  QrCode,
  Rocket,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  Trophy,
  User,
  Zap,
} from 'lucide-react';
import { Certificate, Resume, useKorsayStore } from '@/lib/store';

type PrivacyMode = 'Public' | 'Private' | 'Recruiter Only' | 'Password Protected';

type PortfolioSettings = {
  slug: string;
  status: string;
  location: string;
  preferredRole: string;
  preferredLocation: string;
  noticePeriod: string;
  expectedSalary: string;
  currentCompany: string;
  availability: string;
  privacy: PrivacyMode;
  hiddenSections: string[];
  darkMode: boolean;
  recruiterMode: boolean;
  views: number;
  downloads: number;
  shares: number;
  qrScans: number;
  contactRequests: number;
  lastUpdated: string;
};

const SETTINGS_KEY = 'candfolio_portfolio_settings';
const defaultSections = [
  'summary',
  'stats',
  'skills',
  'experience',
  'projects',
  'education',
  'certifications',
  'achievements',
  'timeline',
  'gallery',
  'testimonials',
  'insights',
  'analytics',
  'contact',
];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'guest-user';
}

function readSettings(name: string): PortfolioSettings {
  if (typeof window === 'undefined') return makeDefaultSettings(name);
  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) return makeDefaultSettings(name);
  try {
    return { ...makeDefaultSettings(name), ...JSON.parse(raw) };
  } catch {
    return makeDefaultSettings(name);
  }
}

function makeDefaultSettings(name: string): PortfolioSettings {
  return {
    slug: slugify(name),
    status: 'Open to Work',
    location: 'Remote',
    preferredRole: 'Full Stack Engineer',
    preferredLocation: 'Remote / Hybrid',
    noticePeriod: 'Immediate',
    expectedSalary: '',
    currentCompany: 'Independent',
    availability: 'Immediate Joiner',
    privacy: 'Public',
    hiddenSections: [],
    darkMode: false,
    recruiterMode: false,
    views: 128,
    downloads: 14,
    shares: 9,
    qrScans: 6,
    contactRequests: 3,
    lastUpdated: 'Today',
  };
}

function saveSettings(settings: PortfolioSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function activeResume(resumes: Resume[], fallbackName: string, fallbackEmail: string): Resume {
  return resumes[0] || {
    id: 'portfolio-empty',
    user_id: fallbackEmail,
    personal_info: {
      name: fallbackName,
      email: fallbackEmail,
      title: 'Professional Candidate',
      phone: '',
      website: '',
      summary: 'Update your Resume Builder to automatically publish a complete professional portfolio.',
    },
    experience: [],
    education: [],
    skills: [],
    certifications: [],
  };
}

function completionScore(resume: Resume, certificates: Certificate[], settings: PortfolioSettings) {
  const checks = [
    resume.personal_info.name,
    resume.personal_info.email,
    resume.personal_info.title,
    resume.personal_info.phone,
    resume.personal_info.website,
    resume.personal_info.summary,
    resume.experience.length > 0,
    resume.education.length > 0,
    resume.skills.length > 0,
    certificates.length > 0 || resume.certifications.length > 0,
    settings.location,
    settings.preferredRole,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function yearsExperience(resume: Resume) {
  if (resume.experience.length === 0) return 0;
  return Math.max(1, resume.experience.length * 2);
}

function categorizeSkill(skill: string) {
  const lower = skill.toLowerCase();
  if (/(python|java|c\+\+|javascript|typescript|react|node|html|css)/.test(lower)) return 'Programming';
  if (/(sql|excel|power bi|tableau|dax|pandas|analytics|data)/.test(lower)) return 'Data Analytics';
  if (/(aws|azure|cloud|gcp|google cloud)/.test(lower)) return 'Cloud';
  if (/(chatgpt|copilot|claude|gemini|ai|ml|llm)/.test(lower)) return 'AI Tools';
  if (/(git|github|docker|vscode|figma|postman)/.test(lower)) return 'Development Tools';
  return 'Core Skills';
}

function visible(settings: PortfolioSettings, section: string) {
  return !settings.hiddenSections.includes(section) && (!settings.recruiterMode || ['summary', 'stats', 'skills', 'experience', 'education', 'certifications', 'insights', 'contact'].includes(section));
}

export default function PortfolioSystem({ publicSlug }: { publicSlug?: string }) {
  const { guestProfile, resumes, certificates, getCourseById } = useKorsayStore();
  const resume = activeResume(resumes, guestProfile.name, guestProfile.email);
  const [settings, setSettings] = useState<PortfolioSettings>(() => readSettings(resume.personal_info.name));
  const [toast, setToast] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const publicUrl = typeof window === 'undefined' ? `/u/${settings.slug}` : `${window.location.origin}/u/${settings.slug}`;
  const profileCompletion = completionScore(resume, certificates, settings);
  const expYears = yearsExperience(resume);
  const isPublicView = Boolean(publicSlug);
  const slugMismatch = isPublicView && publicSlug !== settings.slug;
  const isLocked = isPublicView && settings.privacy !== 'Public' && settings.privacy !== 'Recruiter Only';

  const groupedSkills = useMemo(() => {
    return resume.skills.reduce<Record<string, string[]>>((groups, skill) => {
      const group = categorizeSkill(skill);
      groups[group] = [...(groups[group] || []), skill];
      return groups;
    }, {});
  }, [resume.skills]);

  const missingItems: string[] = [
    ['Photo', true],
    ['Projects', resume.experience.length === 0],
    ['Experience', resume.experience.length === 0],
    ['Certificates', certificates.length === 0 && resume.certifications.length === 0],
    ['LinkedIn', !resume.personal_info.website?.includes('linkedin')],
    ['GitHub', !resume.personal_info.website?.includes('github')],
    ['Portfolio', !resume.personal_info.website],
    ['Recommendations', true],
  ].filter(([, missing]) => Boolean(missing)).map(([label]) => String(label));

  const updateSettings = (patch: Partial<PortfolioSettings>) => {
    const next = { ...settings, ...patch, lastUpdated: 'Today' };
    setSettings(next);
    saveSettings(next);
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    updateSettings({ shares: settings.shares + 1 });
    notify('Profile link copied.');
  };

  const shareProfile = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${resume.personal_info.name} Portfolio`, text: resume.personal_info.summary, url: publicUrl });
    } else {
      await navigator.clipboard.writeText(publicUrl);
    }
    updateSettings({ shares: settings.shares + 1 });
    notify('Profile shared.');
  };

  const printPortfolio = () => {
    window.print();
    updateSettings({ downloads: settings.downloads + 1 });
  };

  const sendContact = (event: FormEvent) => {
    event.preventDefault();
    setContactSent(true);
    updateSettings({ contactRequests: settings.contactRequests + 1 });
    notify('Contact request saved locally.');
  };

  const themeClass = settings.darkMode ? 'bg-zinc-950 text-white' : 'text-zinc-950';

  if (slugMismatch) {
    return <LockedState title="Profile not found" text="This public profile URL does not match the current saved portfolio slug on this device." />;
  }

  if (isLocked) {
    return <LockedState title="Private portfolio" text="This portfolio is not publicly visible. Change privacy settings from the Portfolio page to share it." />;
  }

  return (
    <div className={`relative -mx-4 -my-6 overflow-hidden px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 ${themeClass}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: resume.personal_info.name,
            jobTitle: resume.personal_info.title,
            email: resume.personal_info.email,
            url: publicUrl,
            knowsAbout: resume.skills,
            alumniOf: resume.education.map((item) => item.school),
          }),
        }}
      />

      <div className="pointer-events-none absolute left-[-8rem] top-0 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8rem] top-72 h-96 w-96 rounded-full bg-[#C9A227]/20 blur-3xl" />

      <PortfolioNav settings={settings} updateSettings={updateSettings} isPublicView={isPublicView} />

      {!isPublicView && <SettingsPanel settings={settings} updateSettings={updateSettings} publicUrl={publicUrl} />}

      <section id="top" className="relative mt-6 grid gap-6 rounded-[32px] border border-accent/10 bg-white/70 p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/10 bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-accent shadow-[var(--shadow-card)]">
            <ShieldCheck className="h-4 w-4" />
            Verified Candfolio profile
          </div>
          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={resume.personal_info.name} />
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{resume.personal_info.name}</h1>
              <p className="mt-3 text-xl font-bold text-accent">{resume.personal_info.title}</p>
              <p className="mt-2 text-sm text-zinc-500">{settings.currentCompany} · {settings.status} · {settings.location}</p>
            </div>
          </div>
          <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
            {resume.personal_info.summary || `${resume.personal_info.name} is a ${resume.personal_info.title} focused on measurable business outcomes, clean delivery, and continuous learning.`}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={printPortfolio} className="btn-primary"><Download className="mr-2 h-4 w-4" />Download Resume</button>
            <a href={`mailto:${resume.personal_info.email}`} className="btn-secondary"><Mail className="mr-2 h-4 w-4" />Hire Me</a>
            <button onClick={shareProfile} className="btn-secondary"><Share2 className="mr-2 h-4 w-4" />Share Profile</button>
            <button onClick={copyLink} className="btn-secondary"><Copy className="mr-2 h-4 w-4" />Copy Link</button>
            {resume.personal_info.website && <a href={resume.personal_info.website} target="_blank" rel="noreferrer" className="btn-secondary"><Code2 className="mr-2 h-4 w-4" />Website</a>}
          </div>
        </div>

        <div className="space-y-4">
          <RecruiterSnapshot resume={resume} settings={settings} certificates={certificates} completion={profileCompletion} expYears={expYears} />
          <QrPanel publicUrl={publicUrl} />
        </div>
      </section>

      {visible(settings, 'summary') && (
        <Section id="summary" title="Professional Summary" icon={User}>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <p className="text-lg leading-9 text-zinc-650">{resume.personal_info.summary}</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Mini label="Preferred Role" value={settings.preferredRole} />
                <Mini label="Availability" value={settings.availability} />
                <Mini label="Notice Period" value={settings.noticePeriod} />
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-black">Why hire me</h3>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-600">
                <li>Delivers practical, recruiter-ready outcomes from verified resume data.</li>
                <li>Combines {resume.skills.slice(0, 3).join(', ') || 'technical'} strengths with clear communication.</li>
                <li>Maintains a {profileCompletion}% complete professional profile with live credentials.</li>
              </ul>
            </Card>
          </div>
        </Section>
      )}

      {visible(settings, 'stats') && (
        <Section id="stats" title="Quick Stats" icon={BarChart3}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Projects Completed', Math.max(2, resume.experience.length + 2), Rocket],
              ['Certifications', certificates.length + resume.certifications.length, Award],
              ['Years Experience', expYears, Briefcase],
              ['Skills', resume.skills.length, Zap],
              ['Resume Score', `${Math.min(98, profileCompletion + 4)}%`, Target],
              ['Profile Completion', `${profileCompletion}%`, CheckCircle2],
              ['Portfolio Views', settings.views, Eye],
              ['Resume Downloads', settings.downloads, Download],
            ].map(([label, value, Icon]) => <Stat key={label as string} label={label as string} value={value as string | number} icon={Icon as typeof Rocket} />)}
          </div>
        </Section>
      )}

      {visible(settings, 'skills') && (
        <Section id="skills" title="Skills Radar" icon={Sparkles}>
          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            <Card><SkillRadar skills={resume.skills} /></Card>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(groupedSkills).map(([group, skills]) => (
                <Card key={group}>
                  <h3 className="text-lg font-black">{group}</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span key={skill} className="rounded-full border border-accent/10 bg-white/70 px-3 py-1.5 text-xs font-bold text-accent shadow-[var(--shadow-card)]">
                        {skill} · {90 - (index % 4) * 8}% <ShieldCheck className="ml-1 inline h-3 w-3" />
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Section>
      )}

      {visible(settings, 'experience') && (
        <Section id="experience" title="Experience Timeline" icon={Briefcase}>
          <div className="space-y-4">
            {resume.experience.length === 0 ? <Empty text="Add experience in Resume Builder to populate this timeline." /> : resume.experience.map((item) => (
              <TimelineCard key={item.id} eyebrow={`${item.startDate} - ${item.endDate || 'Present'}`} title={item.role} subtitle={item.company} body={item.description} />
            ))}
          </div>
        </Section>
      )}

      {visible(settings, 'projects') && (
        <Section id="projects" title="Featured Projects" icon={Rocket}>
          <div className="grid gap-4 md:grid-cols-3">
            {resume.experience.slice(0, 3).concat(resume.experience.length ? [] : [{ id: 'sample', company: 'Candfolio', role: 'Portfolio Project', startDate: '', endDate: '', description: 'A polished portfolio generated automatically from the Resume Builder.' }]).map((item, index) => (
              <Card key={item.id}>
                <div className="h-32 rounded-3xl bg-[linear-gradient(135deg,#872341,#C9A227)] shadow-[var(--shadow-inset)]" />
                <h3 className="mt-5 text-lg font-black">{item.role}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">{resume.skills.slice(index, index + 4).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {visible(settings, 'education') && (
        <Section id="education" title="Education" icon={GraduationCap}>
          <div className="grid gap-4 md:grid-cols-2">
            {resume.education.length === 0 ? <Empty text="Education cards sync from Resume Builder." /> : resume.education.map((item) => (
              <Card key={item.id}>
                <p className="text-xs font-black uppercase tracking-wide text-accent">{item.startDate} - {item.endDate}</p>
                <h3 className="mt-3 text-xl font-black">{item.degree}</h3>
                <p className="mt-2 text-sm text-zinc-600">{item.school}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {visible(settings, 'certifications') && (
        <Section id="certifications" title="Certifications" icon={Award}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {certificates.length === 0 && resume.certifications.length === 0 ? <Empty text="Pass Candfolio exams or add credentials to your resume." /> : certificates.map((cert) => {
              const course = getCourseById(cert.course_id);
              return (
                <Card key={cert.id}>
                  <ShieldCheck className="h-8 w-8 text-accent" />
                  <h3 className="mt-4 text-lg font-black">{course?.name || cert.course_id}</h3>
                  <p className="mt-2 text-xs font-semibold text-zinc-500">Issued {cert.issued_at}</p>
                  <code className="mt-3 block rounded-xl bg-white/70 px-3 py-2 text-xs text-accent">{cert.verification_code}</code>
                  <Link href={`/certificate/${cert.verification_code}`} className="btn-secondary mt-4 text-xs">Verify credential</Link>
                </Card>
              );
            })}
          </div>
        </Section>
      )}

      {visible(settings, 'achievements') && (
        <Section id="achievements" title="Achievements" icon={Trophy}>
          <div className="grid gap-4 md:grid-cols-4">
            {['Hackathons', 'Leadership', 'Open Source', 'Scholarships'].map((item) => <Card key={item}><Trophy className="h-7 w-7 text-[#C9A227]" /><h3 className="mt-4 font-black">{item}</h3><p className="mt-2 text-sm text-zinc-500">Ready to sync from future resume achievements.</p></Card>)}
          </div>
        </Section>
      )}

      {visible(settings, 'timeline') && (
        <Section id="timeline" title="Career Timeline" icon={Calendar}>
          <div className="grid gap-3 md:grid-cols-7">
            {['School', 'College', 'Internship', 'Projects', 'Certifications', 'Experience', 'Future Goal'].map((item, index) => (
              <div key={item} className="rounded-3xl border border-accent/10 bg-white/70 p-4 text-center shadow-[var(--shadow-card)]">
                <p className="text-2xl font-black text-accent">{index + 1}</p>
                <p className="mt-2 text-xs font-bold text-zinc-600">{item}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {visible(settings, 'gallery') && (
        <Section id="gallery" title="Portfolio Gallery" icon={LayoutDashboard}>
          <div className="grid gap-4 md:grid-cols-3">
            {['Dashboards', 'Reports', 'Case Studies', 'Presentations', 'Certificates', 'Repositories'].map((item) => <Card key={item}><div className="h-24 rounded-3xl bg-white/70 shadow-[var(--shadow-inset)]" /><h3 className="mt-4 font-black">{item}</h3></Card>)}
          </div>
        </Section>
      )}

      {visible(settings, 'testimonials') && (
        <Section id="testimonials" title="Testimonials" icon={HeartHandshake}>
          <div className="grid gap-4 md:grid-cols-3">
            {['Mentor', 'Manager', 'Client'].map((item) => <Card key={item}><div className="flex gap-1 text-[#C9A227]">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div><p className="mt-4 text-sm leading-6 text-zinc-600">A reliable professional with strong ownership and thoughtful communication.</p><p className="mt-4 text-xs font-black text-accent">{item}</p></Card>)}
          </div>
        </Section>
      )}

      {visible(settings, 'insights') && (
        <Section id="insights" title="AI Insights" icon={Sparkles}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card><h3 className="font-black">Recommended Roles</h3><p className="mt-3 text-sm leading-6 text-zinc-600">{settings.preferredRole}, Frontend Engineer, Product Engineer</p></Card>
            <Card><h3 className="font-black">Industry Match</h3><p className="mt-3 text-4xl font-black text-accent">{Math.min(96, profileCompletion + 8)}%</p></Card>
            <Card><h3 className="font-black">ATS Suggestions</h3><p className="mt-3 text-sm leading-6 text-zinc-600">Add project links, quantified impact, and role-specific keywords for better recruiter scanning.</p></Card>
          </div>
        </Section>
      )}

      <Section id="completion" title="Profile Completion" icon={CheckCircle2}>
        <Card>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <ProgressCircle value={profileCompletion} />
            <div className="flex-1">
              <h3 className="text-xl font-black">Missing items</h3>
              <div className="mt-4 flex flex-wrap gap-2">{missingItems.map((item) => <Badge key={item}>{item}</Badge>)}</div>
            </div>
          </div>
        </Card>
      </Section>

      {visible(settings, 'analytics') && (
        <Section id="analytics" title="Analytics" icon={Eye}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {[
              ['Views', settings.views],
              ['Downloads', settings.downloads],
              ['Shares', settings.shares],
              ['QR Scans', settings.qrScans],
              ['Contacts', settings.contactRequests],
              ['Updated', settings.lastUpdated],
            ].map(([label, value]) => <Mini key={label as string} label={label as string} value={value as string | number} />)}
          </div>
        </Section>
      )}

      {visible(settings, 'contact') && (
        <Section id="contact" title="Contact" icon={Send}>
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <Info icon={Mail} label="Email" value={resume.personal_info.email} />
              <Info icon={Phone} label="Phone" value={resume.personal_info.phone || 'Add phone in Resume Builder'} />
              <Info icon={ExternalLink} label="LinkedIn / Website" value={resume.personal_info.website || 'Add portfolio link'} />
            </Card>
            <Card>
              <form onSubmit={sendContact} className="space-y-3">
                <input required placeholder="Your name" className="w-full rounded-2xl border px-4 py-3 text-sm outline-none" />
                <input required type="email" placeholder="Email" className="w-full rounded-2xl border px-4 py-3 text-sm outline-none" />
                <textarea required rows={4} placeholder="Message" className="w-full rounded-2xl border px-4 py-3 text-sm outline-none" />
                <button className="btn-primary" type="submit">{contactSent ? 'Request Saved' : 'Send Message'}</button>
              </form>
            </Card>
          </div>
        </Section>
      )}

      <div className="fixed bottom-20 right-4 z-40 flex flex-col gap-2 no-print">
        <button onClick={printPortfolio} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-[var(--shadow-button)]" aria-label="Download resume"><Download className="h-5 w-5" /></button>
        <button onClick={shareProfile} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-accent shadow-[var(--shadow-card)]" aria-label="Share"><Share2 className="h-5 w-5" /></button>
        <button onClick={() => updateSettings({ darkMode: !settings.darkMode })} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-accent shadow-[var(--shadow-card)]" aria-label="Toggle dark mode">{settings.darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
        <a href="#top" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-accent shadow-[var(--shadow-card)]" aria-label="Scroll to top"><ArrowUp className="h-5 w-5" /></a>
      </div>

      {toast && <div className="fixed right-4 top-20 z-50 rounded-2xl border border-accent/10 bg-white/90 px-4 py-3 text-sm font-bold text-accent shadow-[var(--shadow-panel)] backdrop-blur">{toast}</div>}
    </div>
  );
}

function PortfolioNav({ settings, updateSettings, isPublicView }: { settings: PortfolioSettings; updateSettings: (patch: Partial<PortfolioSettings>) => void; isPublicView: boolean }) {
  return (
    <nav className="sticky top-20 z-30 mx-auto flex max-w-5xl items-center justify-between rounded-full border border-accent/10 bg-white/70 px-4 py-2 shadow-[var(--shadow-card)] backdrop-blur-xl no-print">
      <div className="flex items-center gap-2 text-sm font-black text-accent"><Sparkles className="h-4 w-4" />Portfolio</div>
      <div className="hidden gap-3 text-xs font-bold text-zinc-500 sm:flex">
        {['summary', 'skills', 'experience', 'certifications', 'contact'].map((item) => <a key={item} href={`#${item}`} className="hover:text-accent">{item}</a>)}
      </div>
      {!isPublicView && <button onClick={() => updateSettings({ recruiterMode: !settings.recruiterMode })} className="rounded-full bg-accent-light px-3 py-1.5 text-xs font-black text-accent">Recruiter Mode</button>}
    </nav>
  );
}

function SettingsPanel({ settings, updateSettings, publicUrl }: { settings: PortfolioSettings; updateSettings: (patch: Partial<PortfolioSettings>) => void; publicUrl: string }) {
  const [draftSlug, setDraftSlug] = useState(settings.slug);
  return (
    <section className="mt-6 rounded-[28px] border border-accent/10 bg-white/65 p-5 shadow-[var(--shadow-card)] no-print">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">Custom public URL</span>
          <input value={draftSlug} onChange={(event) => setDraftSlug(slugify(event.target.value))} className="w-full rounded-2xl border px-4 py-3 text-sm outline-none" />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-zinc-500">Privacy</span>
          <select value={settings.privacy} onChange={(event) => updateSettings({ privacy: event.target.value as PrivacyMode })} className="w-full rounded-2xl border px-4 py-3 text-sm outline-none">
            {['Public', 'Private', 'Recruiter Only', 'Password Protected'].map((mode) => <option key={mode}>{mode}</option>)}
          </select>
        </label>
        <button onClick={() => updateSettings({ slug: draftSlug })} className="btn-primary self-end">Save URL</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
        <span className="break-all">{publicUrl}</span>
        <Link href={`/u/${settings.slug}`} className="text-accent hover:underline">Open public page</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {defaultSections.map((section) => (
          <button key={section} onClick={() => updateSettings({ hiddenSections: settings.hiddenSections.includes(section) ? settings.hiddenSections.filter((item) => item !== section) : [...settings.hiddenSections, section] })} className={`rounded-full px-3 py-1.5 text-xs font-bold ${settings.hiddenSections.includes(section) ? 'bg-zinc-200 text-zinc-500' : 'bg-accent-light text-accent'}`}>
            {section}
          </button>
        ))}
      </div>
    </section>
  );
}

function RecruiterSnapshot({ resume, settings, certificates, completion, expYears }: { resume: Resume; settings: PortfolioSettings; certificates: Certificate[]; completion: number; expYears: number }) {
  const topSkills = resume.skills.slice(0, 6);
  return (
    <Card>
      <h2 className="text-lg font-black">Recruiter Snapshot</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Mini label="ATS Score" value={`${Math.min(98, completion + 4)}%`} />
        <Mini label="Completion" value={`${completion}%`} />
        <Mini label="Experience" value={`${expYears} yrs`} />
        <Mini label="Education" value={resume.education[0]?.degree || 'Add education'} />
        <Mini label="Status" value={settings.status} />
        <Mini label="Notice" value={settings.noticePeriod} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{topSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div>
      <p className="mt-4 text-xs font-semibold text-zinc-500">{certificates.length} verified certifications · {settings.preferredRole} · {settings.preferredLocation}</p>
    </Card>
  );
}

function QrPanel({ publicUrl }: { publicUrl: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <QrCode className="h-5 w-5 text-accent" />
        <h2 className="font-black">Share QR</h2>
      </div>
      <Image
        alt="Portfolio QR code"
        className="mx-auto mt-4 h-40 w-40 rounded-3xl bg-white p-3 shadow-[var(--shadow-inset)]"
        src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}`}
        width={160}
        height={160}
        unoptimized
      />
    </Card>
  );
}

function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section id={id} className="relative mt-8 scroll-mt-32">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-white shadow-[var(--shadow-button)]"><Icon className="h-5 w-5" /></span>
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card p-5 sm:p-6">{children}</div>;
}

function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return <Card><Icon className="h-6 w-6 text-accent" /><p className="mt-5 text-3xl font-black">{value}</p><p className="mt-1 text-xs font-black uppercase tracking-wide text-zinc-500">{label}</p></Card>;
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-accent/10 bg-white/60 p-3 shadow-[var(--shadow-card)]"><p className="text-sm font-black text-accent">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-wide text-zinc-500">{label}</p></div>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-accent/10 bg-white/70 px-3 py-1.5 text-xs font-bold text-accent shadow-[var(--shadow-card)]">{children}</span>;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[32px] bg-[linear-gradient(135deg,#872341,#C9A227)] text-4xl font-black text-white shadow-[var(--shadow-button)]">{initials}</div>;
}

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return <div className="mb-4 flex gap-3"><Icon className="h-5 w-5 text-accent" /><div><p className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-1 text-sm font-semibold text-zinc-700">{value}</p></div></div>;
}

function Empty({ text }: { text: string }) {
  return <Card><p className="text-sm font-semibold text-zinc-500">{text}</p></Card>;
}

function TimelineCard({ eyebrow, title, subtitle, body }: { eyebrow: string; title: string; subtitle: string; body: string }) {
  return (
    <div className="relative border-l-2 border-accent/20 pl-6">
      <span className="absolute -left-[9px] top-5 h-4 w-4 rounded-full bg-accent shadow-[var(--shadow-button)]" />
      <Card>
        <p className="text-xs font-black uppercase tracking-wide text-accent">{eyebrow}</p>
        <h3 className="mt-2 text-xl font-black">{title}</h3>
        <p className="mt-1 text-sm font-bold text-zinc-500">{subtitle}</p>
        <p className="mt-4 text-sm leading-7 text-zinc-600">{body}</p>
      </Card>
    </div>
  );
}

function SkillRadar({ skills }: { skills: string[] }) {
  const points = skills.slice(0, 6).map((_, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(6, skills.slice(0, 6).length) - Math.PI / 2;
    const radius = 72 - (index % 3) * 9;
    return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`;
  }).join(' ');
  return (
    <div>
      <svg viewBox="0 0 200 200" className="mx-auto h-72 w-72">
        {[35, 60, 85].map((radius) => <circle key={radius} cx="100" cy="100" r={radius} fill="none" stroke="rgba(135,35,65,0.13)" />)}
        <polygon points={points || '100,28 162,68 150,145 50,145 38,68'} fill="rgba(135,35,65,0.18)" stroke="#872341" strokeWidth="3" />
        <circle cx="100" cy="100" r="5" fill="#C9A227" />
      </svg>
      <p className="text-center text-xs font-bold text-zinc-500">Dynamic radar based on top resume skills</p>
    </div>
  );
}

function ProgressCircle({ value }: { value: number }) {
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r="48" fill="none" stroke="#eadfd8" strokeWidth="12" />
        <circle cx="60" cy="60" r="48" fill="none" stroke="#872341" strokeDasharray={`${(value / 100) * 302} 302`} strokeLinecap="round" strokeWidth="12" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-accent">{value}%</span>
    </div>
  );
}

function LockedState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card max-w-md p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-5 text-2xl font-black text-zinc-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{text}</p>
        <Link href="/portfolio" className="btn-primary mt-6">Back to Portfolio</Link>
      </div>
    </div>
  );
}
