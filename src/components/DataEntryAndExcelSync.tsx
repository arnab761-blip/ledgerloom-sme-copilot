'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  PlusCircle,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Building,
  CreditCard,
  Users,
  Lightbulb,
} from 'lucide-react';
import { BusinessProfile, Transaction } from '@/lib/types';

interface DataEntryProps {
  profile: BusinessProfile;
  transactions: Transaction[];
  onRefreshData: () => void;
  onUpdateProfile: (updated: Partial<BusinessProfile>) => Promise<boolean>;
  onAddTransaction: (tx: any) => Promise<boolean>;
  isUnlocked: boolean;
  onRequireUnlock: () => void;
}

export const DataEntryAndExcelSync: React.FC<DataEntryProps> = ({
  profile,
  transactions,
  onRefreshData,
  onUpdateProfile,
  onAddTransaction,
  isUnlocked,
  onRequireUnlock,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'new_tx' | 'sheet_view'>('new_tx');

  // New Transaction Form State
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('sales');
  const [txCostType, setTxCostType] = useState<'fixed' | 'variable'>('variable');
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txPartyName, setTxPartyName] = useState('');
  const [txPaymentMethod, setTxPaymentMethod] = useState<'cash' | 'bank_transfer' | 'mobile_money' | 'cheque'>('bank_transfer');
  const [txLoading, setTxLoading] = useState(false);
  const [txSuccessMessage, setTxSuccessMessage] = useState('');

  // Profile Form State
  const [profData, setProfData] = useState({ ...profile });
  const [profLoading, setProfLoading] = useState(false);
  const [profSuccess, setProfSuccess] = useState(false);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) {
      onRequireUnlock();
      return;
    }

    if (!txAmount || Number(txAmount) <= 0) {
      alert('সঠিক টাকার পরিমাণ দিন!');
      return;
    }

    setTxLoading(true);
    setTxSuccessMessage('');

    const success = await onAddTransaction({
      date: new Date().toISOString().split('T')[0],
      type: txType,
      category: txCategory,
      costType: txCostType,
      amount: Number(txAmount),
      description: txDescription || `${txCategory} লেনদেন`,
      partyName: txPartyName,
      paymentMethod: txPaymentMethod,
      status: 'approved',
      source: 'manual_form',
    });

    setTxLoading(false);
    if (success) {
      setTxSuccessMessage('সফলভাবে এক্সেলে (Excel Database) যুক্ত হয়েছে!');
      setTxAmount('');
      setTxDescription('');
      setTxPartyName('');
      setTimeout(() => setTxSuccessMessage(''), 4000);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) {
      onRequireUnlock();
      return;
    }

    setProfLoading(true);
    const success = await onUpdateProfile(profData);
    setProfLoading(false);
    if (success) {
      setProfSuccess(true);
      setTimeout(() => setProfSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('new_tx')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'new_tx'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          নতুন আয়/ব্যয় এন্ট্রি (Web to Excel)
        </button>
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          ব্যবসার প্রোফাইল ও ফিক্সড কস্ট
        </button>
        <button
          onClick={() => setActiveSubTab('sheet_view')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeSubTab === 'sheet_view'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          লাইভ এক্সেল স্প্রেডশীট ভিউয়ার
        </button>
      </div>

      {/* SUBTAB 1: NEW TRANSACTION ENTRY */}
      {activeSubTab === 'new_tx' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                ওয়েব ফর্ম থেকে রিয়েল-টাইম এক্সেল এন্ট্রি
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                মালিক এখানে যা লিখবেন, তা সরাসরি ব্যাকএন্ডের এক্সেল ফাইলের (Excel Database) নির্দিষ্ট কলামে সেভ হবে।
              </p>
            </div>

            {txSuccessMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {txSuccessMessage}
              </div>
            )}

            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setTxCategory('sales');
                    setTxCostType('variable');
                  }}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition flex items-center justify-center gap-2 ${
                    txType === 'income'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🟢 আয় / বিক্রয় (Income)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setTxCategory('raw_material');
                    setTxCostType('variable');
                  }}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition flex items-center justify-center gap-2 ${
                    txType === 'expense'
                      ? 'bg-rose-600 text-white border-rose-600 shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🔴 ব্যয় / খরচ (Expense)
                </button>
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    টাকার পরিমাণ ({profile.currency}) *
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="যেমন: 25000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={txCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setTxCategory(cat);
                      if (cat === 'salary' || cat === 'utility' || cat === 'rent' || cat === 'maintenance') {
                        setTxCostType('fixed');
                      } else {
                        setTxCostType('variable');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {txType === 'income' ? (
                      <>
                        <option value="sales">পণ্য বিক্রয় (Sales / Delivery)</option>
                        <option value="advance">কাস্টমার অগ্রিম (Customer Advance)</option>
                        <option value="other_income">অন্যান্য আয়</option>
                      </>
                    ) : (
                      <>
                        <option value="raw_material">কাঁচামাল / ফেব্রিক ক্রয় (Fabric / Raw Material)</option>
                        <option value="salary">কর্মী ও শ্রমিকের বেতন (Salaries - Fixed)</option>
                        <option value="utility">কারেন্ট বিল / গ্যাস / পানি (Utilities - Fixed)</option>
                        <option value="rent">কারখানার ভাড়া (Factory Rent - Fixed)</option>
                        <option value="maintenance">মেশিনারি সার্ভিসিং / পার্টস (Maintenance)</option>
                        <option value="packaging">প্যাকেজিং ও পরিবহন (Packaging / Transport)</option>
                        <option value="other_expense">অন্যান্য ব্যয়</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Cost Classification & Party */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    খরচের ধরন (Cost Type)
                  </label>
                  <select
                    value={txCostType}
                    onChange={(e) => setTxCostType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="variable">ভ্যারিয়েবল কস্ট (পণ্য উৎপাদনের সাথে পরিবর্তনশীল)</option>
                    <option value="fixed">ফিক্সড কস্ট (স্থায়ী ব্যয় যেমন বেতন/ভাড়া/বিল)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পার্টি / কাস্টমার / সাপ্লায়ারের নাম
                  </label>
                  <input
                    type="text"
                    value={txPartyName}
                    onChange={(e) => setTxPartyName(e.target.value)}
                    placeholder="যেমন: ঢাকা ফ্যাশন হাব"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description & Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পেমেন্ট মাধ্যম
                  </label>
                  <select
                    value={txPaymentMethod}
                    onChange={(e) => setTxPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bank_transfer">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
                    <option value="cash">নগদ ক্যাশ (Cash)</option>
                    <option value="mobile_money">মোবাইল ব্যাংকিং (bKash/Nagad/Rocket)</option>
                    <option value="cheque">ব্যাংক চেক (Cheque)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সংক্ষিপ্ত বিবরণ / নোট
                  </label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="যেমন: ২০০ পিস পোলো ডেলিভারি"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={txLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {txLoading ? 'এক্সেলে সেভ হচ্ছে...' : 'এক্সেলে ডাটা এন্ট্রি নিশ্চিত করুন (Save to Excel)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BUSINESS PROFILE & FIXED COSTS */}
      {activeSubTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ব্যবসার মূলধন ও স্থায়ী খরচ (Master Profile)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  এখানে দেওয়া তথ্যগুলো ব্যাকএন্ডের `Business_Profile` এক্সেল শিটে জমা থাকে।
                </p>
              </div>
            </div>

            {profSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                মাস্টার প্রোফাইল ও এক্সেল শিট আপডেট সম্পন্ন হয়েছে!
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    কারখানা / ব্যবসার নাম
                  </label>
                  <input
                    type="text"
                    value={profData.businessName}
                    onChange={(e) => setProfData({ ...profData, businessName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    শুরুর তারিখ
                  </label>
                  <input
                    type="date"
                    value={profData.startDate}
                    onChange={(e) => setProfData({ ...profData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    প্রারম্ভিক বিনিয়োগ ({profile.currency})
                  </label>
                  <input
                    type="number"
                    value={profData.initialInvestment}
                    onChange={(e) =>
                      setProfData({ ...profData, initialInvestment: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Monthly Fixed Overheads */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  স্থায়ী ব্যয় (Monthly Fixed Costs)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      মোট কর্মী সংখ্যা
                    </label>
                    <input
                      type="number"
                      value={profData.workerCount}
                      onChange={(e) =>
                        setProfData({ ...profData, workerCount: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      মাসিক মোট বেতন ({profile.currency})
                    </label>
                    <input
                      type="number"
                      value={profData.workerSalariesMonthly}
                      onChange={(e) =>
                        setProfData({ ...profData, workerSalariesMonthly: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      বিদ্যুৎ বিল ({profile.currency})
                    </label>
                    <input
                      type="number"
                      value={profData.electricityBillMonthly}
                      onChange={(e) =>
                        setProfData({ ...profData, electricityBillMonthly: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      কারখানা ভাড়া ({profile.currency})
                    </label>
                    <input
                      type="number"
                      value={profData.rentMonthly}
                      onChange={(e) =>
                        setProfData({ ...profData, rentMonthly: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Unit Economics for Reverse Target Calculation */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-indigo-600" />
                  টার্গেট প্রফিট ও ফেব্রিক সমীকরণ প্যারামিটার
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                      মূল পণ্য
                    </label>
                    <input
                      type="text"
                      value={profData.primaryProduct}
                      onChange={(e) =>
                        setProfData({ ...profData, primaryProduct: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                      প্রতি পিসের বিক্রয়মূল্য
                    </label>
                    <input
                      type="number"
                      value={profData.unitSellingPrice}
                      onChange={(e) =>
                        setProfData({ ...profData, unitSellingPrice: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                      প্রতি পিসে ফেব্রিক (মিটার)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={profData.fabricMetersPerUnit}
                      onChange={(e) =>
                        setProfData({ ...profData, fabricMetersPerUnit: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                      ফেব্রিকের মিটার প্রতি দর
                    </label>
                    <input
                      type="number"
                      value={profData.fabricCostPerMeter}
                      onChange={(e) =>
                        setProfData({ ...profData, fabricCostPerMeter: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {profLoading ? 'সংরক্ষণ হচ্ছে...' : 'মাস্টার প্রোফাইল হালনাগাদ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB 3: SPREADSHEET LIVE VIEWER */}
      {activeSubTab === 'sheet_view' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                এক্সেল শিট: Daily_Transactions ({transactions.length} rows)
              </h3>
              <p className="text-xs text-slate-500">
                এই টেবিলটি সরাসরি `ledgerloom_database.xlsx` ফাইল থেকে রিয়েল-টাইমে রেন্ডার হচ্ছে।
              </p>
            </div>
            <button
              onClick={onRefreshData}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition text-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              রিফ্রেশ শিট
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Cost Type</th>
                  <th className="px-3 py-2.5">Party / Client</th>
                  <th className="px-3 py-2.5 text-right">Amount ({profile.currency})</th>
                  <th className="px-3 py-2.5">Method</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">{tx.id}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{tx.date}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          tx.type === 'income'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 capitalize">{tx.category}</td>
                    <td className="px-3 py-2.5 capitalize text-slate-500">{tx.costType}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{tx.partyName || '-'}</td>
                    <td
                      className={`px-3 py-2.5 text-right font-bold ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {tx.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 capitalize text-slate-500">{tx.paymentMethod}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          tx.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
