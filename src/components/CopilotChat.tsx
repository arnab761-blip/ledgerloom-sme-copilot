'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AgentResponse } from '@/lib/agent-orchestrator';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, formatCurrencyAmount } from '@/lib/currency';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  primaryText: string;
  englishText?: string;
  toolUsed?: string;
  suggestedAction?: any;
  timestamp: string;
}

interface CopilotChatProps {
  onNavigateTab: (tab: string) => void;
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({
  onNavigateTab,
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or re-initialize welcome message on language change if only welcome exists
  useEffect(() => {
    setMessages([
      {
        id: 'init-1',
        sender: 'assistant',
        primaryText: t('copilotWelcome'),
        englishText:
          currentLanguage !== 'en'
            ? 'Hello! I am LedgerLoom CFO Copilot. I analyze your business ledger, fixed costs, receivables, and reverse-engineer your profit targets with deterministic precision.'
            : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [currentLanguage]);

  // Currency-aware prompt values
  const targetProfitText =
    currentCurrency === 'USD'
      ? '$500'
      : currentCurrency === 'CNY'
      ? '¥3,000'
      : '৫০,০০০ টাকা';

  const debtorOverdueText =
    currentCurrency === 'USD'
      ? '>$250'
      : currentCurrency === 'CNY'
      ? '>¥1,800'
      : '>৩০,০০০';

  const quickPromptsByLang: Record<SupportedLanguage, string[]> = {
    en: [
      'Show financing options',
      `I want to make ${targetProfitText} profit next month, what to do?`,
      `Who owes overdue money (${debtorOverdueText})?`,
      'How much debt is remaining and EMI?',
      'Where did we spend the most overhead?',
    ],
    zh: [
      '显示适合我的贷款方案',
      `下个月想要赚 ${targetProfitText} 净利润，需要做什么？`,
      `有哪些客户欠款超过 ${debtorOverdueText} 警戒线？`,
      '当前剩余贷款本金及月供是多少？',
      '哪项成本开支占比最高？',
    ],
    bn: [
      'লোনের অপশনগুলো দেখাও',
      `সামনের মাসে ${targetProfitText} লাভ করতে চাই, কি কি করতে হবে?`,
      `কার কাছে কত টাকা বাকি আছে (${debtorOverdueText})?`,
      'ঋণ কত বাকি আছে এবং মাসিক কিস্তির হিসাব দাও',
      'কোথায় সবচেয়ে বেশি খরচ হয়েছে?',
    ],
    hi: [
      'ऋण विकल्प दिखाओ',
      `अगले महीने ${targetProfitText} लाभ कमाने के लिए क्या करें?`,
      `किन ग्राहकों का ${debtorOverdueText} से अधिक बकाया है?`,
      'कुल कितना ऋण बाकी है और मासिक किस्त?',
      'सबसे ज्यादा खर्च किस मद में हुआ?',
    ],
  };

  const quickPrompts = quickPromptsByLang[currentLanguage] || quickPromptsByLang.en;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryToSend?: string) => {
    const q = queryToSend || inputQuery;
    if (!q.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      primaryText: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          language: currentLanguage,
          currency: currentCurrency,
        }),
      });
      const data: AgentResponse & { success: boolean } = await res.json();

      if (data.success) {
        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          primaryText: data.answerPrimary,
          englishText: data.answerEnglish,
          toolUsed: data.executedTool,
          suggestedAction: data.suggestedAction,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('API error');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'assistant',
          primaryText:
            currentLanguage === 'zh'
              ? '抱歉，执行出现异常，请重试或直接查看计算器标签页。'
              : currentLanguage === 'bn'
              ? 'দুঃখিত, কোনো একটি ত্রুটি ঘটেছে। দয়া করে পুনরায় প্রশ্নটি করুন।'
              : currentLanguage === 'hi'
              ? 'क्षमा करें, एक त्रुटि हुई है। कृपया पुनः प्रयास करें।'
              : 'Sorry, an error occurred. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-sm shadow">
            <Bot className="w-5 h-5 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold">LedgerLoom AI CFO</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Deterministic Tool-Calling Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multilingual (English • 中文 • বাংলা • हिन्दी) • Zero-Hallucination Math
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>PII Masked & Sandboxed</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                m.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-300'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-900 border border-slate-200/90 rounded-tl-none space-y-2'
              }`}
            >
              {/* Tool Execution Tag */}
              {m.toolUsed && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold mb-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Tool Executed: {m.toolUsed}()
                </div>
              )}

              {/* Primary response in selected language */}
              <div className="whitespace-pre-line font-sans text-slate-900">{m.primaryText}</div>

              {/* English summary for international competition judges (if primary is not English) */}
              {m.englishText && m.englishText !== m.primaryText && currentLanguage !== 'en' && (
                <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg font-sans">
                  <div className="font-semibold text-slate-500 uppercase tracking-wider text-[9px] mb-1">
                    English Summary (For International Judges)
                  </div>
                  <div className="whitespace-pre-line">{m.englishText}</div>
                </div>
              )}

              {/* Interactive Action Button (if suggested) */}
              {m.suggestedAction && (
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (m.suggestedAction.type === 'open_goal_modal') onNavigateTab('goal_planner');
                      if (m.suggestedAction.type === 'show_debtors') onNavigateTab('debtors');
                      if (m.suggestedAction.type === 'reconcile_loan') onNavigateTab('loans');
                      if (m.suggestedAction.type === 'show_financing') onNavigateTab('financing');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition shadow"
                  >
                    <span>{m.suggestedAction.label || m.suggestedAction.labelEnglish}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div
                className={`text-[9px] mt-1 text-right ${
                  m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-300 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>Executing deterministic math and Excel ledger rules...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
          {t('quickQuestions')}
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 text-[11px] rounded-lg whitespace-nowrap transition shadow-2xs hover:border-indigo-300"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={t('copilotPlaceholder')}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
          >
            <Send className="w-3.5 h-3.5" />
            {t('sendBtn')}
          </button>
        </form>
      </div>
    </div>
  );
};
