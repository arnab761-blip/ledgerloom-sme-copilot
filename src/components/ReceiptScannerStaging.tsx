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

interface StagingProps {
  transactions: Transaction[];
  profile: BusinessProfile;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  onAddTransaction: (tx: any) => Promise<boolean>;
  isUnlocked: boolean;
  onRequireUnlock: () => void;
}

export const ReceiptScannerStaging: React.FC<StagingProps> = ({
  transactions,
  profile,
  onApprove,
  onReject,
  onAddTransaction,
  isUnlocked,
  onRequireUnlock,
}) => {
  const pendingTxs = transactions.filter((t) => t.status === 'pending_approval');

  const [scanning, setScanning] = useState(false);
  const [reminderConfigured, setReminderConfigured] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [notificationToast, setNotificationToast] = useState('');

  // Sample quick OCR templates for demo
  const sampleMemos = [
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
    setNotificationToast(
      '🔔 আজকের রিমাইন্ডার: "শুভ অপরাহ্ন! আজকের নগদ ক্যাশ লেনদেন বা মেমোর ছবি তুলে এজেন্টে জমা দিয়েছেন তো?"'
    );
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
              অটোনোমাস দৈনিক নোটিফিকেশন সিস্টেম (Daily Schedule)
            </h4>
            <p className="text-xs text-slate-600">
              ব্যস্ত মালিক যেন ক্যাশ খরচের হিসাব তুলতে ভুলে না যান, প্রতিদিন সকাল {reminderTime}-এ এজেন্টের নোটিফিকেশন অ্যালার্ট।
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
            টেস্ট নোটিফিকেশন পাঠান
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
              নগদ খরচের মেমো / রসিদের ছবি স্ক্যান করুন (Multimodal OCR)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              দোকান বা বাজারের ক্যাশ মেমোর ছবি তুলুন। AI স্বয়ংক্রিয়ভাবে তারিখ, টাকার অঙ্ক ও বিবরণ
              আলাদা করে ড্রাফট টেবিলে রাখবে।
            </p>
          </div>

          {/* Quick Demo Memo Simulators */}
          <div className="pt-2">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              ডেমো টেস্টের জন্য নিচের নমুনা ক্যাশ মেমোতে ক্লিক করুন:
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
                    {memo.amount.toLocaleString()} {profile.currency}
                  </div>
                  <div className="text-[11px] text-slate-500">{memo.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {scanning && (
            <div className="p-3 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              মেমো থেকে টেক্সট ও টাকার অঙ্ক এক্সট্রাক্ট করা হচ্ছে...
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
              পেন্ডিং ভেরিফিকেশন ও এপ্রুভাল স্টেজ ({pendingTxs.length})
            </h3>
            <p className="text-xs text-slate-500">
              AI ভুল বুঝলে রক্ষা করার জন্য: মালিক "Approve" না দেওয়া পর্যন্ত এই লেনদেনগুলো এক্সেলে
              পার্মানেন্ট হবে না।
            </p>
          </div>
        </div>

        {pendingTxs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            বর্তমানে কোনো পেন্ডিং মেমো নেই। নতুন মেমো স্ক্যান করলে এখানে রিভিউয়ের জন্য জমা হবে।
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
                      পার্টি: <strong>{tx.partyName || 'সাপ্লায়ার'}</strong>
                    </span>
                    <span>
                      ক্যাটাগরি: <strong>{tx.category}</strong> ({tx.costType})
                    </span>
                    <span>পেমেন্ট: {tx.paymentMethod}</span>
                  </div>
                  {tx.evidenceNote && (
                    <p className="text-[11px] text-slate-500 italic">{tx.evidenceNote}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-black text-rose-600">
                      -{tx.amount.toLocaleString()} {profile.currency}
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
                    title="অনুমোদন করুন ও এক্সেল লেজারে যোগ করুন"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve (এক্সেলে সেভ)
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
                    title="বাতিল করুন"
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
