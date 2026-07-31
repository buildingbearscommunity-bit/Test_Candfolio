import type { Metadata } from 'next';
import PortfolioSystem from '@/components/portfolio/PortfolioSystem';

export const metadata: Metadata = {
  title: 'Professional Portfolio | Candfolio',
  description: 'A premium shareable professional portfolio generated from the Candfolio Resume Builder.',
  openGraph: {
    title: 'Professional Portfolio | Candfolio',
    description: 'A premium shareable professional portfolio generated from the Candfolio Resume Builder.',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Professional Portfolio | Candfolio',
    description: 'A premium shareable professional portfolio generated from the Candfolio Resume Builder.',
  },
};

export default function PortfolioPage() {
  return <PortfolioSystem />;
}
