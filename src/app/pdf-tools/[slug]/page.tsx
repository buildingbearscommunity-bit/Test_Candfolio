import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import PdfToolRunner from '@/components/pdf-tools/PdfToolRunner';
import { getPdfToolBySlug, pdfTools } from '@/lib/pdfTools';

export function generateStaticParams() {
  return pdfTools.map((tool) => ({ slug: tool.slug }));
}

export default async function PdfToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getPdfToolBySlug(slug);

  if (!tool) {
    return (
      <main className="min-h-screen bg-[#F0EDE5] px-4 py-12 text-[#872341] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/pdf-tools" className="inline-flex items-center gap-2 rounded-2xl border border-[#872341]/10 px-4 py-2 text-sm font-semibold transition hover:bg-[#872341]/10">
            <ArrowLeft className="h-4 w-4" />
            Back to PDF Tools
          </Link>
          <section className="mt-8 rounded-[28px] border border-[#872341]/10 bg-[#F0EDE5]/80 p-8 shadow-2xl shadow-[#872341]/10">
            <h1 className="text-3xl font-extrabold">Tool not found</h1>
            <p className="mt-3 text-sm leading-7 text-[#872341]/70">Choose another PDF tool from the toolkit.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F0EDE5] px-4 py-12 text-[#872341] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/pdf-tools" className="inline-flex items-center gap-2 rounded-2xl border border-[#872341]/10 px-4 py-2 text-sm font-semibold transition hover:bg-[#872341]/10">
          <ArrowLeft className="h-4 w-4" />
          Back to PDF Tools
        </Link>

        <section className="mt-8 rounded-[28px] border border-[#872341]/10 bg-[#872341] p-8 text-white shadow-2xl shadow-[#872341]/10 sm:p-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0EDE5] text-[#872341]">
            <FileText className="h-8 w-8" />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-white/60">{tool.category}</p>
          <h1 className="mt-2 text-4xl font-extrabold">{tool.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/75">{tool.description}</p>
        </section>

        <section className="mt-8">
          <PdfToolRunner tool={tool} />
        </section>
      </div>
    </main>
  );
}
