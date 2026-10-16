'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Clock,
  Zap,
  ArrowRight,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { FinancialHealthMetrics, BusinessProfile, DebtorRecord, LoanLiability, AnomalyAlert } from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';

interface DashboardProps {
  metrics: FinancialHealthMetrics;
  profile: BusinessProfile;
  debtors: DebtorRecord[];
  loans: LoanLiability[];
  anomalies?: AnomalyAlert[];
  onNavigateTab: (tab: string) => void;
  currentLanguage: SupportedLanguage;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  profile,
  debtors,
  loans,
  anomalies = [],
  onNavigateTab,
  currentLanguage,
}) => {
  const currency = profile.currency || 'BDT';
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

  const [forecastDays, setForecastDays] = React.useState<30 | 60>(30);

  // 30-day forecast curve
  const cashFlowForecast30 = [
    { day: 'Day 1', inflow: 45000, outflow: 20000, balance: 125000 },
    { day: 'Day 5', inflow: 60000, outflow: 35000, balance: 150000 },
    { day: 'Day 10', inflow: 30000, outflow: 85000, balance: 95000 },
    { day: 'Day 15', inflow: 80000, outflow: 25000, balance: 150000 },
    { day: 'Day 20 (Payable/Due)', inflow: 20000, outflow: 145000, balance: 25000 },
    { day: 'Day 25', inflow: 95000, outflow: 30000, balance: 90000 },
    { day: 'Day 30', inflow: 50000, outflow: 20000, balance: 120000 },
  ];

  // 60-day forecast curve (Past 3-6 months pattern projection)
  const cashFlowForecast60 = [
    { day: 'Day 1', inflow: 45000, outflow: 20000, balance: 125000 },
    { day: 'Day 10', inflow: 75000, outflow: 55000, balance: 145000 },
    { day: 'Day 20 (Month 1 Due)', inflow: 30000, outflow: 140000, balance: 35000 },
    { day: 'Day 30', inflow: 95000, outflow: 35000, balance: 95000 },
    { day: 'Day 40', inflow: 65000, outflow: 40000, balance: 120000 },
    { day: 'Day 50 (Month 2 Due)', inflow: 40000, outflow: 135000, balance: 25000 },
    { day: 'Day 60', inflow: 110000, outflow: 45000, balance: 150000 },
  ];

  const activeForecast = forecastDays === 30 ? cashFlowForecast30 : cashFlowForecast60;
  const finalProjectedBalance = activeForecast[activeForecast.length - 1].balance;
  const isSurplus = finalProjectedBalance >= 0;

  const costBreakdownData = [
    { name: t('fixedCostOption').slice(0, 14), amount: metrics.totalFixedCosts, fill: '#6366f1' },
    { name: t('variableCostOption').slice(0, 14), amount: metrics.totalVariableCosts, fill: '#06b6d4' },
    { name: t('tabLoans').slice(0, 14), amount: metrics.monthlyLoanObligation, fill: '#f59e0b' },
  ];

  const highRiskDebtors = debtors.filter(
    (d) => d.type === 'receivable' && d.amount >= (d.alertThreshold || 30000)
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome & Factory Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            {t('bannerSync')}
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{profile.businessName}</h2>
          <p className="text-sm text-slate-300">
            {profile.industry} • {profile.workerCount} {t('workers')} • {t('primaryProduct')}: {profile.primaryProduct}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateTab('copilot')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            {t('askCopilotBtn')}
          </button>
          <button
            onClick={() => onNavigateTab('financing')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition"
          >
            💳 {t('tabFinancing')}
          </button>
          <button
            onClick={() => onNavigateTab('goal_planner')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
          >
            {t('targetPlanBtn')}
          </button>
        </div>
      </div>

      {/* Smart Anomaly & Shortage Feed */}
      {anomalies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {anomalies.map((anom) => (
            <div
              key={anom.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition ${
                anom.severity === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : anom.severity === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  anom.severity === 'critical'
                    ? 'bg-rose-200 text-rose-700'
                    : anom.severity === 'warning'
                    ? 'bg-amber-200 text-amber-700'
                    : 'bg-indigo-200 text-indigo-700'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold">{anom.title}</div>
                <div className="text-[11px] leading-snug opacity-90">{anom.description}</div>
                <div className="text-[10px] font-semibold opacity-75 pt-1">
                  {t('anomProposalPrefix')} {anom.recommendedAction}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4 Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {metrics.totalRevenue.toLocaleString()} {currency}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.breakEvenProgressPercentage}% {t('bepTargetAchieved')}
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
              {metrics.totalExpenses.toLocaleString()} {currency}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {t('fixedVarSplit', {
              fixed: metrics.totalFixedCosts.toLocaleString(),
              variable: metrics.totalVariableCosts.toLocaleString(),
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
                metrics.netProfit >= 0
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {metrics.netProfit >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl font-black ${
                metrics.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {metrics.netProfit >= 0 ? '+' : ''}
              {metrics.netProfit.toLocaleString()} {currency}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {t('netMargin')}: {metrics.netMarginPercentage}%
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
              {metrics.cashRunwayDays} {t('days')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {t('monthlyEmiObligation', {
              amount: metrics.monthlyLoanObligation.toLocaleString(),
              currency,
            })}
          </p>
        </div>
      </div>

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
                        currency,
                      })
                    : t('shortfallBadge', {
                        amount: finalProjectedBalance.toLocaleString(),
                        currency,
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
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ${currency}`, '']}
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
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBreakdownData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={90} />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()} ${currency}`, '']}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">{t('totalMonthlyBurden')}</span>
            <span className="text-xs font-bold text-slate-900">
              {(
                metrics.totalFixedCosts +
                metrics.totalVariableCosts +
                metrics.monthlyLoanObligation
              ).toLocaleString()}{' '}
              {currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
