'use client';

import React, { useState } from 'react';
import {
  Landmark,
  Calculator,
  CheckCircle,
  TrendingDown,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  History,
} from 'lucide-react';
import { LoanLiability, BusinessProfile } from '@/lib/types';
import { AccountingEngine } from '@/lib/accounting-engine';

interface LoanProps {
  loans: LoanLiability[];
  profile: BusinessProfile;
  onRecordPayment: (id: string, amount: number) => Promise<boolean>;
  isUnlocked: boolean;
  onRequireUnlock: () => void;
}

export const LoanReconciliation: React.FC<LoanProps> = ({
  loans,
  profile,
  onRecordPayment,
  isUnlocked,
  onRequireUnlock,
}) => {
  const [selectedLoan, setSelectedLoan] = useState<LoanLiability | null>(loans[0] || null);
  const [payAmount, setPayAmount] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  // Interactive Simulator State
  const [simPrincipal, setSimPrincipal] = useState('200000');
  const [simRate, setSimRate] = useState('9.0');
  const [simTenure, setSimTenure] = useState('12');

  const simResult = AccountingEngine.calculateLoanEMI(
    Number(simPrincipal) || 0,
    Number(simRate) || 0,
    Number(simTenure) || 1
  );

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) {
      onRequireUnlock();
      return;
    }
    if (!selectedLoan || !payAmount || Number(payAmount) <= 0) return;

    const success = await onRecordPayment(selectedLoan.id, Number(payAmount));
    if (success) {
      setPaySuccess(
        `সফলভাবে ${Number(payAmount).toLocaleString()} ${profile.currency} ঋণ পরিশোধ ও রিকনসাইল করা হয়েছে!`
      );
      setPayAmount('');
      setTimeout(() => setPaySuccess(''), 4000);
    }
  };

  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalRemaining = activeLoans.reduce((s, l) => s + l.remainingBalance, 0);
  const totalEMI = activeLoans.reduce((s, l) => s + l.monthlyEMI, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            মোট অবশিষ্ট ঋণ (Remaining Debt)
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {totalRemaining.toLocaleString()} {profile.currency}
          </div>
          <p className="text-xs text-slate-500 mt-1">সক্রিয় ঋণ সংখ্যা: {activeLoans.length}টি</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            মাসিক কিস্তির চাপ (Monthly EMI Obligation)
          </span>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {totalEMI.toLocaleString()} {profile.currency}
          </div>
          <p className="text-xs text-slate-500 mt-1">কারখানার প্রতি মাসের ফিক্সড দায়বদ্ধতা</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            ডিটারমিনিস্টিক ক্যালকুলেটর ইঞ্জিন
          </span>
          <div className="mt-2 text-sm font-bold text-emerald-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            100% Zero-Hallucination Math
          </div>
          <p className="text-xs text-slate-500 mt-1">
            সুদ ও কিস্তির হিসাব AI মুখে বলে না, কোড সরাসরি এক্সিকিউট করে
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Loans Table & Payment Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                সক্রিয় ঋণ ও কিস্তির হিসাব (Loan Reconciliation)
              </h3>
              <p className="text-xs text-slate-500">
                ঋণ গ্রহণ, পরিশোধ এবং অবশিষ্ট ব্যালেন্সের নিখুঁত রিকনসিলিয়েশন
              </p>
            </div>
          </div>

          {paySuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {paySuccess}
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2.5">ঋণের বিবরণ / ব্যাংক</th>
                  <th className="px-3 py-2.5 text-right">মূল ঋণ</th>
                  <th className="px-3 py-2.5 text-right">সুদের হার</th>
                  <th className="px-3 py-2.5 text-right">মাসিক কিস্তি (EMI)</th>
                  <th className="px-3 py-2.5 text-right">অবশিষ্ট ব্যালেন্স</th>
                  <th className="px-3 py-2.5">পরবর্তী তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => (
                  <tr
                    key={loan.id}
                    onClick={() => setSelectedLoan(loan)}
                    className={`cursor-pointer transition ${
                      selectedLoan?.id === loan.id ? 'bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-900">{loan.lenderName}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{loan.lenderType}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {loan.principal.toLocaleString()} {profile.currency}
                    </td>
                    <td className="px-3 py-2.5 text-right">{loan.annualInterestRate}%</td>
                    <td className="px-3 py-2.5 text-right text-amber-600 font-bold">
                      {loan.monthlyEMI.toLocaleString()} {profile.currency}
                    </td>
                    <td className="px-3 py-2.5 text-right text-rose-600 font-black">
                      {loan.remainingBalance.toLocaleString()} {profile.currency}
                    </td>
                    <td className="px-3 py-2.5">{loan.nextPaymentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Payment Execution Box */}
          {selectedLoan && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                কিস্তি বা ঋণ পরিশোধ রেকর্ড করুন: {selectedLoan.lenderName}
              </h4>
              <form onSubmit={handlePaymentSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`কিস্তির অঙ্ক (যেমন: ${selectedLoan.monthlyEMI})`}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  পরিশোধ রেকর্ড ও ব্যালেন্স আপডেট
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Deterministic Loan EMI Simulator */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">লোন কিস্তি ক্যালকুলেটর</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              নতুন লোন বা ক্রেডিট লাইন নেওয়ার পূর্বে সঠিক মাসিক কিস্তি হিসাব করুন।
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  লোনের পরিমাণ ({profile.currency})
                </label>
                <input
                  type="number"
                  value={simPrincipal}
                  onChange={(e) => setSimPrincipal(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  বার্ষিক সুদের হার (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={simRate}
                  onChange={(e) => setSimRate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  মেয়াদ (মাস)
                </label>
                <input
                  type="number"
                  value={simTenure}
                  onChange={(e) => setSimTenure(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-indigo-900 font-medium">মাসিক কিস্তি (EMI):</span>
              <span className="text-base font-black text-indigo-600">
                {simResult.monthlyEMI.toLocaleString()} {profile.currency}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600">
              <span>মোট পরিশোধ:</span>
              <span>{simResult.totalRepayment.toLocaleString()} {profile.currency}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>মোট সুদ (Interest):</span>
              <span className="text-rose-600 font-semibold">
                {simResult.totalInterest.toLocaleString()} {profile.currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
