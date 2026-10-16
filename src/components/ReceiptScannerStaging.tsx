'use client';

import React, { useState } from 'react';
import {
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { Transaction, BusinessProfile } from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, convertCurrency } from '@/lib/currency';

interface StagingProps {
  transactions: Transaction[];
  profile: BusinessProfile;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  onAddTransaction: (tx: any) => Promise<boolean>;
  isUnlocked: boolean;
  onRequireUnlock: () => void;
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const ReceiptScannerStaging: React.FC<StagingProps> = ({
  transactions,
  profile,
  onApprove,
  onReject,
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

  const pendingTxs = transactions.filter((t) => t.status === 'pending_approval');

  const [scanning, setScanning] = useState(false);
  const [reminderConfigured, setReminderConfigured] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [notificationToast, setNotificationToast] = useState('');

  // Localized demo memos
  const getSampleMemos = () => {
    if (currentLanguage === 'zh') {
      return [
        {
          title: '五金机电城收据 (缝纫机电机驱动轴)',
          amount: 8500,
          category: 'maintenance',
          party: '顺达机电配件商行',
          costType: 'fixed',
          desc: '车间缝纫机高转速电机与传动轴承更换维修',
        },
        {
          title: '轻纺辅料城票据 (金属拉链与纽扣)',
          amount: 14200,
          category: 'raw_material',
          party: '宏发纺织辅料行',
          costType: 'variable',
          desc: 'Polo衫定制铜质纽扣 500 打与领口高密拉链',
        },
      ];
    }
    if (currentLanguage === 'hi') {
      return [
        {
          title: 'हार्डवेयर कैश मेमो (सिलाई मशीन मोटर पार्ट्स)',
          amount: 8500,
          category: 'maintenance',
          party: 'नवाबपुर मेटल स्टोर',
          costType: 'fixed',
          desc: 'सिलाई मशीन मोटर ड्राइव बेल्ट व बेयरिंग मरम्मत',
        },
        {
          title: 'सदरघाट एक्सेसरीज मेमो (ज़िप व बटन)',
          amount: 14200,
          category: 'raw_material',
          party: 'सदरघाट ट्रिम्स एंड एक्सेसरीज',
          costType: 'variable',
          desc: 'पोलो शर्ट मेटल बटन 500 दर्जन व स्पेशल कॉलर ज़िप',
        },
      ];
    }
    if (currentLanguage === 'bn') {
      return [
        {
          title: 'নবাবপুর হার্ডওয়্যার ক্যাশ মেমো (মেশিন মোটর পার্টস)',
          amount: 8500,
          category: 'maintenance',
          party: 'নবাবপুর মেটাল স্টোর',
          costType: 'fixed',
          desc: 'সুইং মেশিন মোটর ড্রাইভ বেল্ট ও বিয়ারিং মেরামত',
        },
        {
          title: 'সদরঘাট এক্সেসরিজ মেমো (জিপার ও বোতাম)',
          amount: 14200,
          category: 'raw_material',
          party: 'সদরঘাট ট্রিমস অ্যান্ড এক্সেসরিজ',
          costType: 'variable',
          desc: 'পোলো শার্টের মেটাল বাটন ৫০০ ডজন ও স্পেসিয়াল কলার জিপার',
        },
      ];
    }
    // Default English
    return [
      {
        title: 'Industrial Hardware Receipt (Machine Parts)',
        amount: 8500,
        category: 'maintenance',
        party: 'Metropolis Hardware & Tools',
        costType: 'fixed',
        desc: 'Drive belt replacement and ball bearings for assembly line',
      },
      {
        title: 'Trim & Textile Accessories Invoice (Zippers & Buttons)',
        amount: 14200,
        category: 'raw_material',
        party: 'Prime Trims & Accessories Ltd',
        costType: 'variable',
        desc: '500 gross brass snaps and custom reinforced collar zippers',
      },
    ];
  };

  const sampleMemos = getSampleMemos();

  const handleSimulateScan = async (memo: (typeof sampleMemos)[0]) => {
    setScanning(true);
    setTimeout(async () => {
      await onAddTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        category: memo.category,
        costType: memo.costType,
        amount: memo.amount,
        description: memo.desc,
        partyName: memo.party,
        paymentMethod: 'cash',
        status: 'pending_approval',
        source: 'receipt_ocr',
        evidenceNote: `OCR Scanned: ${memo.title}. Owner approval required before committing to Excel.`,
      });
      setScanning(false);
    }, 1200);
  };

  const triggerDailyReminder = () => {
    const reminderMsg =
      currentLanguage === 'zh'
        ? '🔔 每日记账提醒: “厂长您好！今天发生的所有线下小票和现金采购，记得拍照上传给 AI 副驾核对入账哦！”'
        : currentLanguage === 'hi'
        ? '🔔 दैनिक अनुस्मारक: "नमस्ते! आज के सभी नकद खर्चों और बिलों की तस्वीर खींचकर एआई में अपलोड कर दें।"'
        : currentLanguage === 'bn'
        ? '🔔 আজকের রিমাইন্ডার: "শুভ অপরাহ্ন! আজকের নগদ ক্যাশ লেনদেন বা মেমোর ছবি তুলে এজেন্টে জমা দিয়েছেন তো?"'
        : '🔔 Daily Autonomous Reminder: "Good day! Remember to capture and submit any offline cash receipts before end-of-shift reconciliation."';

    setNotificationToast(reminderMsg);
    setTimeout(() => setNotificationToast(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Automated Daily Notification & Schedule Bar */}
      <div className="bg-indigo-900/10 border border-indigo-200/70 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {t('dailyScheduleTitle')}
            </h4>
            <p className="text-xs text-slate-600">
              {t('dailyScheduleDesc')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
          />
          <button
            onClick={triggerDailyReminder}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            {t('testNotificationBtn')}
          </button>
        </div>
      </div>

      {notificationToast && (
        <div className="p-3 bg-indigo-600 text-white text-xs font-medium rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <span>{notificationToast}</span>
          <button
            onClick={() => setNotificationToast('')}
            className="text-white/80 hover:text-white text-sm font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* OCR Receipt Upload Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('receiptUploadTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t('receiptUploadDesc')}
            </p>
          </div>

          {/* Quick Demo Memo Simulators */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              {t('sampleMemosTitle')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {sampleMemos.map((memo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSimulateScan(memo)}
                  disabled={scanning}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 transition text-xs space-y-1 block disabled:opacity-50"
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{memo.title}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-indigo-600 font-bold">
                    {conv(memo.amount).toLocaleString()} {activeCurrency}
                  </div>
                  <div className="text-[11px] text-slate-500">{memo.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {scanning && (
            <div className="p-3 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              {currentLanguage === 'zh'
                ? '多模态视觉大模型正在解析小票金额、日期与商户科目...'
                : currentLanguage === 'hi'
                ? 'ओसीआर द्वारा रसीद से राशि और विवरण निकाला जा रहा है...'
                : currentLanguage === 'bn'
                ? 'মেমো থেকে টেক্সট ও টাকার অঙ্ক এক্সট্রাক্ট করা হচ্ছে...'
                : 'Extracting transaction details, vendor, and amount via Multimodal OCR...'}
            </div>
          )}
        </div>
      </div>

      {/* Human-in-the-Loop Pending Approvals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              {t('pendingApprovalTitle', { count: pendingTxs.length })}
            </h3>
            <p className="text-xs text-slate-500">
              {t('pendingApprovalDesc')}
            </p>
          </div>
        </div>

        {pendingTxs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            {t('noPendingMemos')}
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTxs.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-800">{tx.id}</span>
                    <span className="text-xs font-bold text-slate-900">{tx.description}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      Pending Owner Approval
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                    <span>
                      {t('partyLabel')}: <strong>{tx.partyName || '-'}</strong>
                    </span>
                    <span>
                      {t('categoryLabel')}: <strong>{tx.category}</strong> ({tx.costType})
                    </span>
                    <span>{t('paymentMethodLabel')}: {tx.paymentMethod}</span>
                  </div>
                  {tx.evidenceNote && (
                    <p className="text-[11px] text-slate-500 italic">{tx.evidenceNote}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-black text-rose-600">
                      -{conv(tx.amount).toLocaleString()} {activeCurrency}
                    </div>
                    <div className="text-[10px] text-slate-400">{tx.date}</div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!isUnlocked) {
                        onRequireUnlock();
                        return;
                      }
                      await onApprove(tx.id);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                    title="Commit to Excel Ledger"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {t('approveBtn')}
                  </button>

                  <button
                    onClick={async () => {
                      if (!isUnlocked) {
                        onRequireUnlock();
                        return;
                      }
                      await onReject(tx.id);
                    }}
                    className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl transition"
                    title={t('rejectBtn')}
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
