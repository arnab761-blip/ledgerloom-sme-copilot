'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Cpu,
  FileCheck2,
  Database,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
  X,
} from 'lucide-react';
import { SupportedLanguage } from '@/lib/i18n';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: SupportedLanguage;
}

export const SecurityAndLimitationsModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="limitations-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="limitations-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center font-bold shadow-lg">
              <ShieldCheck className="w-6 h-6 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">
                  {currentLanguage === 'zh'
                    ? '系统安全架构与诚实局限性说明'
                    : currentLanguage === 'hi'
                    ? 'सुरक्षा वास्तुकला और ईमानदार सीमाएं'
                    : currentLanguage === 'bn'
                    ? 'নিরাপত্তা কাঠামো (৬ স্তর) ও সৎ সীমাবদ্ধতা'
                    : 'Security Architecture (6 Layers) & Honest Limitations'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                  SIMULATED PROTOTYPE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                LedgerLoom SME AI CFO • Competition Compliance & Governance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs leading-relaxed">
          {/* Section 1: 6 Layers of Security */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">
                {currentLanguage === 'zh'
                  ? '第 7 节：六重主动安全防护网 (6 Security Layers)'
                  : currentLanguage === 'bn'
                  ? '৭. নিরাপত্তা: ৬ স্তরের সক্রিয় সুরক্ষা কাঠামো (6 Security Layers)'
                  : '7. Six Active Security Layers (Defense-in-Depth)'}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">1</span>
                  {currentLanguage === 'bn' ? 'অনুমতির স্তর (Tiered Permissions)' : 'Tiered Permissions'}
                </div>
                <p className="text-slate-600 text-[11px]">
                  {currentLanguage === 'bn'
                    ? 'AI কখনো সরাসরি ডেটাবেজ বা টাকায় হাত দেয় না। AI শুধু খসড়া (Draft) তৈরি করে; মালিক নিজে Confirm করলেই তা সেভ হয়।'
                    : 'AI never mutates databases or triggers payouts directly. AI only creates drafts; the business owner must click Confirm to commit.'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">2</span>
                  {currentLanguage === 'bn' ? 'Hallucination সুরক্ষা (Zero-Hallucination Math)' : 'Hallucination Guard'}
                </div>
                <p className="text-slate-600 text-[11px]">
                  {currentLanguage === 'bn'
                    ? 'সব হিসাব-নিকাশ, ব্রেক-ইভেন, মার্জিন ও ঋণের কিস্তির অঙ্ক ১০০% হার্ডকোডেড ম্যাথমেটিক্যাল ইঞ্জিন থেকে আসে, LLM থেকে নয়।'
                    : 'All mathematical numbers, profit targets, EMIs, and thresholds are computed by deterministic TypeScript math tools, not hallucinated.'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">3</span>
                  {currentLanguage === 'bn' ? 'Prompt Injection সুরক্ষা' : 'Prompt Injection Sanitizer'}
                </div>
                <p className="text-slate-600 text-[11px]">
                  {currentLanguage === 'bn'
                    ? 'ইউজারের ইনপুট থেকে গোপন পিন বা সিস্টেম ইনজেকশন ফিল্টার করা হয়। ব্যবহারকারীর কোনো কথা সিস্টেম প্রম্পটকে ওভাররাইড করতে পারে না।'
                    : 'Inputs are sanitized with SecurityVault. Strict system boundaries prevent malicious jailbreaks or prompt injection overrides.'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">4</span>
                  {currentLanguage === 'bn' ? 'ডেটা সুরক্ষা ও গোপনীয়তা' : 'Data Privacy & Isolation'}
                </div>
                <p className="text-slate-600 text-[11px]">
                  {currentLanguage === 'bn'
                    ? 'কোনো আসল ব্যক্তিগত তথ্য বাইরে যায় না। ফোন নম্বর ও নাম মাস্ক করা থাকে এবং ৩০ মিনিট পর সেশন স্বয়ংক্রিয় লক হয়ে যায়।'
                    : 'PII masking on phone numbers and customer names. 30-minute sliding window security vault protects all settings.'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">5</span>
                  {currentLanguage === 'bn' ? 'অপরিবর্তনীয় অডিট লগ (Audit Trail)' : 'Immutable Audit Log'}
                </div>
                <p className="text-slate-600 text-[11px]">
                  {currentLanguage === 'bn'
                    ? 'প্রত্যেকটি ট্রানজ্যাকশন সংযোজন, পরিবর্তন, ডেবটর অ্যালার্ট ও ঋণ অনুমোদনের অপরিবর্তনীয় লগ সংরক্ষিত থাকে।'
                    : 'Every transaction creation, approval, rejection, and loan simulation creates a timestamped tamper-evident audit record.'}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 font-bold text-slate-900 mb-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">6</span>
                  {currentLanguage === 'bn' ? 'নিয়ম মানা (Regulatory Disclaimer)' : 'Regulatory Disclaimer'}
                </div>
                <p className="text-slate-600 text-[11px]">
                  {currentLanguage === 'bn'
                    ? 'এটি একটি সিদ্ধান্ত সমর্থনকারী প্রোটোটাইপ সহকারী; এটি কোনো আর্থিক পরামর্শক (Financial Advisor) বা আসল ব্যাংক নয়।'
                    : 'LedgerLoom is an intelligent decision-support copilot, not an accredited financial advisory firm or licensed lending institution.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Section 11 Honest Limitations */}
          <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>
                {currentLanguage === 'zh'
                  ? '第 11 节：竞赛公开诚实局限性 (Honest Limitations)'
                  : currentLanguage === 'bn'
                  ? '১১. সৎ সীমাবদ্ধতা (Honest Limitations for Judges)'
                  : '11. Honest Limitations & Model Disclaimers'}
              </span>
            </div>

            <ul className="space-y-2 text-[11px] text-amber-950/90 list-disc list-inside">
              <li>
                <strong>{currentLanguage === 'bn' ? 'সব ডেটা ও হার নকল (Simulated Data):' : 'All Data & Interest Rates Simulated:'}</strong>{' '}
                {currentLanguage === 'bn'
                  ? 'সমস্ত হিসাব, সুদের হার ও দেনাদারের নাম কাল্পনিক ডেমো সিনারিও। আসল ব্যাংক, bKash বা সেলফোনের আসল SMS-এর সাথে কোনো লাইভ সংযোগ নেই।'
                  : 'All numbers, rates, and debtor records are calibrated sandbox mock data. There is no live telecommunication or bKash API connection.'}
              </li>
              <li>
                <strong>{currentLanguage === 'bn' ? 'সরলীকৃত অ্যাকাউন্টিং মডেল:' : 'Simplified SME Model:'}</strong>{' '}
                {currentLanguage === 'bn'
                  ? 'হিসাব সরল লিনিয়ার ব্রেক-ইভেন মডেলের; বাস্তব জটিল অর্থনীতির ট্যাক্স ব্র্যাকেট, অবচয় বা মুদ্রাস্ফীতির জটিলতা এখানে ধরা হয়নি।'
                  : 'Calculations utilize intuitive unit-economics and contribution margins; they do not factor complex macro-depreciation or multi-tiered corporate taxation.'}
              </li>
              <li>
                <strong>{currentLanguage === 'bn' ? 'ভাষা ও AI ভুলের ঢাল:' : 'Human-in-the-Loop Safeguard:'}</strong>{' '}
                {currentLanguage === 'bn'
                  ? 'বাংলা ভাষা প্রক্রিয়াকরণে AI ভুল খসড়া সাজাতে পারে; সেজন্য মালিকের "Confirm বা Reject" স্ক্রিনই চূড়ান্ত ঢাল।'
                  : 'Because natural language processing can misinterpret colloquial slang, the owner Confirmation screen serves as the final barrier.'}
              </li>
              <li>
                <strong>{currentLanguage === 'bn' ? 'টাকা স্থানান্তরের অক্ষমতা (Air-Gapped):' : 'No Fund Movement:'}</strong>{' '}
                {currentLanguage === 'bn'
                  ? 'এই সহকারী কোনো ফান্ড সরাতে পারে না, নিজে কোনো ঋণ পাস করতে পারে না এবং কোনো আসল আর্থিক অ্যাকাউন্টে লগইন করতে পারে না।'
                  : 'The agent is strictly air-gapped from financial accounts and cannot move funds or execute bank transfers.'}
              </li>
            </ul>
          </div>

          {/* Section 3: Section 8 Built vs Future Roadmap */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              {currentLanguage === 'bn'
                ? '৮. আসলে তৈরি করা ফিচার বনাম ভবিষ্যৎ রোডম্যাপ (Scope Breakdown)'
                : '8. Built Scope vs Future Roadmap'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {currentLanguage === 'bn' ? 'যা বর্তমানে তৈরি ও সরাসরি সচল (Built & Live)' : 'Built & Fully Working'}
                </div>
                <ul className="space-y-1 text-emerald-900 list-disc list-inside">
                  <li>{currentLanguage === 'bn' ? 'কথোপকথন থেকে খসড়া এন্ট্রি তৈরি' : 'Speech/text to draft transactions'}</li>
                  <li>{currentLanguage === 'bn' ? 'মালিকের জন্য বড় Confirm ও Reject বাটন' : 'Large Confirm & Reject staging'}</li>
                  <li>{currentLanguage === 'bn' ? 'সন্দেহজনক অস্বাভাবিক খরচের লাল অ্যালার্ট' : 'Suspicious transactions highlighted in red'}</li>
                  <li>{currentLanguage === 'bn' ? 'লাভ-ক্ষতি ও উল্টো লক্ষ্য-লাভ হিসাব' : 'P&L and reverse target-profit plan'}</li>
                  <li>{currentLanguage === 'bn' ? 'বাকি সীমা অ্যালার্ট ও অটো রিমাইন্ডার খসড়া' : 'Overdue debtor alerts & SMS generator'}</li>
                  <li>{currentLanguage === 'bn' ? '৩টি বিকল্পে ঋণের কিস্তির চাপ তুলনা' : '3-option loan comparison with EMI pressure'}</li>
                  <li>{currentLanguage === 'bn' ? 'সিমুলেটেড bKash নোটিফিকেশন গ্রহণ ও ট্র্যাকিং' : 'Simulated bKash transaction inbox'}</li>
                </ul>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl">
                <div className="font-bold text-sky-800 flex items-center gap-1.5 mb-1.5">
                  <Cpu className="w-4 h-4 text-sky-600" />
                  {currentLanguage === 'bn' ? 'ভবিষ্যৎ রোডম্যাপ (Future Roadmap)' : 'Future Roadmap'}
                </div>
                <ul className="space-y-1 text-sky-900 list-disc list-inside">
                  <li>{currentLanguage === 'bn' ? 'সরাসরি মোবাইল সিম থেকে আসল push SMS পড়া' : 'Direct Android accessibility service for SMS'}</li>
                  <li>{currentLanguage === 'bn' ? 'সরাসরি বাংলাদেশ ব্যাংকের লাইভ API-এর সাথে সংযোগ' : 'Live Central Bank & open banking API'}</li>
                  <li>{currentLanguage === 'bn' ? 'ব্যাংকগুলোকে সরাসরি PDF স্টেটমেন্ট স্বয়ংক্রিয় পাঠানো' : 'Automated credit appraisal PDF submission'}</li>
                  <li>{currentLanguage === 'bn' ? 'মাইক্রো-ইনস্যুরেন্স ও কমার্শিয়াল ফ্যাক্টরি বিমা লিঙ্কিং' : 'Embedded SME inventory insurance'}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            {currentLanguage === 'zh'
              ? '我已了解并同意 (I Understand)'
              : currentLanguage === 'bn'
              ? 'আমি সম্পূর্ণভাবে অবগত ও একমত (I Understand)'
              : 'I Understand & Acknowledge'}
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
