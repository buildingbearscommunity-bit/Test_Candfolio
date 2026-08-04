import { BookOpen, Building2, FileCheck, LockKeyhole, LucideIcon, ShieldCheck, Sparkles } from 'lucide-react';

export type SiteInfoPage = {
  badge: string;
  title: string;
  subtitle: string;
  updated: string;
  icon: LucideIcon;
  highlights: Array<{ label: string; value: string }>;
  sections: Array<{
    title: string;
    body: string;
    items?: string[];
  }>;
};

export const siteInfoPages = {
  companyBio: {
    badge: 'About Candfolio',
    title: 'Company Bio',
    subtitle: 'Candfolio helps learners, job seekers, and professionals build career-ready skills with practice tools, verified credentials, and productivity workflows.',
    updated: 'Updated August 4, 2026',
    icon: Building2,
    highlights: [
      { label: 'Focus', value: 'Career readiness' },
      { label: 'Audience', value: 'Students and professionals' },
      { label: 'Products', value: 'Exams, resumes, interviews, tools' },
    ],
    sections: [
      {
        title: 'Who We Are',
        body: 'Candfolio is a modern career development platform designed to bring learning, preparation, documentation, and professional growth into one connected experience. The platform supports users who want to prepare for certification exams, practice interviews, build resumes, publish portfolios, manage productivity, improve speaking confidence, and work with practical document tools.',
      },
      {
        title: 'What We Build',
        body: 'Our product brings together career-focused modules that are useful before, during, and after the job search. Candfolio combines certification preparation, mock interviews, resume building, portfolio generation, productivity tools, SpeakPro practice, PDF utilities, calculators, and document workflows inside a simple interface.',
        items: [
          'Certification exam practice for structured learning and confidence building.',
          'Mock interview workflows for technical and HR preparation.',
          'Resume and portfolio tools that help users present their achievements clearly.',
          'Productivity, speaking, PDF, and calculator tools for everyday professional work.',
        ],
      },
      {
        title: 'Our Mission',
        body: 'Our mission is to make career preparation more accessible, practical, and confidence-building. Candfolio is built around the belief that users need more than content. They need tools that help them practice, create, track progress, and present themselves professionally.',
      },
      {
        title: 'Our Values',
        body: 'Candfolio values clarity, consistency, accessibility, and continuous improvement. We aim to keep the experience useful, calm, and practical, so users can focus on learning and career growth without unnecessary complexity.',
      },
    ],
  },
  privacyPolicy: {
    badge: 'Privacy and Data',
    title: 'Privacy Policy',
    subtitle: 'This page explains how Candfolio handles account information, learning activity, generated content, and local app data.',
    updated: 'Effective August 4, 2026',
    icon: LockKeyhole,
    highlights: [
      { label: 'Data use', value: 'Product experience' },
      { label: 'Control', value: 'User-managed content' },
      { label: 'Security', value: 'Responsible safeguards' },
    ],
    sections: [
      {
        title: 'Information We Collect',
        body: 'Candfolio may collect information that users provide directly, such as profile details, resume content, portfolio details, course activity, interview practice inputs, saved tasks, habits, and documents uploaded for local tools. Some features may also store progress, preferences, and recent activity to make the experience more useful.',
      },
      {
        title: 'How We Use Information',
        body: 'We use information to provide and improve Candfolio features, personalize the user experience, save progress, generate resumes or profiles, support learning workflows, process document tools, and maintain platform reliability.',
        items: [
          'To show saved progress, certificates, resumes, and profile information.',
          'To improve recommendations, usability, performance, and product quality.',
          'To support user-requested workflows such as resume parsing or PDF processing.',
          'To maintain security, prevent misuse, and troubleshoot technical issues.',
        ],
      },
      {
        title: 'Local Storage and Device Data',
        body: 'Some Candfolio features use browser storage to preserve user preferences, custom content, recent activity, and tool state on the same device. Users can clear this data through their browser settings or by using reset options where available.',
      },
      {
        title: 'Sharing and Disclosure',
        body: 'Candfolio does not sell personal information. Information may be shared only when required to operate requested features, comply with legal obligations, protect rights and safety, or work with trusted service providers who support the platform.',
      },
      {
        title: 'User Choices',
        body: 'Users can review, update, delete, or replace content they create inside the app. If a feature depends on uploaded or entered information, users should avoid submitting sensitive data unless it is necessary for that workflow.',
      },
      {
        title: 'Contact',
        body: 'For privacy questions or data-related requests, contact support@candfolio.com. This policy is intended as a clear product-facing privacy summary and should be reviewed by legal counsel before public commercial launch.',
      },
    ],
  },
  termsOfService: {
    badge: 'Terms and Usage',
    title: 'Terms of Service',
    subtitle: 'These terms describe the basic rules for using Candfolio and its learning, career, productivity, and document tools.',
    updated: 'Effective August 4, 2026',
    icon: FileCheck,
    highlights: [
      { label: 'Use', value: 'Career and learning tools' },
      { label: 'Responsibility', value: 'User-owned content' },
      { label: 'Availability', value: 'Evolving platform' },
    ],
    sections: [
      {
        title: 'Acceptance of Terms',
        body: 'By using Candfolio, users agree to use the platform responsibly and follow these terms. Candfolio provides tools for learning, career preparation, document workflows, speaking practice, productivity, and professional presentation.',
      },
      {
        title: 'User Responsibilities',
        body: 'Users are responsible for the information they enter, upload, save, generate, download, or share through Candfolio. Users should make sure their content is accurate, lawful, and appropriate for the intended use.',
        items: [
          'Do not upload or create unlawful, harmful, misleading, or infringing content.',
          'Do not misuse platform features, attempt unauthorized access, or disrupt service reliability.',
          'Review generated resumes, profiles, certificates, calculations, and documents before relying on them.',
        ],
      },
      {
        title: 'Educational and Professional Tools',
        body: 'Candfolio provides preparation and productivity tools, but does not guarantee exam success, job offers, interview outcomes, financial results, legal compliance, or professional certification approval. Users should verify important outputs independently.',
      },
      {
        title: 'Content and Ownership',
        body: 'Users retain ownership of content they create or upload. Candfolio may process that content only to provide requested features, improve usability, preserve user progress, or maintain platform operations.',
      },
      {
        title: 'Service Changes',
        body: 'Candfolio may update, improve, add, remove, or modify features over time. Some tools may depend on browser capabilities, third-party services, or network availability.',
      },
      {
        title: 'Limitation of Liability',
        body: 'Candfolio is provided as a practical support platform. To the maximum extent permitted by law, users are responsible for decisions made using platform outputs. These terms should be reviewed by legal counsel before public commercial launch.',
      },
    ],
  },
} satisfies Record<string, SiteInfoPage>;

export const infoPageCards = [
  { title: 'Company bio', href: '/company-bio', description: 'Learn about Candfolio, our mission, and the tools we build.', icon: Sparkles },
  { title: 'Privacy policy', href: '/privacy-policy', description: 'Understand how user information and app data are handled.', icon: ShieldCheck },
  { title: 'Terms of service', href: '/terms-of-service', description: 'Review the basic terms for using Candfolio responsibly.', icon: BookOpen },
];
