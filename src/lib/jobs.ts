export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Internship' | 'Contract' | 'Freelance';
export type WorkMode = 'Remote' | 'Hybrid' | 'Onsite' | 'Work From Home';
export type ExperienceLevel = 'Fresher' | 'Experienced' | 'Internship';
export type ApplicationStatus = 'Applied' | 'Recruiter Viewed' | 'Under Review' | 'Shortlisted' | 'Assessment Assigned' | 'Interview Scheduled' | 'Interview Completed' | 'Offer Released' | 'Selected' | 'Rejected' | 'Withdrawn';

export interface JobCompany {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  rating: number;
  location: string;
  verified: boolean;
  culture: string;
}

export interface Job {
  id: string;
  title: string;
  companyId: string;
  salary: string;
  salaryMin: number;
  salaryMax: number;
  experience: string;
  experienceLevel: ExperienceLevel;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  openings: number;
  skills: string[];
  education: string;
  description: string;
  postedDate: string;
  deadline: string;
  applicants: number;
  easyApply: boolean;
  featured: boolean;
  urgent: boolean;
  category: string;
  department: string;
  benefits: string[];
  responsibilities: string[];
  preferredSkills: string[];
  hiringProcess: string[];
  recruiter: {
    name: string;
    role: string;
    responseTime: string;
  };
}

export interface JobApplication {
  id: string;
  jobId: string;
  appliedAt: string;
  status: ApplicationStatus;
  candidate: string;
}

export interface JobAlert {
  id: string;
  role: string;
  skills: string;
  location: string;
  frequency: 'Instant' | 'Daily' | 'Weekly';
  channels: string[];
}

export const companies: JobCompany[] = [
  {
    id: 'lumora',
    name: 'Lumora Analytics',
    industry: 'Data Analytics',
    size: '501-1000 employees',
    website: 'https://example.com/lumora',
    rating: 4.7,
    location: 'Bengaluru',
    verified: true,
    culture: 'High ownership analytics teams with mentorship, learning budgets, and flexible work.',
  },
  {
    id: 'novanet',
    name: 'NovaNet Systems',
    industry: 'Information Technology',
    size: '1001-5000 employees',
    website: 'https://example.com/novanet',
    rating: 4.5,
    location: 'Hyderabad',
    verified: true,
    culture: 'Enterprise engineering culture with structured growth paths and certification support.',
  },
  {
    id: 'finora',
    name: 'Finora Labs',
    industry: 'FinTech',
    size: '201-500 employees',
    website: 'https://example.com/finora',
    rating: 4.4,
    location: 'Mumbai',
    verified: true,
    culture: 'Fast-moving product squads, strong peer reviews, and practical AI adoption.',
  },
  {
    id: 'govbridge',
    name: 'GovBridge Digital',
    industry: 'Government Technology',
    size: '5000+ employees',
    website: 'https://example.com/govbridge',
    rating: 4.1,
    location: 'Delhi NCR',
    verified: true,
    culture: 'Public-sector digital transformation work with stable benefits and long-term programs.',
  },
];

export const jobs: Job[] = [
  {
    id: 'power-bi-developer-lumora',
    title: 'Power BI Developer',
    companyId: 'lumora',
    salary: '₹6 - 12 LPA',
    salaryMin: 6,
    salaryMax: 12,
    experience: '0-3 years',
    experienceLevel: 'Fresher',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    employmentType: 'Full-Time',
    openings: 8,
    skills: ['Power BI', 'SQL', 'DAX', 'Excel', 'Data Modeling'],
    education: 'Any Graduate / B.Tech / BCA',
    description: 'Build executive dashboards, automate reporting workflows, and convert business questions into measurable insights.',
    postedDate: 'Today',
    deadline: '2026-08-30',
    applicants: 134,
    easyApply: true,
    featured: true,
    urgent: true,
    category: 'Power BI Jobs',
    department: 'Business Intelligence',
    benefits: ['Hybrid work', 'Learning budget', 'Health insurance', 'Certification reimbursement'],
    responsibilities: ['Create Power BI dashboards', 'Optimize SQL datasets', 'Partner with business teams', 'Document report logic'],
    preferredSkills: ['Power Query', 'Azure SQL', 'Stakeholder communication'],
    hiringProcess: ['Resume screening', 'Dashboard assignment', 'Technical interview', 'HR discussion'],
    recruiter: { name: 'Ananya Rao', role: 'Talent Partner', responseTime: 'Usually responds in 1 day' },
  },
  {
    id: 'python-ai-engineer-finora',
    title: 'Python AI Engineer',
    companyId: 'finora',
    salary: '₹10 - 22 LPA',
    salaryMin: 10,
    salaryMax: 22,
    experience: '2-6 years',
    experienceLevel: 'Experienced',
    location: 'Remote',
    workMode: 'Remote',
    employmentType: 'Full-Time',
    openings: 4,
    skills: ['Python', 'Machine Learning', 'APIs', 'Pandas', 'LLM'],
    education: 'B.Tech / MCA / Equivalent',
    description: 'Ship AI-powered internal tools, data automation services, and production-grade model integrations.',
    postedDate: '1 day ago',
    deadline: '2026-09-05',
    applicants: 287,
    easyApply: true,
    featured: true,
    urgent: false,
    category: 'AI & Machine Learning Jobs',
    department: 'AI Platform',
    benefits: ['Remote-first', 'MacBook provided', 'ESOPs', 'Wellness allowance'],
    responsibilities: ['Build Python services', 'Integrate AI APIs', 'Analyze model quality', 'Own deployment pipelines'],
    preferredSkills: ['FastAPI', 'Vector databases', 'Docker'],
    hiringProcess: ['Coding round', 'System design', 'AI case study', 'Leadership round'],
    recruiter: { name: 'Rohan Mehta', role: 'AI Hiring Lead', responseTime: 'Usually responds in 2 days' },
  },
  {
    id: 'sql-data-analyst-novanet',
    title: 'SQL Data Analyst',
    companyId: 'novanet',
    salary: '₹4.5 - 9 LPA',
    salaryMin: 4.5,
    salaryMax: 9,
    experience: '0-2 years',
    experienceLevel: 'Fresher',
    location: 'Hyderabad',
    workMode: 'Onsite',
    employmentType: 'Full-Time',
    openings: 12,
    skills: ['SQL', 'Excel', 'Power BI', 'ETL', 'Analytics'],
    education: 'Any Graduate',
    description: 'Support data quality, reporting, and ad-hoc analysis for enterprise operations teams.',
    postedDate: '2 days ago',
    deadline: '2026-08-24',
    applicants: 94,
    easyApply: true,
    featured: false,
    urgent: true,
    category: 'SQL Jobs',
    department: 'Data Operations',
    benefits: ['Cab facility', 'Training program', 'Certification tracks', 'Performance bonus'],
    responsibilities: ['Write SQL queries', 'Validate reporting data', 'Prepare Excel dashboards', 'Coordinate with operations'],
    preferredSkills: ['Power Query', 'Stored procedures', 'MIS reporting'],
    hiringProcess: ['Aptitude test', 'SQL test', 'Manager interview', 'HR round'],
    recruiter: { name: 'Maya Iyer', role: 'Campus Hiring Manager', responseTime: 'Usually responds same day' },
  },
  {
    id: 'software-developer-intern-novanet',
    title: 'Software Developer Intern',
    companyId: 'novanet',
    salary: '₹25k - 45k / month',
    salaryMin: 3,
    salaryMax: 5.4,
    experience: 'Students / Freshers',
    experienceLevel: 'Internship',
    location: 'Chennai',
    workMode: 'Hybrid',
    employmentType: 'Internship',
    openings: 20,
    skills: ['JavaScript', 'React', 'Git', 'APIs', 'Testing'],
    education: 'Final-year students / Recent graduates',
    description: 'Join product teams to build UI features, test APIs, and learn production engineering practices.',
    postedDate: 'Today',
    deadline: '2026-08-18',
    applicants: 412,
    easyApply: true,
    featured: true,
    urgent: false,
    category: 'Internships',
    department: 'Engineering',
    benefits: ['Mentorship', 'Pre-placement offer track', 'Flexible hours', 'Certificate'],
    responsibilities: ['Build React components', 'Write tests', 'Fix bugs', 'Document pull requests'],
    preferredSkills: ['TypeScript', 'Tailwind CSS', 'Node.js'],
    hiringProcess: ['Portfolio review', 'Coding task', 'Team interview'],
    recruiter: { name: 'Ishaan Kapoor', role: 'University Recruiter', responseTime: 'Usually responds in 3 days' },
  },
  {
    id: 'business-analyst-govbridge',
    title: 'Business Analyst - Government Projects',
    companyId: 'govbridge',
    salary: '₹7 - 14 LPA',
    salaryMin: 7,
    salaryMax: 14,
    experience: '3-7 years',
    experienceLevel: 'Experienced',
    location: 'Delhi NCR',
    workMode: 'Onsite',
    employmentType: 'Contract',
    openings: 6,
    skills: ['Business Analysis', 'Excel', 'SQL', 'Documentation', 'Stakeholder Management'],
    education: 'Graduate / MBA preferred',
    description: 'Lead requirements discovery and delivery coordination for public-sector digital programs.',
    postedDate: '3 days ago',
    deadline: '2026-09-01',
    applicants: 73,
    easyApply: false,
    featured: false,
    urgent: true,
    category: 'Government Jobs',
    department: 'Program Delivery',
    benefits: ['Government exposure', 'Stable contract', 'Travel allowance', 'Leadership visibility'],
    responsibilities: ['Gather requirements', 'Write BRDs', 'Run UAT', 'Track implementation risks'],
    preferredSkills: ['Process mapping', 'Power BI', 'Public sector projects'],
    hiringProcess: ['Profile review', 'Domain interview', 'Client discussion', 'Documentation test'],
    recruiter: { name: 'Neha Suri', role: 'Program Hiring Consultant', responseTime: 'Usually responds in 2 days' },
  },
  {
    id: 'excel-mis-executive-finora',
    title: 'Excel MIS Executive',
    companyId: 'finora',
    salary: '₹3 - 5.5 LPA',
    salaryMin: 3,
    salaryMax: 5.5,
    experience: '0-2 years',
    experienceLevel: 'Fresher',
    location: 'Pune',
    workMode: 'Work From Home',
    employmentType: 'Full-Time',
    openings: 10,
    skills: ['Excel', 'VLOOKUP', 'Pivot Tables', 'Reporting', 'Power Query'],
    education: 'Any Graduate',
    description: 'Prepare daily operational MIS, automate recurring reports, and improve Excel-based business tracking.',
    postedDate: '4 days ago',
    deadline: '2026-08-28',
    applicants: 156,
    easyApply: true,
    featured: false,
    urgent: false,
    category: 'Excel Jobs',
    department: 'Operations Analytics',
    benefits: ['Work from home', 'Evening shift allowance', 'Upskilling plan', 'Performance bonus'],
    responsibilities: ['Create MIS reports', 'Automate Excel workflows', 'Track KPIs', 'Support operations leaders'],
    preferredSkills: ['Power Query', 'Macros', 'SQL basics'],
    hiringProcess: ['Excel test', 'Operations interview', 'HR round'],
    recruiter: { name: 'Arjun Shah', role: 'Operations Recruiter', responseTime: 'Usually responds same day' },
  },
];

export const jobSections = [
  'All Jobs',
  'Freshers',
  'Experienced',
  'Internships',
  'Remote Jobs',
  'Work From Home',
  'Government Jobs',
  'Walk-in Drives',
  'IT Jobs',
  'Non-IT Jobs',
  'Data Analytics Jobs',
  'Power BI Jobs',
  'SQL Jobs',
  'Python Jobs',
  'Excel Jobs',
  'AI & Machine Learning Jobs',
  'Business Analyst Jobs',
  'Software Developer Jobs',
  'Testing Jobs',
  'Resume Match',
  'Saved Jobs',
  'Applied Jobs',
  'Job Alerts',
  'Career Dashboard',
  'Companies',
  'Recruiters',
  'Career Resources',
];

export function companyFor(job: Job) {
  return companies.find((company) => company.id === job.companyId) || companies[0];
}

export function matchJob(job: Job, query: string) {
  const company = companyFor(job);
  const haystack = `${job.title} ${company.name} ${job.skills.join(' ')} ${job.location} ${job.category}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function recommendationScore(job: Job, skills: string[]) {
  if (skills.length === 0) return job.featured ? 72 : 64;
  const matches = job.skills.filter((skill) => skills.some((item) => item.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(item.toLowerCase())));
  return Math.min(98, 55 + matches.length * 11 + (job.featured ? 7 : 0) + (job.easyApply ? 4 : 0));
}
