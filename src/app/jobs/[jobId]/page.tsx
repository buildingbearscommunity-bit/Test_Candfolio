import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Award, Briefcase, Building2, CheckCircle2, Globe, MapPin, Send, ShieldCheck, Star, Users } from 'lucide-react';
import { companyFor, jobs } from '@/lib/jobs';

export const metadata: Metadata = {
  title: 'Job Details | Candfolio Jobs',
  description: 'Premium job details, company profile, hiring process, and application information on Candfolio Jobs.',
  openGraph: {
    title: 'Job Details | Candfolio Jobs',
    description: 'Premium job details and application workflow.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Details | Candfolio Jobs',
    description: 'Premium job details and application workflow.',
  },
};

export default async function JobDetailsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = jobs.find((item) => item.id === jobId) || jobs[0];
  const company = companyFor(job);
  const similar = jobs.filter((item) => item.id !== job.id && item.skills.some((skill) => job.skills.includes(skill))).slice(0, 3);

  return (
    <div className="space-y-6 pb-10">
      <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-accent"><ArrowLeft className="h-4 w-4" />Back to jobs</Link>
      <section className="relative overflow-hidden rounded-[32px] border border-accent/10 bg-white/70 p-6 shadow-[var(--shadow-panel)] sm:p-8">
        <div className="h-44 rounded-[28px] bg-[linear-gradient(135deg,#872341,#C9A227)] shadow-[var(--shadow-inset)]" />
        <div className="relative -mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white text-2xl font-black text-accent shadow-[var(--shadow-card)]">{company.name.slice(0, 2).toUpperCase()}</div>
            <div className="pt-12">
              <h1 className="text-3xl font-black text-zinc-950 sm:text-5xl">{job.title}</h1>
              <p className="mt-2 text-sm font-bold text-zinc-600">{company.name} · {company.industry} · {company.rating} ★</p>
            </div>
          </div>
          <aside className="card p-4 sm:w-72">
            <p className="text-2xl font-black text-accent">{job.salary}</p>
            <p className="mt-1 text-xs font-bold text-zinc-500">{job.experience} · {job.employmentType}</p>
            <button className="btn-primary mt-4 w-full"><Send className="mr-2 h-4 w-4" />Apply Now</button>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title="Job Description" icon={Briefcase}><p>{job.description}</p></Panel>
          <Panel title="Roles and Responsibilities" icon={CheckCircle2}><List items={job.responsibilities} /></Panel>
          <Panel title="Required and Preferred Skills" icon={Award}><div className="flex flex-wrap gap-2">{[...job.skills, ...job.preferredSkills].map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></Panel>
          <Panel title="Salary, Benefits and Work Schedule" icon={Star}><List items={[job.salary, ...job.benefits, `${job.workMode} · Standard business hours`, 'Clear career growth path and review cycles']} /></Panel>
          <Panel title="Hiring Process and Interview Rounds" icon={Users}><List items={job.hiringProcess} /></Panel>
          <Panel title="FAQs and Similar Jobs" icon={ShieldCheck}>
            <List items={['Is this role verified? Yes, this company is verified on Candfolio.', 'Can I one-click apply? Easy Apply jobs can use your Candfolio profile.', 'What should I prepare? Review the required skills and update your Resume Builder.']} />
            <div className="mt-5 grid gap-3 md:grid-cols-3">{similar.map((item) => <Link key={item.id} href={`/jobs/${item.id}`} className="rounded-2xl bg-white/70 p-4 text-sm font-bold text-accent shadow-[var(--shadow-card)]">{item.title}</Link>)}</div>
          </Panel>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <Panel title="Company Profile" icon={Building2}>
            <p className="font-black text-zinc-950">{company.name}</p>
            <p className="mt-2 text-sm text-zinc-600">{company.culture}</p>
            <div className="mt-4 space-y-2 text-sm font-semibold text-zinc-500">
              <p><MapPin className="mr-2 inline h-4 w-4 text-accent" />{company.location}</p>
              <p><Users className="mr-2 inline h-4 w-4 text-accent" />{company.size}</p>
              <p><Globe className="mr-2 inline h-4 w-4 text-accent" />{company.website}</p>
            </div>
          </Panel>
          <Panel title="Recruiter" icon={Users}>
            <p className="font-black text-zinc-950">{job.recruiter.name}</p>
            <p className="text-sm text-zinc-500">{job.recruiter.role}</p>
            <p className="mt-3 text-xs font-bold text-accent">{job.recruiter.responseTime}</p>
          </Panel>
          <Panel title="Company Reviews" icon={Star}>
            <List items={['Work-Life Balance: 4.5/5', 'Salary: 4.3/5', 'Management: 4.4/5', 'Career Growth: 4.6/5', 'Culture: 4.7/5']} />
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return <section className="card p-5 sm:p-6"><div className="mb-4 flex items-center gap-3"><Icon className="h-5 w-5 text-accent" /><h2 className="text-xl font-black text-zinc-950">{title}</h2></div><div className="text-sm leading-7 text-zinc-600">{children}</div></section>;
}

function List({ items }: { items: string[] }) {
  return <ul className="space-y-2">{items.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent" />{item}</li>)}</ul>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold text-accent shadow-[var(--shadow-card)]">{children}</span>;
}
