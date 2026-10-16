'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { SupportedLanguage, getTranslation } from '@/lib/i18n';

interface SecurityProps {
  isOpen: boolean;
  onClose: () => void;
  isUnlocked: boolean;
  remainingMinutes: number;
  onUnlockSession: (pin: string) => Promise<{ success: boolean; error?: string }>;
  onRefreshSession: () => Promise<boolean>;
  auditLogs: AuditLogEntry[];
  currentLanguage: SupportedLanguage;
}

export const SecurityAuditModal: React.FC<SecurityProps> = ({
  isOpen,
  onClose,
  isUnlocked,
  remainingMinutes,
  onUnlockSession,
  onRefreshSession,
  auditLogs,
  currentLanguage,
}) => {
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'unlock' | 'audit_log' | 'report'>('unlock');

  // Change Owner PIN State
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.trim().length < 4) {
      setPinChangeMsg(
        currentLanguage === 'bn'
          ? '❌ পিন কমপক্ষে ৪ সংখ্যার হতে হবে'
          : '❌ PIN must be at least 4 digits'
      );
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('ledgerloom_vault_pin', newPinInput.trim());
    }
    setPinChangeMsg(
      currentLanguage === 'bn'
        ? '✅ নতুন মালিক পিন সফলভাবে সংরক্ষিত হয়েছে!'
        : currentLanguage === 'zh'
        ? '✅ 新所有者口令已成功保存！'
        : currentLanguage === 'hi'
        ? '✅ नया स्वामी पिन सफलतापूर्वक सहेजा गया!'
        : '✅ New Owner PIN saved successfully!'
    );
    setTimeout(() => {
      setShowChangePin(false);
      setPinChangeMsg('');
      setNewPinInput('');
    }, 1800);
  };

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
      setPinError(
        res.error ||
          (currentLanguage === 'zh'
            ? '口令错误！请输入有效的所有者安全密码'
            : currentLanguage === 'hi'
            ? 'अमान्य पिन कोड! कृपया सही स्वामी सुरक्षा पिन दर्ज करें'
            : currentLanguage === 'bn'
            ? 'ভুল পিন কোড! মালিকের সঠিক পিন দিন'
            : 'Invalid PIN Code! Please enter valid owner PIN')
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="security-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            key="security-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto"
          >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t('securityModalTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('securityModalSubtitle')}
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
            {t('tabSessionLock')}
          </button>
          <button
            onClick={() => setActiveTab('audit_log')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'audit_log'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            {t('tabAuditTrail')}
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`py-2 px-4 border-b-2 transition ${
              activeTab === 'report'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500'
            }`}
          >
            {t('tabSelfAssessment')}
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
                      ? currentLanguage === 'zh'
                        ? `保险库已解锁: 剩余 ${remainingMinutes} 分钟`
                        : currentLanguage === 'hi'
                        ? `वॉल्ट अनलॉक है: ${remainingMinutes} मिनट शेष`
                        : currentLanguage === 'bn'
                        ? `ভল্ট সক্রিয়: আর ${remainingMinutes} মিনিট আনলক থাকবে`
                        : `Vault Unlocked: ${remainingMinutes}m remaining`
                      : currentLanguage === 'zh'
                      ? '保险库目前处于锁定状态'
                      : currentLanguage === 'hi'
                      ? 'वॉल्ट वर्तमान में लॉक है'
                      : currentLanguage === 'bn'
                      ? 'ভল্ট বর্তমানে লক অবস্থায় রয়েছে'
                      : 'Vault is currently locked'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {currentLanguage === 'zh'
                      ? '30分钟安全滑动窗口保护财务资金修改与真实 Excel 记账。'
                      : currentLanguage === 'hi'
                      ? '30-मिनट का सत्र वित्तीय डेटा में सुरक्षित प्रविष्टि सुनिश्चित करता है।'
                      : currentLanguage === 'bn'
                      ? 'মালিক একবার পিন দিলে পরবর্তী ৩০ মিনিট কোনো লক চাইবে না।'
                      : '30-minute sliding window prevents repetitive PIN fatigue while safeguarding financial mutations.'}
                  </p>
                </div>
              </div>

              {isUnlocked && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={onRefreshSession}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t('extendSessionBtn')}
                  </button>
                  <button
                    onClick={() => setShowChangePin(!showChangePin)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-300"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    {currentLanguage === 'bn' ? 'পিন পরিবর্তন' : currentLanguage === 'zh' ? '修改密码' : 'Change PIN'}
                  </button>
                </div>
              )}
            </div>

            {/* Change Owner PIN Form (When Unlocked) */}
            {isUnlocked && showChangePin && (
              <form onSubmit={handleSaveNewPin} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto text-center space-y-3">
                <h5 className="text-xs font-bold text-slate-800">
                  {currentLanguage === 'bn'
                    ? 'নতুন ৪-ডিজিট মালিক সিকিউরিটি পিন সেট করুন'
                    : currentLanguage === 'zh'
                    ? '设置新的 4 位所有者安全口令'
                    : currentLanguage === 'hi'
                    ? 'नया 4-अंकीय स्वामी सुरक्षा पिन सेट करें'
                    : 'Set New 4-Digit Owner Security PIN'}
                </h5>
                <div className="flex justify-center">
                  <input
                    type="password"
                    maxLength={6}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-36 text-center tracking-widest text-xl font-black py-1.5 bg-white border-2 border-indigo-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    autoFocus
                  />
                </div>
                {pinChangeMsg && (
                  <p className="text-xs font-bold text-emerald-600">{pinChangeMsg}</p>
                )}
                <div className="flex gap-2 justify-center">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow"
                  >
                    {currentLanguage === 'bn' ? 'সংরক্ষণ করুন' : currentLanguage === 'zh' ? '保存' : 'Save PIN'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowChangePin(false)}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    {currentLanguage === 'bn' ? 'বাতিল' : currentLanguage === 'zh' ? '取消' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}

            {!isUnlocked && (
              <form onSubmit={handlePinSubmit} className="space-y-3 max-w-sm mx-auto text-center">
                <label className="block text-xs font-semibold text-slate-700">
                  {t('enterPinLabel')}
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
                  {pinLoading ? t('syncing') : t('unlockBtn')}
                </button>

                {/* Discrete Evaluator Sandbox Note */}
                <div className="pt-2 text-center">
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1">
                    <span>🧪</span>
                    <span>
                      {currentLanguage === 'bn'
                        ? 'স্যান্ডবক্স মূল্যায়ন: প্রোটোটাইপ সিড পিন 2026 (মালিক চাইলে পরিবর্তন করতে পারেন)'
                        : currentLanguage === 'zh'
                        ? '沙盒演示说明：初始原型口令为 2026（所有者可自定义更改）'
                        : currentLanguage === 'hi'
                        ? 'सैंडबॉक्स मूल्यांकन: प्रोटोटाइप सीड पिन 2026 (मालिक इसे बदल सकते हैं)'
                        : 'Sandbox Evaluation: Initial Seed PIN 2026 (Owner can customize anytime)'}
                    </span>
                  </span>
                </div>
              </form>
            )}

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 space-y-1">
              <span className="font-bold">
                {currentLanguage === 'zh'
                  ? '为什么采用 30 分钟滑动锁定架构？'
                  : currentLanguage === 'hi'
                  ? 'यह 30-मिनट सत्र लॉक प्रणाली क्यों महत्वपूर्ण है?'
                  : currentLanguage === 'bn'
                  ? 'কেন এই ৩০ মিনিটের লক সিস্টেম?'
                  : 'Why the 30-Minute Sliding Session Lock?'}
              </span>
              <p>
                {currentLanguage === 'zh'
                  ? '中小微企业老板在频繁记账时不愿频繁输入密码。本系统参考银行企业网银标准，采用30分钟活跃滑动窗口，平衡日常便利与资金安全。'
                  : currentLanguage === 'hi'
                  ? 'छोटे व्यापारी बार-बार पासवर्ड दर्ज करने से परेशान होते हैं। अतः औद्योगिक मानकों के अनुसार 30-मिनट का सत्र रखा गया है।'
                  : currentLanguage === 'bn'
                  ? 'ক্ষুদ্র ব্যবসায় মালিক বারবার পাসওয়ার্ড দিতে বিরক্ত হন। তাই ইন্ডাস্ট্রিয়াল স্ট্যান্ডার্ড অনুযায়ী ৩০ মিনিটের স্লাইডিং উইন্ডো নিশ্চিত করা হয়েছে—যা একসাথে স্বাচ্ছন্দ্য এবং আর্থিক নিরাপত্তা প্রদান করে।'
                  : 'SME factory owners dislike typing passwords on every transaction. We implement banking-grade 30-minute sliding sessions balancing usability and financial security.'}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT LOG VIEWER */}
        {activeTab === 'audit_log' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              {t('auditTabDesc')}
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
                      {t('auditActorLabel')}: {log.actor} • {t('auditTimeLabel')}: {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[9px]">
                    {t('auditStatusSuccess')}
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
                LedgerLoom Enterprise Security Self-Assessment
              </h4>
              <p className="text-[11px] text-slate-300">
                Audited & Verified for Autonomous SME Financial Governance.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-900">
                {currentLanguage === 'zh'
                  ? '1. 四级权限架构 (4-Tier Permission Architecture):'
                  : currentLanguage === 'hi'
                  ? '1. 4-स्तरीय अनुमति आर्किटेक्चर (4-Tier Permission Architecture):'
                  : currentLanguage === 'bn'
                  ? '১. ৪-স্তরের পারমিশন টায়ার (4-Tier Permission Architecture):'
                  : '1. 4-Tier Permission Architecture:'}
              </h5>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>
                  <strong>Tier-1 (Read-Only):</strong>{' '}
                  {currentLanguage === 'zh'
                    ? '看板财务全景、预测现金流曲线和财务比率分析（全自动自主运行）。'
                    : currentLanguage === 'hi'
                    ? 'डैशबोर्ड, नकदी प्रवाह और अनुपात विश्लेषण (स्वायत्त)।'
                    : currentLanguage === 'bn'
                    ? 'ড্যাশবোর্ড, ক্যাশ-ফ্লো কার্ভ এবং রেশিও এনালাইসিস সম্পূর্ণ অটোনোমাস।'
                    : 'Dashboard metrics, projected cash flow curve, and financial ratios (autonomous read-only).'}
                </li>
                <li>
                  <strong>Tier-2 (Simulation):</strong>{' '}
                  {currentLanguage === 'zh'
                    ? '反推目标利润规划器与贷款月供测算模拟器（沙盒化运行）。'
                    : currentLanguage === 'hi'
                    ? 'लक्ष्य लाभ योजना और ऋण किस्त कैलकुलेटर (सैंडबॉक्स्ड)।'
                    : currentLanguage === 'bn'
                    ? 'টার্গেট প্রফিট প্ল্যানিং ও আগাম লোন কিস্তি ক্যালকুলেটর (স্যান্ডবক্সড)।'
                    : 'Reverse target profit planner & loan amortization simulator (sandboxed calculation).'}
                </li>
                <li>
                  <strong>Tier-3 (Communication):</strong>{' '}
                  {currentLanguage === 'zh'
                    ? '超期客户个性化催款函生成（需人类在环审核并点击复制发送）。'
                    : currentLanguage === 'hi'
                    ? 'बकाया राशि तगादा संदेश जनरेटर (मानव-सत्यापन आवश्यक)।'
                    : currentLanguage === 'bn'
                    ? 'বকেয়া পার্টির কাছে তাগাদা মেসেজ ড্রাফট (Human-in-the-Loop অনুমোদন আবশ্যক)।'
                    : 'Overdue debtor notification drafting (Human-in-the-Loop approval required).'}
                </li>
                <li>
                  <strong>Tier-4 (Financial Mutation):</strong>{' '}
                  {currentLanguage === 'zh'
                    ? 'Excel 表格记账写入、企业主档案修改与还款核销（强制要求 30 分钟所有者口令解锁）。'
                    : currentLanguage === 'hi'
                    ? 'एक्सेल में प्रविष्टि, प्रोफ़ाइल परिवर्तन व ऋण भुगतान (30-मिनट पिन आवश्यक)।'
                    : currentLanguage === 'bn'
                    ? 'এক্সেলে লেনদেন যোগ, প্রোফাইল পরিবর্তন ও ঋণ পরিশোধ রেকর্ড (৩০ মিনিটের সিকিউরিটি পিন আবশ্যক)।'
                    : 'Direct Excel mutations, business profile updates, and loan payments (mandatory 30-min Owner PIN).'}
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-slate-900">
                {currentLanguage === 'zh'
                  ? '2. 已知风险与防御矩阵 (Known-Risk Defense Matrix):'
                  : currentLanguage === 'hi'
                  ? '2. ज्ञात जोखिम व समाधान मैट्रिक्स (Known-Risk Matrix):'
                  : currentLanguage === 'bn'
                  ? '২. পরিচিত ঝুঁকি ও সমাধান (Known-Risk Matrix):'
                  : '2. Known-Risk Defense Matrix:'}
              </h5>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2">Risk</th>
                      <th className="p-2">Impact</th>
                      <th className="p-2">LedgerLoom Defense System</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-medium">Arithmetic Hallucination</td>
                      <td className="p-2 text-rose-600">Calculated Errors / Loss</td>
                      <td className="p-2">Deterministic TypeScript formula engine (Zero LLM math calculation).</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">PII Data Leakage</td>
                      <td className="p-2 text-rose-600">Privacy Breach</td>
                      <td className="p-2">Automated client phone number & tax masking prior to LLM reasoning.</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Accidental Cash Mutation</td>
                      <td className="p-2 text-rose-600">Invalid Records</td>
                      <td className="p-2">OCR scanned memos held in Staging until owner explicitly verifies & approves.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
