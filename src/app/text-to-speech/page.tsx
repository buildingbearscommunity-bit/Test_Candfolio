import Link from 'next/link';
import { ArrowLeft, Bell, Mic2, Sparkles, Volume2 } from 'lucide-react';

export default function TextToSpeechComingSoonPage() {
  return (
    <main className="min-h-screen bg-[#F0EDE5] text-[#872341]">
      <section className="relative isolate flex min-h-screen items-center overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute left-[-140px] top-[-140px] h-96 w-96 rounded-full bg-[#872341]/10 blur-3xl" />
        <div className="absolute bottom-[-160px] right-[-140px] h-[28rem] w-[28rem] rounded-full bg-[#C9A227]/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#872341]/20 to-transparent" />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#872341]/10 bg-white/50 px-4 py-2 text-sm font-semibold text-[#872341] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/70"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#872341]/10 bg-white/45 px-4 py-2 text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Coming soon
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Text to Speech is coming soon
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#872341]/72 sm:text-lg">
              We are preparing a polished document-to-voice workspace for Candfolio, including upload support, text extraction, voice controls, and clean playback tools.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="btn-primary gap-2">
                Explore Candfolio
              </Link>
              <Link href="/certifications" className="btn-secondary gap-2">
                Browse Certifications
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#872341]/10 bg-white/50 p-5 shadow-2xl shadow-[#872341]/10 backdrop-blur-xl">
            <div className="overflow-hidden rounded-[24px] bg-[#872341] p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white/65">Speech workspace</p>
                  <h2 className="mt-1 text-2xl font-bold">In production</h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EDE5] text-[#872341]">
                  <Volume2 className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  ['Document upload', 'PDF, DOCX, TXT, and image workflows'],
                  ['Voice controls', 'Male and female narration profiles'],
                  ['Playback tools', 'Script preview, progress, and timing'],
                ].map(([title, detail], index) => (
                  <div key={title} className="flex items-center gap-4 rounded-2xl border border-white/15 bg-[#F0EDE5]/10 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C9A227] text-[#872341]">
                      {index === 0 ? <Mic2 className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-white/65">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
