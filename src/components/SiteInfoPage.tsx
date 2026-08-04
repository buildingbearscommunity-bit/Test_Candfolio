import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { infoPageCards, SiteInfoPage as SiteInfoPageContent } from '@/lib/siteInfoPages';

export default function SiteInfoPage({ page }: { page: SiteInfoPageContent }) {
  const Icon = page.icon;

  return (
    <div className="space-y-8 py-4 sm:py-8">
      <section className="hero-accent overflow-hidden rounded-[28px] border border-accent/10 bg-white/62 p-6 shadow-[var(--shadow-panel)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="badge badge-accent gap-2">
              <Icon className="h-3.5 w-3.5" />
              {page.badge}
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
              {page.subtitle}
            </p>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-accent/65">
              {page.updated}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {page.highlights.map((highlight) => (
              <div key={highlight.label} className="card p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-accent/55">{highlight.label}</p>
                <p className="mt-2 text-lg font-black text-zinc-900">{highlight.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {page.sections.map((section, index) => (
            <article key={section.title} className="card p-6 sm:p-7">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-accent text-sm font-black text-white shadow-[var(--shadow-button)]">
                  {index + 1}
                </span>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-zinc-950">{section.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-zinc-600">{section.body}</p>
                </div>
              </div>

              {section.items && (
                <ul className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex gap-3 rounded-2xl border border-accent/10 bg-white/55 p-3 text-sm leading-6 text-zinc-650">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-accent/65">Related pages</h2>
            <div className="mt-4 space-y-2">
              {infoPageCards.map((card) => {
                const CardIcon = card.icon;
                return (
                  <Link
                    key={card.href}
                    href={card.href}
                    className="group flex items-start gap-3 rounded-2xl border border-accent/10 bg-white/55 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-accent hover:shadow-[var(--shadow-card)]"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent-light text-accent">
                      <CardIcon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-zinc-850 group-hover:text-accent">{card.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-500">{card.description}</span>
                    </span>
                    <ArrowRight className="ml-auto mt-2 h-4 w-4 flex-shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-[22px] border border-accent/10 bg-accent p-5 text-white shadow-[var(--shadow-button)]">
            <p className="text-sm font-black">Need help?</p>
            <p className="mt-2 text-xs leading-6 text-white/78">For questions about Candfolio, privacy, or account-related requests, contact support@candfolio.com.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}
