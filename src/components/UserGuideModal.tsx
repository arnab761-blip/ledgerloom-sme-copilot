'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  X,
  FileSpreadsheet,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Target,
  ShieldCheck,
  Download,
  Bot,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SupportedLanguage } from '@/lib/i18n';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'entry' | 'staging' | 'debtors' | 'loans' | 'planner' | 'security'>('overview');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="guide-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="guide-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden"
          >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  {currentLanguage === 'zh'
                    ? '系统全功能使用指南与操作手册'
                    : currentLanguage === 'hi'
                    ? 'सिस्टम उपयोगकर्ता मार्गदर्शिका एवं कार्यप्रणाली'
                    : currentLanguage === 'bn'
                    ? 'ইউজার গাইডলাইন: সিস্টেম ব্যবহার নির্দেশিকা'
                    : 'LedgerLoom User Guide & Architecture Manual'}
                </h3>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-400/30">
                  Step-by-Step
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLanguage === 'bn'
                  ? 'কোন সেকশনের কী কাজ এবং একজন ব্যবসায়ী কীভাবে এটি সহজে ব্যবহার করবেন'
                  : currentLanguage === 'zh'
                  ? '各功能模块运作逻辑、数据流转与快速上手说明'
                  : 'How every feature works, data flows, and practical business walkthrough.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs inside Guide */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          {[
            { id: 'overview', label: currentLanguage === 'bn' ? '১. ওভারভিউ' : '1. Overview' },
            { id: 'entry', label: currentLanguage === 'bn' ? '২. হিসাব এন্ট্রি' : '2. Data Entry' },
            { id: 'staging', label: currentLanguage === 'bn' ? '৩. খসড়া ও অনুমোদন' : '3. Staging & Approval' },
            { id: 'debtors', label: currentLanguage === 'bn' ? '৪. বাকির খাতা ও তাগাদা' : '4. Debtors & Alerts' },
            { id: 'loans', label: currentLanguage === 'bn' ? '৫. ক্যাশ-ফ্লো ও ঋণ তুলনা' : '5. Loans & Matcher' },
            { id: 'planner', label: currentLanguage === 'bn' ? '৬. লক্ষ্য-লাভ পরিকল্পনা' : '6. Target Profit Plan' },
            { id: 'security', label: currentLanguage === 'bn' ? '৭. সিকিউরিটি ও ভল্ট' : '7. Security Vault' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                activeSection === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs leading-relaxed flex-1">
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-950 mb-1">
                    {currentLanguage === 'bn'
                      ? 'LedgerLoom কী এবং এটি কীভাবে একজন ব্যবসায়ীর জীবন সহজ করে?'
                      : 'What is LedgerLoom and how does it empower SME owners?'}
                  </h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {currentLanguage === 'bn'
                      ? 'ছোট ও মাঝারি ব্যবসার (যেমন: গার্মেন্টস, ক্যাফে বা পাইকারি দোকান) মালিকরা হিসাব লেখার সময় পান না বা ভুলে যান, কার কাছে কত বাকি তা মনে থাকে না এবং ভবিষ্যতে কবে টাকার টান পড়বে তা আগে থেকে অনুমান করতে পারেন না। LedgerLoom তাদের জন্য একজন ভার্চুয়াল চিফ ফিন্যান্সিয়াল অফিসার (CFO) হিসেবে কাজ করে।'
                      : 'LedgerLoom acts as an Autonomous Virtual Chief Financial Officer (CFO) for SMEs. It tracks cash flows, extracts receipts, forecasts deficits, matches optimal bank credit, and safeguards margins—all anchored by a deterministic accounting engine.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span>🗣️</span>
                    <span>{currentLanguage === 'bn' ? 'কথা ও ছবিতে খসড়া' : 'Drafting from Speech/OCR'}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'মালিক মুখে বলে, ছবি তুলে বা নকল এসএমএস পেস্ট করলেই এআই খসড়া বানিয়ে রাখে।'
                      : 'Create staged drafts from speech, photo receipts, or simulated payment SMS.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>{currentLanguage === 'bn' ? 'মানুষের চূড়ান্ত অনুমোদন' : 'Human-in-the-Loop'}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'এআই নিজে কখনো ব্যাংক থেকে টাকা সরায় না বা মালিকের কনফার্ম ছাড়া হিসাব চূড়ান্ত করে না।'
                      : 'AI never mutates ledgers or moves funds autonomously. Owners confirm all entries.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span>📊</span>
                    <span>{currentLanguage === 'bn' ? 'ভবিষ্যতের পূর্বাভাস' : 'Predictive Forecasting'}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'কবে কত টাকার ঘাটতি হবে তা আগে জানায় এবং ৩টি ব্যাংকের ঋণের কিস্তির তুলনা করে দেয়।'
                      : 'Detects upcoming cash deficits and compares multi-facility loan repayment burdens.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DATA ENTRY & EXCEL SYNC */}
          {activeSection === 'entry' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {currentLanguage === 'bn' ? '২. হিসাব এন্ট্রি ও এক্সেল সিঙ্ক (Data Entry & Excel Sync)' : '2. Data Entry & Real Excel Synchronization'}
                </h4>
              </div>
              <p className="text-slate-600 text-[11px]">
                {currentLanguage === 'bn'
                  ? 'এই সেকশনে ৩টি অত্যন্ত গুরুত্বপূর্ণ সাব-ট্যাব রয়েছে:'
                  : 'This section contains three integrated accounting layers:'}
              </p>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="font-bold text-slate-900 block mb-1">
                    {currentLanguage === 'bn' ? 'ক. New Income / Expense Entry (নতুন আয় বা ব্যয়ের হিসাব):' : 'A. Direct Income/Expense Form:'}
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'যখন আপনি কোনো ভাউচার বা বিল সরাসরি পাকা হিসাবে তুলতে চান। এখানে টাকার পরিমাণ, খাতের নাম (Category), খরচের ধরন (কাঁচামাল খরচ বনাম ভাড়া/বেতন), পার্টি নেম এবং লেনদেনের মাধ্যম (ক্যাশ, ব্যাংক, বা মোবাইল মানি) দিয়ে এন্ট্রি করা যায়।'
                      : 'Manually record audited income or expense entries directly into the ledger, specifying category, fixed vs variable cost types, party names, and payment rails.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="font-bold text-slate-900 block mb-1">
                    {currentLanguage === 'bn' ? 'খ. Business Profile & Fixed Costs (স্থায়ী খরচ ও প্রতি পিসের হিসাব):' : 'B. Business Profile & Fixed Overheads:'}
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'এখানে কারখানার ১৪ জন শ্রমিকের বেতন (১,৪৫,০০০ টাকা), বিদ্যুৎ বিল (২২,০০০ টাকা), কারখানা ভাড়া (৩০,০০০ টাকা) এবং প্রতি পিস টি-শার্ট তৈরিতে কত গজ কাপড় লাগে ও কত টাকায় বিক্রি হয়—তা একবার সেট করে দেওয়া হয়। এআই এই তথ্যের ভিত্তিতেই ব্রেক-ইভেন পয়েন্ট হিসেব করে।'
                      : 'Defines factory fixed overheads (rent, electricity, salaries) and unit economics (selling price, fabric usage per unit, cost per meter) which powers the financial engine.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="font-bold text-slate-900 block mb-1">
                    {currentLanguage === 'bn' ? 'গ. Live Excel Spreadsheet Viewer:' : 'C. Live Excel Spreadsheet Viewer:'}
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'পুরো ডেটাবেজটি হুবহু মাইক্রোসফট এক্সেল টেবিল আকারে দেখা যায়। এছাড়া ওপরের Download .XLSX বাটনে চাপ দিয়ে যেকোনো সময় আসল এক্সেল ফাইল কম্পিউটারে ডাউনলোড করে সংরক্ষণ করা যায়।'
                      : 'View real-time rows and columns of your business database. Export real .XLSX files anytime.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: RECEIPT OCR & STAGING */}
          {activeSection === 'staging' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {currentLanguage === 'bn' ? '৩. অপেক্ষমাণ খসড়া ও রসিদ স্ক্যানার (Receipt OCR & Staging)' : '3. Receipt OCR & Pending Staging'}
                </h4>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <span className="font-bold text-amber-900 block">
                  {currentLanguage === 'bn' ? '💡 এআই খসড়া বনাম চূড়ান্ত এন্ট্রি (Human-in-the-Loop):' : '💡 Staging Philosophy:'}
                </span>
                <p className="text-amber-950/80 text-[11px]">
                  {currentLanguage === 'bn'
                    ? 'কর্মচারী বা এআই ক্যামেরা দিয়ে বিলের ছবি তুললে বা মুখের কথা শুনলে তা সাথে সাথে মূল খাতায় যোগ হয় না! এটি প্রথমে "অপেক্ষমাণ খসড়া (Staging)" স্ক্রিনে জমা থাকে। মালিক যতক্ষণ না বড় Confirm বাটনে চাপ দিচ্ছেন, ততক্ষণ এটি পাকা খাতায় যায় না।'
                    : 'Transcribed speech, OCR scans, and simulated SMS land in Staging first. They do not touch permanent accounts until the owner clicks Confirm.'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-900">🔴 লাল সতর্কতা (Red Border):</span>{' '}
                  <span className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'যদি কোনো অঙ্কে ১৫,০০০ টাকার বেশি বা বাকি ক্রয়ের সন্দেহ থাকে, এআই তা লাল দাগ ও ওয়ার্নিং ব্যাজ দিয়ে মালিককে সাবধান করে দেয়।'
                      : 'Unverified figures, credit memos, or amounts exceeding threshold are bordered in red for scrutiny.'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-900">✅ Confirm ও ❌ Reject:</span>{' '}
                  <span className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'মালিক যাচাই করে ঠিক থাকলে Confirm চাপেন, ভুল থাকলে Reject করে দেন।'
                      : 'Owner approves valid transactions or permanently discards anomalies with one click.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DEBTORS ALERT */}
          {activeSection === 'debtors' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {currentLanguage === 'bn' ? '৪. বাকির খাতা ও তাগাদা অ্যালার্ট (Debtors Alert >30k)' : '4. Debtors Aging & Overdue Alerts'}
                </h4>
              </div>

              <p className="text-slate-600 text-[11px]">
                {currentLanguage === 'bn'
                  ? 'ছোট ব্যবসায় সবচেয়ে বেশি টাকা আটকে থাকে বকেয়া বা বাকির কারণে। এই সেকশনে:'
                  : 'Tracks all customer receivables and overdue aging buckets (0-30d, 31-60d, 60d+):'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="font-bold text-slate-900 block mb-1">
                    {currentLanguage === 'bn' ? '৩০,০০০ টাকার সীমা অতিক্রম নোটিফিকেশন:' : '30,000 Threshold Alert:'}
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'করিম ট্রেডার্স বা কোনো দেনাদারের বাকি যখন ৩০,০০০ টাকার বেশি হয়ে যায়, এআই ড্যাশবোর্ডে লাল সতর্কবার্তা দেয়।'
                      : 'Triggers priority warning badges when debtor balances exceed safe exposure limits.'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="font-bold text-slate-900 block mb-1">
                    {currentLanguage === 'bn' ? '১-ক্লিকে তাগাদা মেসেজ (1-Click Due SMS):' : '1-Click Polite Reminder Generator:'}
                  </span>
                  <p className="text-slate-600 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'মালিককে কোনো কড়া কথা লিখতে হয় না। "Generate SMS" বাটনে চাপ দিলেই এআই একটি বিনম্র তাগাদা মেসেজের খসড়া বানিয়ে দেয়।'
                      : 'Drafts culturally respectful payment collection SMS ready to send to clients.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: LOANS & FINANCING MATCHER */}
          {activeSection === 'loans' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-sky-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {currentLanguage === 'bn' ? '৫. ক্যাশ-ফ্লো ঘাটতি ও ঋণের বিকল্প তুলনা (Financing Matcher)' : '5. Cash-Flow Deficit & 3-Option Loan Matcher'}
                </h4>
              </div>

              <p className="text-slate-600 text-[11px]">
                {currentLanguage === 'bn'
                  ? 'যখন আগামী ২৪ তারিখে সুতা বা কাপড় কেনার জন্য কারখানায় ৩০,০০০ টাকার নগদ সংকট দেখা দেয়, এআই জোর করে কোনো নির্দিষ্ট ঋণ চাপিয়ে দেয় না। বরং সে ৩টি বিকল্প সামনে রাখে:'
                  : 'When predictive forecasting detects upcoming cash shortfalls, the agent compares 3 facilities:'}
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="font-bold text-emerald-950">১. ব্র্যাক ব্যাংক SME ঋণ:</span>{' '}
                  <span className="text-emerald-900 text-[11px]">
                    {currentLanguage === 'bn'
                      ? '৯% সুদ, ১২ মাস মেয়াদী, প্রতি মাসে কিস্তি ~৳২,৬২৫ টাকা (ক্যাশ-ফ্লোর ওপর চাপ কম, এআই কর্তৃক সুপারিশকৃত)।'
                      : '9.0% rate, 12 months tenure, monthly EMI ~৳2,625 (Lowest cash-flow pressure, Recommended).'}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-950">২. আইডিএলসি স্বল্পমেয়াদী ঋণ:</span>{' '}
                  <span className="text-amber-900 text-[11px]">
                    {currentLanguage === 'bn'
                      ? '১১% সুদ, ৬ মাস মেয়াদী, প্রতি মাসে কিস্তি ~৳৫,১৬৩ টাকা।'
                      : '11.0% rate, 6 months tenure, monthly EMI ~৳5,163.'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-950">৩. সরবরাহকারীর বাকিতে মাল (Supplier Credit):</span>{' '}
                  <span className="text-slate-800 text-[11px]">
                    {currentLanguage === 'bn'
                      ? 'সুদ ০%, কিন্তু নগদ ক্রয়ের ৫% ছাড় হারাতে হবে।'
                      : '0% explicit interest, but forfeits 5% upfront cash discount.'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: TARGET PROFIT PLANNER */}
          {activeSection === 'planner' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {currentLanguage === 'bn' ? '৬. লক্ষ্য-লাভ পরিকল্পনা (Target Profit Planner)' : '6. Target Profit & Break-Even Planner'}
                </h4>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="font-bold text-slate-900 block">
                  {currentLanguage === 'bn' ? 'ঈদ বা উৎসবের আগে লাভের লক্ষ্য নির্ধারণ:' : 'Festival & Seasonal Profit Planning:'}
                </span>
                <p className="text-slate-600 text-[11px]">
                  {currentLanguage === 'bn'
                    ? 'মালিক যখন স্লাইডার টেনে বলেন "ঈদের আগে আমি ১,০০,০০০ টাকা লাভ করতে চাই", তখন সিস্টেম ব্রেক-ইভেন ও কন্ট্রিবিউশন মার্জিনের ফর্মুলা দিয়ে হিসাব করে বলে দেয়:'
                    : 'When the owner inputs a target profit (e.g. 100,000 BDT for Eid), the engine deterministically calculates:'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium text-[11px]">
                  <li>{currentLanguage === 'bn' ? 'কারখানা কত পিস বিক্রি করলে কোনো লস হবে না (Break-even Units)' : 'Break-even units required to cover overheads'}</li>
                  <li>{currentLanguage === 'bn' ? '১ লাখ টাকা লাভ করতে মোট কত পিস জামা বানাতে হবে' : 'Exact volume needed to reach target profit'}</li>
                  <li>{currentLanguage === 'bn' ? 'এর জন্য মোট কত গজ কাপড় এবং কত টাকার বাজেট লাগবে' : 'Total fabric yardage and working capital needed'}</li>
                </ul>
              </div>
            </div>
          )}

          {/* SECTION 7: SECURITY VAULT */}
          {activeSection === 'security' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {currentLanguage === 'bn' ? '৭. সিকিউরিটি ভল্ট ও সেশন লক (Security Vault & PIN)' : '7. Security Vault & Sliding Window Lock'}
                </h4>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                <span className="font-bold text-indigo-950 block">
                  {currentLanguage === 'bn' ? 'মালিক বনাম কর্মচারী অ্যাক্সেস কন্ট্রোল:' : 'Tiered Role-Based Access Control:'}
                </span>
                <p className="text-slate-600 text-[11px]">
                  {currentLanguage === 'bn'
                    ? 'লক অবস্থায় কর্মচারী হিসাব দেখতে পারেন এবং খসড়া তৈরি করতে পারেন, কিন্তু কোনো পাকা এন্ট্রি করতে বা হিসাব মুছতে পারেন না। মালিক তাঁর ৪-সংখ্যার গোপন পিন (ডিফল্ট সিড: ২০২৬) দিলে পরবর্তী ৩০ মিনিটের জন্য ভল্ট আনলক হয় এবং মালিক চাইলে নিজের পছন্দমতো নতুন পিনও সেট করে নিতে পারেন।'
                    : 'Employees can stage drafts and inspect metrics. Only owners who authenticate with the 4-digit PIN unlock full financial execution for 30 minutes.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            {currentLanguage === 'bn'
              ? '💡 যেকোনো সেকশনে কাজ করতে সরাসরি সাইডবার মেনু ব্যবহার করুন'
              : 'Use the hamburger sidebar menu to navigate between sections seamlessly.'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow transition"
          >
            {currentLanguage === 'bn' ? 'বুঝেছি (Close)' : 'Got it'}
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
