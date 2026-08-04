'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Boxes,
  Cloud,
  Crop,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Files,
  Image,
  Layers3,
  LockKeyhole,
  PenLine,
  Printer,
  ScanLine,
  Search,
  Signature,
  Sparkles,
  Stamp,
  TextCursorInput,
  Upload,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { PdfTool, PdfToolCategory, PdfToolIcon, pdfToolCategories, popularPdfTools } from '@/lib/pdfTools';

const iconMap: Record<PdfToolIcon, React.ComponentType<{ className?: string }>> = {
  badge: BadgeCheck,
  book: BookOpen,
  cloud: Cloud,
  compress: Zap,
  convert: Boxes,
  crop: Crop,
  download: Download,
  edit: PenLine,
  eye: Eye,
  file: FileText,
  files: Files,
  form: FileCheck2,
  image: Image,
  layers: Layers3,
  lock: LockKeyhole,
  pen: PenLine,
  printer: Printer,
  scan: ScanLine,
  search: Search,
  signature: Signature,
  sparkles: Sparkles,
  stamp: Stamp,
  text: TextCursorInput,
  upload: Upload,
  wand: WandSparkles,
};

function PdfIcon({ name, className }: { name: PdfToolIcon; className?: string }) {
  const Icon = iconMap[name];
  return <Icon className={className} />;
}

export default function PdfToolsPage() {
  const [query, setQuery] = useState('');
  const searchTerm = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return pdfToolCategories;
    return pdfToolCategories
      .map((category) => ({
        ...category,
        tools: category.tools.filter((tool) =>
          `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(searchTerm)
        ),
      }))
      .filter((category) => category.tools.length > 0);
  }, [searchTerm]);

  const filteredToolCount = filteredCategories.reduce((count, category) => count + category.tools.length, 0);

  return (
    <main className="min-h-screen bg-[#F0EDE5] text-[#872341]">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-140px] top-[-140px] h-96 w-96 rounded-full bg-[#872341]/10 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[-120px] h-[28rem] w-[28rem] rounded-full bg-[#872341]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#872341]/10 bg-[#F0EDE5]/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              PDF Tools
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              All-in-One PDF Toolkit
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#872341]/75 sm:text-lg">
              Organize, Edit, Convert, Compress, Sign, OCR and manage your PDF documents in one place.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => document.getElementById('all-pdf-tools')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center rounded-2xl bg-[#872341] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#872341]/15 transition hover:-translate-y-0.5 hover:bg-[#872341]/90"
              >
                Explore Tools
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              <Link
                href="/pdf-tools/merge-pdf"
                className="inline-flex items-center justify-center rounded-2xl border border-[#872341]/20 bg-[#F0EDE5]/80 px-6 py-3 text-sm font-semibold text-[#872341] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#872341]/10"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload PDF
              </Link>
            </div>
          </div>

          <div className="relative rounded-[28px] border border-[#872341]/10 bg-[#F0EDE5]/65 p-4 shadow-2xl shadow-[#872341]/10 backdrop-blur-xl">
            <div className="rounded-[24px] bg-[#872341] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/65">Document command center</p>
                  <h2 className="mt-1 text-2xl font-bold">100+ PDF workflows</h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EDE5] text-[#872341]">
                  <FileText className="h-7 w-7" />
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {['Convert files', 'Organize pages', 'Compress PDFs', 'Sign documents'].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/15 bg-[#F0EDE5]/10 p-4">
                    <BadgeCheck className="mb-3 h-5 w-5" />
                    <p className="text-sm font-semibold">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-white/15 bg-[#F0EDE5]/10 p-4 text-sm leading-6 text-white/80">
                Premium document tools are connected to upload, preview, processing and download workflows.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-[#872341]/10 bg-[#F0EDE5]/80 p-3 shadow-xl shadow-[#872341]/5 backdrop-blur">
          <label className="relative block">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#872341]/45" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search PDF tools instantly..."
              className="w-full rounded-[20px] border border-[#872341]/10 bg-[#F0EDE5] py-4 pl-14 pr-5 text-sm font-medium text-[#872341] outline-none transition placeholder:text-[#872341]/45 focus:border-[#872341] focus:bg-[#872341]/10"
            />
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Popular" title="Popular Tools" description="Start with the most requested PDF actions." />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularPdfTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} featured />
          ))}
        </div>
      </section>

      <section id="all-pdf-tools" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Browse"
          title={searchTerm ? `${filteredToolCount} matching tools` : 'Explore by Category'}
          description="Expandable sections keep the toolkit easy to scan as it grows."
        />
        <div className="mt-6 grid gap-5">
          {filteredCategories.map((category, index) => (
            <CategorySection key={category.id} category={category} defaultOpen={index < 3 || Boolean(searchTerm)} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-[24px] border border-[#872341]/10 bg-[#872341] p-6 text-white shadow-xl shadow-[#872341]/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Recently Used</p>
            <h2 className="mt-2 text-2xl font-bold">No recent files yet</h2>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Your recent PDF actions will appear here once processing tools are connected.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard icon="lock" title="Private by design" description="Built to support secure document workflows when processing is added." />
            <FeatureCard icon="cloud" title="Cloud-ready structure" description="Routes and cards are ready for storage integrations." />
            <FeatureCard icon="wand" title="Scalable toolkit" description="Tool data is centralized so new actions can be added quickly." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-[#872341]/10 bg-[#872341] p-8 text-white shadow-2xl shadow-[#872341]/15 sm:p-10">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Workspace Ready</p>
              <h2 className="mt-2 text-3xl font-extrabold">Process documents from one clean toolkit</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                Each tool opens a dedicated workflow with upload, validation, preview, processing status, download and reset controls.
              </p>
            </div>
            <button
              onClick={() => document.getElementById('all-pdf-tools')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center rounded-2xl bg-[#F0EDE5] px-6 py-3 text-sm font-semibold text-[#872341] transition hover:-translate-y-0.5 hover:bg-[#F0EDE5]/90"
            >
              View All Tools
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#872341]/60">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-extrabold text-[#872341]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-[#872341]/70">{description}</p>
    </div>
  );
}

function CategorySection({ category, defaultOpen }: { category: PdfToolCategory; defaultOpen: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-[24px] border border-[#872341]/10 bg-[#F0EDE5]/80 p-4 shadow-xl shadow-[#872341]/5 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#872341]/10">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[20px] p-2">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#872341] text-white">
            <PdfIcon name={category.icon} className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold text-[#872341]">{category.title}</span>
            <span className="mt-1 block text-sm text-[#872341]/65">{category.description}</span>
          </span>
        </div>
        <span className="rounded-full border border-[#872341]/10 px-3 py-1 text-xs font-semibold text-[#872341]/70">
          {category.tools.length} tools
        </span>
      </summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {category.tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </details>
  );
}

function ToolCard({ tool, featured = false }: { tool: PdfTool; featured?: boolean }) {
  const cardTone = featured
    ? 'border-[#872341] bg-[#872341] text-white'
    : 'border-[#872341]/10 bg-[#F0EDE5] text-[#872341]';

  return (
    <Link
      href={`/pdf-tools/${tool.slug}`}
      className={`group relative overflow-hidden rounded-[22px] border p-5 shadow-lg shadow-[#872341]/5 transition duration-200 hover:-translate-y-1 hover:border-[#872341]/25 hover:shadow-2xl hover:shadow-[#872341]/10 active:scale-[0.98] ${cardTone}`}
    >
      <span className="pointer-events-none absolute inset-0 scale-0 rounded-full bg-current/10 opacity-0 transition duration-300 group-active:scale-100 group-active:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${featured ? 'bg-[#F0EDE5] text-[#872341]' : 'bg-[#C9A227] text-[#872341]'}`}>
          <PdfIcon name={tool.icon} className="h-5 w-5" />
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${featured ? 'border-white/20 text-white/75' : 'border-[#872341]/10 text-[#872341]/55'}`}>
          Ready
        </span>
      </div>
      <h3 className="mt-5 text-base font-bold">{tool.name}</h3>
      <p className={`mt-2 min-h-10 text-sm leading-6 ${featured ? 'text-white/75' : 'text-[#872341]/65'}`}>
        {tool.description}
      </p>
      <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
        Open tool
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function FeatureCard({ icon, title, description }: { icon: PdfToolIcon; title: string; description: string }) {
  return (
    <div className="rounded-[24px] border border-[#872341]/10 bg-[#F0EDE5]/80 p-6 shadow-xl shadow-[#872341]/5 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#872341]/10">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#872341] text-white">
        <PdfIcon name={icon} className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-lg font-bold text-[#872341]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#872341]/65">{description}</p>
    </div>
  );
}
