'use client';

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Flame,
  GripVertical,
  Heart,
  ListChecks,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

type Priority = 'High' | 'Medium' | 'Low';
type Recurrence = 'None' | 'Daily' | 'Weekly' | 'Monthly';
type TaskFilter = 'All' | 'Active' | 'Completed';
type ProductTab = 'tasks' | 'habits';
type HabitFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Custom';

type Task = {
  id: string;
  title: string;
  notes: string;
  category: string;
  priority: Priority;
  dueDate: string;
  dueTime: string;
  recurring: Recurrence;
  progress: number;
  completed: boolean;
  pinned: boolean;
  createdAt: string;
};

type Habit = {
  id: string;
  name: string;
  category: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  target: number;
  checkIns: string[];
  archived: boolean;
  createdAt: string;
};

type Toast = { id: string; message: string; tone: 'success' | 'info' | 'danger' };

const TASKS_KEY = 'candfolio_productivity_tasks';
const HABITS_KEY = 'candfolio_productivity_habits';
const taskCategories = ['Work', 'Learning', 'Personal', 'Health', 'Finance'];
const habitCategories = ['Wellness', 'Focus', 'Learning', 'Fitness', 'Mindset'];
const habitIcons = ['Zap', 'Target', 'Flame', 'Star', 'Heart', 'Bell'];
const habitColors = ['#872341', '#C9A227', '#9f2a4d', '#4f1426', '#065f46', '#1d4ed8'];
const habitIconMap = { Zap, Target, Flame, Star, Heart, Bell };

const blankTask: Omit<Task, 'id' | 'createdAt'> = {
  title: '',
  notes: '',
  category: 'Work',
  priority: 'Medium',
  dueDate: '',
  dueTime: '',
  recurring: 'None',
  progress: 0,
  completed: false,
  pinned: false,
};

const blankHabit: Omit<Habit, 'id' | 'createdAt' | 'checkIns' | 'archived'> = {
  name: '',
  category: 'Wellness',
  icon: 'Zap',
  color: '#872341',
  frequency: 'Daily',
  target: 1,
};

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function isOverdue(task: Task) {
  if (task.completed || !task.dueDate) return false;
  const dateTime = new Date(`${task.dueDate}T${task.dueTime || '23:59'}`);
  return dateTime.getTime() < Date.now();
}

function priorityTone(priority: Priority) {
  if (priority === 'High') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (priority === 'Medium') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function streakFor(checkIns: string[]) {
  const set = new Set(checkIns);
  let current = 0;
  for (let date = new Date(); set.has(todayKey(date)); date = addDays(date, -1)) current += 1;

  let best = 0;
  let run = 0;
  const sorted = [...set].sort();
  sorted.forEach((day, index) => {
    if (index === 0) {
      run = 1;
    } else {
      const previous = new Date(sorted[index - 1]);
      const expected = todayKey(addDays(previous, 1));
      run = day === expected ? run + 1 : 1;
    }
    best = Math.max(best, run);
  });
  return { current, best };
}

export default function ProductivityPage() {
  const [activeTab, setActiveTab] = useState<ProductTab>('tasks');
  const [tasks, setTasks] = useState<Task[]>(() => readStorage<Task[]>(TASKS_KEY, []));
  const [habits, setHabits] = useState<Habit[]>(() => readStorage<Habit[]>(HABITS_KEY, []));
  const [taskDraft, setTaskDraft] = useState(blankTask);
  const [habitDraft, setHabitDraft] = useState(blankHabit);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [habitSearch, setHabitSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('All');
  const [taskSort, setTaskSort] = useState('Pinned first');
  const [habitSort, setHabitSort] = useState('Active first');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ title: string; body: string; run: () => void } | null>(null);
  const taskInputRef = useRef<HTMLInputElement | null>(null);
  const currentDay = todayKey();

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        document.getElementById(activeTab === 'tasks' ? 'task-search' : 'habit-search')?.focus();
      }
      if (event.key.toLowerCase() === 'n' && !typing) {
        event.preventDefault();
        taskInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [activeTab]);

  const toast = (message: string, tone: Toast['tone'] = 'success') => {
    const id = uid('toast');
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 2600);
  };

  const persistTasks = (next: Task[]) => {
    setTasks(next);
    writeStorage(TASKS_KEY, next);
  };

  const persistHabits = (next: Habit[]) => {
    setHabits(next);
    writeStorage(HABITS_KEY, next);
  };

  const taskStats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    const overdue = tasks.filter(isOverdue).length;
    const pending = tasks.length - completed;
    const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
    return { total: tasks.length, completed, pending, overdue, completion };
  }, [tasks]);

  const habitStats = useMemo(() => {
    const active = habits.filter((habit) => !habit.archived);
    const today = todayKey();
    const doneToday = active.filter((habit) => habit.checkIns.includes(today)).length;
    const streaks = active.map((habit) => streakFor(habit.checkIns));
    const totalCheckIns = active.reduce((sum, habit) => sum + habit.checkIns.length, 0);
    const possible = Math.max(1, active.length * 30);
    return {
      created: habits.length,
      todayProgress: active.length ? Math.round((doneToday / active.length) * 100) : 0,
      current: Math.max(0, ...streaks.map((item) => item.current)),
      best: Math.max(0, ...streaks.map((item) => item.best)),
      rate: Math.min(100, Math.round((totalCheckIns / possible) * 100)),
    };
  }, [habits]);

  const visibleTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesSearch = `${task.title} ${task.notes} ${task.category}`.toLowerCase().includes(taskSearch.toLowerCase());
      const matchesFilter = taskFilter === 'All' || (taskFilter === 'Active' ? !task.completed : task.completed);
      return matchesSearch && matchesFilter;
    });
    return [...filtered].sort((a, b) => {
      if (taskSort === 'Due date') return (a.dueDate || '9999').localeCompare(b.dueDate || '9999');
      if (taskSort === 'Priority') return ['High', 'Medium', 'Low'].indexOf(a.priority) - ['High', 'Medium', 'Low'].indexOf(b.priority);
      return Number(b.pinned) - Number(a.pinned);
    });
  }, [tasks, taskSearch, taskFilter, taskSort]);

  const visibleHabits = useMemo(() => {
    const today = todayKey();
    const filtered = habits.filter((habit) => `${habit.name} ${habit.category}`.toLowerCase().includes(habitSearch.toLowerCase()));
    return [...filtered].sort((a, b) => {
      if (habitSort === 'Streak') return streakFor(b.checkIns).current - streakFor(a.checkIns).current;
      if (habitSort === 'Completion') return Number(b.checkIns.includes(today)) - Number(a.checkIns.includes(today));
      return Number(a.archived) - Number(b.archived);
    });
  }, [habits, habitSearch, habitSort]);

  const saveTask = (event: FormEvent) => {
    event.preventDefault();
    if (!taskDraft.title.trim()) return toast('Add a task title first.', 'info');
    const nextTask: Task = {
      ...taskDraft,
      id: editingTaskId || uid('task'),
      title: taskDraft.title.trim(),
      progress: taskDraft.completed ? 100 : taskDraft.progress,
      createdAt: editingTaskId ? tasks.find((task) => task.id === editingTaskId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };
    const next = editingTaskId ? tasks.map((task) => (task.id === editingTaskId ? nextTask : task)) : [nextTask, ...tasks];
    persistTasks(next);
    setTaskDraft(blankTask);
    setEditingTaskId(null);
    toast(editingTaskId ? 'Task updated.' : 'Task added.');
  };

  const editTask = (task: Task) => {
    setTaskDraft({ ...task });
    setEditingTaskId(task.id);
    taskInputRef.current?.focus();
  };

  const deleteTask = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    setConfirmAction({
      title: 'Delete task?',
      body: `This will remove "${task?.title || 'this task'}" permanently.`,
      run: () => {
        persistTasks(tasks.filter((item) => item.id !== id));
        toast('Task deleted.', 'danger');
      },
    });
  };

  const toggleTask = (id: string) => {
    persistTasks(tasks.map((task) => {
      if (task.id !== id) return task;
      const completed = !task.completed;
      return { ...task, completed, progress: completed ? 100 : Math.min(task.progress, 95) };
    }));
    toast('Task status updated.');
  };

  const moveTask = (targetId: string) => {
    if (!draggedTaskId || draggedTaskId === targetId) return;
    const current = [...tasks];
    const from = current.findIndex((task) => task.id === draggedTaskId);
    const to = current.findIndex((task) => task.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    persistTasks(current);
    setDraggedTaskId(null);
  };

  const bulkDeleteCompleted = () => {
    setConfirmAction({
      title: 'Delete completed tasks?',
      body: 'All completed tasks will be removed from your list.',
      run: () => {
        persistTasks(tasks.filter((task) => !task.completed));
        toast('Completed tasks cleared.', 'danger');
      },
    });
  };

  const clearAllTasks = () => {
    setConfirmAction({
      title: 'Clear all tasks?',
      body: 'This removes every task, including active and completed items.',
      run: () => {
        persistTasks([]);
        toast('All tasks cleared.', 'danger');
      },
    });
  };

  const saveHabit = (event: FormEvent) => {
    event.preventDefault();
    if (!habitDraft.name.trim()) return toast('Add a habit name first.', 'info');
    const nextHabit: Habit = {
      ...habitDraft,
      id: editingHabitId || uid('habit'),
      name: habitDraft.name.trim(),
      target: Math.max(1, habitDraft.target),
      checkIns: editingHabitId ? habits.find((habit) => habit.id === editingHabitId)?.checkIns || [] : [],
      archived: editingHabitId ? habits.find((habit) => habit.id === editingHabitId)?.archived || false : false,
      createdAt: editingHabitId ? habits.find((habit) => habit.id === editingHabitId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };
    const next = editingHabitId ? habits.map((habit) => (habit.id === editingHabitId ? nextHabit : habit)) : [nextHabit, ...habits];
    persistHabits(next);
    setHabitDraft(blankHabit);
    setEditingHabitId(null);
    toast(editingHabitId ? 'Habit updated.' : 'Habit created.');
  };

  const toggleHabitCheckIn = (id: string, date = todayKey()) => {
    persistHabits(habits.map((habit) => {
      if (habit.id !== id) return habit;
      const exists = habit.checkIns.includes(date);
      return { ...habit, checkIns: exists ? habit.checkIns.filter((item) => item !== date) : [...habit.checkIns, date].sort() };
    }));
    toast('Habit check-in updated.');
  };

  const editHabit = (habit: Habit) => {
    setHabitDraft({ ...habit });
    setEditingHabitId(habit.id);
  };

  const deleteHabit = (id: string) => {
    const habit = habits.find((item) => item.id === id);
    setConfirmAction({
      title: 'Delete habit?',
      body: `This removes "${habit?.name || 'this habit'}" and its history.`,
      run: () => {
        persistHabits(habits.filter((item) => item.id !== id));
        toast('Habit deleted.', 'danger');
      },
    });
  };

  const updateHabit = (id: string, patch: Partial<Habit>) => {
    persistHabits(habits.map((habit) => (habit.id === id ? { ...habit, ...patch } : habit)));
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="relative overflow-hidden rounded-[28px] border border-accent/10 bg-white/70 p-6 shadow-[var(--shadow-panel)] backdrop-blur-xl sm:p-8">
        <div className="absolute right-[-5rem] top-[-5rem] h-56 w-56 rounded-full bg-accent/12 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/10 bg-white/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent shadow-[var(--shadow-card)]">
              <ListChecks className="h-4 w-4" />
              Productivity command center
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-zinc-950 sm:text-5xl">Productivity</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
              Plan tasks, protect focus, and build habits with a tactile Candfolio workspace that saves everything on this device.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[520px]">
            {(activeTab === 'tasks'
              ? [
                  ['Total Tasks', taskStats.total, ListChecks],
                  ['Completed', taskStats.completed, CheckCircle2],
                  ['Pending', taskStats.pending, Clock],
                  ['Overdue', taskStats.overdue, Flame],
                  ['Completion %', `${taskStats.completion}%`, TrendingUp],
                ]
              : [
                  ['Habits Created', habitStats.created, Target],
                  ["Today's Progress", `${habitStats.todayProgress}%`, CheckCircle2],
                  ['Current Streak', habitStats.current, Flame],
                  ['Best Streak', habitStats.best, Star],
                  ['Completion Rate', `${habitStats.rate}%`, TrendingUp],
                ]).map(([label, value, Icon]) => (
              <StatCard key={label as string} label={label as string} value={value as string | number} icon={Icon as typeof ListChecks} />
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-[24px] border border-accent/10 bg-white/55 p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#eadfd8]/70 p-1 shadow-[var(--shadow-inset)]">
          <button onClick={() => setActiveTab('tasks')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === 'tasks' ? 'bg-white text-accent shadow-[var(--shadow-card)]' : 'text-zinc-500'}`}>
            To-Do List
          </button>
          <button onClick={() => setActiveTab('habits')} className={`rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === 'habits' ? 'bg-white text-accent shadow-[var(--shadow-card)]' : 'text-zinc-500'}`}>
            Habit Tracker
          </button>
        </div>
        <div className="text-xs font-semibold text-zinc-500">Shortcuts: <span className="text-accent">N</span> new task, <span className="text-accent">/</span> search</div>
      </div>

      {activeTab === 'tasks' ? (
        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.4fr]">
          <form onSubmit={saveTask} className="card p-5 sm:p-6">
            <SectionTitle icon={Plus} title={editingTaskId ? 'Edit task' : 'Add new task'} subtitle="Capture the work and add the useful context." />
            <div className="mt-5 space-y-4">
              <input ref={taskInputRef} value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} placeholder="Task title" className="w-full rounded-2xl border px-4 py-3 text-sm outline-none" aria-label="Task title" />
              <textarea value={taskDraft.notes} onChange={(event) => setTaskDraft({ ...taskDraft, notes: event.target.value })} placeholder="Notes or description" rows={3} className="w-full rounded-2xl border px-4 py-3 text-sm outline-none" aria-label="Task notes" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Priority" value={taskDraft.priority} onChange={(value) => setTaskDraft({ ...taskDraft, priority: value as Priority })} options={['High', 'Medium', 'Low']} />
                <Select label="Category" value={taskDraft.category} onChange={(value) => setTaskDraft({ ...taskDraft, category: value })} options={taskCategories} />
                <Field label="Due date" type="date" value={taskDraft.dueDate} onChange={(value) => setTaskDraft({ ...taskDraft, dueDate: value })} />
                <Field label="Due time" type="time" value={taskDraft.dueTime} onChange={(value) => setTaskDraft({ ...taskDraft, dueTime: value })} />
                <Select label="Recurring" value={taskDraft.recurring} onChange={(value) => setTaskDraft({ ...taskDraft, recurring: value as Recurrence })} options={['None', 'Daily', 'Weekly', 'Monthly']} />
                <Field label={`Progress ${taskDraft.progress}%`} type="range" value={String(taskDraft.progress)} min="0" max="100" onChange={(value) => setTaskDraft({ ...taskDraft, progress: Number(value) })} />
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-accent/10 bg-white/55 p-3 text-sm font-semibold text-zinc-700">
                <input type="checkbox" checked={taskDraft.pinned} onChange={(event) => setTaskDraft({ ...taskDraft, pinned: event.target.checked })} />
                Favorite or pin this task
              </label>
              <div className="flex gap-3">
                <button className="btn-primary flex-1" type="submit">{editingTaskId ? 'Save changes' : 'Add task'}</button>
                {editingTaskId && <button className="btn-secondary" type="button" onClick={() => { setEditingTaskId(null); setTaskDraft(blankTask); }}>Cancel</button>}
              </div>
            </div>
          </form>

          <div className="space-y-4">
            <Toolbar
              searchId="task-search"
              search={taskSearch}
              onSearch={setTaskSearch}
              filter={taskFilter}
              onFilter={(value) => setTaskFilter(value as TaskFilter)}
              sort={taskSort}
              onSort={setTaskSort}
              filters={['All', 'Active', 'Completed']}
              sorts={['Pinned first', 'Due date', 'Priority']}
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={bulkDeleteCompleted} disabled={!tasks.some((task) => task.completed)} className="btn-secondary text-xs disabled:opacity-45">Bulk delete completed</button>
              <button onClick={clearAllTasks} disabled={tasks.length === 0} className="btn-secondary text-xs disabled:opacity-45">Clear all tasks</button>
            </div>
            <div className="space-y-3">
              {visibleTasks.length === 0 ? (
                <EmptyState icon={ListChecks} title="No tasks in view" text="Add a task or adjust your search and filters." />
              ) : visibleTasks.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={editTask} onDelete={deleteTask} onToggle={toggleTask} onPin={(id) => persistTasks(tasks.map((item) => item.id === id ? { ...item, pinned: !item.pinned } : item))} onDragStart={setDraggedTaskId} onDrop={moveTask} />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.4fr]">
          <form onSubmit={saveHabit} className="card p-5 sm:p-6">
            <SectionTitle icon={Target} title={editingHabitId ? 'Edit habit' : 'Add habit'} subtitle="Design a ritual, choose its rhythm, and track consistency." />
            <div className="mt-5 space-y-4">
              <input value={habitDraft.name} onChange={(event) => setHabitDraft({ ...habitDraft, name: event.target.value })} placeholder="Habit name" className="w-full rounded-2xl border px-4 py-3 text-sm outline-none" aria-label="Habit name" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select label="Category" value={habitDraft.category} onChange={(value) => setHabitDraft({ ...habitDraft, category: value })} options={habitCategories} />
                <Select label="Frequency" value={habitDraft.frequency} onChange={(value) => setHabitDraft({ ...habitDraft, frequency: value as HabitFrequency })} options={['Daily', 'Weekly', 'Monthly', 'Custom']} />
                <Select label="Icon" value={habitDraft.icon} onChange={(value) => setHabitDraft({ ...habitDraft, icon: value })} options={habitIcons} />
                <Field label="Target per period" type="number" min="1" value={String(habitDraft.target)} onChange={(value) => setHabitDraft({ ...habitDraft, target: Number(value) })} />
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Color</p>
                <div className="flex flex-wrap gap-2">
                  {habitColors.map((color) => (
                    <button key={color} type="button" aria-label={`Use ${color}`} onClick={() => setHabitDraft({ ...habitDraft, color })} className={`h-9 w-9 rounded-full border-2 shadow-[var(--shadow-card)] ${habitDraft.color === color ? 'border-zinc-900' : 'border-white'}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn-primary flex-1" type="submit">{editingHabitId ? 'Save habit' : 'Add habit'}</button>
                {editingHabitId && <button className="btn-secondary" type="button" onClick={() => { setEditingHabitId(null); setHabitDraft(blankHabit); }}>Cancel</button>}
              </div>
            </div>
          </form>

          <div className="space-y-4">
            <Toolbar
              searchId="habit-search"
              search={habitSearch}
              onSearch={setHabitSearch}
              filter="All"
              onFilter={() => undefined}
              sort={habitSort}
              onSort={setHabitSort}
              filters={['All']}
              sorts={['Active first', 'Streak', 'Completion']}
            />
            {visibleHabits.length === 0 ? (
              <EmptyState icon={Target} title="No habits yet" text="Create a habit to start building your streak history." />
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {visibleHabits.map((habit) => (
                  <HabitCard key={habit.id} habit={habit} today={currentDay} onCheck={toggleHabitCheckIn} onEdit={editHabit} onDelete={deleteHabit} onArchive={(id) => updateHabit(id, { archived: !habit.archived })} onReset={(id) => updateHabit(id, { checkIns: [] })} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))} />
      {confirmAction && <ConfirmDialog action={confirmAction} onClose={() => setConfirmAction(null)} />}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-2xl border border-accent/10 bg-white/65 p-4 shadow-[var(--shadow-card)]">
      <Icon className="h-4 w-4 text-accent" />
      <p className="mt-3 text-2xl font-black text-zinc-950">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-white shadow-[var(--shadow-button)]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-xl font-black text-zinc-950">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

function Field(props: { label: string; type: string; value: string; onChange: (value: string) => void; min?: string; max?: string }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{props.label}</span>
      <input type={props.type} value={props.value} min={props.min} max={props.max} onChange={(event) => props.onChange(event.target.value)} className="w-full rounded-2xl border px-4 py-3 text-sm outline-none" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="relative block">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-2xl border px-4 py-3 pr-10 text-sm outline-none">
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </span>
    </label>
  );
}

function Toolbar(props: {
  searchId: string;
  search: string;
  onSearch: (value: string) => void;
  filter: string;
  onFilter: (value: string) => void;
  sort: string;
  onSort: (value: string) => void;
  filters: string[];
  sorts: string[];
}) {
  return (
    <div className="card grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]">
      <label className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input id={props.searchId} value={props.search} onChange={(event) => props.onSearch(event.target.value)} placeholder="Search" className="w-full rounded-2xl border py-3 pl-11 pr-4 text-sm outline-none" aria-label="Search productivity items" />
      </label>
      <Select label="Filter" value={props.filter} onChange={props.onFilter} options={props.filters} />
      <Select label="Sort" value={props.sort} onChange={props.onSort} options={props.sorts} />
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onToggle, onPin, onDragStart, onDrop }: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onPin: (id: string) => void;
  onDragStart: (id: string) => void;
  onDrop: (id: string) => void;
}) {
  return (
    <article draggable onDragStart={() => onDragStart(task.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => onDrop(task.id)} className={`card card-hover p-4 transition ${task.completed ? 'opacity-70' : ''}`}>
      <div className="flex gap-3">
        <button onClick={() => onToggle(task.id)} className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${task.completed ? 'bg-accent text-white' : 'bg-white text-accent'} shadow-[var(--shadow-card)]`} aria-label={task.completed ? 'Undo completed task' : 'Mark task completed'}>
          {task.completed ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <GripVertical className="h-4 w-4 cursor-grab text-zinc-300" />
            {task.pinned && <Star className="h-4 w-4 fill-[#C9A227] text-[#C9A227]" />}
            <h3 className={`font-bold text-zinc-950 ${task.completed ? 'line-through' : ''}`}>{task.title}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${priorityTone(task.priority)}`}>{task.priority}</span>
            {isOverdue(task) && <span className="rounded-full border border-rose-200 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Overdue</span>}
          </div>
          {task.notes && <p className="mt-2 text-sm leading-6 text-zinc-600">{task.notes}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-zinc-500">
            <span className="rounded-full bg-white/70 px-2.5 py-1">{task.category}</span>
            {task.dueDate && <span className="rounded-full bg-white/70 px-2.5 py-1"><Calendar className="mr-1 inline h-3 w-3" />{task.dueDate} {task.dueTime}</span>}
            {task.recurring !== 'None' && <span className="rounded-full bg-white/70 px-2.5 py-1"><RotateCcw className="mr-1 inline h-3 w-3" />{task.recurring}</span>}
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eadfd8] shadow-[var(--shadow-inset)]">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${task.progress}%` }} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <IconButton label="Pin task" onClick={() => onPin(task.id)} icon={Star} />
          <IconButton label="Edit task" onClick={() => onEdit(task)} icon={Pencil} />
          <IconButton label="Delete task" onClick={() => onDelete(task.id)} icon={Trash2} />
        </div>
      </div>
    </article>
  );
}

function HabitCard({ habit, today, onCheck, onEdit, onDelete, onArchive, onReset }: {
  habit: Habit;
  today: string;
  onCheck: (id: string, date?: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const Icon = habitIconMap[habit.icon as keyof typeof habitIconMap] || Sparkles;
  const done = habit.checkIns.includes(today);
  const streak = streakFor(habit.checkIns);
  const missed = Math.max(0, Math.floor((new Date(today).getTime() - new Date(habit.createdAt).getTime()) / 86400000) + 1 - habit.checkIns.length);
  const percent = Math.min(100, Math.round((habit.checkIns.length / Math.max(1, habit.target * 30)) * 100));
  const days = Array.from({ length: 28 }, (_, index) => todayKey(addDays(new Date(today), index - 27)));

  return (
    <article className={`card card-hover p-5 ${habit.archived ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[var(--shadow-button)]" style={{ backgroundColor: habit.color }}>
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-black text-zinc-950">{habit.name}</h3>
            <p className="mt-1 text-xs font-semibold text-zinc-500">{habit.category} · {habit.frequency}</p>
          </div>
        </div>
        <button onClick={() => onCheck(habit.id)} className={`rounded-2xl px-3 py-2 text-xs font-black transition ${done ? 'bg-accent text-white shadow-[var(--shadow-button)]' : 'bg-white text-accent shadow-[var(--shadow-card)]'}`}>
          {done ? 'Checked in' : 'Check in'}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <MiniMetric label="Current" value={`${streak.current}d`} />
        <MiniMetric label="Best" value={`${streak.best}d`} />
        <MiniMetric label="Missed" value={missed} />
      </div>

      <div className="mt-5 flex items-center gap-4">
        <ProgressRing value={percent} color={habit.color} />
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Completion history</p>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {days.map((day) => (
              <button key={day} aria-label={`Toggle ${day}`} onClick={() => onCheck(habit.id, day)} className="h-5 rounded-md border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]" style={{ backgroundColor: habit.checkIns.includes(day) ? habit.color : '#eadfd8' }} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => onEdit(habit)} className="btn-secondary text-xs"><Pencil className="mr-1 h-3.5 w-3.5" />Edit</button>
        <button onClick={() => onArchive(habit.id)} className="btn-secondary text-xs"><Archive className="mr-1 h-3.5 w-3.5" />{habit.archived ? 'Restore' : 'Archive'}</button>
        <button onClick={() => onReset(habit.id)} className="btn-secondary text-xs"><RefreshCw className="mr-1 h-3.5 w-3.5" />Reset</button>
        <button onClick={() => onDelete(habit.id)} className="btn-secondary text-xs"><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</button>
      </div>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-accent/10 bg-white/60 p-3 shadow-[var(--shadow-card)]">
      <p className="text-lg font-black text-accent">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
    </div>
  );
}

function ProgressRing({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r="31" fill="none" stroke="#eadfd8" strokeWidth="9" />
        <circle cx="40" cy="40" r="31" fill="none" stroke={color} strokeDasharray={`${(value / 100) * 195} 195`} strokeLinecap="round" strokeWidth="9" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-zinc-950">{value}%</span>
    </div>
  );
}

function IconButton({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/10 bg-white/70 text-zinc-500 shadow-[var(--shadow-card)] transition hover:text-accent">
      <Icon className="h-4 w-4" />
    </button>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="card flex min-h-64 flex-col items-center justify-center p-8 text-center">
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-accent/15 blur-xl" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-accent shadow-[var(--shadow-card)]">
          <Icon className="h-8 w-8" />
        </span>
      </div>
      <h3 className="mt-5 text-lg font-black text-zinc-950">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">{text}</p>
    </div>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed right-4 top-20 z-[70] space-y-2">
      {toasts.map((toast) => (
        <button key={toast.id} onClick={() => onDismiss(toast.id)} className={`flex min-w-64 items-center gap-3 rounded-2xl border bg-white/90 p-4 text-left text-sm font-semibold shadow-[var(--shadow-panel)] backdrop-blur ${toast.tone === 'danger' ? 'text-rose-700' : 'text-accent'}`}>
          <CheckCircle2 className="h-5 w-5" />
          {toast.message}
        </button>
      ))}
    </div>
  );
}

function ConfirmDialog({ action, onClose }: { action: { title: string; body: string; run: () => void }; onClose: () => void }) {
  const confirm = () => {
    action.run();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/25 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="card max-w-md p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-zinc-950">{action.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{action.body}</p>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-xl p-2 text-zinc-400 hover:text-accent">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={confirm} className="btn-primary">Confirm</button>
        </div>
      </div>
    </div>
  );
}
