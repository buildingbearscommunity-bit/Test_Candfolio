'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export interface Course {
  id: string;
  name: string;
  slug: string;
  icon: string;
  short_description: string;
  exam_count: number;
  question_count: number;
  avg_duration_mins: number;
  category: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_answer: number; // Index of the correct option
}

export interface Exam {
  id: string;
  course_id: string;
  title: string;
  duration_mins: number;
  pass_threshold: number; // e.g. 80 for 80%
  questions: Question[];
}

export interface Attempt {
  id: string;
  exam_id: string;
  user_id: string;
  score: number; // percentage
  passed: boolean;
  answers: number[]; // indices of selected options
  date: string;
}

export interface Certificate {
  id: string;
  attempt_id: string;
  user_id: string;
  course_id: string;
  verification_code: string;
  issued_at: string;
}

export interface EnrollmentLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  course_id: string;
  course_name: string;
  preferred_start?: string;
  submitted_at: string;
}

export interface InterviewQuestion {
  id: string;
  course_id: string;
  question: string;
  sample_answer: string;
  category: 'Technical' | 'Behavioral';
}

export interface PersonalInfo {
  name: string;
  email: string;
  title: string;
  phone: string;
  website: string;
  summary: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface Resume {
  id: string;
  user_id: string;
  personal_info: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
  certifications: string[]; // Auto-pulled from passed exams + custom
}

// Rich per-course detail data
export interface CourseDetail {
  long_description: string;
  topics: string[];
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  gradient: string; // CSS gradient for the card header
}

export const COURSE_DETAILS: Record<string, CourseDetail> = {
  'ai-gen-ai': {
    long_description: 'Dive deep into the mechanics of modern AI systems — from transformer architectures to prompt engineering, RLHF fine-tuning, and production deployment of LLM-powered applications. Build a solid understanding of how generative models work, how to evaluate them, and how to integrate them responsibly.',
    topics: [
      'Transformer architecture & attention mechanisms',
      'Prompt engineering & few-shot learning',
      'Fine-tuning & RLHF techniques',
      'LLM evaluation & hallucination mitigation',
      'RAG pipelines & vector databases',
      'LLM deployment with APIs & cost management',
      'AI ethics, safety & responsible use'
    ],
    duration: '6 weeks',
    level: 'Intermediate',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)'
  },
  'data-analytics-bi': {
    long_description: 'Transform raw data into strategic insight. This course covers the full analytics workflow — from data collection and cleaning to building executive-grade dashboards that drive real decisions. Ideal for analysts, product managers, and anyone who works with data.',
    topics: [
      'Data collection & ETL fundamentals',
      'SQL for analytical queries',
      'Data cleaning & preparation in Python/Excel',
      'Statistical analysis & hypothesis testing',
      'Dashboard design with Power BI & Tableau',
      'KPI frameworks & storytelling with data',
      'Self-service BI architecture'
    ],
    duration: '5 weeks',
    level: 'Beginner',
    gradient: 'linear-gradient(135deg, #1a3a2a 0%, #0d5c3a 50%, #1a4a2a 100%)'
  },
  'data-science-ml': {
    long_description: 'From exploratory analysis to production-grade machine learning pipelines, this course takes you through the complete data science lifecycle. Learn to build, evaluate, and ship predictive models using Python, scikit-learn, and MLOps best practices.',
    topics: [
      'Exploratory data analysis (EDA)',
      'Feature engineering & selection',
      'Supervised learning: regression, classification',
      'Unsupervised learning: clustering, dimensionality reduction',
      'Model evaluation metrics & cross-validation',
      'Ensemble methods: Random Forest, XGBoost',
      'MLOps: versioning, CI/CD, model monitoring'
    ],
    duration: '8 weeks',
    level: 'Intermediate',
    gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
  },
  'cybersecurity': {
    long_description: 'Prepare for roles in security operations, penetration testing, and incident response. This course follows the CompTIA Security+ and CEH frameworks, covering both offensive and defensive security techniques across networks, endpoints, and cloud environments.',
    topics: [
      'Network security fundamentals & firewalls',
      'Threat modelling & vulnerability assessment',
      'Penetration testing methodology',
      'Identity & access management (IAM)',
      'Cryptography & PKI',
      'Incident response & forensics',
      'Cloud security & compliance (GDPR, ISO 27001)'
    ],
    duration: '7 weeks',
    level: 'Intermediate',
    gradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)'
  },
  'cloud-computing': {
    long_description: 'Master the skills needed to design, deploy, and manage scalable cloud infrastructure on AWS, Azure, and Google Cloud. This course aligns with the AWS Solutions Architect Associate, AZ-900, and GCP Associate Cloud Engineer exams.',
    topics: [
      'Cloud fundamentals & shared responsibility model',
      'AWS core services: EC2, S3, RDS, Lambda',
      'Azure fundamentals & hybrid cloud patterns',
      'Google Cloud infrastructure & BigQuery',
      'Networking: VPCs, subnets, load balancers',
      'High availability, fault tolerance & auto-scaling',
      'Cost optimization & FinOps strategies'
    ],
    duration: '6 weeks',
    level: 'Beginner',
    gradient: 'linear-gradient(135deg, #004e92 0%, #000428 100%)'
  },
  'full-stack-dev': {
    long_description: 'Become a complete web developer by mastering both the front-end and back-end of modern web applications. This comprehensive course covers React, Node.js, databases, REST & GraphQL APIs, authentication, and cloud deployment — preparing you for senior developer roles.',
    topics: [
      'HTML5, CSS3 & responsive design',
      'JavaScript ES2024 & TypeScript fundamentals',
      'React 19 — hooks, context, server components',
      'Node.js & Express REST API development',
      'SQL & NoSQL databases (PostgreSQL, MongoDB)',
      'Authentication: JWT, OAuth 2.0, sessions',
      'Docker, CI/CD & cloud deployment'
    ],
    duration: '10 weeks',
    level: 'Intermediate',
    gradient: 'linear-gradient(135deg, #005c55 0%, #003d38 100%)'
  },
  'mobile-app-dev': {
    long_description: 'Build production-quality mobile apps for iOS and Android using React Native and Flutter. Cover the full mobile development lifecycle from wireframing to App Store submission, including native device APIs, offline storage, and push notifications.',
    topics: [
      'React Native fundamentals & Expo workflow',
      'Flutter & Dart basics',
      'Navigation & deep linking',
      'Native device APIs: camera, GPS, biometrics',
      'Offline storage with SQLite & AsyncStorage',
      'Push notifications & background sync',
      'App Store & Google Play submission'
    ],
    duration: '7 weeks',
    level: 'Intermediate',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
  },
  'devops-platform': {
    long_description: 'Learn the engineering discipline behind reliable, scalable software delivery. From CI/CD pipeline design to Kubernetes orchestration and infrastructure-as-code, this course prepares you for DevOps Engineer and Platform Engineering roles at scale.',
    topics: [
      'Linux fundamentals & shell scripting',
      'Git workflows & branching strategies',
      'CI/CD with GitHub Actions & Jenkins',
      'Docker containerisation & best practices',
      'Kubernetes: pods, deployments, services, Helm',
      'Infrastructure as Code with Terraform',
      'Observability: Prometheus, Grafana, ELK'
    ],
    duration: '8 weeks',
    level: 'Advanced',
    gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
  },
  'digital-marketing': {
    long_description: 'Master the digital channels that drive modern business growth. This course covers SEO, paid advertising, social media strategy, email marketing, and analytics — giving you the tools to plan, execute, and measure high-ROI marketing campaigns.',
    topics: [
      'SEO fundamentals & technical SEO audits',
      'Google Ads & Meta Ads campaign management',
      'Social media strategy & content planning',
      'Email marketing & automation workflows',
      'Conversion rate optimisation (CRO)',
      'Google Analytics 4 & attribution modelling',
      'Influencer marketing & brand partnerships'
    ],
    duration: '5 weeks',
    level: 'Beginner',
    gradient: 'linear-gradient(135deg, #4a0072 0%, #7b1fa2 100%)'
  },
  'product-management': {
    long_description: 'Develop the skills to lead cross-functional product teams and take products from discovery to launch. This course covers the full PM toolkit — user research, product strategy, roadmapping, stakeholder management, and data-informed prioritisation frameworks.',
    topics: [
      'Product discovery & user research methods',
      'Defining product vision & strategy',
      'Roadmapping with OKRs & RICE scoring',
      'Writing user stories & acceptance criteria',
      'Agile & scrum for product teams',
      'Metrics & product analytics (retention, NPS)',
      'Stakeholder management & communication'
    ],
    duration: '6 weeks',
    level: 'Intermediate',
    gradient: 'linear-gradient(135deg, #1a2a1a 0%, #2d4a1e 50%, #1a3a1a 100%)'
  },
  'ai-content-creation': {
    long_description: 'Unlock your creative potential with AI. This course teaches you to integrate cutting-edge generative AI tools — Midjourney, Sora, Claude, ChatGPT — into professional content workflows for copywriting, video production, and visual design at scale.',
    topics: [
      'AI copywriting with ChatGPT & Claude',
      'Image generation with Midjourney & DALL·E',
      'Video production with Sora & Runway',
      'AI-assisted audio & podcast creation',
      'Prompt frameworks for creative briefs',
      'Brand consistency in AI-generated content',
      'Content workflows & editorial automation'
    ],
    duration: '4 weeks',
    level: 'Beginner',
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #c0392b 50%, #8b0000 100%)'
  },
  'power-bi': {
    long_description: 'Become proficient with Microsoft Power BI — the industry-leading business intelligence platform. From connecting data sources to publishing enterprise dashboards, this course covers the complete Power BI workflow including advanced DAX calculations and data modeling.',
    topics: [
      'Power BI Desktop interface & data sources',
      'Power Query (M language) for data transformation',
      'Data modelling: star schema, relationships',
      'DAX fundamentals: calculated columns & measures',
      'Advanced DAX: time intelligence, iterators',
      'Interactive visualisations & drill-through',
      'Power BI Service, workspaces & Row-Level Security'
    ],
    duration: '5 weeks',
    level: 'Beginner',
    gradient: 'linear-gradient(135deg, #1a1a3e 0%, #002050 50%, #0078d4 100%)'
  }
};

// Seed Data
export const COURSES: Course[] = [
  {
    id: 'ai-gen-ai',
    name: 'AI & Generative AI',
    slug: 'ai-gen-ai',
    icon: 'BrainCircuit',
    short_description: 'Understand Large Language Models, prompt engineering, and fine-tuning methodologies.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 15,
    category: 'AI'
  },
  {
    id: 'data-analytics-bi',
    name: 'Data Analytics & Business Intelligence',
    slug: 'data-analytics-bi',
    icon: 'BarChart3',
    short_description: 'Analyze data trends, build interactive dashboards, and drive business decision-making.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 15,
    category: 'Data'
  },
  {
    id: 'data-science-ml',
    name: 'Data Science & Machine Learning',
    slug: 'data-science-ml',
    icon: 'Database',
    short_description: 'Implement predictive models, statistical algorithms, and data prep pipelines.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 20,
    category: 'Data'
  },
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    icon: 'ShieldCheck',
    short_description: 'Secure networks, respond to incidents, and perform penetration testing safely.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 15,
    category: 'Security'
  },
  {
    id: 'cloud-computing',
    name: 'Cloud Computing',
    slug: 'cloud-computing',
    icon: 'Cloud',
    short_description: 'Design highly available, scalable, and secure cloud infrastructure.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 15,
    category: 'Cloud'
  },
  {
    id: 'full-stack-dev',
    name: 'Full Stack Development',
    slug: 'full-stack-dev',
    icon: 'Code',
    short_description: 'Master modern front-end and back-end web technologies, database integrations, and deployment workflows.',
    exam_count: 1,
    question_count: 5,
    avg_duration_mins: 10,
    category: 'Dev'
  },
  {
    id: 'mobile-app-dev',
    name: 'Mobile App Development',
    slug: 'mobile-app-dev',
    icon: 'Smartphone',
    short_description: 'Build native and cross-platform apps for iOS and Android devices.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 15,
    category: 'Dev'
  },
  {
    id: 'devops-platform',
    name: 'DevOps & Platform Engineering',
    slug: 'devops-platform',
    icon: 'Cpu',
    short_description: 'Automate deployments, manage CI/CD pipelines, and configure Kubernetes clusters.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 15,
    category: 'Cloud'
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    icon: 'Megaphone',
    short_description: 'Optimize SEO, run targeted ad campaigns, and analyze social media metrics.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 12,
    category: 'Business'
  },
  {
    id: 'product-management',
    name: 'Product Management',
    slug: 'product-management',
    icon: 'Briefcase',
    short_description: 'Define product strategy, run user research, and manage product roadmaps.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 15,
    category: 'Business'
  },
  {
    id: 'ai-content-creation',
    name: 'AI Content Creation',
    slug: 'ai-content-creation',
    icon: 'Sparkles',
    short_description: 'Leverage generative AI for copywriting, video production, and image design.',
    exam_count: 1,
    question_count: 0,
    avg_duration_mins: 10,
    category: 'AI'
  },
  {
    id: 'power-bi',
    name: 'Power BI',
    slug: 'power-bi',
    icon: 'BarChart3',
    short_description: 'Master Microsoft Power BI to build interactive reports, model complex data, and write advanced DAX queries.',
    exam_count: 0,
    question_count: 0,
    avg_duration_mins: 15,
    category: 'Data'
  }
];



export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'fs-int-1',
    course_id: 'full-stack-dev',
    question: 'Explain the concept of the Event Loop in Node.js.',
    sample_answer: 'Node.js is single-threaded but handles highly concurrent asynchronous operations using an event loop. When asynchronous tasks (like database queries or file operations) are initiated, Node.js offloads them to the system kernel or the Libuv thread pool. Once a task completes, the callback queue registers it. The event loop continuously checks if the main call stack is empty. If it is, the loop pushes the callback onto the stack for execution.',
    category: 'Technical'
  },
  {
    id: 'fs-int-2',
    course_id: 'full-stack-dev',
    question: 'How would you optimize a slow database query in a production environment?',
    sample_answer: 'I would start by logging and identifying the slow query using APM tools or slow query logs. Then, I would analyze its execution plan using EXPLAIN to check if indexes are utilized properly. If not, I would create appropriate indexes. Other strategies include fetching only required fields, optimizing joins, implementation of caching (e.g., Redis) for static/frequent queries, and adding read-replicas or sharding if database load is the bottleneck.',
    category: 'Technical'
  },
  {
    id: 'fs-int-3',
    course_id: 'full-stack-dev',
    question: 'Describe a time you had to deal with a technical disagreement in a development team.',
    sample_answer: 'In my last project, a colleague and I disagreed on whether to use Redux or React Context for state management. Instead of arguing, I proposed we schedule a short discussion and draft a comparison matrix outlining developer velocity, bundle size impact, testing overhead, and learning curve. By examining the facts objectively, we realized React Context fit our small-scale requirements perfectly, avoiding Redux bloat. We documented the decision, and both moved forward productively.',
    category: 'Behavioral'
  },
  {
    id: 'fs-int-4',
    course_id: 'full-stack-dev',
    question: 'What is CORS and how does it protect web application security?',
    sample_answer: 'Cross-Origin Resource Sharing (CORS) is a browser-enforced security mechanism that prevents a web application from making requests to a different domain than the one that served it, unless explicitly allowed by the receiving server. The server specifies CORS headers (like Access-Control-Allow-Origin). If a client page attempts an unauthorized request, the browser blocks the response. This prevents cross-site request forgery and data access exploits.',
    category: 'Technical'
  }
];

// Context Type definition
interface KorsayContextType {
  guestProfile: { name: string; email: string };
  updateProfile: (name: string, email: string) => void;
  attempts: Attempt[];
  addAttempt: (examId: string, score: number, passed: boolean, answers: number[]) => Attempt;
  resumes: Resume[];
  updateResume: (resume: Resume) => void;
  certificates: Certificate[];
  enrollmentLeads: EnrollmentLead[];
  addEnrollmentLead: (lead: Omit<EnrollmentLead, 'id' | 'submitted_at'>) => EnrollmentLead;
  getCourseById: (id: string) => Course | undefined;
  getInterviewQuestionsByCourse: (courseId: string) => InterviewQuestion[];
  getCertificatesByUserId: (userId: string) => Certificate[];
  getAttemptById: (attemptId: string) => Attempt | undefined;
  getCertificateByVerificationCode: (code: string) => Certificate | undefined;
}

const KorsayContext = createContext<KorsayContextType | undefined>(undefined);

export function KorsayProvider({ children }: { children: React.ReactNode }) {
  // Safe initialization states for SSR
  const [guestProfile, setGuestProfile] = useState({ name: 'Guest User', email: 'guest@korsay.com' });
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [enrollmentLeads, setEnrollmentLeads] = useState<EnrollmentLead[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    const localProfile = localStorage.getItem('korsay_guest_profile');
    if (localProfile) {
      try {
        setGuestProfile(JSON.parse(localProfile));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.setItem('korsay_guest_profile', JSON.stringify({ name: 'Guest User', email: 'guest@korsay.com' }));
    }

    const localAttempts = localStorage.getItem('korsay_attempts');
    if (localAttempts) {
      try {
        setAttempts(JSON.parse(localAttempts));
      } catch (e) {
        console.error(e);
      }
    }

    const localResumes = localStorage.getItem('korsay_resumes');
    if (localResumes) {
      try {
        setResumes(JSON.parse(localResumes));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Seed default resume
      const defaultResume: Resume = {
        id: 'resume-default',
        user_id: 'guest-user-id',
        personal_info: {
          name: 'Guest User',
          email: 'guest@korsay.com',
          title: 'Full Stack Engineer',
          phone: '+1 (555) 019-2834',
          website: 'https://github.com/guestuser',
          summary: 'Passionate software developer focused on crafting clean, high-performance web applications using modern javascript frameworks.'
        },
        experience: [
          {
            id: 'exp-1',
            company: 'WebCraft Solutions',
            role: 'Junior Frontend Developer',
            startDate: '2024-01',
            endDate: '2025-06',
            description: 'Collaborated in building responsive UI dashboards using React and Tailwind CSS. Integrated client-side REST APIs.'
          }
        ],
        education: [
          {
            id: 'edu-1',
            school: 'Apex Tech Academy',
            degree: 'Certificate in Software Engineering',
            startDate: '2023-06',
            endDate: '2023-12'
          }
        ],
        skills: ['JavaScript', 'React', 'HTML5/CSS3', 'Tailwind CSS', 'Git'],
        certifications: []
      };
      setResumes([defaultResume]);
      localStorage.setItem('korsay_resumes', JSON.stringify([defaultResume]));
    }

    const localLeads = localStorage.getItem('korsay_enrollment_leads');
    if (localLeads) {
      try {
        setEnrollmentLeads(JSON.parse(localLeads));
      } catch (e) {
        console.error(e);
      }
    }

    setHydrated(true);
  }, []);

  // Update profile
  const updateProfile = (name: string, email: string) => {
    const updated = { name, email };
    setGuestProfile(updated);
    localStorage.setItem('korsay_guest_profile', JSON.stringify(updated));

    // Update resume name/email too if it's default
    if (resumes.length > 0) {
      const updatedResume = {
        ...resumes[0],
        personal_info: {
          ...resumes[0].personal_info,
          name,
          email
        }
      };
      updateResume(updatedResume);
    }
  };

  // Add exam attempt
  const addAttempt = (examId: string, score: number, passed: boolean, answers: number[]) => {
    const newAttempt: Attempt = {
      id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      exam_id: examId,
      user_id: guestProfile.email,
      score,
      passed,
      answers,
      date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    };

    const updatedAttempts = [...attempts, newAttempt];
    setAttempts(updatedAttempts);
    localStorage.setItem('korsay_attempts', JSON.stringify(updatedAttempts));

    return newAttempt;
  };

  // Add enrollment lead
  const addEnrollmentLead = (lead: Omit<EnrollmentLead, 'id' | 'submitted_at'>) => {
    const newLead: EnrollmentLead = {
      ...lead,
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      submitted_at: new Date().toISOString()
    };
    const updatedLeads = [...enrollmentLeads, newLead];
    setEnrollmentLeads(updatedLeads);
    localStorage.setItem('korsay_enrollment_leads', JSON.stringify(updatedLeads));
    return newLead;
  };

  // Update resume
  const updateResume = (updatedResume: Resume) => {
    const updatedResumes = resumes.map(r => r.id === updatedResume.id ? updatedResume : r);
    if (!resumes.some(r => r.id === updatedResume.id)) {
      updatedResumes.push(updatedResume);
    }
    setResumes(updatedResumes);
    localStorage.setItem('korsay_resumes', JSON.stringify(updatedResumes));
  };

  // Derive Certificates dynamically from passed attempts
  const certificates: Certificate[] = attempts
    .filter(att => att.passed)
    .map(att => {
      let courseId = att.exam_id;
      if (courseId === 'fs-exam-1') courseId = 'full-stack-dev';
      else if (courseId.startsWith('exam-')) courseId = courseId.replace('exam-', '');
      // Format verification code: KOR-[Attempt ID truncated]-[Email suffix]
      const code = `KOR-${att.id.split('-')[1]}-${att.user_id.split('@')[0].toUpperCase().slice(0, 4)}`;
      return {
        id: `cert-${att.id}`,
        attempt_id: att.id,
        user_id: att.user_id,
        course_id: courseId,
        verification_code: code,
        issued_at: att.date
      };
    });

  // Helper getters
  const getCourseById = (id: string) => COURSES.find(c => c.id === id || c.slug === id);
  const getInterviewQuestionsByCourse = (courseId: string) => 
    INTERVIEW_QUESTIONS.filter(q => q.course_id === courseId);
  const getCertificatesByUserId = (userId: string) => 
    certificates.filter(c => c.user_id === userId);
  const getAttemptById = (attemptId: string) => 
    attempts.find(a => a.id === attemptId);
  const getCertificateByVerificationCode = (code: string) => 
    certificates.find(c => c.verification_code === code);

  return (
    <KorsayContext.Provider value={{
      guestProfile,
      updateProfile,
      attempts,
      addAttempt,
      resumes,
      updateResume,
      certificates,
      enrollmentLeads,
      addEnrollmentLead,
      getCourseById,
      getInterviewQuestionsByCourse,
      getCertificatesByUserId,
      getAttemptById,
      getCertificateByVerificationCode
    }}>
      {children}
    </KorsayContext.Provider>
  );
}

export function useKorsayStore() {
  const context = useContext(KorsayContext);
  if (!context) {
    throw new Error('useKorsayStore must be used within a KorsayProvider');
  }
  return context;
}
