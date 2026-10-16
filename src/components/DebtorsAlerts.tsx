'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  Send,
  CheckCircle,
  Copy,
  PlusCircle,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { DebtorRecord, BusinessProfile } from '@/lib/types';

interface DebtorsProps {
  debtors: DebtorRecord[];
  profile: BusinessProfile;
  onUpdateDebtorStatus: (id: string, status: 'pending' | 'overdue' | 'settled') => Promise<boolean>;
  onAddDebtor: (debtor: any) => Promise<boolean>;
  isUnlocked: boolean;
  onRequireUnlock: () => void;
}

export const DebtorsAlerts: React.FC<DebtorsProps> = ({
  debtors,
  profile,
  onUpdateDebtorStatus,
  onAddDebtor,
  isUnlocked,
  onRequireUnlock,
}) => {
  const [selectedDebtorForDraft, setSelectedDebtorForDraft] = useState<DebtorRecord | null>(null);
  const [draftTone, setDraftTone] = useState<'polite' | 'formal' | 'urgent'>('polite');
  const [copied, setCopied] = useState(false);

  // New Debtor Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const threshold = 30000;
  const receivables = debtors.filter((d) => d.type === 'receivable');
  const highRiskList = receivables.filter((d) => d.amount >= (d.alertThreshold || threshold));

  const generateMessageDraft = (d: DebtorRecord, tone: 'polite' | 'formal' | 'urgent') => {
    if (tone === 'urgent') {
      return `জরুরি বকেয়া নোটিশ: জনাব/মালিকপক্ষ (${d.partyName}), ${profile.businessName}-এর পূর্ববর্তী ডেলিভারির বিপরীতে আপনার নিকট সর্বমোট ${d.amount.toLocaleString()} ${profile.currency} পাওনা রয়েছে, যা নির্ধারিত মেয়াদ (${d.dueDate}) অতিক্রান্ত করেছে। কারখানার কর্মীদের চলতি মাসের বেতন ও চলতি খরচের জন্য আগামী ৪৮ ঘণ্টার মধ্যে উক্ত টাকা পরিশোধের বিশেষ অনুরোধ রইল। ধন্যবাদান্তে, ${profile.businessName}।`;
    }
    if (tone === 'formal') {
      return `প্রিয় (${d.partyName}), সালাম ও শুভেচ্ছা রইল। আশা করি ভালো আছেন। ${profile.businessName}-এর অ্যাকাউন্টস বিভাগ থেকে জানানো যাচ্ছে যে, আপনার নিকট ${d.amount.toLocaleString()} ${profile.currency} বকেয়া পাওনা রয়েছে (বিল মেয়াদ: ${d.dueDate})। দয়া করে ব্যাংকিং সময়ের মধ্যে পেমেন্টটি নিশ্চিত করার ব্যবস্থা গ্রহণ করবেন। ধন্যবাদ।`;
    }
    return `প্রিয় ভাই (${d.partyName}), শুভেচ্ছা জানবেন। আমাদের কারখানার শেষ অর্ডারের বাকি বিল ${d.amount.toLocaleString()} ${profile.currency}-এর বিষয়ে একটু তাগাদা দিতে মেসেজ করলাম। আমাদের আগামী সপ্তাহে নতুন ফেব্রিক অর্ডার করতে হবে, তাই বিলটা ক্লিয়ার করে দিলে খুব উপকৃত হতাম। ভালো থাকবেন!`;
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCreateDebtor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnlocked) {
      onRequireUnlock();
      return;
    }
    if (!partyName || !amount) return;

    await onAddDebtor({
      partyName,
      contactNumber: phone || '+8801700000000',
      type: 'receivable',
      amount: Number(amount),
      originalAmount: Number(amount),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      status: Number(amount) >= threshold ? 'overdue' : 'pending',
      alertThreshold: threshold,
      notes: notes || 'ওয়েব ফর্ম থেকে যুক্ত নতুন বকেয়া',
    });

    setShowAddModal(false);
    setPartyName('');
    setPhone('');
    setAmount('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Alert Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            বকেয়া ও বাকি টাকা রিমাইন্ডার ইঞ্জিন (Receivables Monitor)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            কোড লজিক: কারো কাছে বকেয়া <strong>{threshold.toLocaleString()} {profile.currency}</strong> বা তার বেশি হলে স্বয়ংক্রিয়ভাবে তাগাদা অ্যালার্ট জারি হবে।
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
        >
          <PlusCircle className="w-4 h-4" />
          নতুন বকেয়া / বাকি খাতা এন্ট্রি
        </button>
      </div>

      {/* High-Risk Alert Cards */}
      {highRiskList.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-rose-800 text-sm font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            সতর্কতা: {highRiskList.length}টি একাউন্টে বকেয়ার পরিমাণ থ্রেশহোল্ড (৩০,০০০+) অতিক্রম করেছে!
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highRiskList.map((d) => (
              <div
                key={d.id}
                className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{d.partyName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                      বকেয়া: {d.amount.toLocaleString()} {profile.currency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-slate-400" /> {d.contactNumber}
                  </p>
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    পেমেন্টের শেষ তারিখ ছিল: {d.dueDate} ({d.status.toUpperCase()})
                  </p>
                  {d.notes && <p className="text-[11px] text-slate-500 mt-1 italic">{d.notes}</p>}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedDebtorForDraft(d)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3 h-3" />
                    তাগাদা মেসেজ ড্রাফট করুন
                  </button>
                  <button
                    onClick={async () => {
                      if (!isUnlocked) {
                        onRequireUnlock();
                        return;
                      }
                      await onUpdateDebtorStatus(d.id, 'settled');
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    আদায় সম্পন্ন
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Receivables Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          সকল পাওনাদার ও বকেয়া খাতা তালিকা (Total: {receivables.length})
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="px-3 py-2.5">Party Name</th>
                <th className="px-3 py-2.5">Contact</th>
                <th className="px-3 py-2.5 text-right">Amount ({profile.currency})</th>
                <th className="px-3 py-2.5">Due Date</th>
                <th className="px-3 py-2.5">Risk Level</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receivables.map((d) => {
                const isOver = d.amount >= (d.alertThreshold || threshold);
                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="px-3 py-2.5 font-bold text-slate-900">{d.partyName}</td>
                    <td className="px-3 py-2.5 text-slate-500">{d.contactNumber}</td>
                    <td
                      className={`px-3 py-2.5 text-right font-black ${
                        isOver ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {d.amount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5">{d.dueDate}</td>
                    <td className="px-3 py-2.5">
                      {isOver ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                          ⚠️ ঝুঁকিপূর্ণ (&gt;30k)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                          স্বাভাবিক
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          d.status === 'settled'
                            ? 'bg-emerald-100 text-emerald-700'
                            : d.status === 'overdue'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right space-x-2">
                      <button
                        onClick={() => setSelectedDebtorForDraft(d)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        মেসেজ
                      </button>
                      {d.status !== 'settled' && (
                        <button
                          onClick={async () => {
                            if (!isUnlocked) {
                              onRequireUnlock();
                              return;
                            }
                            await onUpdateDebtorStatus(d.id, 'settled');
                          }}
                          className="text-emerald-600 hover:text-emerald-800 font-semibold"
                        >
                          পরিশোধ
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Drafting Modal */}
      {selectedDebtorForDraft && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                তাগাদা ড্রাফট: {selectedDebtorForDraft.partyName}
              </h3>
              <button
                onClick={() => setSelectedDebtorForDraft(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Tone Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setDraftTone('polite')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  draftTone === 'polite'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                ভদ্র ও বন্ধুত্বপূর্ণ
              </button>
              <button
                onClick={() => setDraftTone('formal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  draftTone === 'formal'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                অফিসিয়াল ফরমাল
              </button>
              <button
                onClick={() => setDraftTone('urgent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  draftTone === 'urgent'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 text-slate-700'
                }`}
              >
                জরুরি নোটিশ (Urgent)
              </button>
            </div>

            {/* Drafted Text Area */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-sans">
              {generateMessageDraft(selectedDebtorForDraft, draftTone)}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                প্রাপক নম্বর: {selectedDebtorForDraft.contactNumber}
              </span>
              <button
                onClick={() =>
                  handleCopyMessage(generateMessageDraft(selectedDebtorForDraft, draftTone))
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'কপি সম্পন্ন!' : 'মেসেজ কপি করুন (WhatsApp/SMS)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Debtor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">নতুন বাকি খাতা এন্ট্রি</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDebtor} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পার্টির নাম *
                </label>
                <input
                  type="text"
                  value={partyName}
                  onChange={(e) => setPartyName(e.target.value)}
                  placeholder="যেমন: বেঙ্গল ফ্যাশনস"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+88017xxxxxxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বাকি টাকার পরিমাণ ({profile.currency}) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="যেমন: 35000"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পরিশোধের শেষ তারিখ (Due Date)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow"
                >
                  সংরক্ষণ করুন (Save to Debtors Sheet)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
