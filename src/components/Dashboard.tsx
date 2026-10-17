'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
  PieChart as PieIcon,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  FinancialHealthMetrics,
  BusinessProfile,
  DebtorRecord,
  LoanLiability,
  AnomalyAlert,
  Transaction,
} from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, convertCurrency } from '@/lib/currency';
import { AccountingEngine } from '@/lib/accounting-engine';
import { StatementDownloadModal } from './StatementDownloadModal';

interface DashboardProps {
  metrics: FinancialHealthMetrics;
  profile: BusinessProfile;
  debtors: DebtorRecord[];
  loans: LoanLiability[];
  transactions?: Transaction[];
  anomalies?: AnomalyAlert[];
  onNavigateTab: (tab: string) => void;
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  profile,
  debtors,
  loans,
  transactions = [],
  anomalies = [],
  onNavigateTab,
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const activeCurrency = currentCurrency || profile.currency || 'BDT';
  const conv = (amt: number) => convertCurrency(amt, 'BDT', activeCurrency);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

  const [forecastDays, setForecastDays] = useState<30 | 60>(30);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | 'current_month' | '30d' | '90d' | 'all'>('all');
  const [isBalanceRevealed, setIsBalanceRevealed] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const balanceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleToggleBalance = () => {
    if (isBalanceRevealed) {
      if (balanceTimerRef.current) clearTimeout(balanceTimerRef.current);
      setIsBalanceRevealed(false);
    } else {
      setIsBalanceRevealed(true);
      if (balanceTimerRef.current) clearTimeout(balanceTimerRef.current);
      // Automatically slide back and hide after 4 seconds (like bKash)
      balanceTimerRef.current = setTimeout(() => {
        setIsBalanceRevealed(false);
      }, 4000);
    }
  };

  React.useEffect(() => {
    return () => {
      if (balanceTimerRef.current) clearTimeout(balanceTimerRef.current);
    };
  }, []);

  // Identify anchor reference date from transactions (e.g. October 2026)
  const anchorDate = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return new Date();
    const timestamps = transactions
      .map((t) => new Date(t.date).getTime())
      .filter((time) => !isNaN(time));
    if (timestamps.length === 0) return new Date();
    return new Date(Math.max(...timestamps));
  }, [transactions]);

  // Dynamically filter transactions based on selected timeframe
  const filteredTransactions = React.useMemo(() => {
    if (selectedPeriod === 'all' || !transactions || transactions.length === 0) {
      return transactions;
    }

    const anchorYear = anchorDate.getFullYear();
    const anchorMonth = anchorDate.getMonth();

    if (selectedPeriod === 'current_month') {
      const monthStart = new Date(anchorYear, anchorMonth, 1, 0, 0, 0).getTime();
      const monthEnd = new Date(anchorYear, anchorMonth + 1, 0, 23, 59, 59).getTime();
      return transactions.filter((t) => {
        const time = new Date(t.date).getTime();
        return !isNaN(time) && time >= monthStart && time <= monthEnd;
      });
    }

    let daysToSubtract = 7;
    if (selectedPeriod === '30d') daysToSubtract = 30;
    if (selectedPeriod === '90d') daysToSubtract = 90;

    const endMs = new Date(anchorDate).setHours(23, 59, 59, 999);
    const startObj = new Date(anchorDate);
    startObj.setDate(startObj.getDate() - daysToSubtract);
    startObj.setHours(0, 0, 0, 0);
    const startMs = startObj.getTime();

    return transactions.filter((t) => {
      const time = new Date(t.date).getTime();
      return !isNaN(time) && time >= startMs && time <= endMs;
    });
  }, [transactions, selectedPeriod, anchorDate]);

  // Re-calculate Financial Health Metrics deterministically for the selected period
  const activeMetrics = React.useMemo(() => {
    if (selectedPeriod === 'all') return metrics;
    return AccountingEngine.computeFinancialHealth(
      profile,
      filteredTransactions,
      debtors,
      loans
    );
  }, [metrics, profile, filteredTransactions, debtors, loans, selectedPeriod]);

  // Timeline Badge Description Text
  const timelineDescription = React.useMemo(() => {
    const txCount = filteredTransactions.length;
    const countText =
      currentLanguage === 'bn'
        ? `${txCount}টি লেনদেন অন্তর্ভুক্ত`
        : `${txCount} transactions evaluated`;

    if (selectedPeriod === 'all') {
      return currentLanguage === 'bn'
        ? `📅 সম্পূর্ণ হিসেব (সব লেনদেন) • ${countText}`
        : `📅 All Time Overview • ${countText}`;
    }
    if (selectedPeriod === '7d') {
      return currentLanguage === 'bn'
        ? `📅 বিগত ৭ দিন • ${countText}`
        : `📅 Past 7 Days • ${countText}`;
    }
    if (selectedPeriod === 'current_month') {
      const monthName = anchorDate.toLocaleDateString(
        currentLanguage === 'bn' ? 'bn-BD' : 'en-US',
        { month: 'long', year: 'numeric' }
      );
      return currentLanguage === 'bn'
        ? `📅 চলতি মাস (${monthName}) • ${countText}`
        : `📅 Current Month (${monthName}) • ${countText}`;
    }
    if (selectedPeriod === '30d') {
      return currentLanguage === 'bn'
        ? `📅 বিগত ৩০ দিন • ${countText}`
        : `📅 Past 30 Days • ${countText}`;
    }
    if (selectedPeriod === '90d') {
      return currentLanguage === 'bn'
        ? `📅 বিগত ৩ মাস / কোয়ার্টার • ${countText}`
        : `📅 Past 90 Days / Quarter • ${countText}`;
    }
    return '';
  }, [selectedPeriod, filteredTransactions.length, currentLanguage, anchorDate]);

  // Cash on hand (calculated deterministically: initial capital + net profit - unpaid receivables)
  const cashBalance = Math.max(15000, profile.initialInvestment + activeMetrics.netProfit - activeMetrics.totalReceivables);

  // Dynamic 30-day and 60-day cash flow forecast calculated from actual transaction run-rates, debtors, and overheads
  const activeForecast = React.useMemo(() => {
    const dailyRevAvg = Math.max(2000, activeMetrics.totalRevenue / 30);
    const rawForecast = AccountingEngine.generateDynamicCashFlowForecast(
      cashBalance,
      dailyRevAvg,
      activeMetrics.totalFixedCosts,
      debtors,
      loans,
      forecastDays
    );
    return rawForecast.map((pt) => ({
      ...pt,
      inflow: conv(pt.inflow),
      outflow: conv(pt.outflow),
      balance: conv(pt.balance),
    }));
  }, [cashBalance, activeMetrics, debtors, loans, forecastDays, activeCurrency]);

  const finalProjectedBalance = activeForecast[activeForecast.length - 1]?.balance || 0;
  const isSurplus = finalProjectedBalance >= 0;

  const costBreakdownData = [
    {
      name: currentLanguage === 'bn' ? 'ফিক্সড কস্ট' : currentLanguage === 'zh' ? '固定开销' : currentLanguage === 'hi' ? 'स्थिर लागत' : 'Fixed Cost',
      amount: conv(activeMetrics.totalFixedCosts),
      fill: '#6366f1',
    },
    {
      name: currentLanguage === 'bn' ? 'কাঁচামাল খরচ' : currentLanguage === 'zh' ? '可变材料' : currentLanguage === 'hi' ? 'कच्चा माल' : 'Variable Cost',
      amount: conv(activeMetrics.totalVariableCosts),
      fill: '#06b6d4',
    },
    {
      name: currentLanguage === 'bn' ? 'ঋণের কিস্তি' : currentLanguage === 'zh' ? '月供负债' : currentLanguage === 'hi' ? 'ऋण किस्त' : 'Loan & EMI',
      amount: conv(activeMetrics.monthlyLoanObligation),
      fill: '#f59e0b',
    },
  ];

  const highRiskDebtors = debtors.filter(
    (d) => d.type === 'receivable' && d.amount >= (d.alertThreshold || 30000)
  );

  return (
    <div className="space-y-6">
      {/* ================= HERO BALANCE & FREQUENT ACTION BUTTONS ================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Business Info & bKash Style Hidden Balance */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {profile.businessName}
              </span>
              <span className="text-[11px] text-slate-400">
                {profile.industry} • {profile.workerCount} {t('workers')}
              </span>
            </div>

            {/* bKash-Style Tap-for-Balance Capsule + Status Message */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {/* Authentic bKash Capsule Button */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {currentLanguage === 'bn' ? 'বর্তমান ক্যাশ ব্যালেন্স' : 'Current Cash Balance'}
                </div>

                <motion.button
                  type="button"
                  onClick={handleToggleBalance}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group bg-white text-slate-900 rounded-full py-2 px-3.5 flex items-center gap-2.5 shadow-lg hover:shadow-xl transition-all cursor-pointer border border-rose-100 select-none overflow-hidden h-[44px] min-w-[210px] w-fit"
                  title={currentLanguage === 'bn' ? 'ট্যাপ করে ব্যালেন্স দেখুন' : 'Tap to view balance'}
                >
                  {/* Left Circular bKash-style badge */}
                  <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                    {activeCurrency === 'BDT' ? '৳' : activeCurrency === 'USD' ? '$' : '¥'}
                  </div>

                  {/* Animated Sliding Window */}
                  <div className="flex-1 relative overflow-hidden h-6 flex items-center pr-2">
                    <AnimatePresence mode="wait" initial={false}>
                      {!isBalanceRevealed ? (
                        <motion.div
                          key="label-hidden"
                          initial={{ x: 25, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -25, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="flex items-center gap-1.5"
                        >
                          <span className="font-bold text-xs sm:text-sm text-rose-600 tracking-wide">
                            {currentLanguage === 'bn' ? 'ব্যালেন্স দেখুন' : 'Tap for Balance'}
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="amount-revealed"
                          initial={{ x: 25, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -25, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="flex items-baseline gap-1"
                        >
                          <span className="font-black text-sm sm:text-base text-slate-900 font-mono tracking-tight">
                            {conv(cashBalance).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-rose-600">
                            {activeCurrency}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 4-Second Auto-Hide Countdown Line */}
                  {isBalanceRevealed && (
                    <motion.div
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 4, ease: 'linear' }}
                      className="absolute bottom-0 left-0 h-0.5 bg-rose-500 rounded-full"
                    />
                  )}
                </motion.button>
              </div>

              {/* Contextual Balance Status Message */}
              <div className="flex items-center sm:self-end sm:mb-0.5">
                {metrics.cashRunwayDays >= 60 ? (
                  <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      {currentLanguage === 'bn' ? 'যথেষ্ট ব্যালেন্স আছে (নিরাপদ)' : 'Sufficient Balance (Safe)'}
                    </span>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                      {currentLanguage === 'bn'
                        ? 'বর্তমান ক্যাশ দিয়ে আগামী ২+ মাসের খরচ ও দায় অনায়াসে মেটানো যাবে।'
                        : 'Current cash comfortably covers 2+ months of operating expenses.'}
                    </p>
                  </div>
                ) : metrics.cashRunwayDays >= 30 ? (
                  <div className="px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      {currentLanguage === 'bn' ? 'মাঝারি ব্যালেন্স (স্থিতিশীল)' : 'Moderate Balance'}
                    </span>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                      {currentLanguage === 'bn'
                        ? 'ব্যালেন্স স্বাভাবিক আছে, তবে বকেয়া বাকি টাকা দ্রুত আদায়ের তাগাদা দিন।'
                        : 'Balance is stable, but prioritize collecting overdue receivables.'}
                    </p>
                  </div>
                ) : (
                  <div className="px-3.5 py-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce"></span>
                      {currentLanguage === 'bn' ? 'ব্যালেন্স কম (সতর্কতা)' : 'Low Balance Alert'}
                    </span>
                    <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                      {currentLanguage === 'bn'
                        ? 'জরুরি ভিত্তিতে বাকি টাকা আদায় বা বিকল্প লোন সুবিধা নিশ্চিত করুন।'
                        : 'Urgent: follow up receivables or activate short-term financing.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Frequent Tasks Quick Action Buttons ("যেগুলো বারবার ক্লিক করতে হয়") */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => onNavigateTab('data_entry')}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition active:scale-95"
              title="Add Transaction or Sync Excel"
            >
              <span>➕</span>
              <span>{currentLanguage === 'bn' ? 'ডাটা এন্ট্রি' : 'Data Entry'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('debtors')}
              className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition active:scale-95"
              title="Manage Overdue Debtors & Send Reminders"
            >
              <span>⚠️</span>
              <span>{currentLanguage === 'bn' ? 'বাকি খাতা' : 'Debtors'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('staging')}
              className="px-3.5 py-2.5 bg-sky-700 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition active:scale-95"
              title="Scan and Process Receipts"
            >
              <span>📸</span>
              <span>{currentLanguage === 'bn' ? 'মেমো স্ক্যান' : 'Receipt OCR'}</span>
            </button>

            <button
              onClick={() => setIsStatementModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              title="Download Date-Filtered Financial Statement"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentLanguage === 'bn' ? 'স্টেটমেন্ট' : 'Statement'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('copilot')}
              className="px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95"
              title="Ask AI CFO Copilot"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentLanguage === 'bn' ? 'এআই কোপাইলট' : 'AI Copilot'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= UPCOMING SCHEDULES & CRITICAL ALERTS (SPACIOUS & UNCLUTTERED) ================= */}
      {anomalies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>
                {currentLanguage === 'bn'
                  ? 'গুরুত্বপূর্ণ পরিশোধ সূচি ও ঝুঁকি নোটিশ'
                  : 'Upcoming Payment Schedules & Health Alerts'}
              </span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500">
              {anomalies.length} {currentLanguage === 'bn' ? 'টি আইটেম' : 'Items'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((anom) => (
              <div
                key={anom.id}
                className={`p-5 rounded-2xl border shadow-xs transition space-y-3.5 ${
                  anom.severity === 'critical'
                    ? 'bg-rose-50/70 border-rose-200/90 text-rose-950'
                    : anom.severity === 'warning'
                    ? 'bg-amber-50/70 border-amber-200/90 text-amber-950'
                    : 'bg-indigo-50/70 border-indigo-200/90 text-indigo-950'
                }`}
              >
                {/* Header Badge & Title */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        anom.severity === 'critical'
                          ? 'bg-rose-200/80 text-rose-800'
                          : anom.severity === 'warning'
                          ? 'bg-amber-200/80 text-amber-800'
                          : 'bg-indigo-200/80 text-indigo-800'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          anom.severity === 'critical'
                            ? 'bg-rose-200/60 text-rose-800 border border-rose-300'
                            : 'bg-amber-200/60 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {anom.severity === 'critical'
                          ? (currentLanguage === 'bn' ? '🚨 জরুরি সূচি' : 'Critical Due')
                          : (currentLanguage === 'bn' ? '⚠️ সতর্কতা' : 'Warning')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clear Headline with comfortable line-height */}
                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {anom.title}
                </h4>

                {/* Uncluttered Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {anom.description}
                </p>

                {/* AI Solution Recommendation Card */}
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/70 space-y-1">
                  <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>{currentLanguage === 'bn' ? 'এআই সমাধান সুপারিশ' : 'AI Copilot Recommendation'}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-normal">
                    {anom.recommendedAction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TIMELINE & FINANCIAL HEALTH OVERVIEW SELECTOR ================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>📊</span>
              <span>
                {currentLanguage === 'bn'
                  ? 'আর্থিক কর্মক্ষমতা ও লাভ-ক্ষতির সময়কাল'
                  : 'Financial Performance Timeline'}
              </span>
            </h3>
          </div>
          <p className="text-xs font-medium text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100 inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>{timelineDescription}</span>
          </p>
        </div>

        {/* Timeline Period Selector Pills */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl self-start md:self-center overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setSelectedPeriod('7d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              selectedPeriod === '7d'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {currentLanguage === 'bn' ? '৭ দিন' : '7 Days'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('current_month')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              selectedPeriod === 'current_month'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {currentLanguage === 'bn' ? 'চলতি মাস' : 'This Month'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('30d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              selectedPeriod === '30d'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {currentLanguage === 'bn' ? '৩০ দিন' : '30 Days'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('90d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              selectedPeriod === '90d'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {currentLanguage === 'bn' ? '৩ মাস' : '90 Days'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
              selectedPeriod === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {currentLanguage === 'bn' ? 'সব সময়' : 'All Time'}
          </button>
        </div>
      </div>

      {/* 4 Primary Financial KPI Cards (Dynamic to Selected Timeline) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPeriod}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Card 1: Total Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('totalRevenue')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {conv(activeMetrics.totalRevenue).toLocaleString()} {activeCurrency}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {activeMetrics.breakEvenProgressPercentage}% {t('bepTargetAchieved')}
            </p>
          </div>

          {/* Card 2: Total Expenses */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('totalExpenses')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {conv(activeMetrics.totalExpenses).toLocaleString()} {activeCurrency}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {t('fixedVarSplit', {
                fixed: conv(activeMetrics.totalFixedCosts).toLocaleString(),
                variable: conv(activeMetrics.totalVariableCosts).toLocaleString(),
              })}
            </p>
          </div>

          {/* Card 3: Net Profit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('netProfit')}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activeMetrics.netProfit >= 0
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {activeMetrics.netProfit >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-black ${
                  activeMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {activeMetrics.netProfit >= 0 ? '+' : ''}
                {conv(activeMetrics.netProfit).toLocaleString()} {activeCurrency}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {t('netMargin')}: {activeMetrics.netMarginPercentage}%
            </p>
          </div>

          {/* Card 4: Cash Runway */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('cashRunway')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-sky-700">
                {activeMetrics.cashRunwayDays} {t('days')}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {t('monthlyEmiObligation', {
                amount: conv(activeMetrics.monthlyLoanObligation).toLocaleString(),
                currency: activeCurrency,
              })}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Predictive Cash Flow Curve (Area Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {t('cashCurveTitle')}
                </h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isSurplus
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  }`}
                >
                  {isSurplus
                    ? t('surplusBadge', {
                        amount: finalProjectedBalance.toLocaleString(),
                        currency: activeCurrency,
                      })
                    : t('shortfallBadge', {
                        amount: finalProjectedBalance.toLocaleString(),
                        currency: activeCurrency,
                      })}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('forecastDescPattern', { days: forecastDays })}
              </p>
            </div>

            {/* 30 vs 60 Days Forecast Period Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setForecastDays(30)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  forecastDays === 30
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('forecast30Btn')}
              </button>
              <button
                type="button"
                onClick={() => setForecastDays(60)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  forecastDays === 60
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('forecast60Btn')}
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeForecast}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ${activeCurrency}`, '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="balance"
                  name={t('expectedBalance')}
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
                <Area
                  type="monotone"
                  dataKey="inflow"
                  name={t('projectedInflow')}
                  stroke="#10b981"
                  strokeWidth={1.5}
                  fill="#10b981"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="outflow"
                  name={t('projectedOutflow')}
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  fill="#f43f5e"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Structure Breakdown (Bar Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">{t('costRatioTitle')}</h3>
              <PieIcon className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {t('costRatioDesc')}
            </p>
            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBreakdownData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={10}
                    tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ${activeCurrency}`, '']}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} barSize={42}>
                    {costBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{t('totalMonthlyBurden')}</span>
            <span className="text-xs font-bold text-slate-900">
              {conv(
                activeMetrics.totalFixedCosts +
                activeMetrics.totalVariableCosts +
                activeMetrics.monthlyLoanObligation
              ).toLocaleString()}{' '}
              {activeCurrency}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Statement Modal */}
      <StatementDownloadModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        profile={profile}
        transactions={transactions}
        currentLanguage={currentLanguage}
        currentCurrency={activeCurrency}
      />
    </div>
  );
};
