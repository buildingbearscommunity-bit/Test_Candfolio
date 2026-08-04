'use client';

import React, { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileSearch,
  Filter,
  GraduationCap,
  Heart,
  LayoutDashboard,
  MapPin,
  Rocket,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useKorsayStore } from '@/lib/store';
import { companies, companyFor, Job, jobSections, jobs, matchJob, recommendationScore } from '@/lib/jobs';

const SAVED_KEY = 'candfolio_saved_jobs';
const APPLIED_KEY = 'candfolio_applied_jobs';
const ALERTS_KEY = 'candfolio_job_alerts';

function readList(key: string) {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(key) || '[]') as string[];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export default function JobsPage() {
  const { resumes } = useKorsayStore();
  const resume = resumes[0];
  const resumeSkills = useMemo(() => resume?.skills || [], [resume]);
  const [activeSection, setActiveSection] = useState('All Jobs');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('All Roles');
  const [workMode, setWorkMode] = useState('All Modes');
  const [employmentType, setEmploymentType] = useState('All Types');
  const [experience, setExperience] = useState('All Experience');
  const [salary, setSalary] = useState('Any Salary');
  const [sort, setSort] = useState('Recommended');
  const [saved, setSaved] = useState<string[]>(() => readList(SAVED_KEY));
  const [applied, setApplied] = useState<string[]>(() => readList(APPLIED_KEY));
  const [alerts, setAlerts] = useState<string[]>(() => readList(ALERTS_KEY));
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumeMatchJob, setResumeMatchJob] = useState<Job>(jobs[0]);
  const [toast, setToast] = useState('');
  const [page, setPage] = useState(1);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const filteredJobs = useMemo(() => {
    let next = jobs.filter((job) => matchJob(job, query));
    if (activeSection === 'Freshers') next = next.filter((job) => job.experienceLevel === 'Fresher');
    if (activeSection === 'Experienced') next = next.filter((job) => job.experienceLevel === 'Experienced');
    if (activeSection === 'Internships') next = next.filter((job) => job.employmentType === 'Internship');
    if (activeSection === 'Remote Jobs') next = next.filter((job) => job.workMode === 'Remote');
    if (activeSection === 'Work From Home') next = next.filter((job) => job.workMode === 'Work From Home');
    if (!['All Jobs', 'Freshers', 'Experienced', 'Internships', 'Remote Jobs', 'Work From Home', 'Resume Match', 'Saved Jobs', 'Applied Jobs', 'Job Alerts', 'Career Dashboard', 'Companies', 'Recruiters', 'Career Resources'].includes(activeSection)) {
      next = next.filter((job) => job.category === activeSection || job.title.toLowerCase().includes(activeSection.split(' ')[0].toLowerCase()));
    }
    if (activeSection === 'Saved Jobs') next = next.filter((job) => saved.includes(job.id));
    if (activeSection === 'Applied Jobs') next = next.filter((job) => applied.includes(job.id));
    if (role !== 'All Roles') next = next.filter((job) => job.title.includes(role) || job.category.includes(role));
    if (workMode !== 'All Modes') next = next.filter((job) => job.workMode === workMode);
    if (employmentType !== 'All Types') next = next.filter((job) => job.employmentType === employmentType);
    if (experience !== 'All Experience') next = next.filter((job) => job.experienceLevel === experience);
    if (salary !== 'Any Salary') next = next.filter((job) => job.salaryMax >= Number(salary));
    return next.sort((a, b) => {
      if (sort === 'Salary High to Low') return b.salaryMax - a.salaryMax;
      if (sort === 'Salary Low to High') return a.salaryMin - b.salaryMin;
      if (sort === 'Most Applied') return b.applicants - a.applicants;
      if (sort === 'Latest') return a.postedDate.localeCompare(b.postedDate);
      return recommendationScore(b, resumeSkills) - recommendationScore(a, resumeSkills);
    });
  }, [activeSection, applied, employmentType, experience, query, role, salary, saved, sort, workMode, resumeSkills]);

  const pagedJobs = filteredJobs.slice(0, page * 4);
  const stats = [
    ['Active Jobs', jobs.length],
    ['Hiring Companies', companies.length],
    ['New Jobs Today', jobs.filter((job) => job.postedDate === 'Today').length],
    ['Internship Openings', jobs.filter((job) => job.employmentType === 'Internship').length],
    ['Freshers Hiring', jobs.filter((job) => job.experienceLevel === 'Fresher').length],
    ['Remote Jobs', jobs.filter((job) => job.workMode === 'Remote' || job.workMode === 'Work From Home').length],
    ['Applications Submitted', applied.length],
  ];

  const toggleSaved = (jobId: string) => {
    const next = saved.includes(jobId) ? saved.filter((id) => id !== jobId) : [...saved, jobId];
    setSaved(next);
    writeList(SAVED_KEY, next);
    notify(saved.includes(jobId) ? 'Job removed from saved.' : 'Job saved.');
  };

  const applyJob = (jobId: string) => {
    if (!applied.includes(jobId)) {
      const next = [...applied, jobId];
      setApplied(next);
      writeList(APPLIED_KEY, next);
    }
    notify('Application submitted with your Candfolio profile.');
  };

  const createAlert = (event: FormEvent) => {
    event.preventDefault();
    const next = [...alerts, `${query || 'All jobs'} · ${workMode} · Daily`];
    setAlerts(next);
    writeList(ALERTS_KEY, next);
    notify('Job alert created.');
  };

  const shareJob = async (job: Job) => {
    const url = `${window.location.origin}/jobs/${job.id}`;
    await navigator.clipboard.writeText(url);
    notify('Job link copied.');
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-[32px] border border-accent/10 bg-white/70 p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-8">
        <div className="absolute right-[-6rem] top-[-6rem] h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/10 bg-white/70 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-accent shadow-[var(--shadow-card)]">
              <Sparkles className="h-4 w-4" /> Verified career opportunities
            </div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-zinc-950 sm:text-6xl">Find Your Dream Job Faster</h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-600 sm:text-lg">
              Students and professionals can discover verified opportunities from top companies, match jobs with their resume, and apply with a Candfolio-ready profile.
            </p>
            <div className="mt-7 grid gap-3 rounded-[24px] border border-accent/10 bg-white/65 p-3 shadow-[var(--shadow-card)] md:grid-cols-[1fr_auto_auto]">
              <label className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="w-full rounded-2xl border py-4 pl-12 pr-4 text-sm outline-none" placeholder="Search title, skills, company, location, keywords..." />
              </label>
              <button className="btn-primary"><Search className="mr-2 h-4 w-4" />Search Jobs</button>
              <button className="btn-secondary"><Upload className="mr-2 h-4 w-4" />Upload Resume</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stats.map(([label, value]) => (
              <div key={label as string} className="rounded-2xl border border-accent/10 bg-white/70 p-4 shadow-[var(--shadow-card)]">
                <p className="text-2xl font-black text-accent">{value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {jobSections.map((section) => (
          <button key={section} onClick={() => { setActiveSection(section); setPage(1); }} className={`flex-shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${activeSection === section ? 'border-accent bg-accent text-white shadow-[var(--shadow-button)]' : 'border-accent/10 bg-white/65 text-zinc-600 shadow-[var(--shadow-card)] hover:text-accent'}`}>
            {section}
          </button>
        ))}
      </div>

      {activeSection === 'Resume Match' ? (
        <ResumeMatch resumeSkills={resumeSkills} selectedJob={resumeMatchJob} setSelectedJob={setResumeMatchJob} />
      ) : activeSection === 'Job Alerts' ? (
        <JobAlerts alerts={alerts} createAlert={createAlert} />
      ) : activeSection === 'Career Dashboard' ? (
        <CareerDashboard saved={saved.length} applied={applied.length} resumeScore={resumeSkills.length ? 86 : 54} />
      ) : activeSection === 'Companies' ? (
        <CompaniesPanel />
      ) : activeSection === 'Recruiters' ? (
        <RecruitersPanel />
      ) : activeSection === 'Career Resources' ? (
        <CareerResources />
      ) : (
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="card sticky top-24 h-fit p-5">
            <div className="flex items-center gap-2 text-sm font-black text-zinc-950"><Filter className="h-4 w-4 text-accent" />Advanced Filters</div>
            <div className="mt-5 space-y-4">
              <Select label="Job Role" value={role} setValue={setRole} options={['All Roles', 'Power BI', 'SQL', 'Python', 'Business Analyst', 'Software Developer']} />
              <Select label="Experience" value={experience} setValue={setExperience} options={['All Experience', 'Fresher', 'Experienced', 'Internship']} />
              <Select label="Salary Range" value={salary} setValue={setSalary} options={['Any Salary', '5', '8', '12', '18']} />
              <Select label="Employment Type" value={employmentType} setValue={setEmploymentType} options={['All Types', 'Full-Time', 'Part-Time', 'Internship', 'Contract', 'Freelance']} />
              <Select label="Work Mode" value={workMode} setValue={setWorkMode} options={['All Modes', 'Remote', 'Hybrid', 'Onsite', 'Work From Home']} />
              <Select label="Sort By" value={sort} setValue={setSort} options={['Recommended', 'Latest', 'Relevance', 'Salary High to Low', 'Salary Low to High', 'Most Applied']} />
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-zinc-600">
                {['Easy Apply', 'Verified', 'Featured', 'Urgent', 'Walk-in', 'Remote'].map((item) => <span key={item} className="rounded-xl bg-white/70 px-2 py-2 shadow-[var(--shadow-card)]"><CheckCircle2 className="mr-1 inline h-3 w-3 text-accent" />{item}</span>)}
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black text-zinc-950">{activeSection}</h2>
                <p className="text-sm text-zinc-500">{filteredJobs.length} jobs found · personalized from your resume skills</p>
              </div>
              <button onClick={() => setSelectedJob(pagedJobs[0] || null)} className="btn-secondary hidden sm:inline-flex"><Eye className="mr-2 h-4 w-4" />Quick Preview</button>
            </div>

            {pagedJobs.length === 0 ? <EmptyState title="No jobs found" text="Try a different section, keyword, or filter combination." /> : pagedJobs.map((job) => (
              <JobCard key={job.id} job={job} saved={saved.includes(job.id)} applied={applied.includes(job.id)} resumeSkills={resumeSkills} onSave={toggleSaved} onApply={applyJob} onShare={shareJob} />
            ))}

            {pagedJobs.length < filteredJobs.length && <button onClick={() => setPage(page + 1)} className="btn-secondary w-full">Load more jobs</button>}
          </div>
        </section>
      )}

      <PlatformPanels />
      {selectedJob && <QuickJobDialog job={selectedJob} onClose={() => setSelectedJob(null)} onApply={applyJob} />}
      {toast && <div className="fixed right-4 top-20 z-50 rounded-2xl border border-accent/10 bg-white/90 px-4 py-3 text-sm font-bold text-accent shadow-[var(--shadow-panel)] backdrop-blur">{toast}</div>}
    </div>
  );
}

function JobCard({ job, saved, applied, resumeSkills, onSave, onApply, onShare }: { job: Job; saved: boolean; applied: boolean; resumeSkills: string[]; onSave: (id: string) => void; onApply: (id: string) => void; onShare: (job: Job) => void }) {
  const company = companyFor(job);
  const score = recommendationScore(job, resumeSkills);
  return (
    <article className="card card-hover p-5">
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#872341,#C9A227)] text-xl font-black text-white shadow-[var(--shadow-button)]">{company.name.slice(0, 2).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-zinc-950">{job.title}</h3>
            {company.verified && <Badge><ShieldCheck className="mr-1 h-3 w-3" />Verified</Badge>}
            {job.easyApply && <Badge>Easy Apply</Badge>}
            {job.featured && <Badge>Featured</Badge>}
            {job.urgent && <span className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-1 text-[10px] font-black text-rose-700">Urgent Hiring</span>}
          </div>
          <p className="mt-1 text-sm font-bold text-zinc-600">{company.name} · {company.rating} ★ · {company.industry}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-zinc-500">
            <span><MapPin className="mr-1 inline h-3.5 w-3.5 text-accent" />{job.location}</span>
            <span><Briefcase className="mr-1 inline h-3.5 w-3.5 text-accent" />{job.experience}</span>
            <span><Rocket className="mr-1 inline h-3.5 w-3.5 text-accent" />{job.workMode}</span>
            <span><Users className="mr-1 inline h-3.5 w-3.5 text-accent" />{job.openings} openings</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{job.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">{job.skills.map((skill) => <span key={skill} className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-accent shadow-[var(--shadow-card)]">{skill}</span>)}</div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-500">
            <span>{job.salary}</span>
            <span>{job.employmentType}</span>
            <span>{job.education}</span>
            <span>{job.applicants} applicants</span>
            <span>Deadline {job.deadline}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 md:w-44">
          <div className="rounded-2xl border border-accent/10 bg-white/70 p-3 text-center shadow-[var(--shadow-card)]">
            <p className="text-2xl font-black text-accent">{score}%</p>
            <p className="text-[10px] font-black uppercase tracking-wide text-zinc-500">Job Match</p>
          </div>
          <Link href={`/jobs/${job.id}`} className="btn-secondary justify-center text-xs">View Details</Link>
          <button onClick={() => onApply(job.id)} className="btn-primary text-xs">{applied ? 'Applied' : 'Apply Now'}</button>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onSave(job.id)} className="rounded-xl bg-white p-2 text-accent shadow-[var(--shadow-card)]" aria-label="Save job"><Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} /></button>
            <button onClick={() => onShare(job)} className="rounded-xl bg-white p-2 text-accent shadow-[var(--shadow-card)]" aria-label="Share job"><Share2 className="h-4 w-4" /></button>
            <button className="rounded-xl bg-white p-2 text-accent shadow-[var(--shadow-card)]" aria-label="Report job"><AlertCircle className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ResumeMatch({ resumeSkills, selectedJob, setSelectedJob }: { resumeSkills: string[]; selectedJob: Job; setSelectedJob: (job: Job) => void }) {
  const matching = selectedJob.skills.filter((skill) => resumeSkills.some((item) => item.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(item.toLowerCase())));
  const missing = selectedJob.skills.filter((skill) => !matching.includes(skill));
  const score = recommendationScore(selectedJob, resumeSkills);
  return (
    <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <div className="card p-5">
        <h2 className="text-xl font-black">Resume Match</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">Upload support is ready for future parsing APIs. Today this uses your Resume Builder skills instantly.</p>
        <select value={selectedJob.id} onChange={(event) => setSelectedJob(jobs.find((job) => job.id === event.target.value) || jobs[0])} className="mt-5 w-full rounded-2xl border px-4 py-3 text-sm outline-none">
          {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
        </select>
        <button className="btn-secondary mt-4 w-full"><Upload className="mr-2 h-4 w-4" />Upload Resume</button>
      </div>
      <div className="card p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Resume Match Score" value={`${score}%`} />
          <Metric label="ATS Score" value={`${Math.min(98, score + 6)}%`} />
          <Metric label="Recommended Jobs" value={jobs.filter((job) => recommendationScore(job, resumeSkills) > 70).length} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Insight title="Matching Skills" items={matching.length ? matching : ['Add skills in Resume Builder']} />
          <Insight title="Missing Skills" items={missing} />
          <Insight title="Strong Areas" items={['Profile clarity', 'Learning readiness', 'Role alignment']} />
          <Insight title="Suggestions" items={['Add quantified achievements', 'Attach project links', 'Mention certifications', 'Use role keywords']} />
        </div>
      </div>
    </section>
  );
}

function JobAlerts({ alerts, createAlert }: { alerts: string[]; createAlert: (event: FormEvent) => void }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={createAlert} className="card p-5">
        <h2 className="text-xl font-black">Create Job Alert</h2>
        {['Job Role', 'Skills', 'Location', 'Salary', 'Experience'].map((field) => <input key={field} placeholder={field} className="mt-3 w-full rounded-2xl border px-4 py-3 text-sm outline-none" />)}
        <button className="btn-primary mt-4 w-full"><Bell className="mr-2 h-4 w-4" />Create Alert</button>
      </form>
      <div className="space-y-3">
        {alerts.length === 0 ? <EmptyState title="No alerts yet" text="Create alerts for instant, daily, or weekly job matches." /> : alerts.map((alert) => <div key={alert} className="card p-4 text-sm font-bold text-zinc-700">{alert}</div>)}
      </div>
    </section>
  );
}

function CareerDashboard({ saved, applied, resumeScore }: { saved: number; applied: number; resumeScore: number }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[
        ['Profile Completion', '92%', Target],
        ['Resume Score', `${resumeScore}%`, FileSearch],
        ['ATS Score', '88%', ShieldCheck],
        ['Saved Jobs', saved, Heart],
        ['Applied Jobs', applied, Send],
        ['Upcoming Interviews', 2, CalendarIcon],
        ['Recruiter Messages', 4, Bell],
        ['Skill Gap', 'Power Query', Zap],
        ['Career Progress', 'On track', Rocket],
      ].map(([label, value, Icon]) => <DashboardCard key={label as string} label={label as string} value={value as string | number} icon={Icon as typeof Target} />)}
    </section>
  );
}

function CompaniesPanel() {
  return <section className="grid gap-4 md:grid-cols-2">{companies.map((company) => <div key={company.id} className="card p-5"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white font-black">{company.name.slice(0, 2).toUpperCase()}</div><div><h3 className="text-lg font-black">{company.name}</h3><p className="text-sm text-zinc-500">{company.industry} · {company.size}</p></div></div><p className="mt-4 text-sm leading-6 text-zinc-600">{company.culture}</p><div className="mt-4 flex gap-2"><button className="btn-secondary text-xs">Follow Company</button><button className="btn-secondary text-xs">Share Company</button></div></div>)}</section>;
}

function RecruitersPanel() {
  return <section className="grid gap-4 md:grid-cols-3">{jobs.slice(0, 6).map((job) => <div key={job.id} className="card p-5"><Users className="h-7 w-7 text-accent" /><h3 className="mt-4 font-black">{job.recruiter.name}</h3><p className="text-sm text-zinc-500">{job.recruiter.role}</p><p className="mt-3 text-xs font-semibold text-zinc-500">{job.recruiter.responseTime}</p></div>)}</section>;
}

function CareerResources() {
  const resources = ['Resume Builder', 'Resume Templates', 'Cover Letter Builder', 'Interview Questions', 'Aptitude Tests', 'Coding Challenges', 'Mock Interviews', 'Salary Calculator', 'Career Blogs', 'Career Roadmaps', 'Certification Guides', 'Success Stories'];
  return <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{resources.map((item) => <Link key={item} href={item === 'Resume Builder' ? '/resume' : '#'} className="card card-hover p-5"><GraduationCap className="h-6 w-6 text-accent" /><h3 className="mt-4 font-black">{item}</h3><p className="mt-2 text-sm text-zinc-500">Premium career resource for faster placement readiness.</p></Link>)}</section>;
}

function PlatformPanels() {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="card p-5"><LayoutDashboard className="h-6 w-6 text-accent" /><h3 className="mt-4 text-lg font-black">Admin Dashboard</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Manage jobs, companies, recruiters, applications, analytics, imports, approvals, featured jobs, and SEO metadata.</p></div>
      <div className="card p-5"><Building2 className="h-6 w-6 text-accent" /><h3 className="mt-4 text-lg font-black">Recruiter Posting</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Post jobs with company assets, salary, skills, responsibilities, toggles, preview, draft, publish, and schedule options.</p></div>
      <div className="card p-5"><Sparkles className="h-6 w-6 text-accent" /><h3 className="mt-4 text-lg font-black">AI Career Coach</h3><p className="mt-2 text-sm leading-6 text-zinc-500">Smart recommendations, ATS suggestions, salary predictor, readiness scoring, roadmaps, and learning recommendations.</p></div>
    </section>
  );
}

function Select({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) {
  return <label className="space-y-1.5"><span className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</span><span className="relative block"><select value={value} onChange={(event) => setValue(event.target.value)} className="w-full appearance-none rounded-2xl border px-4 py-3 pr-10 text-sm outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /></span></label>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-accent/10 bg-accent-light px-2.5 py-1 text-[10px] font-black text-accent">{children}</span>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl bg-white/70 p-4 text-center shadow-[var(--shadow-card)]"><p className="text-3xl font-black text-accent">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-wide text-zinc-500">{label}</p></div>;
}

function DashboardCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return <div className="card p-5"><Icon className="h-6 w-6 text-accent" /><p className="mt-5 text-2xl font-black text-zinc-950">{value}</p><p className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</p></div>;
}

function Insight({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="font-black text-zinc-950">{title}</h3><div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-accent shadow-[var(--shadow-card)]">{item}</span>)}</div></div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="card flex min-h-64 flex-col items-center justify-center p-8 text-center"><Briefcase className="h-10 w-10 text-accent" /><h3 className="mt-5 text-lg font-black text-zinc-950">{title}</h3><p className="mt-2 text-sm text-zinc-500">{text}</p></div>;
}

function QuickJobDialog({ job, onClose, onApply }: { job: Job; onClose: () => void; onApply: (id: string) => void }) {
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm"><div className="card max-w-xl p-6"><h2 className="text-2xl font-black">{job.title}</h2><p className="mt-2 text-sm text-zinc-500">{companyFor(job).name}</p><p className="mt-4 text-sm leading-7 text-zinc-600">{job.description}</p><div className="mt-5 flex gap-3"><button onClick={() => onApply(job.id)} className="btn-primary">Apply Now</button><button onClick={onClose} className="btn-secondary">Close</button></div></div></div>;
}

const CalendarIcon = GraduationCap;
