'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  CalendarDays,
  Check,
  Copy,
  Download,
  GraduationCap,
  Heart,
  History,
  Landmark,
  PieChart,
  Printer,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type CalculatorCategory = 'Education' | 'Students' | 'College' | 'Career' | 'HR' | 'Finance' | 'Business' | 'General';

type Field = {
  key: string;
  label: string;
  type?: 'number' | 'text' | 'select' | 'date';
  placeholder?: string;
  suffix?: string;
  options?: string[];
  min?: number;
};

type CalcResult = {
  answer: string;
  detail: string;
  formula: string;
  example: string;
  metrics?: Array<{ label: string; value: string; percent?: number }>;
};

type CalculatorDefinition = {
  id: string;
  name: string;
  category: CalculatorCategory;
  icon: React.ElementType;
  description: string;
  fields: Field[];
  defaults: Record<string, string>;
  compute: (values: Record<string, string>) => CalcResult;
};

const categories: Array<{ name: CalculatorCategory; icon: React.ElementType; tone: string }> = [
  { name: 'Education', icon: GraduationCap, tone: 'from-[#872341] to-[#b83f68]' },
  { name: 'Students', icon: BookOpen, tone: 'from-[#c9a227] to-[#e6c75a]' },
  { name: 'College', icon: CalendarDays, tone: 'from-[#7b3250] to-[#c9a227]' },
  { name: 'Career', icon: BriefcaseBusiness, tone: 'from-[#872341] to-[#5f1930]' },
  { name: 'HR', icon: Users, tone: 'from-[#9f2a4d] to-[#c9a227]' },
  { name: 'Finance', icon: Landmark, tone: 'from-[#613348] to-[#872341]' },
  { name: 'Business', icon: BarChart3, tone: 'from-[#c9a227] to-[#872341]' },
  { name: 'General', icon: Sparkles, tone: 'from-[#7c2947] to-[#d7b54b]' },
];

const round = (value: number, digits = 2) => Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
const money = (value: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(round(value));
const n = (values: Record<string, string>, key: string) => Number(values[key] || 0);
const pct = (value: number) => `${round(value)}%`;
const required = (label: string, value: number) => {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a valid positive number.`);
};
const dateDiffDays = (start: string, end: string) => {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) throw new Error('Please choose valid dates.');
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

function simpleResult(answer: string, detail: string, formula: string, example: string, metrics?: CalcResult['metrics']): CalcResult {
  return { answer, detail, formula, example, metrics };
}

function createPercentCalculator(id: string, name: string, description: string, mode: string): CalculatorDefinition {
  return {
    id,
    name,
    category: 'Students',
    icon: PieChart,
    description,
    fields: [
      { key: 'a', label: 'Value A', type: 'number', placeholder: 'Enter value' },
      { key: 'b', label: 'Value B / Percentage', type: 'number', placeholder: 'Enter value' },
    ],
    defaults: { a: '80', b: '100' },
    compute: (values) => {
      const a = n(values, 'a');
      const b = n(values, 'b');
      required('Value A', a);
      required('Value B', b);
      if (mode === 'of') return simpleResult(String(round((a * b) / 100)), `${a}% of ${b} is ${round((a * b) / 100)}.`, '(Percentage x Number) / 100', '20% of 500 = 100');
      if (mode === 'increase') return simpleResult(String(round(a + (a * b) / 100)), `${a} increased by ${b}% is ${round(a + (a * b) / 100)}.`, 'Base + Base x Rate / 100', '100 increased by 15% = 115');
      if (mode === 'decrease') return simpleResult(String(round(a - (a * b) / 100)), `${a} decreased by ${b}% is ${round(a - (a * b) / 100)}.`, 'Base - Base x Rate / 100', '100 decreased by 15% = 85');
      return simpleResult(pct((a / b) * 100), `${a} is ${pct((a / b) * 100)} of ${b}.`, 'Part / Whole x 100', '45 out of 60 = 75%');
    },
  };
}

function buildCalc(id: string, name: string, category: CalculatorCategory, icon: React.ElementType, description: string, fields: Field[], defaults: Record<string, string>, compute: CalculatorDefinition['compute']): CalculatorDefinition {
  return { id, name, category, icon, description, fields, defaults, compute };
}

const calculatorDefinitions: CalculatorDefinition[] = [
  buildCalc('cgpa-percentage', 'CGPA to Percentage', 'Students', GraduationCap, 'Convert CGPA into percentage with common Indian formulas.', [
    { key: 'cgpa', label: 'CGPA', type: 'number', placeholder: '8.2' },
    { key: 'factor', label: 'Conversion factor', type: 'number', placeholder: '9.5' },
  ], { cgpa: '8.2', factor: '9.5' }, (v) => {
    const result = n(v, 'cgpa') * n(v, 'factor');
    return simpleResult(pct(result), `Estimated percentage is ${pct(result)}.`, 'CGPA x Conversion factor', '8.2 x 9.5 = 77.9%');
  }),
  buildCalc('percentage-cgpa', 'Percentage to CGPA', 'Students', GraduationCap, 'Convert percentage into CGPA using your institution factor.', [
    { key: 'percentage', label: 'Percentage', type: 'number', placeholder: '78' },
    { key: 'factor', label: 'Conversion factor', type: 'number', placeholder: '9.5' },
  ], { percentage: '78', factor: '9.5' }, (v) => simpleResult(String(round(n(v, 'percentage') / Math.max(n(v, 'factor'), 0.01))), 'Converted CGPA based on your factor.', 'Percentage / Factor', '78 / 9.5 = 8.21')),
  createPercentCalculator('percentage-basic', 'Percentage Calculator', 'Find percentage of a number.', 'of'),
  createPercentCalculator('percentage-increase', 'Increase Percentage', 'Calculate percentage increase.', 'increase'),
  createPercentCalculator('percentage-decrease', 'Decrease Percentage', 'Calculate percentage decrease.', 'decrease'),
  createPercentCalculator('what-percent', 'What Percent is X of Y', 'Find what percent one value is of another.', 'ratio'),
  buildCalc('grade-calculator', 'Grade Calculator', 'Students', GraduationCap, 'Calculate grade from earned and total marks.', [
    { key: 'earned', label: 'Marks earned', type: 'number' },
    { key: 'total', label: 'Total marks', type: 'number' },
  ], { earned: '84', total: '100' }, (v) => {
    const score = (n(v, 'earned') / Math.max(n(v, 'total'), 1)) * 100;
    const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'Needs improvement';
    return simpleResult(`${grade} (${pct(score)})`, `Your score is ${pct(score)}.`, 'Earned / Total x 100', '84 / 100 x 100 = 84%', [{ label: 'Score', value: pct(score), percent: score }]);
  }),
  buildCalc('exam-marks', 'Exam Marks Calculator', 'Students', BookOpen, 'Compute required final exam marks.', [
    { key: 'current', label: 'Current score %', type: 'number' },
    { key: 'target', label: 'Target score %', type: 'number' },
    { key: 'finalWeight', label: 'Final exam weight %', type: 'number' },
  ], { current: '72', target: '80', finalWeight: '40' }, (v) => {
    const needed = (n(v, 'target') - n(v, 'current') * (1 - n(v, 'finalWeight') / 100)) / (n(v, 'finalWeight') / 100);
    return simpleResult(pct(needed), `You need about ${pct(needed)} on the final.`, '(Target - Current x Coursework weight) / Final weight', '(80 - 72 x 0.6) / 0.4 = 92%');
  }),
  buildCalc('average-marks', 'Average Marks Calculator', 'Students', BarChart3, 'Find average marks across subjects.', [
    { key: 'marks', label: 'Marks separated by commas', type: 'text', placeholder: '78, 82, 91, 74' },
  ], { marks: '78, 82, 91, 74' }, (v) => {
    const values = v.marks.split(',').map((x) => Number(x.trim())).filter(Number.isFinite);
    if (values.length === 0) throw new Error('Enter at least one mark.');
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return simpleResult(String(round(avg)), `Average across ${values.length} entries.`, 'Sum of marks / Number of subjects', '(78 + 82 + 91 + 74) / 4 = 81.25');
  }),
  buildCalc('study-time', 'Study Time Calculator', 'Students', CalendarDays, 'Plan daily study hours before an exam.', [
    { key: 'chapters', label: 'Chapters/topics', type: 'number' },
    { key: 'hoursPerChapter', label: 'Hours per chapter', type: 'number' },
    { key: 'days', label: 'Days available', type: 'number' },
  ], { chapters: '12', hoursPerChapter: '2', days: '8' }, (v) => {
    const total = n(v, 'chapters') * n(v, 'hoursPerChapter');
    const daily = total / Math.max(n(v, 'days'), 1);
    return simpleResult(`${round(daily)} hrs/day`, `${round(total)} total study hours planned.`, 'Chapters x Hours per chapter / Days', '12 x 2 / 8 = 3 hrs/day');
  }),
  buildCalc('semester-planner', 'Semester Planner Calculator', 'Students', CalendarDays, 'Estimate weekly workload for semester targets.', [
    { key: 'subjects', label: 'Subjects', type: 'number' },
    { key: 'hours', label: 'Hours per subject/week', type: 'number' },
    { key: 'weeks', label: 'Weeks', type: 'number' },
  ], { subjects: '6', hours: '4', weeks: '16' }, (v) => simpleResult(`${round(n(v, 'subjects') * n(v, 'hours'))} hrs/week`, `Semester total is ${round(n(v, 'subjects') * n(v, 'hours') * n(v, 'weeks'))} hours.`, 'Subjects x Weekly hours', '6 x 4 = 24 hrs/week')),
  buildCalc('age-calculator', 'Age Calculator', 'General', CalendarDays, 'Calculate age from date of birth.', [
    { key: 'dob', label: 'Date of birth', type: 'date' },
    { key: 'asOf', label: 'As of date', type: 'date' },
  ], { dob: '2000-01-01', asOf: new Date().toISOString().slice(0, 10) }, (v) => {
    const days = dateDiffDays(v.dob, v.asOf);
    return simpleResult(`${Math.floor(days / 365.25)} years`, `${days} days old.`, 'Difference between dates / 365.25', '2000-01-01 to today gives age in years');
  }),
  buildCalc('date-difference', 'Date Difference Calculator', 'General', CalendarDays, 'Find days between two dates.', [
    { key: 'start', label: 'Start date', type: 'date' },
    { key: 'end', label: 'End date', type: 'date' },
  ], { start: '2026-01-01', end: '2026-12-31' }, (v) => simpleResult(`${dateDiffDays(v.start, v.end)} days`, 'Calendar day difference calculated from midnight dates.', 'End date - Start date', '2026-01-01 to 2026-12-31 = 364 days')),
  buildCalc('time-calculator', 'Time Calculator', 'General', CalendarDays, 'Convert hours, minutes, and seconds.', [
    { key: 'hours', label: 'Hours', type: 'number' },
    { key: 'minutes', label: 'Minutes', type: 'number' },
    { key: 'seconds', label: 'Seconds', type: 'number' },
  ], { hours: '2', minutes: '30', seconds: '15' }, (v) => {
    const seconds = n(v, 'hours') * 3600 + n(v, 'minutes') * 60 + n(v, 'seconds');
    return simpleResult(`${seconds} seconds`, `${round(seconds / 60)} minutes or ${round(seconds / 3600)} hours.`, 'h x 3600 + m x 60 + s', '2h 30m 15s = 9015s');
  }),
  buildCalc('unit-converter', 'Unit Converter', 'General', RefreshCw, 'Convert common length units.', [
    { key: 'value', label: 'Value', type: 'number' },
    { key: 'from', label: 'From', type: 'select', options: ['meter', 'kilometer', 'mile', 'foot'] },
    { key: 'to', label: 'To', type: 'select', options: ['meter', 'kilometer', 'mile', 'foot'] },
  ], { value: '5', from: 'kilometer', to: 'mile' }, (v) => {
    const map: Record<string, number> = { meter: 1, kilometer: 1000, mile: 1609.344, foot: 0.3048 };
    const result = n(v, 'value') * map[v.from] / map[v.to];
    return simpleResult(`${round(result, 4)} ${v.to}`, `${v.value} ${v.from} equals ${round(result, 4)} ${v.to}.`, 'Value x From factor / To factor', '5 km = 3.1069 miles');
  }),
  buildCalc('bmi', 'BMI Calculator', 'General', Activity, 'Calculate body mass index.', [
    { key: 'weight', label: 'Weight', type: 'number', suffix: 'kg' },
    { key: 'height', label: 'Height', type: 'number', suffix: 'cm' },
  ], { weight: '70', height: '172' }, (v) => {
    const bmi = n(v, 'weight') / Math.pow(n(v, 'height') / 100, 2);
    return simpleResult(String(round(bmi)), `BMI category: ${bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'}.`, 'Weight / Height²', '70 / 1.72² = 23.66', [{ label: 'BMI', value: String(round(bmi)), percent: Math.min(100, bmi * 2.5) }]);
  }),
  buildCalc('scholarship-eligibility', 'Scholarship Eligibility Calculator', 'Students', Star, 'Estimate eligibility from score and income.', [
    { key: 'score', label: 'Academic score %', type: 'number' },
    { key: 'income', label: 'Annual family income', type: 'number' },
  ], { score: '86', income: '240000' }, (v) => {
    const eligible = n(v, 'score') >= 75 && n(v, 'income') <= 800000;
    return simpleResult(eligible ? 'Eligible' : 'Review needed', eligible ? 'Meets common merit and income thresholds.' : 'One or more thresholds need review.', 'Score >= 75% and income <= 800000', '86% and 240000 income = Eligible');
  }),
  buildCalc('rank-predictor', 'Rank Predictor', 'Students', BarChart3, 'Predict rank from percentile and applicants.', [
    { key: 'percentile', label: 'Percentile', type: 'number' },
    { key: 'applicants', label: 'Total applicants', type: 'number' },
  ], { percentile: '96.5', applicants: '100000' }, (v) => {
    const rank = Math.ceil(((100 - n(v, 'percentile')) / 100) * n(v, 'applicants')) + 1;
    return simpleResult(`#${money(rank)}`, 'Estimated rank from percentile distribution.', '((100 - Percentile) / 100) x Applicants + 1', '96.5 percentile among 100000 = rank around 3501');
  }),
];

const financeCalculators: CalculatorDefinition[] = [
  buildCalc('loan-emi', 'Loan EMI Calculator', 'Finance', Landmark, 'Calculate monthly EMI for any loan.', [
    { key: 'principal', label: 'Loan amount', type: 'number' },
    { key: 'rate', label: 'Annual interest %', type: 'number' },
    { key: 'months', label: 'Tenure in months', type: 'number' },
  ], { principal: '500000', rate: '10', months: '60' }, (v) => {
    const p = n(v, 'principal'), r = n(v, 'rate') / 1200, m = n(v, 'months');
    const emi = p * r * Math.pow(1 + r, m) / (Math.pow(1 + r, m) - 1);
    return simpleResult(`₹${money(emi)}`, `Total payable: ₹${money(emi * m)}. Interest: ₹${money(emi * m - p)}.`, 'P x r x (1+r)^n / ((1+r)^n - 1)', '500000 at 10% for 60 months = ₹10,624 EMI');
  }),
  buildCalc('simple-interest', 'Simple Interest', 'Finance', PieChart, 'Calculate simple interest.', [
    { key: 'principal', label: 'Principal', type: 'number' },
    { key: 'rate', label: 'Rate %', type: 'number' },
    { key: 'years', label: 'Years', type: 'number' },
  ], { principal: '100000', rate: '8', years: '3' }, (v) => simpleResult(`₹${money(n(v, 'principal') * n(v, 'rate') * n(v, 'years') / 100)}`, 'Simple interest only, not compounding.', 'P x R x T / 100', '100000 x 8 x 3 / 100 = 24000')),
  buildCalc('compound-interest', 'Compound Interest', 'Finance', BarChart3, 'Calculate compounded maturity value.', [
    { key: 'principal', label: 'Principal', type: 'number' },
    { key: 'rate', label: 'Rate %', type: 'number' },
    { key: 'years', label: 'Years', type: 'number' },
    { key: 'frequency', label: 'Compounds per year', type: 'number' },
  ], { principal: '100000', rate: '8', years: '5', frequency: '4' }, (v) => {
    const amount = n(v, 'principal') * Math.pow(1 + n(v, 'rate') / 100 / n(v, 'frequency'), n(v, 'frequency') * n(v, 'years'));
    return simpleResult(`₹${money(amount)}`, `Interest earned: ₹${money(amount - n(v, 'principal'))}.`, 'P(1 + r/n)^(nt)', '100000 at 8% quarterly for 5 years = ₹148,595');
  }),
  buildCalc('gst', 'GST Calculator', 'Finance', Calculator, 'Calculate GST inclusive or exclusive totals.', [
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'rate', label: 'GST rate %', type: 'number' },
    { key: 'mode', label: 'Mode', type: 'select', options: ['exclusive', 'inclusive'] },
  ], { amount: '1000', rate: '18', mode: 'exclusive' }, (v) => {
    const amount = n(v, 'amount'), rate = n(v, 'rate');
    const tax = v.mode === 'inclusive' ? amount - amount / (1 + rate / 100) : amount * rate / 100;
    const total = v.mode === 'inclusive' ? amount : amount + tax;
    return simpleResult(`₹${money(total)}`, `GST amount: ₹${money(tax)}. Base: ₹${money(total - tax)}.`, v.mode === 'inclusive' ? 'Tax = Total - Total / (1 + Rate)' : 'Total = Amount + Amount x Rate', '1000 + 18% GST = 1180');
  }),
  buildCalc('income-tax', 'Income Tax Calculator', 'Finance', Landmark, 'Estimate Indian new-regime income tax.', [
    { key: 'income', label: 'Annual taxable income', type: 'number' },
    { key: 'deductions', label: 'Deductions', type: 'number' },
  ], { income: '1200000', deductions: '50000' }, (v) => {
    const taxable = Math.max(0, n(v, 'income') - n(v, 'deductions'));
    const slabs = [[300000, 0], [300000, 0.05], [300000, 0.1], [300000, 0.15], [300000, 0.2], [Infinity, 0.3]];
    let left = taxable, tax = 0;
    for (const [limit, rate] of slabs) {
      const part = Math.min(left, limit);
      tax += part * rate;
      left -= part;
      if (left <= 0) break;
    }
    tax *= 1.04;
    return simpleResult(`₹${money(tax)}`, `Taxable income: ₹${money(taxable)} including estimated cess.`, 'Progressive slab tax + 4% cess', '12L taxable income gives slab-based estimate');
  }),
  buildCalc('tds', 'TDS Calculator', 'Finance', Calculator, 'Calculate tax deducted at source.', [
    { key: 'amount', label: 'Payment amount', type: 'number' },
    { key: 'rate', label: 'TDS rate %', type: 'number' },
  ], { amount: '50000', rate: '10' }, (v) => simpleResult(`₹${money(n(v, 'amount') * n(v, 'rate') / 100)}`, `Net payable: ₹${money(n(v, 'amount') * (1 - n(v, 'rate') / 100))}.`, 'Amount x TDS rate / 100', '50000 x 10% = 5000')),
  buildCalc('profit-margin', 'Profit Margin Calculator', 'Finance', PieChart, 'Calculate profit margin percentage.', [
    { key: 'revenue', label: 'Revenue', type: 'number' },
    { key: 'cost', label: 'Cost', type: 'number' },
  ], { revenue: '150000', cost: '95000' }, (v) => {
    const profit = n(v, 'revenue') - n(v, 'cost');
    return simpleResult(pct((profit / Math.max(n(v, 'revenue'), 1)) * 100), `Profit: ₹${money(profit)}.`, 'Profit / Revenue x 100', '(150000 - 95000) / 150000 = 36.67%');
  }),
  buildCalc('break-even', 'Break-even Calculator', 'Business', BarChart3, 'Find units needed to break even.', [
    { key: 'fixed', label: 'Fixed cost', type: 'number' },
    { key: 'price', label: 'Selling price/unit', type: 'number' },
    { key: 'variable', label: 'Variable cost/unit', type: 'number' },
  ], { fixed: '200000', price: '1000', variable: '600' }, (v) => {
    const units = n(v, 'fixed') / Math.max(n(v, 'price') - n(v, 'variable'), 0.01);
    return simpleResult(`${Math.ceil(units)} units`, `Contribution per unit: ₹${money(n(v, 'price') - n(v, 'variable'))}.`, 'Fixed cost / (Price - Variable cost)', '200000 / (1000 - 600) = 500 units');
  }),
  buildCalc('roi', 'ROI Calculator', 'Finance', BarChart3, 'Calculate return on investment.', [
    { key: 'gain', label: 'Final value / gain', type: 'number' },
    { key: 'cost', label: 'Investment cost', type: 'number' },
  ], { gain: '135000', cost: '100000' }, (v) => simpleResult(pct(((n(v, 'gain') - n(v, 'cost')) / Math.max(n(v, 'cost'), 1)) * 100), `Net gain: ₹${money(n(v, 'gain') - n(v, 'cost'))}.`, '(Gain - Cost) / Cost x 100', '(135000 - 100000) / 100000 = 35%')),
  buildCalc('depreciation', 'Depreciation Calculator', 'Finance', Calculator, 'Calculate straight-line depreciation.', [
    { key: 'cost', label: 'Asset cost', type: 'number' },
    { key: 'salvage', label: 'Salvage value', type: 'number' },
    { key: 'years', label: 'Useful life years', type: 'number' },
  ], { cost: '500000', salvage: '50000', years: '5' }, (v) => simpleResult(`₹${money((n(v, 'cost') - n(v, 'salvage')) / Math.max(n(v, 'years'), 1))}/year`, 'Straight-line depreciation estimate.', '(Cost - Salvage) / Useful life', '(500000 - 50000) / 5 = 90000')),
  buildCalc('cash-flow', 'Cash Flow Calculator', 'Finance', BarChart3, 'Calculate net cash flow.', [
    { key: 'inflows', label: 'Inflows comma-separated', type: 'text', placeholder: '50000,25000' },
    { key: 'outflows', label: 'Outflows comma-separated', type: 'text', placeholder: '22000,18000' },
  ], { inflows: '50000,25000', outflows: '22000,18000' }, (v) => {
    const sum = (s: string) => s.split(',').reduce((a, x) => a + Number(x.trim() || 0), 0);
    const net = sum(v.inflows) - sum(v.outflows);
    return simpleResult(`₹${money(net)}`, `Inflows minus outflows.`, 'Total inflows - Total outflows', '(50000+25000) - (22000+18000) = 35000');
  }),
  buildCalc('currency-converter', 'Currency Converter', 'Finance', RefreshCw, 'Convert currency using your own rate.', [
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'rate', label: 'Exchange rate', type: 'number' },
  ], { amount: '100', rate: '83.2' }, (v) => simpleResult(`₹${money(n(v, 'amount') * n(v, 'rate'))}`, 'Live rates vary, update the exchange rate before final use.', 'Amount x Exchange rate', '100 USD x 83.2 = 8320 INR')),
  buildCalc('invoice-total', 'Invoice Total Calculator', 'Business', Calculator, 'Calculate invoice subtotal, tax, and discount.', [
    { key: 'subtotal', label: 'Subtotal', type: 'number' },
    { key: 'tax', label: 'Tax %', type: 'number' },
    { key: 'discount', label: 'Discount %', type: 'number' },
  ], { subtotal: '25000', tax: '18', discount: '5' }, (v) => {
    const discounted = n(v, 'subtotal') * (1 - n(v, 'discount') / 100);
    const total = discounted * (1 + n(v, 'tax') / 100);
    return simpleResult(`₹${money(total)}`, `Discounted subtotal: ₹${money(discounted)}.`, 'Subtotal x (1 - Discount) x (1 + Tax)', '25000 less 5% plus 18% = 28025');
  }),
  buildCalc('savings', 'Savings Calculator', 'Finance', Landmark, 'Estimate savings after regular contributions.', [
    { key: 'initial', label: 'Initial savings', type: 'number' },
    { key: 'monthly', label: 'Monthly savings', type: 'number' },
    { key: 'months', label: 'Months', type: 'number' },
  ], { initial: '25000', monthly: '5000', months: '24' }, (v) => simpleResult(`₹${money(n(v, 'initial') + n(v, 'monthly') * n(v, 'months'))}`, 'Simple savings without interest.', 'Initial + Monthly x Months', '25000 + 5000 x 24 = 145000')),
  buildCalc('investment-growth', 'Investment Growth Calculator', 'Finance', BarChart3, 'Project investment growth with monthly contributions.', [
    { key: 'initial', label: 'Initial amount', type: 'number' },
    { key: 'monthly', label: 'Monthly contribution', type: 'number' },
    { key: 'rate', label: 'Annual return %', type: 'number' },
    { key: 'years', label: 'Years', type: 'number' },
  ], { initial: '100000', monthly: '10000', rate: '12', years: '10' }, (v) => {
    const r = n(v, 'rate') / 1200, months = n(v, 'years') * 12;
    const amount = n(v, 'initial') * Math.pow(1 + r, months) + n(v, 'monthly') * ((Math.pow(1 + r, months) - 1) / r);
    return simpleResult(`₹${money(amount)}`, 'Projected future value with monthly compounding.', 'FV initial + FV annuity', '1L + 10K/month at 12% for 10 years');
  }),
  buildCalc('discount', 'Discount Calculator', 'Finance', Calculator, 'Find sale price after discount.', [
    { key: 'price', label: 'Original price', type: 'number' },
    { key: 'discount', label: 'Discount %', type: 'number' },
  ], { price: '2000', discount: '25' }, (v) => simpleResult(`₹${money(n(v, 'price') * (1 - n(v, 'discount') / 100))}`, `You save ₹${money(n(v, 'price') * n(v, 'discount') / 100)}.`, 'Price x (1 - Discount)', '2000 less 25% = 1500')),
  buildCalc('markup', 'Markup Calculator', 'Business', Calculator, 'Calculate selling price from markup.', [
    { key: 'cost', label: 'Cost', type: 'number' },
    { key: 'markup', label: 'Markup %', type: 'number' },
  ], { cost: '800', markup: '40' }, (v) => simpleResult(`₹${money(n(v, 'cost') * (1 + n(v, 'markup') / 100))}`, 'Selling price from cost plus markup.', 'Cost x (1 + Markup)', '800 plus 40% = 1120')),
];

const careerCalculators: CalculatorDefinition[] = [
  buildCalc('salary', 'Salary Calculator', 'Career', BriefcaseBusiness, 'Break down CTC, gross, deductions, and take-home pay.', [
    { key: 'ctc', label: 'Annual CTC', type: 'number' },
    { key: 'basicPct', label: 'Basic salary %', type: 'number' },
    { key: 'hraPct', label: 'HRA % of basic', type: 'number' },
    { key: 'pfPct', label: 'PF % of basic', type: 'number' },
    { key: 'tax', label: 'Annual income tax', type: 'number' },
    { key: 'bonus', label: 'Annual bonus', type: 'number' },
  ], { ctc: '1200000', basicPct: '40', hraPct: '50', pfPct: '12', tax: '65000', bonus: '50000' }, (v) => {
    const ctc = n(v, 'ctc'), basic = ctc * n(v, 'basicPct') / 100, hra = basic * n(v, 'hraPct') / 100, pf = basic * n(v, 'pfPct') / 100;
    const special = Math.max(0, ctc - basic - hra - pf - n(v, 'bonus'));
    const net = ctc - pf - n(v, 'tax');
    return simpleResult(`₹${money(net / 12)}/month`, `Basic ₹${money(basic)}, HRA ₹${money(hra)}, Special allowance ₹${money(special)}, annual PF ₹${money(pf)}.`, 'Take-home = CTC - PF - Tax, divided monthly', '12L CTC with 12% PF and 65K tax gives monthly net', [
      { label: 'Basic', value: `₹${money(basic)}`, percent: basic / ctc * 100 },
      { label: 'HRA', value: `₹${money(hra)}`, percent: hra / ctc * 100 },
      { label: 'Net', value: `₹${money(net)}`, percent: net / ctc * 100 },
    ]);
  }),
  buildCalc('in-hand-salary', 'In-Hand Salary Calculator', 'Career', BriefcaseBusiness, 'Estimate monthly in-hand salary.', [
    { key: 'gross', label: 'Monthly gross', type: 'number' },
    { key: 'deductions', label: 'Monthly deductions', type: 'number' },
  ], { gross: '90000', deductions: '12500' }, (v) => simpleResult(`₹${money(n(v, 'gross') - n(v, 'deductions'))}`, 'Monthly gross minus recurring deductions.', 'Gross - Deductions', '90000 - 12500 = 77500')),
  buildCalc('pf', 'PF Calculator', 'Career', Landmark, 'Calculate employee and employer PF.', [
    { key: 'basic', label: 'Monthly basic', type: 'number' },
    { key: 'rate', label: 'PF rate %', type: 'number' },
  ], { basic: '40000', rate: '12' }, (v) => {
    const monthly = n(v, 'basic') * n(v, 'rate') / 100;
    return simpleResult(`₹${money(monthly * 2)}/month`, `Employee PF ₹${money(monthly)} + employer PF ₹${money(monthly)}.`, 'Basic x Rate x 2', '40000 x 12% x 2 = 9600');
  }),
  buildCalc('gratuity', 'Gratuity Calculator', 'Career', Landmark, 'Estimate gratuity payable.', [
    { key: 'basic', label: 'Last drawn basic + DA monthly', type: 'number' },
    { key: 'years', label: 'Completed years', type: 'number' },
  ], { basic: '60000', years: '6' }, (v) => simpleResult(`₹${money((15 * n(v, 'basic') * n(v, 'years')) / 26)}`, 'Standard gratuity estimate for covered employees.', '15 x Salary x Years / 26', '15 x 60000 x 6 / 26 = 207692')),
  buildCalc('leave-encashment', 'Leave Encashment Calculator', 'Career', CalendarDays, 'Calculate leave encashment value.', [
    { key: 'salary', label: 'Monthly salary', type: 'number' },
    { key: 'days', label: 'Unused leave days', type: 'number' },
  ], { salary: '75000', days: '18' }, (v) => simpleResult(`₹${money(n(v, 'salary') / 30 * n(v, 'days'))}`, 'Daily salary multiplied by unused leave days.', 'Monthly salary / 30 x Days', '75000 / 30 x 18 = 45000')),
  buildCalc('notice-period', 'Notice Period Calculator', 'Career', CalendarDays, 'Calculate notice end date.', [
    { key: 'start', label: 'Start date', type: 'date' },
    { key: 'days', label: 'Notice days', type: 'number' },
  ], { start: new Date().toISOString().slice(0, 10), days: '60' }, (v) => {
    const end = new Date(v.start);
    end.setDate(end.getDate() + n(v, 'days'));
    return simpleResult(end.toISOString().slice(0, 10), `${v.days} calendar days from ${v.start}.`, 'Start date + Notice days', '2026-08-04 + 60 days');
  }),
  buildCalc('experience', 'Experience Calculator', 'Career', CalendarDays, 'Calculate work experience duration.', [
    { key: 'start', label: 'Joining date', type: 'date' },
    { key: 'end', label: 'End date', type: 'date' },
  ], { start: '2022-01-01', end: new Date().toISOString().slice(0, 10) }, (v) => {
    const days = Math.max(0, dateDiffDays(v.start, v.end));
    return simpleResult(`${Math.floor(days / 365.25)}y ${Math.floor((days % 365.25) / 30.44)}m`, `${days} total days of experience.`, 'End date - Start date', '2022-01-01 to today');
  }),
  buildCalc('work-hours', 'Work Hours Calculator', 'Career', CalendarDays, 'Calculate weekly work hours.', [
    { key: 'daily', label: 'Hours per day', type: 'number' },
    { key: 'days', label: 'Working days/week', type: 'number' },
  ], { daily: '8', days: '5' }, (v) => simpleResult(`${round(n(v, 'daily') * n(v, 'days'))} hrs/week`, 'Weekly work commitment.', 'Hours per day x Days', '8 x 5 = 40')),
  buildCalc('overtime', 'Overtime Calculator', 'Career', Calculator, 'Calculate overtime payout.', [
    { key: 'hourly', label: 'Hourly rate', type: 'number' },
    { key: 'hours', label: 'Overtime hours', type: 'number' },
    { key: 'multiplier', label: 'Multiplier', type: 'number' },
  ], { hourly: '500', hours: '12', multiplier: '1.5' }, (v) => simpleResult(`₹${money(n(v, 'hourly') * n(v, 'hours') * n(v, 'multiplier'))}`, 'Overtime payout based on multiplier.', 'Rate x Hours x Multiplier', '500 x 12 x 1.5 = 9000')),
  buildCalc('retirement', 'Retirement Calculator', 'Career', Landmark, 'Estimate retirement corpus gap.', [
    { key: 'currentAge', label: 'Current age', type: 'number' },
    { key: 'retireAge', label: 'Retirement age', type: 'number' },
    { key: 'monthlyNeed', label: 'Monthly need after retirement', type: 'number' },
  ], { currentAge: '30', retireAge: '60', monthlyNeed: '80000' }, (v) => {
    const years = Math.max(1, n(v, 'retireAge') - n(v, 'currentAge'));
    const corpus = n(v, 'monthlyNeed') * 12 * 25;
    return simpleResult(`₹${money(corpus)}`, `${years} years left to build the corpus.`, 'Annual retirement need x 25', '80000 x 12 x 25 = 2.4 crore');
  }),
  buildCalc('increment', 'Increment Calculator', 'Career', BarChart3, 'Calculate revised salary after increment.', [
    { key: 'salary', label: 'Current salary', type: 'number' },
    { key: 'increment', label: 'Increment %', type: 'number' },
  ], { salary: '900000', increment: '12' }, (v) => simpleResult(`₹${money(n(v, 'salary') * (1 + n(v, 'increment') / 100))}`, `Increase amount: ₹${money(n(v, 'salary') * n(v, 'increment') / 100)}.`, 'Salary x (1 + Increment%)', '900000 + 12% = 1008000')),
  buildCalc('promotion-eligibility', 'Promotion Eligibility Calculator', 'Career', Star, 'Score promotion readiness.', [
    { key: 'performance', label: 'Performance score / 100', type: 'number' },
    { key: 'tenure', label: 'Tenure years', type: 'number' },
    { key: 'skills', label: 'Skill readiness / 100', type: 'number' },
  ], { performance: '88', tenure: '2', skills: '82' }, (v) => {
    const score = n(v, 'performance') * 0.5 + Math.min(100, n(v, 'tenure') * 25) * 0.2 + n(v, 'skills') * 0.3;
    return simpleResult(score >= 75 ? 'Strong candidate' : 'Needs growth plan', `Readiness score: ${pct(score)}.`, 'Performance 50% + Tenure 20% + Skills 30%', '88, 2 years, 82 skills = strong');
  }),
  buildCalc('freelancer-hourly-rate', 'Freelancer Hourly Rate Calculator', 'Career', Calculator, 'Calculate hourly rate from annual target.', [
    { key: 'income', label: 'Target annual income', type: 'number' },
    { key: 'billableHours', label: 'Billable hours/year', type: 'number' },
    { key: 'expenses', label: 'Annual expenses', type: 'number' },
  ], { income: '1800000', billableHours: '1200', expenses: '200000' }, (v) => simpleResult(`₹${money((n(v, 'income') + n(v, 'expenses')) / Math.max(n(v, 'billableHours'), 1))}/hr`, 'Target income plus expenses divided by billable hours.', '(Income + Expenses) / Billable hours', '(18L + 2L) / 1200 = 1667/hr')),
];

const hrCalculators: CalculatorDefinition[] = [
  buildCalc('employee-cost', 'Employee Cost Calculator', 'HR', Users, 'Estimate full employer cost.', [
    { key: 'salary', label: 'Annual salary', type: 'number' },
    { key: 'benefits', label: 'Benefits %', type: 'number' },
    { key: 'overhead', label: 'Overhead %', type: 'number' },
  ], { salary: '1000000', benefits: '18', overhead: '12' }, (v) => simpleResult(`₹${money(n(v, 'salary') * (1 + (n(v, 'benefits') + n(v, 'overhead')) / 100))}`, 'Full loaded employee cost.', 'Salary x (1 + Benefits + Overhead)', '10L with 30% load = 13L')),
  buildCalc('payroll', 'Payroll Calculator', 'HR', Calculator, 'Calculate net payroll for a team.', [
    { key: 'employees', label: 'Employees', type: 'number' },
    { key: 'avgSalary', label: 'Average monthly salary', type: 'number' },
    { key: 'deductions', label: 'Average deductions %', type: 'number' },
  ], { employees: '25', avgSalary: '65000', deductions: '12' }, (v) => simpleResult(`₹${money(n(v, 'employees') * n(v, 'avgSalary') * (1 - n(v, 'deductions') / 100))}/month`, 'Estimated net monthly payroll.', 'Employees x Avg salary x (1 - deductions)', '25 x 65000 x 88% = 14.3L')),
  buildCalc('salary-revision', 'Salary Revision Calculator', 'HR', BarChart3, 'Calculate revised compensation budget.', [
    { key: 'headcount', label: 'Headcount', type: 'number' },
    { key: 'avgSalary', label: 'Average annual salary', type: 'number' },
    { key: 'revision', label: 'Revision %', type: 'number' },
  ], { headcount: '40', avgSalary: '900000', revision: '10' }, (v) => simpleResult(`₹${money(n(v, 'headcount') * n(v, 'avgSalary') * n(v, 'revision') / 100)}`, 'Additional annual budget required.', 'Headcount x Avg salary x Revision%', '40 x 9L x 10% = 36L')),
  buildCalc('leave-balance', 'Leave Balance Calculator', 'HR', CalendarDays, 'Calculate remaining leave.', [
    { key: 'opening', label: 'Opening balance', type: 'number' },
    { key: 'earned', label: 'Earned leave', type: 'number' },
    { key: 'used', label: 'Used leave', type: 'number' },
  ], { opening: '6', earned: '12', used: '8' }, (v) => simpleResult(`${round(n(v, 'opening') + n(v, 'earned') - n(v, 'used'))} days`, 'Available leave balance.', 'Opening + Earned - Used', '6 + 12 - 8 = 10')),
  buildCalc('working-days', 'Working Days Calculator', 'HR', CalendarDays, 'Estimate working days between dates.', [
    { key: 'start', label: 'Start date', type: 'date' },
    { key: 'end', label: 'End date', type: 'date' },
  ], { start: '2026-08-01', end: '2026-08-31' }, (v) => {
    const start = new Date(v.start), end = new Date(v.end);
    let days = 0;
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) if (![0, 6].includes(d.getDay())) days += 1;
    return simpleResult(`${days} working days`, 'Excludes Saturdays and Sundays.', 'Calendar days - weekends', 'August 2026 has 21 weekdays');
  }),
  buildCalc('recruitment-cost', 'Recruitment Cost Calculator', 'HR', Users, 'Calculate cost per hire.', [
    { key: 'ads', label: 'Job ads/platform cost', type: 'number' },
    { key: 'agency', label: 'Agency/recruiter cost', type: 'number' },
    { key: 'interviews', label: 'Interview cost', type: 'number' },
    { key: 'hires', label: 'Hires', type: 'number' },
  ], { ads: '50000', agency: '120000', interviews: '30000', hires: '4' }, (v) => simpleResult(`₹${money((n(v, 'ads') + n(v, 'agency') + n(v, 'interviews')) / Math.max(n(v, 'hires'), 1))}/hire`, 'Total recruiting spend divided by hires.', '(Ads + Agency + Interviews) / Hires', '200000 / 4 = 50000')),
  buildCalc('attrition-rate', 'Attrition Rate Calculator', 'HR', Activity, 'Calculate employee attrition rate.', [
    { key: 'exits', label: 'Employee exits', type: 'number' },
    { key: 'averageHeadcount', label: 'Average headcount', type: 'number' },
  ], { exits: '12', averageHeadcount: '180' }, (v) => simpleResult(pct(n(v, 'exits') / Math.max(n(v, 'averageHeadcount'), 1) * 100), 'Employee exits as a percentage of average headcount.', 'Exits / Average headcount x 100', '12 / 180 = 6.67%')),
  buildCalc('interview-score', 'Interview Score Calculator', 'HR', Star, 'Weighted interview scoring.', [
    { key: 'technical', label: 'Technical / 100', type: 'number' },
    { key: 'communication', label: 'Communication / 100', type: 'number' },
    { key: 'culture', label: 'Culture / 100', type: 'number' },
  ], { technical: '82', communication: '76', culture: '88' }, (v) => {
    const score = n(v, 'technical') * 0.5 + n(v, 'communication') * 0.25 + n(v, 'culture') * 0.25;
    return simpleResult(pct(score), score >= 75 ? 'Recommended for next round.' : 'Needs deeper review.', 'Technical 50% + Communication 25% + Culture 25%', '82, 76, 88 = 82%');
  }),
  buildCalc('performance-rating', 'Performance Rating Calculator', 'HR', Star, 'Calculate weighted performance rating.', [
    { key: 'goals', label: 'Goals / 100', type: 'number' },
    { key: 'skills', label: 'Skills / 100', type: 'number' },
    { key: 'behavior', label: 'Behavior / 100', type: 'number' },
  ], { goals: '86', skills: '80', behavior: '90' }, (v) => simpleResult(pct(n(v, 'goals') * 0.5 + n(v, 'skills') * 0.3 + n(v, 'behavior') * 0.2), 'Weighted performance score.', 'Goals 50% + Skills 30% + Behavior 20%', '86, 80, 90 = 85%')),
  buildCalc('training-cost', 'Training Cost Calculator', 'HR', BookOpen, 'Calculate training investment per employee.', [
    { key: 'program', label: 'Program cost', type: 'number' },
    { key: 'hours', label: 'Paid hours cost', type: 'number' },
    { key: 'employees', label: 'Employees trained', type: 'number' },
  ], { program: '150000', hours: '80000', employees: '20' }, (v) => simpleResult(`₹${money((n(v, 'program') + n(v, 'hours')) / Math.max(n(v, 'employees'), 1))}/employee`, 'Total training cost per participant.', '(Program + Time cost) / Employees', '230000 / 20 = 11500')),
  buildCalc('offer-comparison', 'Offer Comparison Calculator', 'HR', BriefcaseBusiness, 'Compare two compensation offers.', [
    { key: 'offerA', label: 'Offer A annual value', type: 'number' },
    { key: 'offerB', label: 'Offer B annual value', type: 'number' },
  ], { offerA: '1200000', offerB: '1350000' }, (v) => {
    const diff = n(v, 'offerB') - n(v, 'offerA');
    return simpleResult(diff >= 0 ? `Offer B by ₹${money(diff)}` : `Offer A by ₹${money(Math.abs(diff))}`, `Difference is ${pct(Math.abs(diff) / Math.max(Math.min(n(v, 'offerA'), n(v, 'offerB')), 1) * 100)}.`, 'Offer B - Offer A', '13.5L - 12L = 1.5L');
  }),
];

const calculators = [...calculatorDefinitions, ...financeCalculators, ...careerCalculators, ...hrCalculators];

function evaluateScientific(input: string, degrees: boolean) {
  const factorial = (value: number): number => value <= 1 ? 1 : value * factorial(value - 1);
  const normalized = input
    .replace(/π/g, 'pi')
    .replace(/\^/g, '**')
    .replace(/\bpi\b/gi, `(${Math.PI})`)
    .replace(/\be\b/g, `(${Math.E})`)
    .replace(/\bln\(/g, 'log(')
    .replace(/\bsin\(/g, degrees ? 'sinDeg(' : 'Math.sin(')
    .replace(/\bcos\(/g, degrees ? 'cosDeg(' : 'Math.cos(')
    .replace(/\btan\(/g, degrees ? 'tanDeg(' : 'Math.tan(')
    .replace(/\basin\(/g, degrees ? 'asinDeg(' : 'Math.asin(')
    .replace(/\bacos\(/g, degrees ? 'acosDeg(' : 'Math.acos(')
    .replace(/\batan\(/g, degrees ? 'atanDeg(' : 'Math.atan(')
    .replace(/\blog\(/g, 'Math.log10(')
    .replace(/\bsqrt\(/g, 'Math.sqrt(')
    .replace(/\babs\(/g, 'Math.abs(')
    .replace(/(\d+)!/g, 'factorial($1)');
  if (!/^[0-9+\-*/().,\s*MahtloginscDegfrqPI]+$/.test(normalized)) throw new Error('Expression contains unsupported characters.');
  const sinDeg = (x: number) => Math.sin((x * Math.PI) / 180);
  const cosDeg = (x: number) => Math.cos((x * Math.PI) / 180);
  const tanDeg = (x: number) => Math.tan((x * Math.PI) / 180);
  const asinDeg = (x: number) => Math.asin(x) * 180 / Math.PI;
  const acosDeg = (x: number) => Math.acos(x) * 180 / Math.PI;
  const atanDeg = (x: number) => Math.atan(x) * 180 / Math.PI;
  return Function('Math', 'factorial', 'sinDeg', 'cosDeg', 'tanDeg', 'asinDeg', 'acosDeg', 'atanDeg', `"use strict"; return (${normalized});`)(Math, factorial, sinDeg, cosDeg, tanDeg, asinDeg, acosDeg, atanDeg) as number;
}

async function downloadResultPdf(title: string, result: CalcResult) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  page.drawText('Candfolio Smart Calculators Hub', { x: 44, y: 790, size: 12, font: bold, color: rgb(0.53, 0.14, 0.25) });
  page.drawText(title, { x: 44, y: 750, size: 22, font: bold, color: rgb(0.1, 0.1, 0.1) });
  const lines = [`Final Answer: ${result.answer}`, '', result.detail, '', `Formula: ${result.formula}`, '', `Example: ${result.example}`];
  let y = 705;
  for (const line of lines) {
    page.drawText(line.slice(0, 95), { x: 44, y, size: 11, font, color: rgb(0.18, 0.16, 0.16) });
    y -= 20;
  }
  const bytes = await doc.save();
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-result.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function CalculatorsHubPage() {
  const [activeCategory, setActiveCategory] = useState<CalculatorCategory>('Education');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('scientific');
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('candfolio_calculator_favorites') || '[]') as string[];
  });
  const [recent, setRecent] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('candfolio_calculator_recent') || '[]') as string[];
  });

  const allCalculators = useMemo(() => [
    { id: 'scientific', name: 'Scientific Calculator', category: 'Education' as CalculatorCategory, icon: Calculator, description: 'Premium scientific calculator with memory, history, degrees/radians, shortcuts, and advanced functions.' },
    { id: 'graph', name: 'Graph Calculator', category: 'Education' as CalculatorCategory, icon: Activity, description: 'Plot f(x) and g(x), zoom, inspect coordinates, and download the graph as PNG.' },
    { id: 'gpa', name: 'GPA Calculator', category: 'Education' as CalculatorCategory, icon: GraduationCap, description: 'Semester GPA, CGPA, grading systems, credits, distribution, and performance summary.' },
    { id: 'attendance', name: 'Attendance Calculator', category: 'College' as CalculatorCategory, icon: CalendarDays, description: 'Track attendance percentage, classes needed, safe bunks, and future predictions.' },
    ...calculators,
  ], []);

  const filtered = allCalculators.filter((calc) => {
    const matchesSearch = `${calc.name} ${calc.description} ${calc.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesSearch && (!activeCategory || calc.category === activeCategory);
  });

  const selected = allCalculators.find((calc) => calc.id === selectedId) || allCalculators[0];
  const recentItems = recent.map((id) => allCalculators.find((calc) => calc.id === id)).filter(Boolean).slice(0, 5) as typeof allCalculators;
  const favoriteItems = favorites.map((id) => allCalculators.find((calc) => calc.id === id)).filter(Boolean).slice(0, 5) as typeof allCalculators;

  const pickCalculator = (id: string) => {
    setSelectedId(id);
    setRecent((current) => {
      const next = [id, ...current.filter((item) => item !== id)].slice(0, 8);
      localStorage.setItem('candfolio_calculator_recent', JSON.stringify(next));
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
      localStorage.setItem('candfolio_calculator_favorites', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-8">
      <section className="hero-accent overflow-hidden rounded-[28px] border border-accent/10 bg-white/60 p-6 shadow-[var(--shadow-panel)] sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <span className="badge badge-accent mb-5 gap-2"><Sparkles className="h-3.5 w-3.5" /> Smart Calculators Hub</span>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">Smart Calculators</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
              Everything you need in one place. 100% free calculators for students, professionals, HRs, accountants, recruiters, teachers and everyone else.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                <input
                  aria-label="Search calculators"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search salary, GST, GPA, attendance..."
                  className="h-13 w-full rounded-2xl border px-11 text-sm font-semibold outline-none"
                />
              </label>
              <button className="btn-primary gap-2" onClick={() => pickCalculator(filtered[0]?.id || selectedId)}>
                Open first match <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 4).map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => setActiveCategory(category.name)}
                  className={`group rounded-[20px] border border-white/60 bg-gradient-to-br ${category.tone} p-5 text-left text-white shadow-[var(--shadow-card)] transition hover:-translate-y-1`}
                >
                  <Icon className="h-7 w-7" />
                  <p className="mt-4 text-lg font-black">{category.name}</p>
                  <p className="mt-1 text-xs text-white/80">{allCalculators.filter((calc) => calc.category === category.name).length} tools</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-30 -mx-4 overflow-x-auto border-y border-accent/10 bg-[#F0EDE5]/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-3xl sm:border sm:shadow-[var(--shadow-card)]">
        <div className="flex gap-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const active = activeCategory === category.name;
            return (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={`inline-flex flex-shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black transition ${active ? 'bg-accent text-white shadow-[var(--shadow-button)]' : 'bg-white/65 text-zinc-600 hover:bg-white hover:text-accent'}`}
              >
                <Icon className="h-4 w-4" /> {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-36 lg:self-start">
          <QuickList title="Recently Used" icon={History} items={recentItems} onPick={pickCalculator} empty="Open a calculator to build your recent list." />
          <QuickList title="Favorites" icon={Heart} items={favoriteItems} onPick={pickCalculator} empty="Tap the heart on any calculator to save it." />
          <div className="card p-4">
            <h2 className="text-sm font-black text-zinc-900">Calculator Library</h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{filtered.length} calculators match your filters.</p>
            <div className="mt-4 max-h-[460px] space-y-2 overflow-auto pr-1 no-scrollbar">
              {filtered.map((calc) => {
                const Icon = calc.icon;
                const active = selected.id === calc.id;
                return (
                  <button
                    key={calc.id}
                    onClick={() => pickCalculator(calc.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${active ? 'border-accent/30 bg-accent-light/55 text-accent shadow-[var(--shadow-inset)]' : 'border-accent/10 bg-white/60 text-zinc-700 hover:bg-white'}`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      <span className="block text-xs font-black">{calc.name}</span>
                      <span className="mt-1 line-clamp-2 block text-[11px] leading-4 opacity-70">{calc.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-accent">{selected.category}</p>
              <h2 className="text-2xl font-black tracking-tight text-zinc-950">{selected.name}</h2>
            </div>
            <button
              onClick={() => toggleFavorite(selected.id)}
              aria-label={favorites.includes(selected.id) ? 'Remove from favorites' : 'Add to favorites'}
              className={`rounded-2xl border p-3 transition hover:-translate-y-0.5 ${favorites.includes(selected.id) ? 'border-accent/20 bg-accent text-white' : 'border-accent/15 bg-white/70 text-accent'}`}
            >
              <Heart className="h-5 w-5" fill={favorites.includes(selected.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
          {selected.id === 'scientific' ? <ScientificCalculator /> : selected.id === 'graph' ? <GraphCalculator /> : selected.id === 'gpa' ? <GpaCalculator /> : selected.id === 'attendance' ? <AttendanceCalculator /> : <GenericCalculator key={selected.id} definition={selected as CalculatorDefinition} />}
        </main>
      </section>
    </div>
  );
}

function QuickList({ title, icon: Icon, items, onPick, empty }: { title: string; icon: React.ElementType; items: Array<{ id: string; name: string; icon: React.ElementType }>; onPick: (id: string) => void; empty: string }) {
  return (
    <div className="card p-4">
      <h2 className="flex items-center gap-2 text-sm font-black text-zinc-900"><Icon className="h-4 w-4 text-accent" /> {title}</h2>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? <p className="text-xs leading-5 text-zinc-500">{empty}</p> : items.map((item) => {
          const ItemIcon = item.icon;
          return <button key={item.id} onClick={() => onPick(item.id)} className="flex w-full items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-left text-xs font-bold text-zinc-700 transition hover:bg-white hover:text-accent"><ItemIcon className="h-3.5 w-3.5" /> {item.name}</button>;
        })}
      </div>
    </div>
  );
}

function ActionButtons({ title, result, onReset }: { title: string; result: CalcResult | null; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const resultText = result ? `${title}: ${result.answer}\n${result.detail}\nFormula: ${result.formula}` : '';
  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn-secondary gap-2" onClick={onReset}><RefreshCw className="h-4 w-4" /> Reset</button>
      <button disabled={!result} className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50" onClick={async () => { await navigator.clipboard.writeText(resultText); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy Result</button>
      <button disabled={!result} className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => result && downloadResultPdf(title, result)}><Download className="h-4 w-4" /> Download PDF</button>
      <button disabled={!result} className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</button>
      <button disabled={!result} className="btn-secondary gap-2 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => navigator.share ? navigator.share({ title, text: resultText }) : navigator.clipboard.writeText(resultText)}><Share2 className="h-4 w-4" /> Share</button>
    </div>
  );
}

function ResultCard({ result }: { result: CalcResult | null }) {
  if (!result) {
    return (
      <div className="card flex min-h-[320px] flex-col items-center justify-center p-8 text-center text-zinc-500">
        <Calculator className="h-12 w-12 text-accent/50" />
        <h3 className="mt-4 text-lg font-black text-zinc-900">Result appears here</h3>
        <p className="mt-2 max-w-sm text-sm leading-6">Enter values and calculate to see the answer, formula, worked example, and visual summary.</p>
      </div>
    );
  }
  return (
    <div className="card animate-[page-enter_0.35s_cubic-bezier(0.22,1,0.36,1)_both] overflow-hidden p-6">
      <p className="badge badge-accent mb-4">Final Answer</p>
      <h3 className="break-words text-3xl font-black tracking-tight text-accent">{result.answer}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{result.detail}</p>
      {result.metrics && (
        <div className="mt-5 space-y-3">
          {result.metrics.map((metric) => (
            <div key={metric.label}>
              <div className="mb-1 flex justify-between text-xs font-bold text-zinc-600"><span>{metric.label}</span><span>{metric.value}</span></div>
              <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${Math.min(100, Math.max(0, metric.percent || 0))}%` }} /></div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-accent/10 bg-white/60 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-accent">Formula Used</p>
          <p className="mt-2 text-sm font-semibold text-zinc-800">{result.formula}</p>
        </div>
        <div className="rounded-2xl border border-accent/10 bg-white/60 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-accent">Example Calculation</p>
          <p className="mt-2 text-sm font-semibold text-zinc-800">{result.example}</p>
        </div>
      </div>
    </div>
  );
}

function GenericCalculator({ definition }: { definition: CalculatorDefinition }) {
  const savedCalculation = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(localStorage.getItem(`candfolio_last_${definition.id}`) || 'null') as { values: Record<string, string>; result: CalcResult } | null;
    } catch {
      return null;
    }
  }, [definition.id]);
  const [values, setValues] = useState(savedCalculation?.values || definition.defaults);
  const [result, setResult] = useState<CalcResult | null>(savedCalculation?.result || null);
  const [error, setError] = useState('');

  const calculate = () => {
    try {
      const next = definition.compute(values);
      setResult(next);
      setError('');
      localStorage.setItem(`candfolio_last_${definition.id}`, JSON.stringify({ values, result: next }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Please check the inputs and try again.');
      setResult(null);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="card p-5 sm:p-6">
        <p className="text-sm leading-6 text-zinc-600">{definition.description}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {definition.fields.map((field) => (
            <label key={field.key} className="block">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-500">{field.label}</span>
              {field.type === 'select' ? (
                <select value={values[field.key] || ''} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none">
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <div className="relative">
                  <input
                    aria-label={field.label}
                    type={field.type || 'number'}
                    min={field.min}
                    value={values[field.key] || ''}
                    placeholder={field.placeholder}
                    onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
                    className="mt-2 h-12 w-full rounded-2xl border px-4 pr-12 text-sm font-semibold outline-none"
                  />
                  {field.suffix && <span className="absolute right-4 top-1/2 text-xs font-bold text-zinc-400">{field.suffix}</span>}
                </div>
              )}
            </label>
          ))}
        </div>
        {error && <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary gap-2" onClick={calculate}><Calculator className="h-4 w-4" /> Calculate</button>
          <ActionButtons title={definition.name} result={result} onReset={() => { setValues(definition.defaults); setResult(null); setError(''); }} />
        </div>
      </section>
      <ResultCard result={result} />
    </div>
  );
}

function ScientificCalculator() {
  const [expression, setExpression] = useState('sin(30)+sqrt(144)');
  const [degrees, setDegrees] = useState(true);
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState('');
  const keys = ['7', '8', '9', '/', 'sin(', 'cos(', '4', '5', '6', '*', 'tan(', 'log(', '1', '2', '3', '-', 'ln(', 'sqrt(', '0', '.', 'π', '+', '^', '!', '(', ')'];

  const calculate = () => {
    try {
      const value = evaluateScientific(expression, degrees);
      const next = simpleResult(String(round(value, 8)), `${expression} = ${round(value, 8)}`, degrees ? 'Trig functions use degrees.' : 'Trig functions use radians.', 'sin(30)+sqrt(144)=12.5 in degree mode');
      setResult(next);
      setHistory((current) => [`${expression} = ${next.answer}`, ...current].slice(0, 12));
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Invalid expression.');
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-zinc-600">Supports arithmetic, powers, roots, logs, trig, inverse trig, factorial, constants, memory, keyboard-friendly input, and scrollable history.</p>
          <button onClick={() => setDegrees(!degrees)} className="btn-secondary">{degrees ? 'Degrees' : 'Radians'}</button>
        </div>
        <input value={expression} onChange={(event) => setExpression(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') calculate(); }} aria-label="Scientific expression" className="mt-5 h-14 w-full rounded-2xl border px-4 text-right text-xl font-black outline-none" />
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-4 grid grid-cols-6 gap-2">
          {keys.map((key) => <button key={key} onClick={() => setExpression((value) => value + key)} className="rounded-2xl border border-accent/10 bg-white/70 py-3 text-sm font-black text-zinc-700 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:text-accent">{key}</button>)}
          <button onClick={() => setExpression('')} className="rounded-2xl bg-red-50 py-3 text-sm font-black text-red-700">C</button>
          <button onClick={() => setMemory(Number(result?.answer || 0))} className="rounded-2xl bg-white/70 py-3 text-sm font-black text-accent">MS</button>
          <button onClick={() => setExpression((value) => value + memory)} className="rounded-2xl bg-white/70 py-3 text-sm font-black text-accent">MR</button>
          <button onClick={calculate} className="col-span-3 rounded-2xl bg-accent py-3 text-sm font-black text-white shadow-[var(--shadow-button)]">Calculate</button>
        </div>
        <div className="mt-5 max-h-36 overflow-auto rounded-2xl border border-accent/10 bg-white/50 p-3 no-scrollbar">
          {history.length === 0 ? <p className="text-xs text-zinc-500">Calculation history will appear here.</p> : history.map((item) => <p key={item} className="border-b border-accent/10 py-2 text-xs font-semibold text-zinc-600 last:border-0">{item}</p>)}
        </div>
        <div className="mt-5"><ActionButtons title="Scientific Calculator" result={result} onReset={() => { setExpression(''); setResult(null); setError(''); setHistory([]); }} /></div>
      </section>
      <ResultCard result={result} />
    </div>
  );
}

function GraphCalculator() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [f, setF] = useState('sin(x)');
  const [g, setG] = useState('0.1*x^2-2');
  const [zoom, setZoom] = useState(32);
  const [point, setPoint] = useState('Hover over graph');

  const evalY = (expr: string, x: number) => evaluateScientific(expr.replace(/\bx\b/g, `(${x})`), false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = '#fffaf3';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = 'rgba(135,35,65,0.12)';
    for (let x = rect.width / 2 % zoom; x < rect.width; x += zoom) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke(); }
    for (let y = rect.height / 2 % zoom; y < rect.height; y += zoom) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke(); }
    ctx.strokeStyle = '#872341';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, rect.height / 2); ctx.lineTo(rect.width, rect.height / 2); ctx.moveTo(rect.width / 2, 0); ctx.lineTo(rect.width / 2, rect.height); ctx.stroke();
    const plot = (expr: string, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (let px = 0; px < rect.width; px += 1) {
        const x = (px - rect.width / 2) / zoom;
        const y = evalY(expr, x);
        const py = rect.height / 2 - y * zoom;
        if (!Number.isFinite(py) || Math.abs(py) > 10000) { started = false; continue; }
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };
    try { plot(f, '#872341'); plot(g, '#c9a227'); } catch {}
  }, [f, g, zoom]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="card p-5 sm:p-6">
        <p className="text-sm leading-6 text-zinc-600">Plot polynomial, trigonometric, exponential, logarithmic, absolute value, and piecewise-style expressions. Use x as the variable.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label><span className="text-xs font-black uppercase text-zinc-500">f(x)</span><input value={f} onChange={(e) => setF(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border px-4 font-semibold outline-none" /></label>
          <label><span className="text-xs font-black uppercase text-zinc-500">g(x)</span><input value={g} onChange={(e) => setG(e.target.value)} className="mt-2 h-12 w-full rounded-2xl border px-4 font-semibold outline-none" /></label>
        </div>
        <label className="mt-5 block text-xs font-black uppercase text-zinc-500">Zoom / Grid density</label>
        <input type="range" min="16" max="70" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="mt-3 w-full accent-[#872341]" />
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => { setF('sin(x)'); setG('0.1*x^2-2'); setZoom(32); }}>Reset graph</button>
          <button className="btn-secondary gap-2" onClick={() => { const url = canvasRef.current?.toDataURL('image/png'); if (!url) return; const a = document.createElement('a'); a.href = url; a.download = 'candfolio-graph.png'; a.click(); }}><Download className="h-4 w-4" /> Download PNG</button>
        </div>
      </section>
      <section className="card overflow-hidden p-4">
        <canvas
          ref={canvasRef}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = round((event.clientX - rect.left - rect.width / 2) / zoom, 3);
            setPoint(`x: ${x}, f(x): ${round(evalY(f, x), 3)}`);
          }}
          className="h-[420px] w-full rounded-[20px] border border-accent/10"
          aria-label="Interactive graph canvas"
        />
        <p className="mt-3 text-xs font-bold text-accent">{point}</p>
      </section>
    </div>
  );
}

function GpaCalculator() {
  const [scale, setScale] = useState('10');
  const [subjects, setSubjects] = useState([{ name: 'Mathematics', credits: '4', grade: '9' }, { name: 'Physics', credits: '3', grade: '8' }]);
  const totalCredits = subjects.reduce((sum, item) => sum + Number(item.credits || 0), 0);
  const gpa = subjects.reduce((sum, item) => sum + Number(item.credits || 0) * Number(item.grade || 0), 0) / Math.max(totalCredits, 1);
  const normalized = scale === '4' ? gpa : scale === '100' ? gpa / 10 : gpa;
  const result = simpleResult(`${round(gpa)} GPA`, `Total credits: ${totalCredits}. Percentage estimate: ${pct((normalized / Number(scale)) * 100)}.`, 'Sum(Credits x Grade points) / Sum(Credits)', '((4x9) + (3x8)) / 7 = 8.57', [{ label: 'Performance', value: pct((gpa / Number(scale)) * 100), percent: (gpa / Number(scale)) * 100 }]);
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-zinc-600">Add unlimited subjects, credits, and grade points. Supports 10-point, 4-point, 100-point, and custom grading scales.</p>
          <select value={scale} onChange={(e) => setScale(e.target.value)} className="h-11 rounded-2xl border px-4 text-sm font-bold outline-none"><option value="10">10 point</option><option value="4">4 point</option><option value="100">100 point</option></select>
        </div>
        <div className="mt-5 space-y-3">
          {subjects.map((subject, index) => (
            <div key={`${subject.name}-${index}`} className="grid gap-2 rounded-2xl border border-accent/10 bg-white/60 p-3 sm:grid-cols-[1fr_90px_90px_auto]">
              <input value={subject.name} onChange={(e) => setSubjects(subjects.map((s, i) => i === index ? { ...s, name: e.target.value } : s))} aria-label="Subject name" className="rounded-xl border px-3 py-2 text-sm font-semibold outline-none" />
              <input value={subject.credits} onChange={(e) => setSubjects(subjects.map((s, i) => i === index ? { ...s, credits: e.target.value } : s))} aria-label="Credits" type="number" className="rounded-xl border px-3 py-2 text-sm font-semibold outline-none" />
              <input value={subject.grade} onChange={(e) => setSubjects(subjects.map((s, i) => i === index ? { ...s, grade: e.target.value } : s))} aria-label="Grade" type="number" className="rounded-xl border px-3 py-2 text-sm font-semibold outline-none" />
              <button className="rounded-xl bg-red-50 px-3 text-xs font-black text-red-700" onClick={() => setSubjects(subjects.filter((_, i) => i !== index))}>Delete</button>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => setSubjects([...subjects, { name: 'New subject', credits: '3', grade: '8' }])}>Add subject</button>
          <ActionButtons title="GPA Calculator" result={result} onReset={() => setSubjects([{ name: 'Mathematics', credits: '4', grade: '9' }])} />
        </div>
      </section>
      <ResultCard result={result} />
    </div>
  );
}

function AttendanceCalculator() {
  const [values, setValues] = useState({ total: '80', attended: '62', target: '75', future: '10' });
  const total = n(values, 'total'), attended = n(values, 'attended'), target = n(values, 'target');
  const current = attended / Math.max(total, 1) * 100;
  const needed = Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target)));
  const bunk = Math.max(0, Math.floor((attended * 100 / target) - total));
  const future = (attended + n(values, 'future')) / Math.max(total + n(values, 'future'), 1) * 100;
  const result = simpleResult(pct(current), `Attend ${needed} more classes to reach ${target}%. You can safely miss ${bunk} classes at this target.`, 'Attended / Total x 100', '62 / 80 = 77.5%', [{ label: 'Current attendance', value: pct(current), percent: current }, { label: 'Future prediction', value: pct(future), percent: future }]);
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="card p-5 sm:p-6">
        <p className="text-sm leading-6 text-zinc-600">Track current attendance, required classes for 75/80/85/90/95%, safe bunks, and future attendance prediction.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Object.entries({ total: 'Current classes', attended: 'Attended classes', target: 'Target %', future: 'Future classes you will attend' }).map(([key, label]) => <label key={key}><span className="text-xs font-black uppercase text-zinc-500">{label}</span><input type="number" value={values[key as keyof typeof values]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} className="mt-2 h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none" /></label>)}
        </div>
        <div className="mt-6"><ActionButtons title="Attendance Calculator" result={result} onReset={() => setValues({ total: '80', attended: '62', target: '75', future: '10' })} /></div>
      </section>
      <ResultCard result={result} />
    </div>
  );
}
