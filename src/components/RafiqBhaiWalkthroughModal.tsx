'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bell,
  ArrowRight,
  Receipt,
  Smartphone,
  CreditCard,
  Target,
  FileCheck,
  ChevronRight,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { SupportedLanguage } from '@/lib/i18n';
import { SupportedCurrency } from '@/lib/currency';

interface WalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const RafiqBhaiWalkthroughModal: React.FC<WalkthroughProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      time: '08:00 AM',
      titleBn: '১. সকাল ৮টার রিমাইন্ডার (Morning Autonomous Reminder)',
      titleEn: '1. 08:00 AM Autonomous Reminder',
      titleZh: '1. 早上 08:00 自动记账提醒',
      descBn:
        'এজেন্ট স্বয়ংক্রিয়ভাবে রফিক ভাইকে রিমাইন্ডার পাঠায়: "শুভ সকাল রফিক ভাই! গতকালের কাঁচামাল ক্রয় বা বিক্রির হিসাব কি লিখেছেন?"',
      descEn:
        'The agent automatically triggers a morning reminder: "Good morning Rafiq Bhai! Did you record yesterday’s fabric purchase and cash sales?"',
      descZh:
        'AI 副驾在早晨自动推送消息：“厂长早！昨天的面料采购和车间销售流水记下了吗？”',
      actionLabelBn: 'নোটিফিকেশন প্যানেলে যান',
      actionLabelEn: 'View Reminder Panel',
      actionLabelZh: '前往通知面板',
      targetTab: 'staging',
      badge: 'Reminder Engine',
      codeDetails: 'Cron schedule triggered at 08:00 AM. Rule: If uncommitted drafts exist, send notification.',
    },
    {
      time: '10:30 AM',
      titleBn: '২. মুখে বলা হিসাব থেকে খসড়া (Natural Voice/Text to Draft)',
      titleEn: '2. Conversational Entry to Pending Draft',
      titleZh: '2. 口述语音转化为待审草案',
      descBn:
        'রফিক ভাই লিখলেন: "৫০ গজ কাপড় কিনলাম ২৫,০০০ টাকায়, ১০,০০০ টাকা বাকি রইলো।" সহকারী কোনো প্রশ্ন না করে হিসাব উল্টে সাজালো এবং কনফার্মেশনের জন্য খসড়া তৈরি করলো।',
      descEn:
        'Rafiq Bhai says: "Bought 50 yards of fabric for 25,000 Tk, 10,000 Tk is on credit." The AI structures a pending draft without mutating the real database yet.',
      descZh:
        '拉菲克老板输入：“买了50码面料花费25,000，其中10,000挂账欠款。” AI 自动解析并生成待审批草案。',
      actionLabelBn: 'অপেক্ষমান খসড়ায় দেখুন',
      actionLabelEn: 'Open Pending Staging',
      actionLabelZh: '查看待办草案',
      targetTab: 'staging',
      badge: 'Tier-1 NLP Draft',
      codeDetails: 'CostType: Variable (Fabric). Split: Cash paid 15,000 Tk, Creditor Payable created 10,000 Tk.',
    },
    {
      time: '01:15 PM',
      titleBn: '৩. মেমো স্ক্যান ও খসড়া অনুমোদন (Receipt OCR & Owner Confirm)',
      titleEn: '3. Memo Photo Scan & Big Confirm Button',
      titleZh: '3. 单据照片扫描与大按钮确认',
      descBn:
        'নবাবপুর মেটাল স্টোরের মেশিন মেরামতের ক্যাশ মেমো ছবি তুললেন। সহকারী খসড়া বানালো; সন্দেহজনক অঙ্ক লাল রঙে দাগিয়ে দিলো। রফিক ভাই বড় সবুজ Confirm বাটনে চাপ দিয়ে স্থায়ী করলেন।',
      descEn:
        'He uploads a photo of a sewing machine repair receipt. AI flags high expenses in red. Rafiq Bhai clicks the prominent green Confirm button to log it into Excel.',
      descZh:
        '上传缝纫机维修收据照片。AI 用红色高亮可疑大额开支，老板点击显眼的绿色 Confirm 按钮正式入账。',
      actionLabelBn: 'খসড়া ও অনুমোদন স্ক্রিন',
      actionLabelEn: 'View Staging & Confirm',
      actionLabelZh: '查看确认屏幕',
      targetTab: 'staging',
      badge: 'Human-in-the-Loop',
      codeDetails: 'Immutable Audit Trail logged: Actor=owner, Action=APPROVE_TRANSACTION, Status=success.',
    },
    {
      time: '03:45 PM',
      titleBn: '৪. সিমুলেটেড bKash পেমেন্ট আগমন (Simulated bKash Inbox)',
      titleEn: '4. Incoming Simulated bKash SMS Capture',
      titleZh: '4. 模拟移动支付短信自动捕获',
      descBn:
        'ঢাকা ফ্যাশন হাব থেকে ২৫,০০০ টাকার bKash মেসেজ আসলো। সরাসরি ব্যালেন্সে যোগ না হয়ে এটি খসড়া তালিকায় উঠলো, রফিক ভাই যাচাই করে অনুমোদন করলেন।',
      descEn:
        'An incoming simulated bKash SMS arrives: "Received Tk 25,000 from Dhaka Fashion Hub". Instead of auto-executing, it sits in staging awaiting 1-click verification.',
      descZh:
        '收到一笔模拟 bKash 25,000 货款短信。系统不擅自篡改资金，而是加入待核实收件箱等待老板确认。',
      actionLabelBn: 'লেনদেন তালিকায় দেখুন',
      actionLabelEn: 'Inspect Ledger',
      actionLabelZh: '查看账本明细',
      targetTab: 'data_entry',
      badge: 'Zero Auto-Write',
      codeDetails: 'SMS Regex Parser extracted TrxID, Party, Amount. Staged with source: receipt_ocr.',
    },
    {
      time: '05:00 PM',
      titleBn: '৫. করিম ট্রেডার্সের বাকি সীমা অ্যালার্ট (Debtor Threshold Alert)',
      titleEn: '5. Debtor Threshold Breach Alert',
      titleZh: '5. 客户逾期欠款超过警戒线报警',
      descBn:
        'করিম ট্রেডার্স ও বেঙ্গল গার্মেন্টস মার্টের বকেয়া ৩০,০০০ টাকার সীমা পেরিয়েছে। সিস্টেম সাথে সাথে জরুরি লাল অ্যালার্ট দিলো এবং হোয়াটসঅ্যাপ/এসএমএস তাগাদার ড্রাফট তৈরি করে দিলো।',
      descEn:
        'Receivables from Bengal Garments Mart & Karim Traders exceed the 30,000 Tk risk threshold. The system alerts Rafiq Bhai with 1-click overdue collection messages.',
      descZh:
        '客户挂账款超过 30,000 警戒线。系统立即触发红色预警，并一键生成催款草案。',
      actionLabelBn: 'বকেয়া অ্যালার্ট দেখুন',
      actionLabelEn: 'Open Debtors Panel',
      actionLabelZh: '打开催款中心',
      targetTab: 'debtors',
      badge: 'Automated Alerting',
      codeDetails: 'Threshold: 30,000 Tk. Status: overdue (6 days). High-risk debtor badge triggered.',
    },
    {
      time: '07:30 PM',
      titleBn: '৬. "ঈদে ১ লাখ লাগবে" ও ৩টি ঋণের তুলনা (Eid Goal & 3 Loan Options)',
      titleEn: '6. "Need 1 Lakh for Eid" & 3 Loan Pressure Comparison',
      titleZh: '6. “开斋节需要10万备货”与三种贷款压力对比',
      descBn:
        'রফিক ভাই লিখলেন: "ঈদে ১ লাখ লাগবে।" সহকারী ব্রেক-ইভেন ও কাঁচামাল পরিকল্পনা দিলো, সাথে ২৪ তারিখে ৳৩০,০০০ সম্ভাব্য ঘাটতি ধরে ৩টি ঋণের কিস্তির চাপ তুলনা করে দিলো (যেমন: ৬ মাসের ক্ষুদ্রঋণে মাসিক কিস্তি ৳৫,১৭৬ বনাম ব্যাংকে ৳৫,২৯৬—কোনটিতে চাপ কম)।',
      descEn:
        'Rafiq Bhai asks: "Need 1 Lakh profit for Eid." AI reverse-engineers required shirts & fabric, detects a 30,000 Tk deficit on the 24th, and compares 3 loan options (e.g. EMI ~5,176 Tk vs 5,296 Tk) recommending the lowest cash-flow pressure option.',
      descZh:
        '拉菲克询问：“开斋节目标净利10万”。AI 倒推所需生产件数与布料采购，预测到24日存在30,000资金缺口，对比3种贷款方案（月供 5,176 vs 5,296），推荐现金流压力最小的方案。',
      actionLabelBn: 'ঋণ তুলনা ও সুপারিশ দেখুন',
      actionLabelEn: 'View Loan Comparison',
      actionLabelZh: '查看贷款对比',
      targetTab: 'financing',
      badge: 'Deficit Forecasting',
      codeDetails: 'Formula: Deficit = Obligations - Forecasted Cash. Options compared: Micro-loan vs SME Bank vs Invoice Factoring.',
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleJumpToTab = (tab: string) => {
    onNavigateTab(tab);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="walkthrough-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="walkthrough-card"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]"
          >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  {currentLanguage === 'zh'
                    ? '拉菲克厂长的一天 (交互式全流程模拟)'
                    : currentLanguage === 'bn'
                    ? 'রফিক ভাইয়ের একদিন (কাল্পনিক ইন্টারঅ্যাক্টিভ ডেমো)'
                    : "Rafiq Bhai's Day (Interactive Scenario Simulation)"}
                </h3>
              </div>
              <p className="text-[11px] text-indigo-200">
                {currentLanguage === 'bn'
                  ? 'প্রতিযোগিতার ৬ নম্বর সেকশনের বাস্তব উদাহরণ ধাপ অনুযায়ী লাইভ দেখুন'
                  : 'Step-by-step interactive simulation matching Section 6 of the competition blueprint'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {steps.map((st, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                  currentStep === idx
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : idx < currentStep
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                <span>{st.time}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-500 shrink-0 ml-2">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Active Step Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              {currentStepData.time} • {currentStepData.badge}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {currentStepData.codeDetails}
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-900">
            {currentLanguage === 'zh'
              ? currentStepData.titleZh
              : currentLanguage === 'bn'
              ? currentStepData.titleBn
              : currentStepData.titleEn}
          </h4>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 text-xs leading-relaxed">
            {currentLanguage === 'zh'
              ? currentStepData.descZh
              : currentLanguage === 'bn'
              ? currentStepData.descBn
              : currentStepData.descEn}
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-300 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">
              {currentLanguage === 'bn'
                ? 'সরাসরি অ্যাপের এই মডিউলে গিয়ে ফিচারটি দেখতে চান?'
                : 'Would you like to jump directly to this working feature?'}
            </span>
            <button
              onClick={() => handleJumpToTab(currentStepData.targetTab)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <span>
                {currentLanguage === 'zh'
                  ? currentStepData.actionLabelZh
                  : currentLanguage === 'bn'
                  ? currentStepData.actionLabelBn
                  : currentStepData.actionLabelEn}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Navigation Controls */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 rounded-xl text-xs font-bold transition"
          >
            {currentLanguage === 'bn' ? 'পূর্ববর্তী ধাপ' : 'Previous'}
          </button>

          <div className="flex items-center gap-2">
            {currentStep === steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(0)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{currentLanguage === 'bn' ? 'পুনরায় শুরু করুন' : 'Restart Story'}</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <span>{currentLanguage === 'bn' ? 'পরবর্তী ধাপ' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
