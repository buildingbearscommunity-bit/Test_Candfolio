'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useKorsayStore } from '@/lib/store';
import { useSheetExams } from '@/lib/sheetExams';
import { 
  User, Mail, Award, FileText, CheckCircle2, 
  XCircle, ChevronRight, AlertTriangle, ShieldCheck, Save, Check 
} from 'lucide-react';
import BrandLogoIcon from '@/components/BrandLogoIcon';

export default function ProfilePage() {
  const { 
    guestProfile, 
    updateProfile, 
    attempts, 
    certificates, 
    resumes, 
    getCourseById 
  } = useKorsayStore();

  const { exams } = useSheetExams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Sync state with store on mount
  useEffect(() => {
    setName(guestProfile.name);
    setEmail(guestProfile.email);
    setHydrated(true);
  }, [guestProfile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      updateProfile(name.trim(), email.trim());
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 2000);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Guest profile</h1>
        <p className="text-sm text-zinc-500">
          Manage your local profile information and monitor your learning credentials.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
        <div className="flex items-start space-x-3.5 max-w-xl">
          <AlertTriangle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-indigo-900">Local guest progress active</h4>
            <p className="text-[11px] text-indigo-700/90 leading-relaxed font-normal">
              Your profile, exam scores, and resume drafts are saved locally in your browser storage. To secure your credentials permanently, access them across devices, and share verified badges, register for a full account.
            </p>
          </div>
        </div>
        <button className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-accent-hover transition-colors tap-active whitespace-nowrap self-start sm:self-auto shadow-2xs">
          Sign up to save progress
        </button>
      </div>

      {/* Grid: Edit fields (left) vs Activity history (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Edit Identity */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 uppercase tracking-wider">
            Identity details
          </h3>

          <form onSubmit={handleSave} className="bg-white border border-zinc-100 p-6 rounded-xl space-y-4 shadow-2xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 pl-10 pr-4 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-accent focus:bg-white transition-all duration-150 font-normal text-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 pl-10 pr-4 py-2 text-xs rounded-lg border border-zinc-200 focus:outline-none focus:border-accent focus:bg-white transition-all duration-150 font-normal text-zinc-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !email.trim()}
              className="w-full flex items-center justify-center space-x-1.5 bg-zinc-900 text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-zinc-800 transition-colors tap-active disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              {showSavedToast ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Details saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Update details</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Credential Ledger */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Verified Certificates */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 uppercase tracking-wider">
              Earned credentials ({certificates.length})
            </h3>

            {certificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certificates.map((cert) => {
                  const course = getCourseById(cert.course_id);
                  return (
                    <div 
                      key={cert.id}
                      className="bg-white border border-zinc-100 p-5 rounded-xl shadow-2xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full uppercase">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Verified</span>
                          </span>
                          <span className="text-[9px] text-zinc-400 font-semibold">{cert.issued_at}</span>
                        </div>
                        <h4 className="text-xs font-bold text-zinc-800 leading-normal">{course?.name}</h4>
                        <code className="text-[10px] text-zinc-500 font-semibold block">{cert.verification_code}</code>
                      </div>

                      <Link
                        href={`/certificate/${cert.verification_code}`}
                        className="w-full text-center py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/50 rounded-lg text-[11px] font-semibold text-zinc-700 transition-colors tap-active"
                      >
                        Verify certificate page
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-white border border-dashed border-zinc-200 rounded-xl">
                <Award className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-700">No credentials earned yet</p>
                <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Earn credentials by passing certification exams in your courses.
                </p>
              </div>
            )}
          </div>

          {/* 2. Exams Taken History */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 uppercase tracking-wider">
              Exam history ({attempts.length})
            </h3>

            {attempts.length > 0 ? (
              <div className="bg-white border border-zinc-100 rounded-xl divide-y divide-zinc-50 overflow-hidden shadow-2xs">
                {attempts.slice().reverse().map((att) => {
                  let courseId = att.exam_id;
                  if (courseId === 'fs-exam-1') courseId = 'full-stack-dev';
                  else if (courseId.startsWith('exam-')) courseId = courseId.replace('exam-', '');
                  const exam = exams.find(e => e.id === courseId || e.course_id === courseId);
                  return (
                    <div key={att.id} className="p-4 flex items-center justify-between gap-4 text-xs font-normal">
                      <div className="space-y-1">
                        <h4 className="font-bold text-zinc-800">{exam?.title || 'Certification Exam'}</h4>
                        <div className="flex space-x-3 text-zinc-400 text-[10px]">
                          <span>{att.date}</span>
                          <span>•</span>
                          <span className={`font-semibold ${att.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Score: {att.score}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {att.passed ? (
                          <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            <span>Failed</span>
                          </span>
                        )}
                        
                        <Link 
                          href={`/exam/${att.exam_id}/result?attemptId=${att.id}`}
                          className="p-1 rounded-lg hover:bg-zinc-50 text-zinc-400 hover:text-accent transition-colors tap-active"
                        >
                          <ChevronRight className="h-4.5 w-4.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-white border border-dashed border-zinc-200 rounded-xl">
                <BrandLogoIcon className="h-8 w-8 mx-auto mb-2 opacity-45" />
                <p className="text-xs font-semibold text-zinc-700">No exams taken yet</p>
                <p className="text-[10px] text-zinc-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                  Start practicing certification exams to evaluate your expertise.
                </p>
              </div>
            )}
          </div>

          {/* 3. Resumes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-3 uppercase tracking-wider">
              Saved resumes ({resumes.length})
            </h3>

            <div className="bg-white border border-zinc-100 p-4 rounded-xl shadow-2xs flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 bg-indigo-50 text-accent rounded-lg">
                  <FileText className="h-5 w-5 stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800">Primary Career Resume</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Template: Minimal · Last synced: {resumes[0] ? 'Just now' : 'Never'}
                  </p>
                </div>
              </div>

              <Link 
                href="/resume"
                className="text-xs font-semibold text-accent hover:text-accent-hover inline-flex items-center space-x-1"
              >
                <span>Edit resume</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
