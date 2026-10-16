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
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, convertCurrency } from '@/lib/currency';

interface LoanProps {
  loans: LoanLiability[];
  profile: BusinessProfile;
  onRecordPayment: (id: string, amount: number) => Promise<boolean>;
  isUnlocked: boolean;
  onRequireUnlock: () => void;
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const LoanReconciliation: React.FC<LoanProps> = ({
  loans,
  profile,
  onRecordPayment,
  isUnlocked,
  onRequireUnlock,
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const activeCurrency = currentCurrency || profile.currency || 'BDT';
  const conv = (amt: number) => convertCurrency(amt, 'BDT', activeCurrency);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

  const [selectedLoan, setSelectedLoan] = useState<LoanLiability | null>(loans[0] || null);
  const [payAmount, setPayAmount] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  // Interactive Simulator State - adapts default to selected currency
  const defaultSim = activeCurrency === 'USD' ? '1600' : activeCurrency === 'CNY' ? '12000' : '200000';
  const [simPrincipal, setSimPrincipal] = useState(defaultSim);
  const [simRate, setSimRate] = useState('9.0');
  const [simTenure, setSimTenure] = useState('12');

  React.useEffect(() => {
    setSimPrincipal(activeCurrency === 'USD' ? '1600' : activeCurrency === 'CNY' ? '12000' : '200000');
  }, [activeCurrency]);

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

    // Convert payment to BDT base for Excel database consistency
    const enteredAmt = Number(payAmount);
    const amountInBDT = convertCurrency(enteredAmt, activeCurrency, 'BDT');

    const success = await onRecordPayment(selectedLoan.id, amountInBDT);
    if (success) {
      const msg =
        currentLanguage === 'zh'
          ? `已成功记账还款 ${enteredAmt.toLocaleString()} ${activeCurrency} 并完成贷款对账核销！`
          : currentLanguage === 'hi'
          ? `सफलतापूर्वक ${enteredAmt.toLocaleString()} ${activeCurrency} की किस्त दर्ज की गई और ऋण का समाधान किया गया!`
          : currentLanguage === 'bn'
          ? `সফলভাবে ${enteredAmt.toLocaleString()} ${activeCurrency} ঋণ পরিশোধ ও রিকনসাইল করা হয়েছে!`
          : `Successfully recorded repayment of ${enteredAmt.toLocaleString()} ${activeCurrency} and updated amortization ledger!`;
      setPaySuccess(msg);
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
            {t('totalRemainingDebtCard')}
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {conv(totalRemaining).toLocaleString()} {activeCurrency}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('activeLoansCountCard')}: {activeLoans.length}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('monthlyEmiBurdenCard')}
          </span>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {conv(totalEMI).toLocaleString()} {activeCurrency}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('monthlyFixedCostsGroup')}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {t('zeroHallucinationCard')}
          </span>
          <div className="mt-2 text-sm font-bold text-emerald-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            100% Deterministic Math
          </div>
          <p className="text-xs text-slate-500 mt-1">
            FinTechathon Zero-Hallucination Amortization Formula
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
                {t('loansDashboardTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('loansDashboardDesc')}
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
                  <th className="px-3 py-2.5">{t('lenderTh')}</th>
                  <th className="px-3 py-2.5 text-right">{t('principalTh')}</th>
                  <th className="px-3 py-2.5 text-right">{t('interestRateTh')}</th>
                  <th className="px-3 py-2.5 text-right">{t('simMonthlyEmi')}</th>
                  <th className="px-3 py-2.5 text-right">{t('remainingTh')}</th>
                  <th className="px-3 py-2.5">{t('nextDueTh')}</th>
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
                      {conv(loan.principal).toLocaleString()} {activeCurrency}
                    </td>
                    <td className="px-3 py-2.5 text-right">{loan.annualInterestRate}%</td>
                    <td className="px-3 py-2.5 text-right text-amber-600 font-bold">
                      {conv(loan.monthlyEMI).toLocaleString()} {activeCurrency}
                    </td>
                    <td className="px-3 py-2.5 text-right text-rose-600 font-black">
                      {conv(loan.remainingBalance).toLocaleString()} {activeCurrency}
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
                {t('payEmiModalBtn')}: {selectedLoan.lenderName}
              </h4>
              <form onSubmit={handlePaymentSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`${t('simMonthlyEmi')}: ${conv(selectedLoan.monthlyEMI).toLocaleString()} ${activeCurrency}`}
                  className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t('payEmiModalBtn')}
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
              <h3 className="text-base font-bold text-slate-900">{t('prepaymentSimTitle')}</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {t('prepaymentSimDesc')}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t('principalTh')} ({activeCurrency})
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
                  {t('interestRateTh')} (%)
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
                  {t('tenureTh')}
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
              <span className="text-xs text-indigo-900 font-medium">{t('simMonthlyEmi')}:</span>
              <span className="text-base font-black text-indigo-600">
                {simResult.monthlyEMI.toLocaleString()} {activeCurrency}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-600">
              <span>{t('simTotalRepay')}:</span>
              <span>{simResult.totalRepayment.toLocaleString()} {activeCurrency}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{t('simTotalInterest')}:</span>
              <span className="text-rose-600 font-semibold">
                {simResult.totalInterest.toLocaleString()} {activeCurrency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
