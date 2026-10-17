'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  FileText,
  DollarSign,
  AlertCircle,
  Send,
} from 'lucide-react';
import {
  FinancingOption,
  BusinessProfile,
  FinancialHealthMetrics,
  DebtorRecord,
} from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency } from '@/lib/currency';

interface FinancingProps {
  financingOptions: FinancingOption[];
  profile: BusinessProfile;
  health: FinancialHealthMetrics;
  debtors: DebtorRecord[];
  isUnlocked: boolean;
  onRequireUnlock: () => void;
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const FinancingMatcher: React.FC<FinancingProps> = ({
  financingOptions,
  profile,
  health,
  debtors,
  isUnlocked,
  onRequireUnlock,
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const activeCurrency = currentCurrency || profile.currency || 'BDT';
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

  const [selectedOption, setSelectedOption] = useState<FinancingOption | null>(
    financingOptions[0] || null
  );
  const [applying, setApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState<string | null>(null);

  const handleApplySandbox = (option: FinancingOption) => {
    if (!isUnlocked) {
      onRequireUnlock();
      return;
    }

    setApplying(true);
    setTimeout(() => {
      setApplying(false);
      setAppliedSuccess(
        t('applySandboxToast', { id: Date.now().toString().slice(-6) })
      );
      setTimeout(() => setAppliedSuccess(null), 6000);
    }, 1200);
  };

  const getTenureSuffix = () => {
    if (currentLanguage === 'zh') return '个月';
    if (currentLanguage === 'bn') return ' মাস';
    if (currentLanguage === 'hi') return ' माह';
    return ' months';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Underwriting & Credit Matching Engine
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('financingTitle')}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {t('financingDesc')}
          </p>
        </div>

        {/* Creditworthiness Score Badge */}
        <div className="bg-indigo-900/60 border border-indigo-500/40 p-4 rounded-xl flex items-center gap-4 shrink-0">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">
              {t('creditHealthTitle')}
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {health.netProfit > 0 ? `785 (${t('excellentScore')})` : `640 (${t('fairScore')})`}
            </div>
            <div className="text-[10px] text-slate-300">
              DSCR: {(health.totalRevenue / Math.max(1, health.monthlyLoanObligation)).toFixed(1)}x
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-400 flex items-center justify-center font-black text-xs text-white">
            A+
          </div>
        </div>
      </div>

      {appliedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-medium animate-in fade-in shadow">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{appliedSuccess}</span>
        </div>
      )}

      {/* Section 6 Eid Deficit Forecast & 3-Option Loan Pressure Comparison */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-slate-50 border-2 border-indigo-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-900 flex items-center justify-center font-black shrink-0">
              <AlertCircle className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-300">
                  {currentLanguage === 'bn' ? '২৪ তারিখে ৳৩০,০০০ নগদ ঘাটতি পূর্বাভাস' : 'Deficit Alert: 30,000 BDT on the 24th'}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {currentLanguage === 'bn' ? 'Owner-এর কাল্পনিক দৃশ্যপট' : "Owner's Scenario"}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {currentLanguage === 'zh'
                  ? '资金缺口应对方案：3种贷款月供还款压力对比'
                  : currentLanguage === 'bn'
                  ? 'ঘাটতি মেটানোর ৩টি ঋণ বিকল্পের মাসিক কিস্তির চাপ তুলনা'
                  : '3-Option Loan Pressure Comparison (Deficit Mitigation)'}
              </h3>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-xl border border-indigo-200 shrink-0">
            {currentLanguage === 'bn' ? 'সুপারিশ: বিকল্প ১ (সবচেয়ে কম চাপ)' : 'Recommended: Option 1 (Lowest Pressure)'}
          </span>
        </div>

        {/* 3 Options Comparison Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Option 1 */}
          <div className="p-4 bg-white border-2 border-emerald-400 rounded-2xl shadow-sm space-y-2 relative">
            <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black">
              ⭐ {currentLanguage === 'bn' ? 'সর্বোত্তম পছন্দ' : 'BEST MATCH'}
            </span>
            <div className="text-xs font-bold text-slate-900">
              {currentLanguage === 'bn' ? '১. ৬ মাসের ক্ষুদ্রঋণ ফ্যাসিলিটি' : '1. 6-Month Micro-Facility'}
            </div>
            <div className="text-[11px] text-slate-500">
              {currentLanguage === 'bn' ? 'সুদের হার: ৮.৫% বার্ষিক' : 'Interest: 8.5% p.a.'}
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-[10px] text-emerald-800 font-semibold">
                {currentLanguage === 'bn' ? 'আনুমানিক মাসিক কিস্তি (EMI)' : 'Estimated Monthly EMI'}
              </div>
              <div className="text-lg font-black text-emerald-700">
                ~৳৫,১৭৬ <span className="text-[10px] font-normal text-emerald-800">/মাস</span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'bn' ? 'সবচেয়ে কম নগদ চাপ (Lowest Pressure)' : 'Lowest Cash-Flow Pressure'}</span>
            </div>
          </div>

          {/* Option 2 */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-900">
              {currentLanguage === 'bn' ? '২. বাণিজ্যিক এসএমই ব্যাংক লোন' : '2. Commercial SME Bank Loan'}
            </div>
            <div className="text-[11px] text-slate-500">
              {currentLanguage === 'bn' ? 'সুদের হার: ৯.৫% বার্ষিক' : 'Interest: 9.5% p.a.'}
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-[10px] text-slate-600 font-semibold">
                {currentLanguage === 'bn' ? 'আনুমানিক মাসিক কিস্তি (EMI)' : 'Estimated Monthly EMI'}
              </div>
              <div className="text-lg font-black text-slate-800">
                ~৳৫,২৯৬ <span className="text-[10px] font-normal text-slate-500">/মাস</span>
              </div>
            </div>
            <div className="text-[10px] font-semibold text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'bn' ? 'মাঝারি চাপ (+৳১২০ বেশি কিস্তি)' : 'Medium Pressure (+120 Tk EMI)'}</span>
            </div>
          </div>

          {/* Option 3 */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2">
            <div className="text-xs font-bold text-slate-900">
              {currentLanguage === 'bn' ? '৩. চালান ফ্যাক্টরিং (অগ্রিম পাওনা)' : '3. Invoice Factoring'}
            </div>
            <div className="text-[11px] text-slate-500">
              {currentLanguage === 'bn' ? 'বেঙ্গল গার্মেন্টস মার্টের বকেয়া বিলের বিপরীতে' : 'Against 45,000 Tk receivable'}
            </div>
            <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-200">
              <div className="text-[10px] text-sky-800 font-semibold">
                {currentLanguage === 'bn' ? 'মাসিক কিস্তির দায়' : 'Monthly Debt Obligation'}
              </div>
              <div className="text-lg font-black text-sky-700">
                ৳০ <span className="text-[10px] font-normal text-sky-800">({currentLanguage === 'bn' ? 'কোনো কিস্তি নেই' : 'Zero EMI'})</span>
              </div>
            </div>
            <div className="text-[10px] font-bold text-sky-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{currentLanguage === 'bn' ? 'জিরো ঋণ ঝুঁকি (নগদ অগ্রিম)' : 'Zero Debt (Factored Advance)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Matched Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {financingOptions.map((opt) => (
          <div
            key={opt.id}
            onClick={() => setSelectedOption(opt)}
            className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
              selectedOption?.id === opt.id
                ? 'bg-white border-indigo-600 shadow-lg ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div>
              {/* Header: Title & Fit Score */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {opt.provider}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{opt.name}</h3>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {opt.fitScorePercentage}% {t('matchScoreLabel')}
                  </span>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {opt.collateralRequired ? t('collateralBadge') : t('noCollateralBadge')}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {opt.processingTime}
                </span>
              </div>

              {/* Core Financial Terms */}
              <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-xl text-center">
                <div>
                  <div className="text-[10px] text-slate-500">{t('interestRateLabel')}</div>
                  <div className="text-xs font-bold text-slate-900">{opt.interestRateText}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">{t('tenureLabel')}</div>
                  <div className="text-xs font-bold text-slate-900">
                    {opt.tenureMonths}{getTenureSuffix()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">{t('maxCreditLimitLabel')}</div>
                  <div className="text-xs font-bold text-indigo-600">
                    {opt.maxAmount.toLocaleString()} {activeCurrency}
                  </div>
                </div>
              </div>

              {/* Explainable AI Reason */}
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                <strong>{t('whyItFitsLabel')}</strong> {opt.explainableMatchReason}
              </p>

              {/* Transparent Fees */}
              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3 text-slate-400" />
                <span>{t('feesAndChargesLabel')} {opt.hiddenFees}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('preApprovedBadge')}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplySandbox(opt);
                }}
                disabled={applying}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {t('applySandboxBtn')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
