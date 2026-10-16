'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Scissors,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { BusinessProfile, TargetProfitPlan } from '@/lib/types';
import { AccountingEngine } from '@/lib/accounting-engine';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, getProfitPresets, getDefaultTargetProfit } from '@/lib/currency';

interface GoalPlannerProps {
  profile: BusinessProfile;
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const TargetProfitPlanner: React.FC<GoalPlannerProps> = ({
  profile,
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

  const activeCurrency = currentCurrency || profile.currency || 'BDT';
  const activeProfile = AccountingEngine.getConvertedProfile(profile, activeCurrency);

  const [targetProfitInput, setTargetProfitInput] = useState(() => getDefaultTargetProfit(activeCurrency));
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // Update default input when user switches currency
  useEffect(() => {
    setTargetProfitInput(getDefaultTargetProfit(activeCurrency));
  }, [activeCurrency]);

  const minTarget = activeCurrency === 'USD' ? 10 : activeCurrency === 'CNY' ? 100 : 1000;
  const targetAmount = Math.max(minTarget, Number(targetProfitInput) || minTarget);
  const plan: TargetProfitPlan = AccountingEngine.solveTargetProfit(
    activeProfile,
    targetAmount,
    period,
    currentLanguage
  );

  const productMatrix = AccountingEngine.getProductProfitabilityMatrix(
    activeProfile,
    currentLanguage,
    activeCurrency
  );

  const presets = getProfitPresets(activeCurrency);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-2">
            <Target className="w-3.5 h-3.5" />
            Reverse Accounting & Unit Economics Solver
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('targetPlannerTitle')}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {t('targetPlannerDesc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            {t('targetNetProfitLabel')}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('targetNetProfitLabel')} ({activeCurrency})
            </label>
            <div className="relative">
              <input
                type="number"
                step={activeCurrency === 'USD' ? '50' : activeCurrency === 'CNY' ? '500' : '5000'}
                value={targetProfitInput}
                onChange={(e) => setTargetProfitInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                {activeCurrency}
              </span>
            </div>
            {/* Quick Presets */}
            <div className="flex gap-2 mt-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTargetProfitInput(preset.toString())}
                  className={`px-2 py-1 text-[11px] rounded-lg border transition ${
                    targetProfitInput === preset.toString()
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('periodLabel')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['month', 'quarter', 'year'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`py-2 rounded-xl text-xs font-bold border capitalize transition ${
                    period === p
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p === 'month'
                    ? t('oneMonth')
                    : p === 'quarter'
                    ? t('threeMonths')
                    : t('oneYear')}
                </button>
              ))}
            </div>
          </div>

            {/* Business Assumptions summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>{t('currentParametersTitle')}:</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('monthlyFixedLabel')}:</span>
                <span className="font-semibold">
                  {plan.totalFixedCost.toLocaleString()} {activeCurrency}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('unitPriceLabel')}:</span>
                <span className="font-semibold">
                  {activeProfile.unitSellingPrice} {activeCurrency}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{t('unitVarCostLabel')}:</span>
                <span className="font-semibold">
                  {activeProfile.unitVariableCost} {activeCurrency}
                </span>
              </div>
              <div className="flex justify-between text-indigo-700 font-bold pt-1 border-t border-slate-200">
                <span>{t('unitMarginLabel')}:</span>
                <span>
                  {plan.unitContributionMargin} {activeCurrency}
                </span>
              </div>
            </div>
          </div>

          {/* Calculation Results Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Deliverable Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Required Units */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    {t('requiredOutputCard')}
                  </span>
                  <div className="mt-2 text-3xl font-black text-indigo-600">
                    {plan.requiredUnits.toLocaleString()} {t('unitPcs')}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('produceAndDeliverDesc', { product: activeProfile.primaryProduct })}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  {t('expectedRevenueLabel')}:{' '}
                  <strong>
                    {plan.requiredRevenue.toLocaleString()} {activeCurrency}
                  </strong>
                </div>
              </div>

              {/* Card 2: Material Required */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-emerald-600" />
                    {t('requiredFabricCard')}
                  </span>
                  <div className="mt-2 text-3xl font-black text-emerald-600">
                    {plan.requiredFabricMeters.toLocaleString()} {t('unitMeters')}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('perUnitMaterialDesc', { meters: activeProfile.fabricMetersPerUnit })}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  {t('rawMaterialBudgetLabel')}:{' '}
                  <strong>
                    {plan.requiredFabricCost.toLocaleString()} {activeCurrency}
                  </strong>
                </div>
              </div>
            </div>

          {/* Actionable Strategy Steps */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              {t('actionStepsTitle')}
            </h3>

            <div className="space-y-3">
              {plan.actionableSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            {/* Break-even & Margin of Safety Progress */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                <span>{t('marginOfSafetyTitle')}</span>
                <span>{plan.marginOfSafetyPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(10, plan.marginOfSafetyPercentage)
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="text-[11px] text-indigo-800">
                {t('bepRiskFreeMsg', {
                  units: plan.breakEvenUnits.toLocaleString(),
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Profitability & Unit Economics Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              {t('unitEconomicsMatrixTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('unitEconomicsMatrixDesc')}
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 w-fit">
            {t('matrixBadge')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">{t('colProduct')}</th>
                <th className="py-3 px-3">{t('colSellingPrice')}</th>
                <th className="py-3 px-3">{t('colVarCost')}</th>
                <th className="py-3 px-3">{t('colMargin')}</th>
                <th className="py-3 px-3">{t('colMarginPct')}</th>
                <th className="py-3 px-3">{t('colMonthlyVolume')}</th>
                <th className="py-3 px-3">{t('colStatus')}</th>
                <th className="py-3 px-4">{t('colCfoAdvice')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productMatrix.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 transition ${
                    item.status === 'loss_making' ? 'bg-rose-50/50' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {item.productName}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">
                    {item.unitSellingPrice.toLocaleString()} {activeCurrency}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">
                    {item.unitVariableCost.toLocaleString()} {activeCurrency}
                  </td>
                  <td
                    className={`py-3.5 px-3 font-bold ${
                      item.contributionMargin >= 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {item.contributionMargin >= 0 ? '+' : ''}
                    {item.contributionMargin.toLocaleString()} {activeCurrency}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`font-black ${
                        item.marginPercentage >= 40
                          ? 'text-emerald-600'
                          : item.marginPercentage >= 20
                          ? 'text-indigo-600'
                          : item.marginPercentage >= 0
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {item.marginPercentage}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">
                    ~{item.monthlyVolumeEstimate} {t('unitPcs')}
                  </td>
                  <td className="py-3.5 px-3">
                    {item.status === 'high_profit' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {t('statusHighProfit')}
                      </span>
                    )}
                    {item.status === 'profitable' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                        {t('statusProfitable')}
                      </span>
                    )}
                    {item.status === 'thin_margin' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        {t('statusThinMargin')}
                      </span>
                    )}
                    {item.status === 'loss_making' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        {t('statusLossMaking')}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-600 leading-snug">
                    {item.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
