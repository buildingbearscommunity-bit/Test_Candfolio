'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  Code2,
  Copy,
  Download,
  FileText,
  FlipHorizontal,
  FolderCode,
  Heart,
  Maximize2,
  MessageSquare,
  Mic,
  Moon,
  Pause,
  Phone,
  Play,
  Presentation,
  Printer,
  RotateCcw,
  Search,
  Shuffle,
  SlidersHorizontal,
  Square,
  Star,
  Sun,
  Trophy,
  Users,
  Volume2,
  Wallet,
} from 'lucide-react';
import { SPEAKPRO_TOPIC_SCRIPTS } from '@/lib/speakproScripts';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
type PracticeMode = 'Teleprompter' | 'Paragraph Reading' | 'Interview Simulation' | 'Presentation Practice' | 'Story Reading';
type TabKey = 'topics' | 'library' | 'own';

type Topic = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  script: string;
};

type PracticeScript = {
  id: string;
  folder: string;
  title: string;
  difficulty: Difficulty;
  estimatedTime: string;
  skillLevel: string;
  text: string;
};

type StoredStats = {
  totalSeconds: number;
  sessions: number;
  longestSession: number;
  favoriteTopics: string[];
  history: { title: string; seconds: number; date: string }[];
};

const CUSTOM_SCRIPT_KEY = 'speakpro_custom_script';
const STATS_KEY = 'speakpro_stats';

const topics: Topic[] = [
  { title: 'Self Introduction', description: 'Open interviews and meetings with a polished introduction.', icon: Mic, script: SPEAKPRO_TOPIC_SCRIPTS['Self Introduction'] },
  { title: 'HR Interview', description: 'Answer common HR questions with structure and warmth.', icon: Users, script: SPEAKPRO_TOPIC_SCRIPTS['HR Interview'] },
  { title: 'Technical Interview', description: 'Explain tools, logic and projects in simple language.', icon: Code2, script: SPEAKPRO_TOPIC_SCRIPTS['Technical Interview'] },
  { title: 'Tell Me About Yourself', description: 'Build a memorable answer with education, skills and goals.', icon: MessageSquare, script: SPEAKPRO_TOPIC_SCRIPTS['Tell Me About Yourself'] },
  { title: 'Strengths & Weaknesses', description: 'Talk about strengths and growth areas without sounding unsure.', icon: Trophy, script: SPEAKPRO_TOPIC_SCRIPTS['Strengths & Weaknesses'] },
  { title: 'Project Explanation', description: 'Explain project goals, steps, tools and outcomes confidently.', icon: FolderCode, script: SPEAKPRO_TOPIC_SCRIPTS['Project Explanation'] },
  { title: 'Explain Your Resume', description: 'Walk through resume sections without missing key points.', icon: FileText, script: SPEAKPRO_TOPIC_SCRIPTS['Explain Your Resume'] },
  { title: 'Why Should We Hire You?', description: 'Give a persuasive answer focused on value and attitude.', icon: BadgeCheck, script: SPEAKPRO_TOPIC_SCRIPTS['Why Should We Hire You?'] },
  { title: 'Communication at Workplace', description: 'Speak clearly with managers, peers and teams.', icon: Building2, script: SPEAKPRO_TOPIC_SCRIPTS['Communication at Workplace'] },
  { title: 'Client Meetings', description: 'Practice polite, concise client-facing conversation.', icon: Briefcase, script: SPEAKPRO_TOPIC_SCRIPTS['Client Meetings'] },
  { title: 'Daily Office Conversation', description: 'Improve common professional phrases used every day.', icon: MessageSquare, script: SPEAKPRO_TOPIC_SCRIPTS['Daily Office Conversation'] },
  { title: 'Team Discussion', description: 'Share ideas and respond to teammates with confidence.', icon: Users, script: SPEAKPRO_TOPIC_SCRIPTS['Team Discussion'] },
  { title: 'Public Speaking', description: 'Develop stage presence, pacing and audience connection.', icon: Volume2, script: SPEAKPRO_TOPIC_SCRIPTS['Public Speaking'] },
  { title: 'Group Discussion', description: 'Enter, support and conclude group discussions politely.', icon: Users, script: SPEAKPRO_TOPIC_SCRIPTS['Group Discussion'] },
  { title: 'Presentation Skills', description: 'Deliver strong openings, transitions and conclusions.', icon: Presentation, script: SPEAKPRO_TOPIC_SCRIPTS['Presentation Skills'] },
  { title: 'Phone Conversation', description: 'Practice professional calls with clarity and etiquette.', icon: Phone, script: SPEAKPRO_TOPIC_SCRIPTS['Phone Conversation'] },
  { title: 'Email Discussion', description: 'Speak through email points before writing or meetings.', icon: MessageSquare, script: SPEAKPRO_TOPIC_SCRIPTS['Email Discussion'] },
  { title: 'Problem Solving', description: 'Explain issues, root causes and solutions logically.', icon: SlidersHorizontal, script: SPEAKPRO_TOPIC_SCRIPTS['Problem Solving'] },
  { title: 'Leadership Communication', description: 'Practice ownership, delegation and decision communication.', icon: Award, script: SPEAKPRO_TOPIC_SCRIPTS['Leadership Communication'] },
  { title: 'Salary Negotiation', description: 'Discuss compensation professionally and respectfully.', icon: Wallet, script: SPEAKPRO_TOPIC_SCRIPTS['Salary Negotiation'] },
  { title: 'Customer Communication', description: 'Handle customer questions with empathy and clarity.', icon: Heart, script: SPEAKPRO_TOPIC_SCRIPTS['Customer Communication'] },
  { title: 'Sales Pitch', description: 'Present value, outcomes and next steps with confidence.', icon: BarChart3, script: SPEAKPRO_TOPIC_SCRIPTS['Sales Pitch'] },
  { title: 'Confidence Building', description: 'Use affirmations and structured speaking drills.', icon: Star, script: SPEAKPRO_TOPIC_SCRIPTS['Confidence Building'] },
  { title: 'Pronunciation Practice', description: 'Practice pacing, stress and difficult professional words.', icon: Volume2, script: SPEAKPRO_TOPIC_SCRIPTS['Pronunciation Practice'] },
  { title: 'Story Telling', description: 'Make answers memorable with situation, action and result.', icon: BookOpen, script: SPEAKPRO_TOPIC_SCRIPTS['Story Telling'] },
];

const folders = [
  { name: 'HR Interview', count: 25, titles: ['Tell me about yourself', 'Why do you want this role?', 'What are your strengths?', 'What are your weaknesses?', 'Where do you see yourself?', 'Why should we hire you?', 'Describe a challenge', 'Teamwork example', 'Handling feedback', 'Career goals'] },
  { name: 'Technical Interview', count: 25, titles: ['Explain your analytics project', 'SQL joins explanation', 'Power BI dashboard walkthrough', 'Data cleaning process', 'Excel reporting workflow', 'KPI explanation', 'Handling missing data', 'Database basics', 'Python data task', 'Business insight explanation'] },
  { name: 'Office Communication', count: 20, titles: ['Daily status update', 'Requesting clarification', 'Team standup', 'Client follow-up', 'Manager update', 'Deadline discussion', 'Asking for help', 'Sharing blockers', 'Meeting summary', 'Polite disagreement'] },
  { name: 'Presentations', count: 15, titles: ['Project presentation opening', 'Dashboard demo', 'Business findings', 'Case study summary', 'Data story', 'Final recommendation', 'Q and A response', 'Closing statement', 'Audience engagement', 'Transition between slides'] },
  { name: 'Leadership', count: 15, titles: ['Delegating work', 'Motivating a team', 'Conflict resolution', 'Decision explanation', 'Ownership mindset', 'Performance discussion', 'Leading a meeting', 'Mentoring a teammate', 'Escalation communication', 'Planning priorities'] },
];

const difficulties: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
const practiceModes: PracticeMode[] = ['Teleprompter', 'Paragraph Reading', 'Interview Simulation', 'Presentation Practice', 'Story Reading'];
const speedOptions = [
  { label: 'Very Slow', wpm: 80 },
  { label: 'Slow', wpm: 100 },
  { label: 'Normal', wpm: 130 },
  { label: 'Fast', wpm: 160 },
  { label: 'Very Fast', wpm: 190 },
];
const fontOptions = [
  { label: 'Small', className: 'text-lg sm:text-xl' },
  { label: 'Medium', className: 'text-xl sm:text-2xl' },
  { label: 'Large', className: 'text-2xl sm:text-3xl' },
  { label: 'Extra Large', className: 'text-3xl sm:text-4xl' },
];
const quotes = [
  'Speak slowly. Confidence sounds calm.',
  'Every practice session makes the next real conversation easier.',
  'Clear English is built one honest repetition at a time.',
  'Your goal is not perfect English. Your goal is understood English.',
  'A strong voice is trained through small daily wins.',
];
const defaultStats: StoredStats = { totalSeconds: 0, sessions: 0, longestSession: 0, favoriteTopics: [], history: [] };

const scriptLibrary: PracticeScript[] = folders.flatMap((folder) =>
  Array.from({ length: folder.count }, (_, index) => {
    const baseTitle = folder.titles[index % folder.titles.length];
    const difficulty = difficulties[index % difficulties.length];
    const skillLevel = difficulty === 'Beginner' ? 'Foundation' : difficulty === 'Intermediate' ? 'Career Ready' : 'Professional';
    const minutes = difficulty === 'Beginner' ? 2 : difficulty === 'Intermediate' ? 3 : 4;

    return {
      id: `${folder.name.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
      folder: folder.name,
      title: `${baseTitle} ${Math.floor(index / folder.titles.length) + 1}`,
      difficulty,
      estimatedTime: `${minutes} min`,
      skillLevel,
      text: `Good day.

Today I will practice: ${baseTitle}.

First, I will speak with a clear opening and explain the context in simple words.

Second, I will share the most important points in a structured order so the listener can follow me easily.

Third, I will connect my answer to practical work, learning attitude and professional communication.

I will pause naturally, pronounce each key word clearly and maintain a confident tone.

To conclude, I will summarize my answer and invite the listener to ask any follow-up questions.

Thank you.`,
    };
  })
);

function normalizeWords(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getStoredStats(): StoredStats {
  if (typeof window === 'undefined') return defaultStats;
  try {
    const stored = window.localStorage.getItem(STATS_KEY);
    return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats;
  } catch {
    return defaultStats;
  }
}

export default function SpeakProPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('topics');
  const [selectedTopic, setSelectedTopic] = useState<Topic>(topics[0]);
  const [selectedScript, setSelectedScript] = useState<PracticeScript | null>(null);
  const [scriptText, setScriptText] = useState(topics[0].script);
  const [customScript, setCustomScript] = useState('');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('Teleprompter');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(2);
  const [fontIndex, setFontIndex] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [stats, setStats] = useState<StoredStats>(defaultStats);
  const [query, setQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | Difficulty>('All');
  const [folderFilter, setFolderFilter] = useState('All');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const teleprompterRef = useRef<HTMLDivElement | null>(null);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const sessionSecondsRef = useRef(0);
  const nextScriptIndexRef = useRef(0);
  const speedValueRef = useRef(speedOptions[2].wpm);
  const scrollPositionRef = useRef(0);
  const lastScrollFrameTimeRef = useRef<number | null>(null);
  const autoScrollingRef = useRef(false);

  const scriptLines = useMemo(() => scriptText.split('\n'), [scriptText]);
  const words = useMemo(() => normalizeWords(scriptText), [scriptText]);
  const readingMinutes = Math.max(1, Math.ceil(words.length / 135));
  const activeLine = Math.min(scriptLines.length - 1, Math.floor((progress / 100) * scriptLines.length));
  const speedDisplay = `${speedOptions[speedIndex].label} (${speedOptions[speedIndex].wpm} WPM)`;

  const filteredScripts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return scriptLibrary.filter((script) => {
      const matchesSearch = !search || `${script.title} ${script.folder} ${script.text}`.toLowerCase().includes(search);
      const matchesDifficulty = difficultyFilter === 'All' || script.difficulty === difficultyFilter;
      const matchesFolder = folderFilter === 'All' || script.folder === folderFilter;
      return matchesSearch && matchesDifficulty && matchesFolder;
    });
  }, [difficultyFilter, folderFilter, query]);

  const currentTitle = selectedScript?.title || selectedTopic.title;

  const saveStats = useCallback((nextStats: StoredStats) => {
    setStats(nextStats);
    window.localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
  }, []);

  const updateProgressFromScroll = useCallback(() => {
    const node = teleprompterRef.current;
    if (!node) return;
    if (!autoScrollingRef.current) {
      scrollPositionRef.current = node.scrollTop;
    }
    const maxScroll = Math.max(1, node.scrollHeight - node.clientHeight);
    const scrollTop = autoScrollingRef.current ? scrollPositionRef.current : node.scrollTop;
    setProgress(Math.min(100, Math.round((scrollTop / maxScroll) * 100)));
  }, []);

  const stopTimers = useCallback(() => {
    if (scrollAnimationRef.current) window.cancelAnimationFrame(scrollAnimationRef.current);
    if (elapsedTimerRef.current) window.clearInterval(elapsedTimerRef.current);
    scrollAnimationRef.current = null;
    elapsedTimerRef.current = null;
    lastScrollFrameTimeRef.current = null;
    autoScrollingRef.current = false;
  }, []);

  const startPractice = useCallback(() => {
    stopTimers();
    setIsPlaying(true);
    scrollPositionRef.current = teleprompterRef.current?.scrollTop ?? scrollPositionRef.current;
    autoScrollingRef.current = true;

    const scrollFrame = (timestamp: number) => {
      const node = teleprompterRef.current;
      if (!node) {
        scrollAnimationRef.current = window.requestAnimationFrame(scrollFrame);
        return;
      }

      if (lastScrollFrameTimeRef.current === null) {
        lastScrollFrameTimeRef.current = timestamp;
      }

      const deltaSeconds = Math.max(0, (timestamp - lastScrollFrameTimeRef.current) / 1000);
      lastScrollFrameTimeRef.current = timestamp;
      const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
      const durationSeconds = Math.max(1, (Math.max(words.length, 1) / speedValueRef.current) * 60);
      const pixelsPerSecond = maxScroll / durationSeconds;

      scrollPositionRef.current = Math.min(maxScroll, scrollPositionRef.current + pixelsPerSecond * deltaSeconds);
      node.scrollTop = scrollPositionRef.current;
      setProgress(Math.min(100, Math.round((scrollPositionRef.current / Math.max(1, maxScroll)) * 100)));
      scrollAnimationRef.current = window.requestAnimationFrame(scrollFrame);
    };

    scrollAnimationRef.current = window.requestAnimationFrame(scrollFrame);
    elapsedTimerRef.current = window.setInterval(() => {
      sessionSecondsRef.current += 1;
      setElapsed((current) => current + 1);
    }, 1000);
  }, [stopTimers, words.length]);

  const pausePractice = useCallback(() => {
    stopTimers();
    setIsPlaying(false);
  }, [stopTimers]);

  const stopPractice = useCallback(() => {
    stopTimers();
    setIsPlaying(false);
    const sessionSeconds = sessionSecondsRef.current || elapsed;
    if (sessionSeconds > 0) {
      saveStats({
        ...stats,
        totalSeconds: stats.totalSeconds + sessionSeconds,
        sessions: stats.sessions + 1,
        longestSession: Math.max(stats.longestSession, sessionSeconds),
        favoriteTopics: Array.from(new Set([...stats.favoriteTopics, selectedTopic.title])).slice(-6),
        history: [{ title: currentTitle, seconds: sessionSeconds, date: new Date().toISOString() }, ...stats.history].slice(0, 8),
      });
    }
    sessionSecondsRef.current = 0;
  }, [currentTitle, elapsed, saveStats, selectedTopic.title, stats, stopTimers]);

  const restartPractice = useCallback(() => {
    scrollPositionRef.current = 0;
    if (teleprompterRef.current) teleprompterRef.current.scrollTop = 0;
    setProgress(0);
    setElapsed(0);
    sessionSecondsRef.current = 0;
    startPractice();
  }, [startPractice]);

  const resetReader = () => {
    setElapsed(0);
    setProgress(0);
    scrollPositionRef.current = 0;
    sessionSecondsRef.current = 0;
    if (teleprompterRef.current) teleprompterRef.current.scrollTop = 0;
  };

  const loadTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setSelectedScript(null);
    setScriptText(topic.script);
    setActiveTab('topics');
    resetReader();
  };

  const loadLibraryScript = (script: PracticeScript) => {
    setSelectedScript(script);
    setScriptText(script.text);
    setActiveTab('library');
    resetReader();
  };

  const loadCustomScript = () => {
    const nextText = customScript.trim() || 'Add your own practice script here and press Load Script.';
    setSelectedScript(null);
    setScriptText(nextText);
    setActiveTab('own');
    resetReader();
  };

  const handleRandom = () => {
    const nextScript = scriptLibrary[nextScriptIndexRef.current % scriptLibrary.length];
    nextScriptIndexRef.current += 17;
    loadLibraryScript(nextScript);
  };

  const copyScript = async () => {
    await navigator.clipboard.writeText(scriptText);
  };

  const downloadScript = () => {
    const blob = new Blob([scriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'speakpro-script.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = async () => {
    if (!fullscreenRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await fullscreenRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    window.queueMicrotask(() => {
      setStats(getStoredStats());
      try {
        const savedCustom = window.localStorage.getItem(CUSTOM_SCRIPT_KEY);
        if (savedCustom) setCustomScript(savedCustom);
      } catch {
        setCustomScript('');
      }
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_SCRIPT_KEY, customScript);
  }, [customScript]);

  useEffect(() => {
    speedValueRef.current = speedOptions[speedIndex].wpm;
  }, [speedIndex]);

  useEffect(() => {
    const quoteTimer = window.setInterval(() => {
      setQuoteIndex((current) => (current + 1) % quotes.length);
    }, 15000);
    return () => window.clearInterval(quoteTimer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'TEXTAREA' || target?.tagName === 'INPUT') return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (isPlaying) pausePractice();
        else startPractice();
      }
      if (event.key === 'ArrowUp') setSpeedIndex((current) => Math.min(speedOptions.length - 1, current + 1));
      if (event.key === 'ArrowDown') setSpeedIndex((current) => Math.max(0, current - 1));
      if (event.key === '+' || event.key === '=') setFontIndex((current) => Math.min(fontOptions.length - 1, current + 1));
      if (event.key === '-') setFontIndex((current) => Math.max(0, current - 1));
      if (event.key.toLowerCase() === 'f') void toggleFullscreen();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlaying, pausePractice, startPractice]);

  useEffect(() => () => {
    stopTimers();
  }, [stopTimers]);

  return (
    <main className="min-h-screen bg-[#F0EDE5] text-[#872341]">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-12rem] top-[-10rem] h-96 w-96 rounded-full bg-[#872341]/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-8rem] h-96 w-96 rounded-full bg-[#872341]/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8 lg:pb-10 lg:pt-14">
          <div className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#872341]/10 bg-[#F0EDE5]/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#872341] shadow-sm backdrop-blur">
                <Mic className="h-4 w-4 text-[#872341]" />
                SpeakPro Practice Studio
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight text-[#872341] sm:text-5xl lg:text-6xl">
                Improve Your Speaking Confidence
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#872341]/75 sm:text-lg">
                Practice interviews, workplace conversations, introductions and presentations in one calm, focused speaking studio.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => document.getElementById('practice-studio')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center justify-center rounded-2xl bg-[#872341] px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-[#872341]/90">
                  <Play className="mr-2 h-5 w-5" />
                  Start Practicing
                </button>
                <button onClick={handleRandom} className="inline-flex items-center justify-center rounded-2xl border border-[#872341] bg-[#F0EDE5] px-6 py-3 text-base font-medium text-[#872341] transition hover:bg-[#872341]/10">
                  <Shuffle className="mr-2 h-5 w-5" />
                  Surprise Me
                </button>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#872341]/10 bg-[#F0EDE5]/70 p-4 shadow-2xl shadow-[#872341]/10 backdrop-blur">
              <div className="rounded-[24px] bg-[#872341] p-6 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/65">Today&apos;s focus</p>
                    <h2 className="mt-1 text-2xl font-bold">{currentTitle}</h2>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EDE5] text-[#872341]">
                    <Volume2 className="h-7 w-7" />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <HeroMetric label="Scripts" value="100+" />
                  <HeroMetric label="Topics" value="25" />
                  <HeroMetric label="Modes" value="5" />
                </div>
                <div className="mt-6 rounded-2xl border border-white/20 bg-[#F0EDE5]/10 p-4 text-sm leading-6 text-white/80">
                  &quot;{quotes[quoteIndex]}&quot;
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <MiniStat icon={TimerIcon} label="Total practice" value={`${Math.floor(stats.totalSeconds / 60)} min`} />
            <MiniStat icon={Trophy} label="Sessions" value={String(stats.sessions)} />
            <MiniStat icon={Star} label="Speed" value={speedDisplay} />
            <MiniStat icon={BookOpen} label="Read time" value={`${readingMinutes} min`} />
          </div>
        </div>
      </section>

      <section id="practice-studio" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-[24px] border border-[#872341]/10 bg-[#F0EDE5] p-4 shadow-xl shadow-[#872341]/5">
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#F0EDE5] p-1">
                {(['topics', 'library', 'own'] as TabKey[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold capitalize transition ${activeTab === tab ? 'bg-[#872341] text-white shadow' : 'text-[#872341] hover:bg-[#872341]/10'}`}
                  >
                    {tab === 'own' ? 'Mine' : tab}
                  </button>
                ))}
              </div>

              {activeTab === 'topics' && (
                <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
                  {topics.map((topic) => {
                    const Icon = topic.icon;
                    const active = selectedTopic.title === topic.title && !selectedScript;
                    return (
                      <button
                        key={topic.title}
                        onClick={() => loadTopic(topic)}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-[#872341] bg-[#872341] text-white' : 'border-[#872341]/10 bg-[#F0EDE5]/70 text-[#872341] hover:border-[#872341] hover:bg-[#872341]/10'}`}
                      >
                        <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-[#F0EDE5] text-[#872341]' : 'bg-[#C9A227] text-[#872341]'}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">{topic.title}</span>
                          <span className={`mt-0.5 block text-xs leading-5 ${active ? 'text-white/70' : 'text-[#872341]/65'}`}>{topic.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {activeTab === 'library' && (
                <div className="mt-4 space-y-3">
                  <label className="relative block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#872341]/45" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search scripts"
                      className="w-full rounded-2xl border border-[#872341]/10 bg-[#F0EDE5]/70 py-3 pl-10 pr-4 text-sm text-[#872341] outline-none transition focus:border-[#872341] focus:bg-[#872341]/10"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <SelectShell>
                      <select value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)} className="w-full appearance-none bg-transparent text-sm font-bold outline-none">
                        <option>All</option>
                        {folders.map((folder) => <option key={folder.name}>{folder.name}</option>)}
                      </select>
                    </SelectShell>
                    <SelectShell>
                      <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value as 'All' | Difficulty)} className="w-full appearance-none bg-transparent text-sm font-bold outline-none">
                        <option>All</option>
                        {difficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}
                      </select>
                    </SelectShell>
                  </div>
                  <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                    {filteredScripts.slice(0, 35).map((script) => (
                      <button key={script.id} onClick={() => loadLibraryScript(script)} className="w-full rounded-2xl border border-[#872341]/10 bg-[#F0EDE5] p-3 text-left transition hover:border-[#872341] hover:bg-[#872341]/10 hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#872341]/50">{script.folder}</p>
                            <h3 className="mt-1 text-sm font-semibold text-[#872341]">{script.title}</h3>
                          </div>
                          <span className="rounded-full bg-[#F0EDE5] px-2 py-1 text-[10px] font-semibold text-[#872341]">{script.difficulty}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'own' && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={customScript}
                    onChange={(event) => setCustomScript(event.target.value)}
                    rows={10}
                    placeholder="Paste your own script..."
                    className="w-full resize-none rounded-2xl border border-[#872341]/10 bg-[#F0EDE5]/70 p-4 text-sm leading-7 text-[#872341] outline-none transition focus:border-[#872341] focus:bg-[#872341]/10"
                  />
                  <button onClick={loadCustomScript} className="inline-flex w-full items-center justify-center rounded-2xl bg-[#872341] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#872341]/90">Load My Script</button>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setCustomScript('')} className="rounded-2xl border border-[#872341] bg-[#F0EDE5] px-4 py-2 text-sm font-medium text-[#872341] transition hover:bg-[#872341]/10">Clear</button>
                    <button onClick={() => window.localStorage.setItem(CUSTOM_SCRIPT_KEY, customScript)} className="rounded-2xl border border-[#872341]/40 bg-[#872341]/10 px-4 py-2 text-sm font-bold text-[#872341]">Save</button>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section ref={fullscreenRef} className={`overflow-hidden rounded-[28px] border shadow-2xl shadow-[#872341]/10 ${darkMode ? 'border-white/20 bg-[#872341] text-white' : 'border-[#872341]/10 bg-[#F0EDE5] text-[#872341]'}`}>
            <div className="border-b border-current/10 p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-current opacity-70">{selectedScript?.folder || practiceMode}</p>
                  <h2 className="mt-1 text-2xl font-bold text-current sm:text-3xl">{currentTitle}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={isPlaying ? pausePractice : startPractice} className="inline-flex items-center justify-center rounded-2xl bg-[#872341] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#872341]/90">
                    {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {isPlaying ? 'Pause' : 'Start'}
                  </button>
                  <IconButton label="Stop" onClick={stopPractice}><Square className="h-4 w-4" /></IconButton>
                  <IconButton label="Restart" onClick={restartPractice}><RotateCcw className="h-4 w-4" /></IconButton>
                  <IconButton label="Fullscreen" onClick={toggleFullscreen}><Maximize2 className="h-4 w-4" /></IconButton>
                </div>
              </div>

              <details className="mt-4 rounded-2xl border border-current/10 bg-current/5 px-4 py-3">
                <summary className="cursor-pointer text-sm font-semibold text-[#872341] dark:text-white">Settings, export and shortcuts</summary>
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                  <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Practice mode
                    <SelectShell dark={darkMode}>
                      <select value={practiceMode} onChange={(event) => setPracticeMode(event.target.value as PracticeMode)} className="w-full appearance-none bg-transparent text-sm font-bold outline-none">
                        {practiceModes.map((mode) => <option key={mode}>{mode}</option>)}
                      </select>
                    </SelectShell>
                  </label>
                  <label className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Font size
                    <SelectShell dark={darkMode}>
                      <select value={fontIndex} onChange={(event) => setFontIndex(Number(event.target.value))} className="w-full appearance-none bg-transparent text-sm font-bold outline-none">
                        {fontOptions.map((option, index) => <option key={option.label} value={index}>{option.label}</option>)}
                      </select>
                    </SelectShell>
                  </label>
                  <div className="flex flex-wrap items-end gap-2">
                    <IconButton label="Dark mode" onClick={() => setDarkMode((value) => !value)}>{darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</IconButton>
                    <IconButton label="Mirror mode" onClick={() => setMirrorMode((value) => !value)}><FlipHorizontal className="h-4 w-4" /></IconButton>
                    <IconButton label="Copy" onClick={copyScript}><Copy className="h-4 w-4" /></IconButton>
                    <IconButton label="Download" onClick={downloadScript}><Download className="h-4 w-4" /></IconButton>
                    <IconButton label="Print" onClick={() => window.print()}><Printer className="h-4 w-4" /></IconButton>
                  </div>
                </div>
                <label className="mt-4 block text-xs font-semibold uppercase tracking-wide opacity-70">
                  Scroll speed: {speedDisplay}
                  <input aria-label="Teleprompter speed" type="range" min={0} max={speedOptions.length - 1} value={speedIndex} onChange={(event) => setSpeedIndex(Number(event.target.value))} className="mt-3 w-full accent-[#872341]" />
                </label>
                <p className="mt-3 text-xs leading-6 opacity-60">Shortcuts: Space start or pause, Arrow Up faster, Arrow Down slower, + larger text, - smaller text, F fullscreen.</p>
              </details>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-current/10">
                <div className="h-full rounded-full bg-[#872341] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div
              ref={teleprompterRef}
              onScroll={updateProgressFromScroll}
              onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
              onTouchEnd={(event) => {
                if (touchStart === null) return;
                const diff = event.changedTouches[0].clientX - touchStart;
                if (diff > 60) setSpeedIndex((current) => Math.max(0, current - 1));
                if (diff < -60) setSpeedIndex((current) => Math.min(speedOptions.length - 1, current + 1));
                setTouchStart(null);
              }}
              className={`mx-4 mt-4 h-[56vh] min-h-[430px] overflow-y-auto rounded-[24px] border border-current/10 p-5 leading-[1.9] shadow-inner sm:mx-5 sm:p-8 ${darkMode ? 'bg-[#872341] text-white' : 'bg-[#F0EDE5]/70 text-[#872341]'} ${fontOptions[fontIndex].className}`}
              aria-label="Teleprompter script"
            >
              <div className={mirrorMode ? '-scale-x-100 transform' : ''}>
                {scriptLines.map((line, index) => (
                  <p key={`${line}-${index}`} className={`rounded-2xl px-3 py-1.5 transition ${index === activeLine ? (darkMode ? 'bg-[#F0EDE5]/15 text-white' : 'bg-[#872341]/15 text-[#872341]') : ''}`}>
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-5 sm:p-5">
              <ReaderStat label="Words" value={String(words.length)} />
              <ReaderStat label="Read time" value={`${readingMinutes} min`} />
              <ReaderStat label="Elapsed" value={formatTime(elapsed)} />
              <ReaderStat label="Speed" value={speedDisplay} />
              <ReaderStat label="Progress" value={`${progress}%`} />
            </div>

          </section>

        </div>
      </section>
    </main>
  );
}

function TimerIcon({ className }: { className?: string }) {
  return <Volume2 className={className} />;
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-[#F0EDE5]/10 p-4">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wide text-white/60">{label}</div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#872341]/10 bg-[#F0EDE5]/70 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A227] text-[#872341]">
          <Icon className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-lg font-bold text-[#872341]">{value}</span>
          <span className="block text-xs font-bold uppercase tracking-wide text-[#872341]/60">{label}</span>
        </span>
      </div>
    </div>
  );
}

function SelectShell({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`relative mt-1 flex rounded-2xl border px-3 py-3 ${dark ? 'border-white/20 bg-[#F0EDE5]/10 text-white' : 'border-[#872341]/10 bg-[#F0EDE5]/70 text-[#872341]'}`}>
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
    </span>
  );
}

function ReaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-current/10 bg-current/5 p-3">
      <div className="text-base font-bold text-current">{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide opacity-55">{label}</div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void | Promise<void>; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-current/10 bg-current/5 transition hover:-translate-y-0.5 hover:bg-[#872341]/20"
    >
      {children}
    </button>
  );
}
