'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Edit3,
  X,
  FileText,
  Download,
} from 'lucide-react';
import { BusinessProfile, Transaction } from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, convertCurrency } from '@/lib/currency';
import { StatementDownloadModal } from './StatementDownloadModal';
import { exportExcelDatabaseInBrowser } from '@/lib/excel-exporter';

interface DataEntryProps {
  profile: BusinessProfile;
  transactions: Transaction[];
  onRefreshData: () => void;
  onUpdateProfile: (updated: Partial<BusinessProfile>) => Promise<boolean>;
  onAddTransaction: (tx: any) => Promise<boolean>;
  onEditTransaction?: (tx: Transaction) => Promise<boolean>;
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
  onEditTransaction,
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

  // Edit Transaction Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editPartyName, setEditPartyName] = useState<string>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'bank_transfer' | 'mobile_money' | 'cheque'>('bank_transfer');
  const [editLoading, setEditLoading] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  const handleStartEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditDescription(tx.description);
    setEditCategory(tx.category);
    setEditPartyName(tx.partyName || '');
    setEditPaymentMethod(tx.paymentMethod);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) {
      onRequireUnlock();
      return;
    }
    if (!editingTx || !onEditTransaction) return;

    setEditLoading(true);
    try {
      const updated: Transaction = {
        ...editingTx,
        amount: Number(editAmount),
        previousAmount: editingTx.amount,
        description: editDescription,
        category: editCategory,
        partyName: editPartyName,
        paymentMethod: editPaymentMethod,
        isEdited: true,
        editedAt: new Date().toISOString(),
      };
      await onEditTransaction(updated);
      setEditingTx(null);
    } finally {
      setEditLoading(false);
    }
  };

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
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportExcelDatabaseInBrowser(profile, transactions)}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
                title="Download full Excel workbook (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{currentLanguage === 'bn' ? 'এক্সেল ডাউনলোড (.XLSX)' : 'Download .XLSX'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsStatementModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 transition shadow-xs active:scale-95 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentLanguage === 'bn' ? 'স্টেটমেন্ট' : 'Statement'}</span>
              </button>

              <button
                onClick={onRefreshData}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition text-slate-700 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
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
                  <th className="px-3 py-2.5 text-center">{currentLanguage === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <span>{tx.id}</span>
                      {tx.isEdited && (
                        <span
                          className="ml-1.5 inline-block px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold border border-amber-300"
                          title={`Edited: ${tx.editedAt ? new Date(tx.editedAt).toLocaleTimeString() : ''}`}
                        >
                          ✏️ Edited
                        </span>
                      )}
                    </td>
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
                      {tx.previousAmount && tx.previousAmount !== tx.amount && (
                        <div className="text-[9px] text-slate-400 font-normal line-through">
                          ({conv(tx.previousAmount).toLocaleString()})
                        </div>
                      )}
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
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(tx)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                        title="Edit this entry / ভুল সংশোধন করুন"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-600" />
                        <span>{currentLanguage === 'bn' ? 'এডিট' : 'Edit'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATEMENT DOWNLOAD MODAL */}
      <StatementDownloadModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        transactions={transactions}
        profile={profile}
        currentCurrency={activeCurrency}
        currentLanguage={currentLanguage}
      />

      {/* EDIT TRANSACTION MODAL */}
      <AnimatePresence>
        {editingTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
            >
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Edit3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">
                      {currentLanguage === 'bn' ? 'লেনদেন সংশোধন (এডিট)' : 'Edit Transaction Entry'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      ID: {editingTx.id} • {editingTx.type.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p>
                    {currentLanguage === 'bn'
                      ? 'এন্ট্রি সংশোধন করলে স্বচ্ছতার জন্য অডিট ট্রেইলে সংরক্ষিত হবে এবং [✏️ Edited] ফ্ল্যাগ শো করবে।'
                      : 'Changes will be permanently logged in the audit trail with an [✏️ Edited] flag for total transparency.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {currentLanguage === 'bn' ? 'সংশোধিত টাকার পরিমাণ' : 'Amount'} ({activeCurrency})
                    </label>
                    <input
                      type="number"
                      required
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    {editingTx.amount !== Number(editAmount) && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        পূর্বের পরিমাণ: ৳{editingTx.amount.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {currentLanguage === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {currentLanguage === 'bn' ? 'বিবরণ / পণ্যের বিবরণ' : 'Description'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {currentLanguage === 'bn' ? 'পার্টি / ক্রেতা / ভেন্ডর' : 'Party / Counterparty'}
                    </label>
                    <input
                      type="text"
                      value={editPartyName}
                      onChange={(e) => setEditPartyName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {currentLanguage === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'}
                    </label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white"
                    >
                      <option value="cash">নগদ (Cash)</option>
                      <option value="bank_transfer">ব্যাংক ট্রান্সফার (Bank Transfer)</option>
                      <option value="mobile_money">বিকাশ / নগদ (Mobile Money)</option>
                      <option value="cheque">চেক (Cheque)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    {currentLanguage === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    {editLoading ? (
                      <span>{currentLanguage === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{currentLanguage === 'bn' ? 'সংশোধন সংরক্ষণ করুন' : 'Save Changes'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
