import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {};
}

const JSZip = require('jszip');

type SectionKey =
  | 'header'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'unknown';

interface ParsedResume {
  personal_info: {
    name: string;
    email: string;
    phone: string;
    website: string;
    title: string;
    summary: string;
  };
  experience: Array<{
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
  }>;
  skills: string[];
}

const SECTION_ALIASES: Record<Exclude<SectionKey, 'header' | 'unknown'>, string[]> = {
  summary: [
    'summary',
    'profile',
    'objective',
    'about',
    'about me',
    'professional summary',
    'career summary',
    'career objective',
    'professional profile',
    'personal statement',
    'executive summary',
    'overview',
  ],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'employment',
    'employment history',
    'work history',
    'career history',
    'career experience',
    'professional background',
    'professional history',
    'relevant experience',
    'selected experience',
    'positions held',
    'internships',
    'apprenticeships',
  ],
  education: [
    'education',
    'academic',
    'academics',
    'academic background',
    'academic history',
    'academic qualifications',
    'education and training',
    'training and education',
    'qualifications',
    'degrees',
    'certificates and education',
    'schooling',
  ],
  skills: [
    'skills',
    'technical skills',
    'core skills',
    'key skills',
    'professional skills',
    'areas of expertise',
    'expertise',
    'core competencies',
    'competencies',
    'proficiencies',
    'technical expertise',
    'technical competencies',
    'technical proficiency',
    'technology stack',
    'technologies',
    'tools',
    'tools and technologies',
    'tools & technologies',
    'software',
    'platforms',
    'programming languages',
  ],
  certifications: [
    'certifications',
    'certificates',
    'licenses',
    'licences',
    'credentials',
    'professional certifications',
    'accreditations',
  ],
  projects: [
    'projects',
    'personal projects',
    'selected projects',
    'key projects',
    'project experience',
    'notable projects',
  ],
};

const INLINE_SECTION_ALIASES = Array.from(
  new Set([
    'professional summary',
    'career summary',
    'executive summary',
    'professional profile',
    'personal statement',
    'summary',
    'profile',
    'objective',
    'overview',
    'professional experience',
    'work experience',
    'employment history',
    'work history',
    'career history',
    'career experience',
    'professional background',
    'professional history',
    'relevant experience',
    'selected experience',
    'positions held',
    'experience',
    'employment',
    'internships',
    'education and training',
    'training and education',
    'academic background',
    'academic history',
    'academic qualifications',
    'education',
    'academics',
    'qualifications',
    'technical skills',
    'core skills',
    'key skills',
    'professional skills',
    'areas of expertise',
    'core competencies',
    'technical expertise',
    'technical competencies',
    'technical proficiency',
    'technology stack',
    'tools and technologies',
    'tools & technologies',
    'programming languages',
    'skills',
    'certifications',
    'certificates',
    'licenses',
    'credentials',
    'professional certifications',
    'projects',
    'personal projects',
    'selected projects',
    'key projects',
    'project experience',
    'notable projects',
  ]),
).sort((a, b) => b.length - a.length);

const BULLET_RE = /^[\s\-*•·▪‣▸►–—]+/;

function decodeXml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeLine(line: string): string {
  return line
    .replace(/\u00a0/g, ' ')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/[•·▪‣▸►]/g, '•')
    .replace(/\t+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}

function cleanBodyLine(line: string): string {
  return normalizeLine(line).replace(BULLET_RE, '').trim();
}

function isParserPageMarker(line: string): boolean {
  return /^---\s*Page\b.*---$/i.test(normalizeLine(line));
}

function splitLines(text: string): string[] {
  return text
    .replace(/\r/g, '\n')
    .split('\n')
    .map(normalizeLine)
    .filter((line) => Boolean(line) && !isParserPageMarker(line));
}

function uniqueLines(text: string): string {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const line of splitLines(text)) {
    const key = line.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      output.push(line);
    }
  }

  return output.join('\n');
}

function mergeTextSources(...sources: string[]): string {
  return uniqueLines(sources.filter(Boolean).join('\n'));
}

function headingCandidate(line: string): string {
  return normalizeLine(line)
    .replace(BULLET_RE, '')
    .replace(/^[\d.()[\]\s]+/, '')
    .replace(/[:|]+$/, '')
    .trim()
    .toLowerCase();
}

function detectSection(rawLine: string): { section: SectionKey | null; remainder: string } {
  const line = normalizeLine(rawLine);
  const candidate = headingCandidate(line);
  if (candidate.length < 3 || candidate.length > 90) {
    return { section: null, remainder: '' };
  }

  for (const [section, aliases] of Object.entries(SECTION_ALIASES)) {
    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exact = new RegExp(`^${escaped}$`, 'i');
      const prefixed = new RegExp(`^${escaped}\\s*[:|\\-–—]\\s*(.*)$`, 'i');
      const headingWithDecor = new RegExp(`^${escaped}\\b(?:\\s+[A-Z&/ ]{0,30})?$`, 'i');
      const prefixMatch = line.match(prefixed);

      if (exact.test(candidate) || headingWithDecor.test(candidate)) {
        return { section: section as SectionKey, remainder: '' };
      }

      if (prefixMatch) {
        return { section: section as SectionKey, remainder: prefixMatch[1]?.trim() || '' };
      }
    }
  }

  return { section: null, remainder: '' };
}

function expandInlineSectionBreaks(text: string): string {
  let expanded = text.replace(/\r/g, '\n');

  for (const alias of INLINE_SECTION_ALIASES) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expanded = expanded.replace(new RegExp(`(${escaped})(?=[A-Z][a-z])`, 'gi'), '$1\n');
    const pattern = new RegExp(`(^|\\s)(${escaped})(\\s*[:|\\-–—]?)(?=\\s+[A-Z0-9])`, 'gi');
    expanded = expanded.replace(pattern, (match, before, heading, separator, offset, whole) => {
      const previousText = whole.slice(Math.max(0, offset - 24), offset).toLowerCase();
      if (alias === 'experience' && /\b(years?|yrs?)\s+of\s+$/i.test(previousText)) return match;
      const prefix = before.includes('\n') ? before : `${before}\n`;
      const suffix = separator && /[:|\\-–—]/.test(separator) ? separator : '';
      return `${prefix}${heading}${suffix}\n`;
    });
  }

  return expanded;
}

function extractEmail(text: string): string {
  return text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/)?.[0] ?? '';
}

function extractPhone(text: string): string {
  return (
    text.match(/(?:\+?\d{1,3}[\s.\-]?)?(?:\(?\d{2,4}\)?[\s.\-]?){2,4}\d{3,4}/)?.[0] ??
    ''
  );
}

function extractWebsite(text: string): string {
  const withoutEmail = text.replace(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, '');
  return (
    withoutEmail.match(/(?:https?:\/\/|www\.)(?:[a-z0-9\-]+\.)+[a-z]{2,}(?:\/[^\s]*)*|(?:linkedin\.com|github\.com)(?:\/[^\s]*)*/i)?.[0] ??
    ''
  );
}

function extractName(lines: string[]): string {
  for (const line of lines.slice(0, 12)) {
    const stripped = line.replace(/[^a-zA-Z\s.'-]/g, '').trim();
    if (
      stripped.length > 2 &&
      stripped.length < 60 &&
      !line.includes('@') &&
      !extractPhone(line) &&
      !extractWebsite(line) &&
      !/\b(?:portfolio|website|linkedin|github|email|phone|mobile)\b/i.test(line) &&
      !detectSection(line).section
    ) {
      return stripped;
    }
  }
  return '';
}

function extractTitle(lines: string[], name: string): string {
  const nameIndex = lines.findIndex((line) => line.includes(name));
  const candidateLines = lines.slice(Math.max(0, nameIndex + 1), Math.max(0, nameIndex + 5));
  return (
    candidateLines.find(
      (line) =>
        line.length > 2 &&
        line.length < 80 &&
        !line.includes('@') &&
        !extractPhone(line) &&
        !detectSection(line).section,
    ) ?? ''
  );
}

function extractDateRange(line: string): [string, string] | null {
  const normal = normalizeLine(line);
  const month =
    '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  const end = `(?:present|current|now|${month}\\.?\\s*\\d{4}|\\d{1,2}[\\/.-]\\d{4}|\\d{4})`;
  const patterns = [
    new RegExp(`\\b(${month}\\.?\\s*\\d{4})\\s*(?:-|to|until|through)\\s*(${end})\\b`, 'i'),
    /\b(\d{1,2}[\/.-]\d{4})\s*(?:-|to|until|through)\s*(\d{1,2}[\/.-]\d{4}|present|current|now)\b/i,
    /\b((?:19|20)\d{2})\s*(?:-|to|until|through)\s*((?:19|20)\d{2}|present|current|now)\b/i,
    new RegExp(`\\b(${month}\\.?\\s*\\d{4})\\b`, 'i'),
    /\b((?:19|20)\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = normal.match(pattern);
    if (match) return [match[1].trim(), (match[2] || 'Present').trim()];
  }

  return null;
}

function removeDateRange(line: string): string {
  const month =
    '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  return normalizeLine(line)
    .replace(new RegExp(`\\b${month}\\.?\\s*\\d{4}\\s*(?:-|to|until|through)\\s*(?:present|current|now|${month}\\.?\\s*\\d{4}|\\d{4})\\b`, 'gi'), '')
    .replace(/\b\d{1,2}[\/.-]\d{4}\s*(?:-|to|until|through)\s*(?:\d{1,2}[\/.-]\d{4}|present|current|now)\b/gi, '')
    .replace(/\b(?:19|20)\d{2}\s*(?:-|to|until|through)\s*(?:(?:19|20)\d{2}|present|current|now)\b/gi, '')
    .trim();
}

function splitRoleCompany(value: string): { role: string; company: string } {
  const cleaned = cleanBodyLine(value);
  const parts = cleaned
    .split(/\s+(?:at|@)\s+|\s+[|]\s+|\s+-\s+|\s+,\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    role: parts[0] || cleaned || 'Role',
    company: parts[1] || 'Company',
  };
}

function looksLikeTitleLine(line: string): boolean {
  const cleaned = cleanBodyLine(line);
  return (
    cleaned.length > 2 &&
    cleaned.length < 100 &&
    !cleaned.endsWith('.') &&
    !detectSection(cleaned).section &&
    !extractEmail(cleaned)
  );
}

function parseExperience(lines: string[]) {
  const entries: ParsedResume['experience'] = [];
  let current: ParsedResume['experience'][number] | null = null;
  let pendingTitle = '';

  const pushCurrent = () => {
    if (current && (current.description.trim() || current.role !== 'Role')) {
      current.description = current.description.trim();
      entries.push(current);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = normalizeLine(lines[i]);
    const dateRange = extractDateRange(line);
    const nextHasDate = i + 1 < lines.length && Boolean(extractDateRange(lines[i + 1]));

    if (dateRange) {
      pushCurrent();
      const titleSource = removeDateRange(line) || pendingTitle || (i > 0 ? lines[i - 1] : '');
      const { role, company } = splitRoleCompany(titleSource);
      current = {
        id: `exp-${entries.length + 1}-${Date.now()}`,
        role,
        company,
        startDate: dateRange[0],
        endDate: dateRange[1],
        description: '',
      };
      pendingTitle = '';
      continue;
    }

    if (!current && looksLikeTitleLine(line)) {
      pendingTitle = line;
      if (!nextHasDate && i + 1 < lines.length && looksLikeTitleLine(lines[i + 1])) {
        pendingTitle = `${line} - ${lines[i + 1]}`;
        i++;
      }
      continue;
    }

    if (current && nextHasDate && looksLikeTitleLine(line)) {
      pushCurrent();
      current = null;
      pendingTitle = line;
      continue;
    }

    if (current) {
      const cleaned = cleanBodyLine(line);
      if (cleaned) current.description += `${cleaned}\n`;
    }
  }

  pushCurrent();

  if (entries.length === 0 && lines.length > 0) {
    const first = lines.find(looksLikeTitleLine) || lines[0];
    const { role, company } = splitRoleCompany(first);
    entries.push({
      id: `exp-1-${Date.now()}`,
      role,
      company,
      startDate: '',
      endDate: '',
      description: lines.filter((line) => line !== first).map(cleanBodyLine).join('\n').trim(),
    });
  }

  return entries;
}

function parseEducation(lines: string[]) {
  const entries: ParsedResume['education'] = [];
  const degreeWords = [
    'bachelor',
    'master',
    'phd',
    'ph.d',
    'associate',
    'diploma',
    'certificate',
    'certification',
    'degree',
    'b.s',
    'b.a',
    'm.s',
    'm.a',
    'b.sc',
    'm.sc',
    'b.tech',
    'm.tech',
    'b.e',
    'm.e',
    'mba',
    'bba',
    'bcom',
    'b.com',
    'mca',
    'bca',
  ];
  const schoolWords = ['university', 'college', 'institute', 'school', 'academy', 'polytechnic'];

  let current: ParsedResume['education'][number] | null = null;
  const pushCurrent = () => {
    if (current && (current.degree !== 'Degree' || current.school !== 'Institution')) {
      entries.push(current);
    }
  };

  for (const rawLine of lines) {
    const line = normalizeLine(rawLine);
    const lower = line.toLowerCase();
    const dateRange = extractDateRange(line);
    const hasDegree = degreeWords.some((word) => lower.includes(word));
    const hasSchool = schoolWords.some((word) => lower.includes(word));

    if (hasDegree || hasSchool || dateRange) {
      if (!current || (hasDegree && current.degree !== 'Degree' && current.school !== 'Institution')) {
        pushCurrent();
        current = {
          id: `edu-${entries.length + 1}-${Date.now()}`,
          degree: 'Degree',
          school: 'Institution',
          startDate: '',
          endDate: '',
        };
      }

      if (dateRange) {
        current.startDate = dateRange[0];
        current.endDate = dateRange[1];
      }

      const withoutDate = removeDateRange(line);
      const parts = withoutDate.split(/\s+[|]\s+|\s+-\s+|\s+,\s+/).map((part) => part.trim()).filter(Boolean);

      for (const part of parts.length ? parts : [withoutDate]) {
        const partLower = part.toLowerCase();
        if (degreeWords.some((word) => partLower.includes(word))) current.degree = part;
        else if (schoolWords.some((word) => partLower.includes(word))) current.school = part;
      }

      if (current.degree === 'Degree' && hasDegree) current.degree = withoutDate || line;
      if (current.school === 'Institution' && hasSchool) current.school = withoutDate || line;
    } else if (current && line.length > 1) {
      if (current.school === 'Institution') current.school = line;
      else if (current.degree === 'Degree') current.degree = line;
    }
  }

  pushCurrent();
  return entries;
}

function parseSkills(lines: string[]): string[] {
  const raw = lines.join('\n');
  const candidates = raw
    .split(/[,;|•\n]/)
    .map((skill) => cleanBodyLine(skill).replace(/^(technical|tools|languages|frameworks|platforms)\s*[:|-]\s*/i, ''))
    .map((skill) => skill.trim())
    .filter((skill) => skill.length > 1 && skill.length <= 45 && !detectSection(skill).section);

  return Array.from(new Set(candidates)).slice(0, 40);
}

function bucketSections(lines: string[]) {
  let currentSection: SectionKey = 'header';
  const sections: Record<SectionKey, string[]> = {
    header: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    unknown: [],
  };

  for (const line of lines) {
    const detected = detectSection(line);
    if (detected.section) {
      currentSection = detected.section;
      if (detected.remainder) sections[currentSection].push(detected.remainder);
      continue;
    }
    sections[currentSection].push(line);
  }

  return sections;
}

function parseResumeText(rawText: string): ParsedResume {
  const lines = splitLines(expandInlineSectionBreaks(rawText));
  const sectionContent = bucketSections(lines);
  const name = extractName(lines);

  if (sectionContent.summary.length === 0) {
    sectionContent.summary = sectionContent.header.filter((line) => line.length > 55);
  }

  const resume: ParsedResume = {
    personal_info: {
      name,
      email: extractEmail(rawText),
      phone: extractPhone(rawText),
      website: extractWebsite(rawText),
      title: extractTitle(lines, name),
      summary: sectionContent.summary.map(cleanBodyLine).join(' ').trim(),
    },
    experience: parseExperience(sectionContent.experience),
    education: parseEducation(sectionContent.education),
    skills: parseSkills(sectionContent.skills),
  };

  console.log('[Korsay Parser] Section line counts:', {
    header: sectionContent.header.length,
    summary: sectionContent.summary.length,
    experience: sectionContent.experience.length,
    education: sectionContent.education.length,
    skills: sectionContent.skills.length,
    certifications: sectionContent.certifications.length,
    projects: sectionContent.projects.length,
  });
  console.log('[Korsay Parser] Parsed result:', {
    name: resume.personal_info.name,
    email: resume.personal_info.email,
    phone: resume.personal_info.phone,
    title: resume.personal_info.title,
    summaryLen: resume.personal_info.summary.length,
    experienceCount: resume.experience.length,
    educationCount: resume.education.length,
    skillsCount: resume.skills.length,
  });

  return resume;
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

async function extractPdfText(buffer: Buffer) {
  let coordinateText = '';
  let pageCount = 0;

  try {
    const PdfParser = require('pdf2json');
    const parser = new PdfParser(null, 1);

    const rawData = await new Promise<any>((resolve, reject) => {
      parser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError || errData));
      parser.on('pdfParser_dataReady', (data: any) => resolve(data));
      parser.parseBuffer(buffer);
    });

    const pages = rawData?.formImage?.Pages || rawData?.Pages || [];
    pageCount = pages.length;
    const pageTexts = pages.map((page: any, pageIndex: number) => {
      const items = (page?.Texts || [])
        .map((textItem: any) => ({
          x: Number(textItem.x) || 0,
          y: Number(textItem.y) || 0,
          width: Number(textItem.w) || 0,
          text: normalizeLine(
            (textItem.R || [])
              .map((run: any) => {
                try {
                  return decodeURIComponent(run.T || '');
                } catch {
                  return run.T || '';
                }
              })
              .join(''),
          ),
        }))
        .filter((item: any) => item.text);

      const rows: Array<{ y: number; items: typeof items }> = [];
      for (const item of items.sort((a: any, b: any) => a.y - b.y || a.x - b.x)) {
        let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 0.35);
        if (!row) {
          row = { y: item.y, items: [] as typeof items };
          rows.push(row);
        }
        row.items.push(item);
        row.y = (row.y * (row.items.length - 1) + item.y) / row.items.length;
      }

      const lineChunks = rows
        .sort((a, b) => a.y - b.y)
        .flatMap((row) => {
          const rowItems = row.items.sort((a: any, b: any) => a.x - b.x);
          const chunks: Array<{ x: number; y: number; text: string }> = [];
          let line = '';
          let previousRight: number | null = null;
          let previousX: number | null = null;
          let chunkX = rowItems[0]?.x ?? 0;
          for (const item of rowItems) {
            if (
              (previousX !== null && item.x - previousX > 8) ||
              (previousRight !== null && item.x - previousRight > 1.25)
            ) {
              if (line.trim()) chunks.push({ x: chunkX, y: row.y, text: normalizeLine(line) });
              line = '';
              chunkX = item.x;
            } else if (previousRight !== null && item.x - previousRight > 0.25) {
              line += ' ';
            }
            line += item.text;
            previousRight = item.x + item.width;
            previousX = item.x;
          }
          if (line.trim()) chunks.push({ x: chunkX, y: row.y, text: normalizeLine(line) });
          return chunks;
        })
        .filter((chunk) => chunk.text);

      const minX = Math.min(...lineChunks.map((chunk) => chunk.x));
      const maxX = Math.max(...lineChunks.map((chunk) => chunk.x));
      const columnBreakX = minX + Math.max(8, (maxX - minX) / 2);
      const lines = lineChunks
        .sort((a, b) => {
          const aColumn = maxX - minX > 8 && a.x >= columnBreakX ? 1 : 0;
          const bColumn = maxX - minX > 8 && b.x >= columnBreakX ? 1 : 0;
          return aColumn - bColumn || a.y - b.y || a.x - b.x;
        })
        .map((chunk) => chunk.text);

      return `--- Page ${pageIndex + 1} ---\n${lines.join('\n')}`;
    });

    coordinateText = pageTexts.join('\n\n');
  } catch (error) {
    console.warn('[Korsay Parser] pdf2json coordinate extraction failed:', error);
  }

  if (coordinateText.trim()) {
    return { text: coordinateText, pages: pageCount };
  }

  const pdfParse = require('pdf-parse');
  const fallback = await pdfParse(buffer);
  return {
    text: fallback.text || '',
    pages: fallback.numpages || pageCount,
  };
}

async function extractDocxXmlText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const partNames = Object.keys(zip.files)
    .filter((name) =>
      /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes|comments)\.xml$/i.test(name),
    )
    .sort((a, b) => {
      const rank = (name: string) => {
        if (/header\d+\.xml$/i.test(name)) return 0;
        if (/document\.xml$/i.test(name)) return 1;
        if (/footer\d+\.xml$/i.test(name)) return 2;
        return 3;
      };
      return rank(a) - rank(b) || a.localeCompare(b);
    });
  const parts: string[] = [];

  for (const partName of partNames) {
    const xml = await zip.files[partName].async('string');
    const paragraphs: string[] = xml.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];
    const lines = paragraphs
      .map((paragraph: string) => {
        const withBreaks = paragraph
          .replace(/<w:tab\/>/g, '\t')
          .replace(/<w:br\/>/g, '\n')
          .replace(/<\/w:tc>/g, '\t');
        const texts = [...withBreaks.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((match) =>
          decodeXml(match[1]),
        );
        return normalizeLine(texts.join(''));
      })
      .filter(Boolean);
    if (lines.length > 0) parts.push(lines.join('\n'));
  }

  return uniqueLines(parts.join('\n'));
}

async function extractDocx(buffer: Buffer) {
  const [rawResult, htmlResult, xmlText] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
    extractDocxXmlText(buffer),
  ]);

  return {
    text: mergeTextSources(xmlText, rawResult.value),
    html: sanitizeHtml(htmlResult.value),
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isDocx =
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx');

    let rawText = '';
    let previewHtml = '';
    const extractionMeta: Record<string, unknown> = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };

    if (isPdf) {
      const pdf = await extractPdfText(buffer);
      rawText = pdf.text;
      extractionMeta.pdfPages = pdf.pages;
    } else if (isDocx) {
      const docx = await extractDocx(buffer);
      rawText = docx.text;
      previewHtml = docx.html;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or DOCX file.' },
        { status: 400 },
      );
    }

    console.log('[Korsay] ========================================================');
    console.log('[Korsay] Full extracted resume text');
    console.log('[Korsay] File:', file.name, file.type || 'unknown', `${file.size} bytes`);
    console.log('[Korsay] Extracted text length:', rawText.length, 'chars');
    console.log('[Korsay] --- FULL EXTRACTED TEXT START ---');
    console.log(rawText);
    console.log('[Korsay] --- FULL EXTRACTED TEXT END ---');
    console.log('[Korsay] ========================================================');

    const parsedResume = parseResumeText(rawText);

    return NextResponse.json({
      success: true,
      resume: parsedResume,
      rawText,
      previewHtml,
      extractionMeta,
    });
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    return NextResponse.json(
      { error: 'Failed to parse resume', details: error.message },
      { status: 500 },
    );
  }
}
