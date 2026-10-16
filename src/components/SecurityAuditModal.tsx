'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  FileCheck,
  AlertOctagon,
  Clock,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { AuditLogEntry } from '@/lib/types';

interface SecurityProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  remainingMinutes: number;
  onUnlockSession: (pin: string) => Promise<{ success: boolean; error?: string }>;
  onRefreshSession: () => Promise<boolean>;
  auditLogs: AuditLogEntry[];
}

export const SecurityAuditModal: React.FC<SecurityProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  remainingMinutes,
  onUnlockSession,
  onRefreshSession,
  auditLogs,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'unlock' | 'audit_log' | 'report'>('unlock');

  if (!isOpen) return null;

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinLoading(true);
    setPinError('');

    const res = await onUnlockSession(pinInput);
    setPinLoading(false);

    if (res.success) {
      setPinInput('');
      onClose();
    } else {
      setPinError(res.error || 'ভুল পিন কোড! ডিফল্ট পিন: 2026');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                LedgerLoom সিকিউরিটি ভল্ট ও কমপ্লায়েন্স রিপোর্ট
              </h3>
              <p className="text-xs text-slate-500">
                FinTechathon 2026 • 30% Security & Compliance Deliverable Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab switch inside modal */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('unlock')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'unlock'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            🔐 ৩০-মিনিট সেশন লক
          </button>
          <button
            onClick={() => setActiveTab('audit_log')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'audit_log'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            📜 রিয়েল অডিট ট্রেইল (Audit Trail)
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'report'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            🛡️ সিকিউরিটি সেলফ-অ্যাসেসমেন্ট
          </button>
        </div>

        {/* TAB 1: 30-MIN SESSION PIN UNLOCK */}
        {activeTab === 'unlock' && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isUnlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {isUnlocked
                      ? `ভল্ট সক্রিয়: আর ${remainingMinutes} মিনিট আনলক থাকবে`
                      : 'ভল্ট বর্তমানে লক অবস্থায় রয়েছে'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    মালিক একবার পিন দিলে পরবর্তী ৩০ মিনিট কোনো লক চাইবে না।
                  </p>
                </div>
              </div>

              {isUnlocked && (
                <button
                  onClick={onRefreshSession}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  +৩০ মিনিট বাড়ান
                </button>
              )}
            </div>

            {!isUnlocked && (
              <form onSubmit={handlePinSubmit} className="space-y-3 max-w-sm mx-auto text-center">
                <label className="block text-xs font-semibold text-slate-700">
                  মালিকের ৪-ডিজিটের সিকিউরিটি পিন দিন (ডিফল্ট: 2026)
                </label>
                <div className="flex justify-center">
                  <input
                    type="password"
                    maxLength={6}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-40 text-center tracking-widest text-2xl font-black py-2 bg-slate-50 border-2 border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    autoFocus
                  />
                </div>

                {pinError && <p className="text-xs font-bold text-rose-600">{pinError}</p>}

                <button
                  type="submit"
                  disabled={pinLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  {pinLoading ? 'যাচাই হচ্ছে...' : '৩০ মিনিটের জন্য ভল্ট আনলক করুন'}
                </button>
              </form>
            )}

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 space-y-1">
              <span className="font-bold">কেন এই ৩০ মিনিটের লক সিস্টেম?</span>
              <p>
                ক্ষুদ্র ব্যবসায় মালিক বারবার পাসওয়ার্ড দিতে বিরক্ত হন। তাই ইন্ডাস্ট্রিয়াল স্ট্যান্ডার্ড
                অনুযায়ী ৩০ মিনিটের স্লাইডিং উইন্ডো নিশ্চিত করা হয়েছে—যা একসাথে স্বাচ্ছন্দ্য এবং আর্থিক নিরাপত্তা প্রদান করে।
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT LOG VIEWER */}
        {activeTab === 'audit_log' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Deliverable 06 Evidence: কারখানার প্রতিটি আর্থিক স্টেট পরিবর্তন ও এআই টাস্কের অপরিবর্তনীয় অডিট লগ।
            </p>
            <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-50 transition flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{log.id}</span>
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-700">
                        {log.permissionTier}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.details}</p>
                    <div className="text-[10px] text-slate-400">
                      Actor: {log.actor} • Time: {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[9px]">
                    {log.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY SELF-ASSESSMENT REPORT */}
        {activeTab === 'report' && (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-80 overflow-y-auto">
            <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-1">
              <h4 className="font-bold text-sm text-emerald-400">
                Official Security Self-Assessment Report (FinTechathon 2026)
              </h4>
              <p className="text-[11px] text-slate-300">
                Prepared by Team LedgerLoom for Topic E: SME Finance Copilot.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-900">১. ৪-স্তরের পারমিশন টায়ার (4-Tier Permission Architecture):</h5>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Tier-1 (Read-Only):</strong> ড্যাশবোর্ড, ক্যাশ-ফ্লো কার্ভ এবং রেশিও এনালাইসিস সম্পূর্ণ অটোনোমাস।</li>
                <li><strong>Tier-2 (Simulation):</strong> টার্গেট প্রফিট প্ল্যানিং ও আগাম লোন কিস্তি ক্যালকুলেটর (স্যান্ডবক্সড)।</li>
                <li><strong>Tier-3 (Communication):</strong> বকেয়া পার্টির কাছে তাগাদা মেসেজ ড্রাফট (Human-in-the-Loop অনুমোদন আবশ্যক)।</li>
                <li><strong>Tier-4 (Financial Mutation):</strong> এক্সেলে লেনদেন যোগ, প্রোফাইল পরিবর্তন ও ঋণ পরিশোধ রেকর্ড (৩০ মিনিটের সিকিউরিটি পিন আবশ্যক)।</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-900">২. পরিচিত ঝুঁকি ও সমাধান (Known-Risk Matrix):</h5>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2">ঝুঁকি (Known Risk)</th>
                      <th className="p-2">প্রভাব</th>
                      <th className="p-2">লেজারলুম ডিফেন্স সিস্টেম</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-medium">Arithmetic Hallucination</td>
                      <td className="p-2 text-rose-600">ভুল হিসাব/লস</td>
                      <td className="p-2">ডিটারমিনিস্টিক টাইপস্ক্রিপ্ট ক্যালকুলেটর ইঞ্জিন (Zero LLM Math)।</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">PII Data Leakage</td>
                      <td className="p-2 text-rose-600">গোপনীয়তা ভঙ্গ</td>
                      <td className="p-2">LLM-এ পাঠানোর পূর্বে মোবাইল ও ট্যাক্স আইডি স্বয়ংক্রিয় মাস্কিং।</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Accidental Cash Mutation</td>
                      <td className="p-2 text-rose-600">ভুল এন্ট্রি</td>
                      <td className="p-2">OCR মেমোগুলো প্রথমে Staging টেবিলে থাকে, মালিক Approve করলে এক্সেলে যায়।</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
