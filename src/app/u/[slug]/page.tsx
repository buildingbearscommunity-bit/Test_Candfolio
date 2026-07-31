import type { Metadata } from 'next';
import PortfolioSystem from '@/components/portfolio/PortfolioSystem';

export const metadata: Metadata = {
  title: 'Public Professional Profile | Candfolio',
  description: 'A recruiter-ready public professional profile powered by Candfolio Resume Builder data.',
  openGraph: {
    title: 'Public Professional Profile | Candfolio',
    description: 'A recruiter-ready public professional profile powered by Candfolio Resume Builder data.',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Public Professional Profile | Candfolio',
    description: 'A recruiter-ready public professional profile powered by Candfolio Resume Builder data.',
  },
};

export default async function PublicPortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PortfolioSystem publicSlug={slug} />;
}
