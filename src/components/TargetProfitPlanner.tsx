'use client';

import React, { useState } from 'react';
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

interface GoalPlannerProps {
  profile: BusinessProfile;
}

export const TargetProfitPlanner: React.FC<GoalPlannerProps> = ({ profile }) => {
  const [targetProfitInput, setTargetProfitInput] = useState('35000');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const targetAmount = Math.max(1000, Number(targetProfitInput) || 1000);
  const plan: TargetProfitPlan = AccountingEngine.solveTargetProfit(profile, targetAmount, period);

  const productMatrix = AccountingEngine.getProductProfitabilityMatrix(profile);

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
            টার্গেট প্রফিট প্ল্যানার ও ইউনিট ইকোনমিক্স (Goal & Unit Economics)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            আপনি কত টাকা লাভ করতে চান তা নির্ধারণ করুন এবং কোন পণ্যটি সবচেয়ে বেশি লাভজনক ও কোনটিতে লোকসান হচ্ছে তা শনাক্ত করুন।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            আপনার কাঙ্ক্ষিত লাভের লক্ষ্যমাত্রা
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              লক্ষ্যমাত্রা নিট লাভ ({profile.currency})
            </label>
            <div className="relative">
              <input
                type="number"
                step="5000"
                value={targetProfitInput}
                onChange={(e) => setTargetProfitInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                {profile.currency}
              </span>
            </div>
            {/* Quick Presets */}
            <div className="flex gap-2 mt-2">
              {['10000', '25000', '50000', '100000'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setTargetProfitInput(preset)}
                  className={`px-2 py-1 text-[11px] rounded-lg border transition ${
                    targetProfitInput === preset
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  +{Number(preset).toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">সময়কাল</label>
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
                  {p === 'month' ? '১ মাস' : p === 'quarter' ? '৩ মাস (Quarter)' : '১ বছর'}
                </button>
              ))}
            </div>
          </div>

          {/* Business Assumptions summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>কারখানার বর্তমান পরামিতি:</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>মাসিক ফিক্সড কস্ট:</span>
              <span className="font-semibold">{plan.totalFixedCost.toLocaleString()} {profile.currency}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>প্রতি পণ্যে বিক্রয়মূল্য:</span>
              <span className="font-semibold">{profile.unitSellingPrice} {profile.currency}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>প্রতি পণ্যে ভ্যারিয়েবল খরচ:</span>
              <span className="font-semibold">{profile.unitVariableCost} {profile.currency}</span>
            </div>
            <div className="flex justify-between text-indigo-700 font-bold pt-1 border-t border-slate-200">
              <span>প্রতি পিসে কন্ট্রিবিউশন মার্জিন:</span>
              <span>{plan.unitContributionMargin} {profile.currency}</span>
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
                  প্রয়োজনীয় বিক্রয় ইউনিট (Required Output)
                </span>
                <div className="mt-2 text-3xl font-black text-indigo-600">
                  {plan.requiredUnits.toLocaleString()} পিস
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {profile.primaryProduct} তৈরি ও ডেলিভারি নিশ্চিত করতে হবে
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                প্রত্যাশিত মোট বিক্রয় মূল্য:{' '}
                <strong>{plan.requiredRevenue.toLocaleString()} {profile.currency}</strong>
              </div>
            </div>

            {/* Card 2: Fabric Material Required */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-emerald-600" />
                  প্রয়োজনীয় কাঁচামাল / উপকরণ (Raw Material)
                </span>
                <div className="mt-2 text-3xl font-black text-emerald-600">
                  {plan.requiredFabricMeters.toLocaleString()} মিটার/কেজি
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  প্রতি ইউনিটে {profile.fabricMetersPerUnit} একক উপকরণ হিসেবে
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                কাঁচামাল ক্রয়ের সম্ভাব্য বাজেট:{' '}
                <strong>{plan.requiredFabricCost.toLocaleString()} {profile.currency}</strong>
              </div>
            </div>
          </div>

          {/* Actionable Strategy Steps */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              মালিকের জন্য করণীয় রূপরেখা (Actionable Execution Plan)
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
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">{step}</p>
                </div>
              ))}
            </div>

            {/* Break-even & Margin of Safety Progress */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                <span>মার্জিন অব সেফটি (Margin of Safety):</span>
                <span>{plan.marginOfSafetyPercentage}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(10, plan.marginOfSafetyPercentage))}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-indigo-800">
                প্রথম {plan.breakEvenUnits.toLocaleString()}টি পণ্য বিক্রির পর কারখানার লস হওয়ার ঝুঁকি শূন্য হয়ে যাবে।
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
              পণ্যভিত্তিক প্রফিট মার্জিন ও ইউনিট ইকোনমিক্স (Product Profitability Matrix)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রতিটি পণ্যের লাভ-মার্জিন ও লোকসানের হিসাব — কোনটিতে উৎপাদন বাড়ানো দরকার আর কোনটি লোকসানে চলছে
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 w-fit">
            Unit Economics Analyzer
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">পণ্য / সেবা</th>
                <th className="py-3 px-3">বিক্রয়মূল্য</th>
                <th className="py-3 px-3">ভ্যারিয়েবল খরচ</th>
                <th className="py-3 px-3">কন্ট্রিবিউশন মার্জিন</th>
                <th className="py-3 px-3">মার্জিন %</th>
                <th className="py-3 px-3">মাসিক বিক্রয়</th>
                <th className="py-3 px-3">অবস্থা (Status)</th>
                <th className="py-3 px-4">সিএফও পরামর্শ (Action)</th>
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
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.productName}</td>
                  <td className="py-3.5 px-3 font-semibold text-slate-800">
                    {item.unitSellingPrice.toLocaleString()} {profile.currency}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">
                    {item.unitVariableCost.toLocaleString()} {profile.currency}
                  </td>
                  <td
                    className={`py-3.5 px-3 font-bold ${
                      item.contributionMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {item.contributionMargin >= 0 ? '+' : ''}
                    {item.contributionMargin.toLocaleString()} {profile.currency}
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
                    ~{item.monthlyVolumeEstimate} পিস
                  </td>
                  <td className="py-3.5 px-3">
                    {item.status === 'high_profit' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ⭐ উচ্চ মার্জিন
                      </span>
                    )}
                    {item.status === 'profitable' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                        ✅ লাভজনক
                      </span>
                    )}
                    {item.status === 'thin_margin' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        ⚠️ স্বল্প মার্জিন
                      </span>
                    )}
                    {item.status === 'loss_making' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                        ❌ লোকসান ঝুঁকি
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
