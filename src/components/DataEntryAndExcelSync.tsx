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
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, convertCurrency } from '@/lib/currency';

interface DataEntryProps {
  profile: BusinessProfile;
  transactions: Transaction[];
  onRefreshData: () => void;
  onUpdateProfile: (updated: Partial<BusinessProfile>) => Promise<boolean>;
  onAddTransaction: (tx: any) => Promise<boolean>;
  isUnlocked: boolean;
  onRequireUnlock: () => void;
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const DataEntryAndExcelSync: React.FC<DataEntryProps> = ({
  profile,
  transactions,
  onRefreshData,
  onUpdateProfile,
  onAddTransaction,
  isUnlocked,
  onRequireUnlock,
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const activeCurrency = currentCurrency || profile.currency || 'BDT';
  const conv = (amt: number) => convertCurrency(amt, 'BDT', activeCurrency);
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

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
      alert(currentLanguage === 'zh' ? '请输入有效金额！' : currentLanguage === 'hi' ? 'कृपया मान्य राशि दर्ज करें!' : currentLanguage === 'bn' ? 'সঠিক টাকার পরিমাণ দিন!' : 'Please enter a valid amount!');
      return;
    }

    setTxLoading(true);
    setTxSuccessMessage('');

    const enteredAmount = Number(txAmount);
    const amountInBDT = Math.round(convertCurrency(enteredAmount, activeCurrency, 'BDT'));

    const success = await onAddTransaction({
      date: new Date().toISOString().split('T')[0],
      type: txType,
      category: txCategory,
      costType: txCostType,
      amount: amountInBDT,
      description: txDescription || `${txCategory}`,
      partyName: txPartyName,
      paymentMethod: txPaymentMethod,
      status: 'approved',
      source: 'manual_form',
    });

    setTxLoading(false);
    if (success) {
      setTxSuccessMessage(t('saveSuccessMsg'));
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
          {t('newTxSubTab')}
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
          {t('profileSubTab')}
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
          {t('sheetViewSubTab')}
        </button>
      </div>

      {/* SUBTAB 1: NEW TRANSACTION ENTRY */}
      {activeSubTab === 'new_tx' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                {t('webToExcelTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t('webToExcelDesc')}
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
                  {t('incomeBtn')}
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
                  {t('expenseBtn')}
                </button>
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('amountLabel')} ({activeCurrency}) *
                    {activeCurrency !== 'BDT' && txAmount && Number(txAmount) > 0 && (
                      <span className="text-[10px] text-slate-400 font-normal ml-2">
                        (≈ ৳{Math.round(convertCurrency(Number(txAmount), activeCurrency, 'BDT')).toLocaleString()} BDT)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="25000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('categoryLabel')}
                  </label>
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
                        <option value="sales">{currentLanguage === 'zh' ? '销售收入 (Sales)' : currentLanguage === 'hi' ? 'बिक्री आय (Sales)' : currentLanguage === 'bn' ? 'পণ্য বিক্রয় (Sales)' : 'Sales & Revenue'}</option>
                        <option value="advance">{currentLanguage === 'zh' ? '客户预收款 (Customer Advance)' : currentLanguage === 'hi' ? 'अग्रिम भुगतान (Advance)' : currentLanguage === 'bn' ? 'কাস্টমার অগ্রিম (Customer Advance)' : 'Customer Advance'}</option>
                        <option value="other_income">{currentLanguage === 'zh' ? '其他营业收入' : currentLanguage === 'hi' ? 'अन्य आय' : currentLanguage === 'bn' ? 'অন্যান্য আয়' : 'Other Income'}</option>
                      </>
                    ) : (
                      <>
                        <option value="raw_material">{currentLanguage === 'zh' ? '原料辅料采购 (Raw Materials)' : currentLanguage === 'hi' ? 'कच्चा माल / कपड़ा' : currentLanguage === 'bn' ? 'কাঁচামাল / ফেব্রিক ক্রয়' : 'Raw Materials & Inventory'}</option>
                        <option value="salary">{currentLanguage === 'zh' ? '工人工资 (Salaries - 固定)' : currentLanguage === 'hi' ? 'कर्मचारी वेतन (Salaries)' : currentLanguage === 'bn' ? 'কর্মী ও শ্রমিকের বেতন (Fixed)' : 'Worker Salaries (Fixed)'}</option>
                        <option value="utility">{currentLanguage === 'zh' ? '水电动力费 (Utilities - 固定)' : currentLanguage === 'hi' ? 'बिजली व पानी बिल (Utilities)' : currentLanguage === 'bn' ? 'কারেন্ট বিল / গ্যাস / পানি (Fixed)' : 'Utilities & Power (Fixed)'}</option>
                        <option value="rent">{currentLanguage === 'zh' ? '厂房租金 (Rent - 固定)' : currentLanguage === 'hi' ? 'किराया (Rent)' : currentLanguage === 'bn' ? 'কারখানার ভাড়া (Fixed)' : 'Facility Rent (Fixed)'}</option>
                        <option value="maintenance">{currentLanguage === 'zh' ? '设备维修保养 (Maintenance)' : currentLanguage === 'hi' ? 'रखरखाव (Maintenance)' : currentLanguage === 'bn' ? 'মেশিনারি সার্ভিসিং (Maintenance)' : 'Equipment Maintenance'}</option>
                        <option value="packaging">{currentLanguage === 'zh' ? '包装与物流配送 (Logistics)' : currentLanguage === 'hi' ? 'पैकेजिंग व परिवहन' : currentLanguage === 'bn' ? 'প্যাকেজিং ও পরিবহন' : 'Packaging & Shipping'}</option>
                        <option value="other_expense">{currentLanguage === 'zh' ? '其他杂费开支' : currentLanguage === 'hi' ? 'अन्य व्यय' : currentLanguage === 'bn' ? 'অন্যান্য ব্যয়' : 'Other Expenses'}</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Cost Classification & Party */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('costTypeLabel')}
                  </label>
                  <select
                    value={txCostType}
                    onChange={(e) => setTxCostType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="variable">{t('variableCostOption')}</option>
                    <option value="fixed">{t('fixedCostOption')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('partyLabel')}
                  </label>
                  <input
                    type="text"
                    value={txPartyName}
                    onChange={(e) => setTxPartyName(e.target.value)}
                    placeholder="e.g. Apex Outfits / Metro Mart"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description & Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('paymentMethodLabel')}
                  </label>
                  <select
                    value={txPaymentMethod}
                    onChange={(e) => setTxPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bank_transfer">Bank Transfer / EFT</option>
                    <option value="cash">Cash in Hand</option>
                    <option value="mobile_money">Digital / Mobile Money</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('descriptionLabel')}
                  </label>
                  <input
                    type="text"
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="e.g. 500 pcs fabric procurement"
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
                  {txLoading ? t('syncing') : t('saveToExcelBtn')}
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
                  {t('profileSubTab')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Master business profile synchronized with `Business_Profile` Excel database sheet.
                </p>
              </div>
            </div>

            {profSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {t('saveProfileSuccessMsg')}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('factoryNameLabel')}
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
                    {t('startDateLabel')}
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
                    {t('initialInvestmentLabel')} ({profile.currency})
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
                  {t('monthlyFixedCostsGroup')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {t('workerCountLabel')}
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
                      {t('salariesLabel')} ({profile.currency})
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
                      {t('electricityLabel')} ({profile.currency})
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
                      {t('rentLabel')} ({profile.currency})
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
                  {t('unitEconomicsGroup')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                      {t('primaryProduct')}
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
                      {t('unitSellingPriceLabel')}
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
                      {t('fabricPerUnitLabel')}
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
                      {t('fabricCostPerMeterLabel')}
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
                  {profLoading ? t('syncing') : t('updateProfileBtn')}
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
                Excel: Daily_Transactions ({transactions.length} rows)
              </h3>
              <p className="text-xs text-slate-500">
                {t('bannerSync')} • LedgerLoom_Database.xlsx
              </p>
            </div>
            <button
              onClick={onRefreshData}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition text-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
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
                  <th className="px-3 py-2.5 text-right">{t('amountLabel')} ({activeCurrency})</th>
                  <th className="px-3 py-2.5">{t('paymentMethodLabel')}</th>
                  <th className="px-3 py-2.5">{t('statusTh')}</th>
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
                      {conv(tx.amount).toLocaleString()} {activeCurrency}
                      {activeCurrency !== 'BDT' && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          (৳{tx.amount.toLocaleString()})
                        </div>
                      )}
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
