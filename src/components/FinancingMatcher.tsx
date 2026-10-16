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

interface FinancingProps {
  financingOptions: FinancingOption[];
  profile: BusinessProfile;
  health: FinancialHealthMetrics;
  debtors: DebtorRecord[];
  isUnlocked: boolean;
  onRequireUnlock: () => void;
  currentLanguage: SupportedLanguage;
}

export const FinancingMatcher: React.FC<FinancingProps> = ({
  financingOptions,
  profile,
  health,
  debtors,
  isUnlocked,
  onRequireUnlock,
  currentLanguage,
}) => {
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
                    {opt.maxAmount.toLocaleString()} {profile.currency}
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
