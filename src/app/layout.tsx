import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { KorsayProvider } from '@/lib/store';
import { SheetCoursesProvider } from '@/lib/sheetCourses';
import { SheetExamsProvider } from '@/lib/sheetExams';
import { SheetInterviewsProvider } from '@/lib/sheetInterviews';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Candfolio — Get Certified. Practice Interviews. Build Your Resume.',
  description: 'Premium preparation platform for certification exams, mock interviews, and automated resume building. Get job-ready with Candfolio.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-accent-light selection:text-accent">
        <KorsayProvider>
          <SheetCoursesProvider>
            <SheetExamsProvider>
            <SheetInterviewsProvider>
              {/* Top Navbar (Desktop) & Top Header (Mobile) */}
              <Navbar />
              
              {/* Main content wrapper with mobile bottom spacing */}
              <main className="flex-grow pb-16 sm:pb-8 lg:pb-12 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
                {children}
              </main>
              
              {/* Bottom Tab Bar (Mobile only) */}
              <BottomNav />
            </SheetInterviewsProvider>
          </SheetExamsProvider>
          </SheetCoursesProvider>
        </KorsayProvider>
      </body>
    </html>
  );
}
