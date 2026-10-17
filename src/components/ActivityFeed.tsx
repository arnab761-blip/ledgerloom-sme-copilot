'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  TrendingUp,
  TrendingDown,
  Edit3,
  AlertTriangle,
  CreditCard,
  ShieldCheck,
  Search,
  Filter,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Transaction, AuditLogEntry, DebtorRecord, LoanLiability } from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, convertCurrency } from '@/lib/currency';

interface ActivityFeedProps {
  transactions: Transaction[];
  auditLogs: AuditLogEntry[];
  debtors?: DebtorRecord[];
  loans?: LoanLiability[];
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

interface FeedItem {
  id: string;
  type: 'income' | 'expense' | 'edit' | 'debtor' | 'loan' | 'security';
  actor: string;
  timestamp: string;
  displayTime: string;
  title: string;
  description: string;
  amount?: number;
  previousAmount?: number;
  partyName?: string;
  paymentMethod?: string;
  badgeText: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  transactions,
  auditLogs,
  debtors = [],
  loans = [],
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'edit' | 'debtor_loan'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const conv = (amount: number) => {
    return convertCurrency(amount, 'BDT', currentCurrency);
  };

  // Convert raw ISO or Date string into human-friendly relative label
  const formatFriendlyTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return currentLanguage === 'bn' ? 'এইমাত্র' : 'Just now';
      if (diffMins < 60) return `${diffMins} ${currentLanguage === 'bn' ? 'মিনিট আগে' : 'mins ago'}`;
      if (diffHours < 24) return `${diffHours} ${currentLanguage === 'bn' ? 'ঘণ্টা আগে' : 'hours ago'}`;
      if (diffDays === 1) return currentLanguage === 'bn' ? 'গতকাল' : 'Yesterday';
      if (diffDays < 7) return `${diffDays} ${currentLanguage === 'bn' ? 'দিন আগে' : 'days ago'}`;

      return date.toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Generate unified Activity Timeline items from transactions, audit logs, and events
  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];

    // 1. Transaction additions & edits
    for (const tx of transactions) {
      if (tx.isEdited) {
        items.push({
          id: `feed-edit-${tx.id}`,
          type: 'edit',
          actor: currentLanguage === 'bn' ? 'আপনি (স্বত্বাধিকারী)' : 'You (Owner)',
          timestamp: tx.editedAt || tx.createdAt || tx.date,
          displayTime: formatFriendlyTime(tx.editedAt || tx.createdAt || tx.date),
          title: currentLanguage === 'bn' ? 'ভুল সংশোধন করে এন্ট্রি সম্পাদনা করেছেন' : 'Corrected and Edited Transaction',
          description: `ট্রানজ্যাকশন #${tx.id}: ${tx.description} (${tx.category})`,
          amount: tx.amount,
          previousAmount: tx.previousAmount,
          partyName: tx.partyName,
          paymentMethod: tx.paymentMethod,
          badgeText: currentLanguage === 'bn' ? 'সম্পাদিত (Edited)' : 'Edited',
        });
      }

      items.push({
        id: `feed-tx-${tx.id}`,
        type: tx.type === 'income' ? 'income' : 'expense',
        actor: tx.source === 'receipt_ocr'
          ? (currentLanguage === 'bn' ? 'স্মার্ট মেমো স্ক্যানার (OCR)' : 'Receipt OCR Scanner')
          : (currentLanguage === 'bn' ? 'আপনি (স্বত্বাধিকারী)' : 'You (Owner)'),
        timestamp: tx.createdAt || tx.date,
        displayTime: formatFriendlyTime(tx.createdAt || tx.date),
        title: tx.type === 'income'
          ? (currentLanguage === 'bn' ? 'ক্যাশ বাক্সে টাকা জমা যুক্ত করেছেন' : 'Added Cash Inflow')
          : (currentLanguage === 'bn' ? 'ব্যবসায়িক খরচ পরিশোধ রেকর্ড করেছেন' : 'Recorded Business Expense'),
        description: tx.description,
        amount: tx.amount,
        partyName: tx.partyName,
        paymentMethod: tx.paymentMethod,
        badgeText: tx.type === 'income'
          ? (currentLanguage === 'bn' ? '+ আয় / জমা' : '+ Income')
          : (currentLanguage === 'bn' ? '- ব্যয় / খরচ' : '- Expense'),
      });
    }

    // 2. Audit log events (PIN changes, session unlock, debtor reminders)
    for (const log of auditLogs) {
      if (log.action.includes('EDIT')) continue; // Already covered above
      items.push({
        id: `feed-audit-${log.id}`,
        type: log.action.includes('SECURITY') ? 'security' : 'debtor',
        actor: log.actor === 'owner'
          ? (currentLanguage === 'bn' ? 'আপনি (স্বত্বাধিকারী)' : 'You (Owner)')
          : 'AI Copilot Engine',
        timestamp: log.timestamp,
        displayTime: formatFriendlyTime(log.timestamp),
        title: log.action.replace(/_/g, ' '),
        description: log.details,
        badgeText: log.permissionTier || 'Activity',
      });
    }

    // Sort newest first
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, auditLogs, currentLanguage]);

  // Filtered feed
  const filteredFeed = useMemo(() => {
    return feedItems.filter((item) => {
      // Type filter
      if (filterType === 'income' && item.type !== 'income') return false;
      if (filterType === 'expense' && item.type !== 'expense') return false;
      if (filterType === 'edit' && item.type !== 'edit') return false;
      if (filterType === 'debtor_loan' && !['debtor', 'loan'].includes(item.type)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchParty = item.partyName?.toLowerCase().includes(q);
        const matchAmount = item.amount?.toString().includes(q);
        if (!matchTitle && !matchDesc && !matchParty && !matchAmount) return false;
      }

      return true;
    });
  }, [feedItems, filterType, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Feed Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md font-black text-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {currentLanguage === 'bn' ? 'ব্যবসায়িক অ্যাক্টিভিটি হিস্ট্রি ও টাইমলাইন' : 'Business Activity Log & Timeline'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {currentLanguage === 'bn' ? 'ভেরিফায়েড লগ' : 'Verified'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentLanguage === 'bn'
                  ? 'ফেসবুকের মতো লাইভ হিস্ট্রি: কে, কখন, কীভাবে কত টাকা যোগ, খরচ বা ভুল সংশোধন করেছেন'
                  : 'Live audit log: exact chronological record of every inflow, expense, and transaction edit'}
              </p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={currentLanguage === 'bn' ? 'খুঁজুন (টাকা, নাম, খরচ)...' : 'Search activity...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: currentLanguage === 'bn' ? 'সব কার্যকলাপ' : 'All Activity', count: feedItems.length },
            { id: 'income', label: currentLanguage === 'bn' ? '💰 টাকা জমা' : 'Inflows', count: feedItems.filter(f => f.type === 'income').length },
            { id: 'expense', label: currentLanguage === 'bn' ? '💸 টাকা খরচ' : 'Outflows', count: feedItems.filter(f => f.type === 'expense').length },
            { id: 'edit', label: currentLanguage === 'bn' ? '✏️ ভুল সংশোধন' : 'Edits', count: feedItems.filter(f => f.type === 'edit').length },
            { id: 'debtor_loan', label: currentLanguage === 'bn' ? '⚠️ বাকি ও অন্যান্য' : 'Others', count: feedItems.filter(f => ['debtor', 'loan', 'security'].includes(f.type)).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterType === tab.id ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List (Facebook Style Cards) */}
      <div className="space-y-3">
        {filteredFeed.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
            {currentLanguage === 'bn' ? 'কোনো কার্যকলাপ খুঁজে পাওয়া যায়নি।' : 'No activity found matching your criteria.'}
          </div>
        ) : (
          filteredFeed.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      item.type === 'income'
                        ? 'bg-emerald-100 text-emerald-700'
                        : item.type === 'expense'
                        ? 'bg-rose-100 text-rose-700'
                        : item.type === 'edit'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {item.type === 'income' && <TrendingUp className="w-5 h-5" />}
                    {item.type === 'expense' && <TrendingDown className="w-5 h-5" />}
                    {item.type === 'edit' && <Edit3 className="w-5 h-5" />}
                    {item.type !== 'income' && item.type !== 'expense' && item.type !== 'edit' && (
                      <History className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.actor}
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.displayTime}</span>
                    </div>
                  </div>
                </div>

                {/* Amount / Action Pill */}
                {item.amount !== undefined && (
                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-bold ${
                        item.type === 'income'
                          ? 'text-emerald-600'
                          : item.type === 'edit'
                          ? 'text-amber-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}
                      {conv(item.amount).toLocaleString()} {currentCurrency}
                    </div>
                    {item.previousAmount && item.previousAmount !== item.amount && (
                      <div className="text-[10px] text-slate-400">
                        আগে ছিল:{' '}
                        <span className="line-through">
                          {conv(item.previousAmount).toLocaleString()} {currentCurrency}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Post Body Box */}
              <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100 space-y-1.5">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {item.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {item.partyName && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 font-semibold">
                      👤 {item.partyName}
                    </span>
                  )}
                  {item.paymentMethod && (
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-600 font-semibold capitalize">
                      💳 {item.paymentMethod.replace('_', ' ')}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      item.type === 'income'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.type === 'expense'
                        ? 'bg-rose-100 text-rose-800'
                        : item.type === 'edit'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {item.badgeText}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
