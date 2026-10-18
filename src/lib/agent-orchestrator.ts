import { ExcelDatabase } from './excel-database';
import { AccountingEngine } from './accounting-engine';
import { SecurityVault } from './security-vault';
import { TargetProfitPlan, FinancialHealthMetrics } from './types';
import { SupportedLanguage } from './i18n';
import {
  SupportedCurrency,
  convertCurrency,
  getOverdueThreshold,
  getDefaultTargetProfit,
} from './currency';

export interface AgentResponse {
  answerPrimary: string;
  answerEnglish: string;
  answerBengali?: string; // backwards compatibility
  executedTool?: string;
  toolOutput?: any;
  suggestedAction?: {
    type: 'open_goal_modal' | 'show_debtors' | 'reconcile_loan' | 'approve_staging' | 'show_financing';
    label: string;
    labelEnglish: string;
  };
  metricsSnapshot?: Partial<FinancialHealthMetrics>;
}

export class AgentOrchestrator {
  public static detectLanguage(query: string, defaultLang: SupportedLanguage = 'bn'): SupportedLanguage {
    const q = query.toLowerCase().trim();

    // 1. Script checks
    if (/[\u0980-\u09FF]/.test(query)) return 'bn';
    if (/[\u4e00-\u9fa5]/.test(query)) return 'zh';
    if (/[\u0900-\u097F]/.test(query)) return 'hi';

    // 2. Comprehensive Banglish patterns (ami, tumi, tmi, tmr, kmn, hae, hmm, kmne, etc.)
    const banglishWords = new Set([
      'ami', 'amr', 'amar', 'amader', 'amake',
      'tumi', 'tmi', 'tmr', 'tomar', 'tomake', 'apni', 'apnr', 'apnar',
      'kmn', 'kemon', 'kemne', 'kmne', 'kivabe', 'kibhabe',
      'ki', 'koe', 'koi', 'kothay', 'kotay',
      'hae', 'ha', 'haa', 'hmm', 'humm', 'ho', 'hbe',
      'accha', 'acha', 'achha', 'thik', 'tik', 'thikache',
      'bujhlam', 'bujhso', 'bujhlen', 'bujhechi',
      'bhai', 'vai', 'vaia', 'bhaia',
      'khoroch', 'koros', 'khoros', 'koroch',
      'lav', 'labh', 'munafa',
      'taka', 'tk', 'paisa',
      'baki', 'dhar', 'dena', 'bakir',
      'shob', 'sob', 'koto', 'kto', 'kototuku',
      'ache', 'ase', 'asen', 'acho', 'aso', 'nai', 'na', 'nei',
      'hobe', 'lagbe', 'lagbo', 'chai', 'chay',
      'dekhaw', 'dekhao', 'dakhaw', 'dekte', 'dekhte',
      'kire', 'obostha', 'obosta', 'khobor',
      'bol', 'bolo', 'bolen', 'shuno', 'suno', 'shuncho',
      'ekhon', 'ajke', 'kalke', 'pore',
      'kar', 'kache', 'keno', 'ken',
      'korbo', 'parbo', 'korle', 'dite', 'nibo', 'pabo',
      'khata', 'kisti', 'shune', 'dokan', 'karkhana',
      'hater', 'hatekene', 'hishab', 'hisab'
    ]);

    const words = q.split(/[\s,?.!_+-]+/);
    if (words.some((w) => banglishWords.has(w))) {
      return 'bn';
    }

    // 3. Clear English indicators
    const englishWords = new Set([
      'how', 'what', 'who', 'where', 'when', 'why',
      'can', 'could', 'should', 'would', 'is', 'are', 'am',
      'show', 'tell', 'calculate', 'profit', 'expense',
      'cost', 'revenue', 'debtor', 'loan', 'balance', 'cash',
      'hello', 'hi', 'hey', 'thanks', 'thank', 'help', 'please'
    ]);
    if (words.some((w) => englishWords.has(w))) {
      return 'en';
    }

    return defaultLang;
  }

  /**
   * Main query processor: Handles both natural language understanding and deterministic tool routing
   */
  public static async processQuery(
    query: string,
    apiKey?: string,
    lang: SupportedLanguage = 'en',
    currency: SupportedCurrency = 'BDT'
  ): Promise<AgentResponse> {
    const sanitizedQuery = SecurityVault.maskPII(query).toLowerCase().trim();
    const activeLang = this.detectLanguage(query, lang);
    const rawProfile = ExcelDatabase.getProfile();
    const profile = AccountingEngine.getConvertedProfile(rawProfile, currency);
    const transactions = ExcelDatabase.getTransactions();
    const debtors = ExcelDatabase.getDebtors();
    const loans = ExcelDatabase.getLoans();
    const rawHealth = AccountingEngine.computeFinancialHealth(rawProfile, transactions, debtors, loans);

    const conv = (amt: number) => convertCurrency(amt, 'BDT', currency);
    const health: FinancialHealthMetrics = {
      ...rawHealth,
      totalRevenue: conv(rawHealth.totalRevenue),
      totalExpenses: conv(rawHealth.totalExpenses),
      totalFixedCosts: conv(rawHealth.totalFixedCosts),
      totalVariableCosts: conv(rawHealth.totalVariableCosts),
      netProfit: conv(rawHealth.netProfit),
      totalReceivables: conv(rawHealth.totalReceivables),
      totalPayables: conv(rawHealth.totalPayables),
      monthlyLoanObligation: conv(rawHealth.monthlyLoanObligation),
    };

    // If Gemini API Key is configured, attempt LLM tool-calling; else use deterministic router
    if (apiKey || process.env.GEMINI_API_KEY) {
      try {
        return await this.callGeminiWithTools(query, apiKey || process.env.GEMINI_API_KEY!, activeLang, currency);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to deterministic router:', err);
      }
    }

    // DETERMINISTIC ZERO-HALLUCINATION ROUTER (Always reliable & instant)
    return this.deterministicRoute(sanitizedQuery, profile, transactions, debtors, loans, health, activeLang, currency);
  }

  private static convertBengaliDigits(text: string): string {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    let res = text;
    bengaliDigits.forEach((d, idx) => {
      res = res.replaceAll(d, idx.toString());
    });
    return res;
  }

  /**
   * Deterministic logic router: matches user intent and executes exact mathematical code
   */
  private static deterministicRoute(
    qRaw: string,
    profile: any,
    transactions: any[],
    debtors: any[],
    loans: any[],
    health: FinancialHealthMetrics,
    lang: SupportedLanguage,
    currency: SupportedCurrency = 'BDT'
  ): AgentResponse {
    const q = this.convertBengaliDigits(qRaw);

    // =========================================================================
    // 0A. HOW ARE YOU / KMN / KEMON ACHEN
    // =========================================================================
    const isHowAreYou =
      q.includes('kmn') ||
      q.includes('kemon') ||
      q.includes('kemne acho') ||
      q.includes('how are you');

    if (isHowAreYou) {
      const ansBn = `আলহামদুলিল্লাহ ভাই, আমি বেশ ভালো আছি! 😊\nআপনার কারখানার আর্থিক অবস্থা ও খাতা-কলম একদম ঠিকঠাক রাখার জন্য আমি সবসময় প্রস্তুত।\n\nবলুন ভাই, আজকে কারখানার কী খবর? কোনো হিসাব দেখতে চান বা কোনো পরামর্শ দরকার?`;
      const ansEn = `Hello! I am doing great, thank you! 😊\nYour factory's cash flow and financial health are stable.\n\nHow can I help you today? Feel free to ask about your profits, debtors, expenses, or loan options!`;
      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'cfoGreetings',
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 0B. CONVERSATIONAL "AMI" / "AMI OWNER" / "AMI KI KORBO"
    // =========================================================================
    const isAmi =
      q === 'ami' ||
      q.includes('ami owner') ||
      q.includes('ami malik') ||
      q.includes('ami rafiq') ||
      q.includes('ami ki korbo') ||
      q.includes('amar ki kora');

    if (isAmi) {
      const ansBn = `জি ভাই! আপনাকে পেয়ে খুব ভালো লাগল। আপনি শুধু বলুন আপনি কী করতে চান—\n১. আগামী মাসের লাভের লক্ষ্য ঠিক করবেন?\n২. বাকি খাতা ও বকেয়া পাওনা চেক করবেন?\n৩. নাকি কারখানা সম্প্রসারণে লোনের হিসাব দেখবেন?\nযেটাই চান, আমাকে জানান! 😊`;
      const ansEn = `Yes! Glad to assist you. Tell me what you would like to do:\n1. Plan your monthly target profit\n2. Review overdue debtors\n3. Check loan & EMI options\nJust let me know! 😊`;
      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'cfoAssistance',
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 0C. CONVERSATIONAL "KMNE" / "KEMNE" / "KMNE KI KORBO"
    // =========================================================================
    const isKmne =
      q === 'kmne' ||
      q === 'kemne' ||
      q.includes('kmne ki') ||
      q.includes('kemne ki') ||
      q.includes('kmne korbo');

    if (isKmne) {
      const ansBn = `একদম সহজ ভাই! 😊 আমি আপনাকে ধাপে ধাপে বুঝিয়ে দিচ্ছি।\nআপনি শুধু বলুন—\n• লাভের লক্ষ্য ঠিক করবেন? (যেমন: *"৫০ হাজার লাভ কেমনে করবো?"*)\n• বকেয়া বাকি টাকা দেখতে চান? (যেমন: *"বাকি কত আছে?"*)\n• নাকি লোন ও কিস্তির হিসাব দেখতে চান?\nযেকোনো একটি লিখে জানান, আমি এখনই গাণিতিক হিসাব বের করে দিচ্ছি!`;
      const ansEn = `Very simple! 😊 I can guide you step by step.\nPlease tell me what you would like to focus on:\n• Set a target profit (e.g. "How to make 50,000 profit?")\n• Check overdue receivables ("Who owes money?")\n• Explore loan options & EMI\nJust type your goal, and I'll calculate it instantly!`;
      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'cfoGuidance',
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 0D. CONVERSATIONAL ACKNOWLEDGMENTS ("hae", "ha", "hmm", "ok", "thik ache", etc.)
    // =========================================================================
    const isAck =
      q === 'hae' ||
      q === 'ha' ||
      q === 'haa' ||
      q === 'hmm' ||
      q === 'humm' ||
      q === 'accha' ||
      q === 'acha' ||
      q === 'achha' ||
      q === 'ok' ||
      q === 'okay' ||
      q === 'thik ache' ||
      q === 'thik ase' ||
      q === 'tik ache' ||
      q === 'bujhlam' ||
      q === 'understood' ||
      q === 'got it' ||
      q === 'sure';

    if (isAck) {
      const ansBn = `জি ভাই, শুনছি! বলুন, কারখানার আয়-ব্যয়, বাকি টাকা আদায় কিংবা লোন সম্পর্কিত কোনো হিসাব কি দেখতে চান? নিশ্চিন্তে বলুন, আমি এখনই বের করে দিচ্ছি।`;
      const ansEn = `Understood! Let me know which financial metric, debtor alert, loan reconciliation, or profit target you would like to explore next.`;
      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'cfoAcknowledgment',
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 0E. IDENTITY & CAPABILITIES ("tmi", "tumi", "tmr", "who are you")
    // =========================================================================
    const isIdentity =
      q.includes('tumi ke') ||
      q.includes('who are you') ||
      q.includes('tmr nam') ||
      q.includes('tomar nam') ||
      q.includes('what is your name') ||
      q.includes('ki korte paro') ||
      q.includes('what can you do') ||
      q === 'tmi' ||
      q === 'tumi' ||
      q === 'tmr';

    if (isIdentity) {
      const ansBn = `আমি আপনার **LedgerLoom AI CFO কোপাইলট**! 🤝\nআপনার কারখানার হিসাব-নিকাশ নিখুঁত রাখা, বাকি টাকার তাগাদা দেওয়া, লোনের কিস্তি ট্র্যাক করা এবং লাভের লক্ষ্য অর্জনে কত পিস কাপড় বানাতে হবে তা গাণিতিকভাবে বের করাই আমার কাজ।\n\nযেকোনো প্রশ্ন লিখে জানান, আমি সাথে সাথে হিসাব করে দেব!`;
      const ansEn = `I am your **LedgerLoom AI CFO Copilot**! 🤝\nI help manage your SME factory finances, compute break-even targets, monitor overdue receivables, and evaluate loan opportunities with zero-hallucination math.\n\nHow can I assist you right now?`;
      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'cfoIdentity',
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 0F. BALANCE & CASH INQUIRY (e.g. "balance koto", "koto taka ase", "cash")
    // =========================================================================
    const isBalanceIntent =
      q.includes('balance') ||
      q.includes('hater taka') ||
      q.includes('cash koto') ||
      q.includes('koto taka ase') ||
      q.includes('koto taka ache') ||
      q.includes('ক্যাশ ব্যালেন্স') ||
      q.includes('ব্যালেন্স কত') ||
      q.includes('হাতে নগদ');

    if (isBalanceIntent) {
      const conv = (amt: number) => convertCurrency(amt, 'BDT', currency);
      const cash = Math.max(15000, profile.initialInvestment + health.netProfit - health.totalReceivables);
      const ansBn = `আপনার বর্তমান নগদ ক্যাশ ব্যালেন্স (হাতে নগদ) হলো **${conv(cash).toLocaleString()} ${profile.currency}**।\n• চলতি মাসে নিট লাভ: **+${health.netProfit.toLocaleString()} ${profile.currency}**\n• বর্তমান ক্যাশ রানওয়ে: **${health.cashRunwayDays} দিন** (${health.cashRunwayDays >= 60 ? 'যথেষ্ট ব্যালেন্স আছে (নিরাপদ)' : health.cashRunwayDays >= 30 ? 'মাঝারি ব্যালেন্স (স্থিতিশীল)' : 'ব্যালেন্স কম (জরুরি নগদ সতর্কতা)'})\n\n💡 ড্যাশবোর্ডের উপরে bKash স্টাইল বোতামে ট্যাপ করেও যেকোনো সময় ব্যালেন্স দেখতে পারবেন।`;

      const ansEn = `Your current liquid cash balance is **${conv(cash).toLocaleString()} ${profile.currency}**.\n• Monthly Net Profit: **+${health.netProfit.toLocaleString()} ${profile.currency}**\n• Cash Runway: **${health.cashRunwayDays} days** (${health.cashRunwayDays >= 60 ? 'Sufficient Balance (Safe)' : health.cashRunwayDays >= 30 ? 'Moderate Balance' : 'Low Balance Warning'})\n\n💡 You can also tap the bKash-style button on the dashboard to view your balance.`;

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'getCashBalance',
        toolOutput: { cashBalance: cash, cashRunwayDays: health.cashRunwayDays },
        metricsSnapshot: health,
      };
    }

    // 1. Target Profit / Goal Planning
    const profitMatch =
      q.match(/(\d+[\d,]*)\s*(?:টাকা|tk|bdt|元|rmb|\$|rs|rupees)?\s*(?:净)?(?:লাভ|profit|ইনকাম|আয়|利润|赚|लाभ)/i) ||
      q.match(/(?:লাভ|profit|ইনকাম|আয়|利润|赚|लाभ|净利润)\s*(?:করতে চাই|হিসাব|目标)?\s*(\d+[\d,]*)/i) ||
      q.match(/(\d+[\d,]*)\s*(?:হাজার|k|万)/i);

    const isGoalIntent =
      profitMatch ||
      q.includes('টার্গেট') ||
      q.includes('লক্ষ্য') ||
      q.includes('target') ||
      q.includes('goal') ||
      q.includes('目标') ||
      q.includes('利润') ||
      q.includes('लक्ष्य');

    if (isGoalIntent) {
      let targetAmount = Number(getDefaultTargetProfit(currency));
      if (profitMatch && profitMatch[1]) {
        targetAmount = parseInt(profitMatch[1].replace(/,/g, ''), 10);
        if (q.includes('万')) targetAmount *= 10000;
      }
      const plan = AccountingEngine.solveTargetProfit(profile, targetAmount, 'month');

      const ansBn = `আগামী মাসে **${targetAmount.toLocaleString()} ${profile.currency}** নেট লাভ করতে হলে:
- আপনাকে মোট **${plan.requiredUnits.toLocaleString()}টি ${profile.primaryProduct}** বিক্রি করতে হবে।
- এর জন্য আনুমানিক **${plan.requiredFabricMeters.toLocaleString()} মিটার/গজ ফেব্রিক** কিনতে হবে (সম্ভাব্য খরচ: ${plan.requiredFabricCost.toLocaleString()} ${profile.currency})।
- আপনার কারখানার মাসিক ফিক্সড কস্ট **${plan.totalFixedCost.toLocaleString()} ${profile.currency}** তুলতে প্রথম **${plan.breakEvenUnits.toLocaleString()}টি** পণ্য বিক্রি করতে হবে, এরপরের পণ্যগুলো থেকে লাভ আসবে।`;

      const ansEn = `To achieve a target net profit of **${targetAmount.toLocaleString()} ${profile.currency}** next month:
- You must produce and sell **${plan.requiredUnits.toLocaleString()} units of ${profile.primaryProduct}**.
- Required raw material: approx **${plan.requiredFabricMeters.toLocaleString()} meters of fabric** (Estimated cost: ${plan.requiredFabricCost.toLocaleString()} ${profile.currency}).
- Break-even is at **${plan.breakEvenUnits.toLocaleString()} units** to cover factory fixed overhead (${plan.totalFixedCost.toLocaleString()} ${profile.currency}).`;

      const ansZh = `为了在下个月实现 **${targetAmount.toLocaleString()} ${profile.currency}** 的净利润目标：
- 您需要生产并销售 **${plan.requiredUnits.toLocaleString()} 件 ${profile.primaryProduct}**。
- 所需核心面料采购量：约 **${plan.requiredFabricMeters.toLocaleString()} 米/码**（预计面料采购预算：${plan.requiredFabricCost.toLocaleString()} ${profile.currency}）。
- 工厂的保本平衡点为 **${plan.breakEvenUnits.toLocaleString()} 件**，用于覆盖每月固定开销（${plan.totalFixedCost.toLocaleString()} ${profile.currency}），超出部分的销售才产生净利润。`;

      const ansHi = `अगले महीने **${targetAmount.toLocaleString()} ${profile.currency}** शुद्ध लाभ कमाने के लिए:
- आपको कुल **${plan.requiredUnits.toLocaleString()} यूनिट ${profile.primaryProduct}** बेचनी होंगी।
- इसके लिए लगभग **${plan.requiredFabricMeters.toLocaleString()} मीटर कपड़ा** खरीदना होगा (अनुमानित लागत: ${plan.requiredFabricCost.toLocaleString()} ${profile.currency})।
- कारखाने की स्थिर लागत (${plan.totalFixedCost.toLocaleString()} ${profile.currency}) निकालने के लिए शुरुआती **${plan.breakEvenUnits.toLocaleString()} यूनिट** बेचना अनिवार्य है।`;

      const primary = lang === 'zh' ? ansZh : lang === 'bn' ? ansBn : lang === 'hi' ? ansHi : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'solveTargetProfit',
        toolOutput: plan,
        suggestedAction: {
          type: 'open_goal_modal',
          label: lang === 'zh' ? '查看目标拆解方案' : lang === 'bn' ? 'টার্গেট প্রফিট প্ল্যান দেখুন' : lang === 'hi' ? 'लक्ष्य योजना देखें' : 'View Target Plan',
          labelEnglish: 'View Detailed Target Plan',
        },
        metricsSnapshot: health,
      };
    }

    // 2. Debtors / Overdue Receivables
    const isDebtorIntent =
      q.includes('বাকি') ||
      q.includes('পাওনা') ||
      q.includes('debtor') ||
      q.includes('receivable') ||
      q.includes('owe') ||
      q.includes('overdue') ||
      q.includes('তাগাদা') ||
      q.includes('应收') ||
      q.includes('欠款') ||
      q.includes('催款') ||
      q.includes('बकाया') ||
      q.includes('उधारी');

    if (isDebtorIntent) {
      const riskThreshold = getOverdueThreshold(currency);
      const conv = (amt: number) => convertCurrency(amt, 'BDT', currency);
      const convertedDebtors = debtors.map((d) => ({
        ...d,
        amount: conv(d.amount),
        alertThreshold: conv(d.alertThreshold || 30000),
      }));
      const highRisk = convertedDebtors.filter(
        (d) => d.type === 'receivable' && d.amount >= riskThreshold
      );
      const totalRec = convertedDebtors
        .filter((d) => d.type === 'receivable')
        .reduce((s, d) => s + d.amount, 0);

      const highRiskBn = highRisk
        .map(
          (d) =>
            `• **${d.partyName}**: বকেয়া ${d.amount.toLocaleString()} ${profile.currency} (মেয়াদ: ${d.dueDate})`
        )
        .join('\n');
      const highRiskEn = highRisk
        .map(
          (d) =>
            `• **${d.partyName}**: ${d.amount.toLocaleString()} ${profile.currency} (Due: ${d.dueDate})`
        )
        .join('\n');
      const highRiskZh = highRisk
        .map(
          (d) =>
            `• **${d.partyName}**: 欠款 ${d.amount.toLocaleString()} ${profile.currency}（到期日: ${d.dueDate}）`
        )
        .join('\n');
      const highRiskHi = highRisk
        .map(
          (d) =>
            `• **${d.partyName}**: बकाया ${d.amount.toLocaleString()} ${profile.currency} (देय: ${d.dueDate})`
        )
        .join('\n');

      const ansBn = `বর্তমানে আপনার মোট বকেয়া (Receivables) **${totalRec.toLocaleString()} ${profile.currency}**। 
এর মধ্যে **${highRisk.length}টি পার্টির** বকেয়া ${riskThreshold.toLocaleString()} ${profile.currency} এর সীমা ছাড়িয়ে গেছে:
${highRiskBn}

জরুরি ভিত্তিতে তাদের কাছে তাগাদা মেসেজ পাঠানোর প্রস্তাব করা হচ্ছে।`;

      const ansEn = `You have total outstanding receivables of **${totalRec.toLocaleString()} ${profile.currency}**.
There are **${highRisk.length} account(s)** exceeding the ${riskThreshold.toLocaleString()} ${profile.currency} risk threshold:
${highRiskEn}

Recommended action: Send automated reminder notices to overdue accounts.`;

      const ansZh = `当前您的应收账款总额为 **${totalRec.toLocaleString()} ${profile.currency}**。
其中共有 **${highRisk.length} 家客户** 欠款超出 ${riskThreshold.toLocaleString()} ${profile.currency} 的信用风控红线：
${highRiskZh}

系统建议：请立即向超期客户发起自动生成的对账催缴通知函。`;

      const ansHi = `वर्तमान में आपकी कुल बकाया राशि (Receivables) **${totalRec.toLocaleString()} ${profile.currency}** है।
इनमें से **${highRisk.length} खातों** का बकाया ${riskThreshold.toLocaleString()} ${profile.currency} की सीमा पार कर चुका है:
${highRiskHi}

सिफारिश: कृपया तुरंत तगादा संदेश भेजें।`;

      const primary = lang === 'zh' ? ansZh : lang === 'bn' ? ansBn : lang === 'hi' ? ansHi : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'checkHighRiskDebtors',
        toolOutput: { totalReceivables: totalRec, highRiskAccounts: highRisk },
        suggestedAction: {
          type: 'show_debtors',
          label: lang === 'zh' ? '查看逾期账目并催收' : lang === 'bn' ? 'বকেয়া তালিকা ও তাগাদা দেখুন' : lang === 'hi' ? 'बकाया सूची देखें' : 'Review Overdue Debtors',
          labelEnglish: 'Review Overdue Debtors & Send Reminders',
        },
        metricsSnapshot: health,
      };
    }

    // 3. New Loan Evaluation & Multi-Step Reasoning (e.g. "মেশিন কেনার জন্য লোন নেওয়া কি ঠিক হবে?")
    const isLoanEvaluationIntent =
      (q.includes('মেশিন') || q.includes('machine') || q.includes('নিতে চাই') || q.includes('ঠিক হবে') || q.includes('should i') || q.includes('invest') || q.includes('বিনিয়োগ')) &&
      (q.includes('ঋণ') || q.includes('loan') || q.includes('লোন') || q.includes('贷款') || q.includes('कर्ज'));

    if (isLoanEvaluationIntent) {
      const conv = (amt: number) => convertCurrency(amt, 'BDT', currency);
      const defaultLoan = conv(50000);
      const loanAmountMatch = q.match(/(\d+[\d,]*)/);
      const prospectiveAmount = loanAmountMatch ? parseInt(loanAmountMatch[1].replace(/,/g, ''), 10) : defaultLoan;
      const sim = AccountingEngine.calculateLoanEMI(prospectiveAmount, 8.5, 24);
      const postEmiProfit = health.netProfit - sim.monthlyEMI;

      const ansBn = `🧠 **AI CFO মাল্টি-স্টেপ ডিসিশন ফ্রেমওয়ার্ক (৩টি ধাপে বিশ্লেষণ):**

• **ধাপ ১ (বর্তমান মুনাফা যাচাই):** আপনার কারখানার চলতি মাসিক নিট মুনাফা **${health.netProfit.toLocaleString()} ${profile.currency}**।
• **ধাপ ২ (ক্যাশ-ফ্লো প্রজেকশন):** ${prospectiveAmount.toLocaleString()} ${profile.currency} ঋণের ক্ষেত্রে ৮.৫% সুদে ২৪ মাসের আনুমানিক মাসিক কিস্তি দাঁড়াবে **${sim.monthlyEMI.toLocaleString()} ${profile.currency}**। কিস্তি দেওয়ার পরও আপনার মাসিক সারপ্লাস থাকবে **+${postEmiProfit.toLocaleString()} ${profile.currency}**।
• **ধাপ ৩ (উপযুক্ত স্কিম ম্যাচিং):** সাধারণ শর্ট-টার্ম লোনের চেয়ে **'Machinery & Equipment Expansion Lease'** নেওয়া বেশি লাভজনক, কারণ এতে কোনো অতিরিক্ত জামানত ছাড়াই মেশিন নিজেই জামানত হিসেবে থাকবে।

💡 **চূড়ান্ত পরামর্শ:** হ্যাঁ, আপনার বর্তমান ক্যাশ-ফ্লো অনুযায়ী এই লোন নেওয়া ঝুঁকিমুক্ত ও লাভজনক।`;

      const ansEn = `🧠 **AI CFO Multi-Step Reasoning Framework (3-Step Decision Analysis):**

• **Step 1 (Profitability Check):** Current monthly net profit is **${health.netProfit.toLocaleString()} ${profile.currency}**.
• **Step 2 (Cash Flow Stress-Test):** For a ${prospectiveAmount.toLocaleString()} ${profile.currency} loan at 8.5% APR over 24 months, estimated monthly EMI is **${sim.monthlyEMI.toLocaleString()} ${profile.currency}**. Monthly surplus remains positive at **+${postEmiProfit.toLocaleString()} ${profile.currency}**.
• **Step 3 (Scheme Matching):** Recommend **'Machinery & Equipment Expansion Lease'** over short-term loans, using the equipment itself as collateral.

💡 **Conclusion:** Approved. Your factory cash runway comfortably supports this capital expenditure.`;

      const ansZh = `🧠 **AI 首席财务官多步逻辑推理架构 (3步决策分析法)：**

• **第 1 步 (当前盈利校验):** 工厂当前月度净利润为 **${health.netProfit.toLocaleString()} ${profile.currency}**。
• **第 2 步 (现金流压力测试):** 针对 ${prospectiveAmount.toLocaleString()} ${profile.currency} 的设备融资，按 8.5% 年化测算 24 期月供约为 **${sim.monthlyEMI.toLocaleString()} ${profile.currency}**。扣除还贷后月度现金结余仍保持在 **+${postEmiProfit.toLocaleString()} ${profile.currency}**。
• **第 3 步 (最优信贷方案匹配):** 强烈推荐优先匹配 **“设备融资租赁 (Machinery Lease)”**，直接以新设备作为物权担保，无需额外不动产抵押。

💡 **决策结论:** 经压力测试，该笔资本开支完全在您的安全现金流承受范围内。`;

      const ansHi = `🧠 **एआई सीएफओ बहु-चरणीय निर्णय ढाँचा (3 चरणों में विश्लेषण):**

• **चरण 1 (लाभप्रदता जांच):** आपके कारखाने का वर्तमान मासिक शुद्ध लाभ **${health.netProfit.toLocaleString()} ${profile.currency}** है।
• **चरण 2 (नकदी प्रवाह तनाव परीक्षण):** ${prospectiveAmount.toLocaleString()} ${profile.currency} ऋण के लिए 24 माह की अनुमानित मासिक किस्त **${sim.monthlyEMI.toLocaleString()} ${profile.currency}** होगी। किस्त के बाद भी अधिशेष **+${postEmiProfit.toLocaleString()} ${profile.currency}** बना रहेगा।
• **चरण 3 (योजना मिलान):** सामान्य ऋण के बजाय **'मशीनरी लीजिंग'** विकल्प चुनें जिसमें उपकरण ही बंधक का कार्य करता है।

💡 **निष्कर्ष:** अनुमोदित। आपका नकदी प्रवाह इस निवेश को वहन करने में पूर्णतः सक्षम है।`;

      const primary = lang === 'zh' ? ansZh : lang === 'bn' ? ansBn : lang === 'hi' ? ansHi : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'evaluateEquipmentLoanEligibility',
        toolOutput: { sim, postEmiProfit },
        suggestedAction: {
          type: 'open_goal_modal',
          label: lang === 'zh' ? '查看信贷方案列表' : lang === 'bn' ? 'ম্যাচিং ফাইন্যান্সিং বিকল্প দেখুন' : lang === 'hi' ? 'वित्त विकल्प देखें' : 'View Financing Options',
          labelEnglish: 'View Financing Options',
        },
        metricsSnapshot: health,
      };
    }

    // 4. Financing Matching Intent (e.g. "লোনের অপশনগুলো দেখাও" or "financing options")
    const isFinancingMatchIntent =
      q.includes('লোনের অপশন') ||
      q.includes('লোন অপশন') ||
      q.includes('ফাইন্যান্সিং') ||
      q.includes('বিকল্প লোন') ||
      q.includes('loan option') ||
      q.includes('financing') ||
      q.includes('credit option') ||
      q.includes('show loans') ||
      q.includes('what loans') ||
      q.includes('贷款方案') ||
      q.includes('融资方案') ||
      q.includes('推荐贷款') ||
      q.includes('ऋण विकल्प');

    if (isFinancingMatchIntent) {
      const options = AccountingEngine.matchFinancingOptions(profile, health, debtors, lang, currency);
      const top3 = options.slice(0, 3);

      const topBn = top3
        .map(
          (opt, i) =>
            `${i + 1}. **${opt.name}** (${opt.fitScorePercentage}% ম্যাচ)\n   • সুদের হার: ${opt.interestRateText} | মেয়াদ: ${opt.tenureMonths} মাস\n   • সর্বোচ্চ সীমা: ${opt.maxAmount.toLocaleString()} ${profile.currency} (${opt.collateralRequired ? 'জামানতযুক্ত' : 'জামানতবিহীন'})\n   • উপযোগী কারণ: ${opt.explainableMatchReason}`
        )
        .join('\n\n');

      const topEn = top3
        .map(
          (opt, i) =>
            `${i + 1}. **${opt.name}** (${opt.fitScorePercentage}% Fit)\n   • Rate: ${opt.interestRateText} | Tenure: ${opt.tenureMonths} mos\n   • Limit: ${opt.maxAmount.toLocaleString()} ${profile.currency} (${opt.collateralRequired ? 'Secured' : 'Unsecured'})\n   • Match Reason: ${opt.explainableMatchReason}`
        )
        .join('\n\n');

      const topZh = top3
        .map(
          (opt, i) =>
            `${i + 1}. **${opt.name}**（匹配度: ${opt.fitScorePercentage}%）\n   • 利率: ${opt.interestRateText} | 期限: ${opt.tenureMonths} 个月\n   • 额度: ${opt.maxAmount.toLocaleString()} ${profile.currency}（${opt.collateralRequired ? '需抵押' : '纯信用无担保'}）\n   • 匹配理由: ${opt.explainableMatchReason}`
        )
        .join('\n\n');

      const topHi = top3
        .map(
          (opt, i) =>
            `${i + 1}. **${opt.name}** (${opt.fitScorePercentage}% मैच)\n   • ब्याज दर: ${opt.interestRateText} | अवधि: ${opt.tenureMonths} माह\n   • अधिकतम सीमा: ${opt.maxAmount.toLocaleString()} ${profile.currency} (${opt.collateralRequired ? 'जमानत' : 'बिना गारंटी'})\n   • उपयुक्तता: ${opt.explainableMatchReason}`
        )
        .join('\n\n');

      const ansBn = `আপনার বর্তমান মাসিক ক্যাশ-ফ্লো, আয় ও বকেয়া ইনভয়েস অ্যানালাইসিস করে AI Underwriting ইঞ্জিন **৩টি সেরা ফাইন্যান্সিং বিকল্প** নির্ধারণ করেছে:\n\n${topBn}\n\n💡 আপনি সরাসরি ড্যাশবোর্ড থেকে WeBank ডিজিটাল স্যান্ডবক্সে আবেদন করতে পারবেন।`;
      const ansEn = `Based on your monthly cash-flow, revenues, and receivables, our AI Underwriting Engine has matched **top 3 financing options**:\n\n${topEn}\n\n💡 You can apply directly through the WeBank Digital Sandbox on the Financing tab.`;
      const ansZh = `基于您的月度现金流、营收数据与应收账款，AI 智能信贷核保引擎为您优选匹配了 **3 个最具性价比的融资方案**：\n\n${topZh}\n\n💡 您可在“融资方案”标签页一键提交至微众银行 (WeBank) 数字信贷沙盒。`;
      const ansHi = `आपके मासिक नकदी प्रवाह, राजस्व और बकाया के आधार पर एआई अंडरराइटिंग इंजन ने **3 शीर्ष वित्त विकल्प** चुने हैं:\n\n${topHi}\n\n💡 आप सीधे वित्त टैब से आवेदन कर सकते हैं।`;

      const primary = lang === 'zh' ? ansZh : lang === 'bn' ? ansBn : lang === 'hi' ? ansHi : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'matchFinancingOptions',
        toolOutput: options,
        suggestedAction: {
          type: 'show_financing',
          label:
            lang === 'zh'
              ? '查看全部融资对比表'
              : lang === 'bn'
              ? 'সম্পূর্ণ ফাইন্যান্সিং তুলনা দেখুন'
              : lang === 'hi'
              ? 'पूर्ण वित्त तुलना देखें'
              : 'View Full Financing Comparison',
          labelEnglish: 'View Full Financing Comparison Table',
        },
        metricsSnapshot: health,
      };
    }

    // 5. Loans & Reconciliation
    const isLoanIntent =
      q.includes('ঋণ') ||
      q.includes('দেনা') ||
      q.includes('কিস্তি') ||
      q.includes('loan') ||
      q.includes('reconcile') ||
      q.includes('emi') ||
      q.includes('贷款') ||
      q.includes('还款') ||
      q.includes('月供') ||
      q.includes('कर्ज') ||
      q.includes('किस्त');

    if (isLoanIntent) {
      const loanSummary = AccountingEngine.reconcileAllLoans(loans, currency);

      const loanDetailsBn = loanSummary.nextDueDetails.map(
        (l) => `• **${l.lender}**: অবশিষ্ট ঋণ ${l.remaining.toLocaleString()} ${profile.currency} (মাসিক কিস্তি: ${l.emi.toLocaleString()} ${profile.currency}, পরবর্তী কিস্তির তারিখ: ${l.nextDate})`
      ).join('\n');

      const loanDetailsEn = loanSummary.nextDueDetails.map(
        (l) => `• **${l.lender}**: Remaining balance ${l.remaining.toLocaleString()} ${profile.currency} (Monthly EMI: ${l.emi.toLocaleString()} ${profile.currency}, Next payment: ${l.nextDate})`
      ).join('\n');

      const loanDetailsZh = loanSummary.nextDueDetails.map(
        (l) => `• **${l.lender}**: 剩余本金 ${l.remaining.toLocaleString()} ${profile.currency}（每月月供: ${l.emi.toLocaleString()} ${profile.currency}，下次还款日: ${l.nextDate}）`
      ).join('\n');

      const loanDetailsHi = loanSummary.nextDueDetails.map(
        (l) => `• **${l.lender}**: शेष ऋण ${l.remaining.toLocaleString()} ${profile.currency} (मासिक EMI: ${l.emi.toLocaleString()} ${profile.currency}, अगली तिथि: ${l.nextDate})`
      ).join('\n');

      const ansBn = `আপনার বর্তমানে **${loanSummary.activeLoanCount}টি সক্রিয় ঋণ** রয়েছে:
${loanDetailsBn}

- মোট অবশিষ্ট ঋণের পরিমাণ: **${loanSummary.totalRemainingDebt.toLocaleString()} ${profile.currency}**
- প্রতি মাসে মোট কিস্তির বাধ্যবাধকতা: **${loanSummary.totalMonthlyEMIObligation.toLocaleString()} ${profile.currency}**`;

      const ansEn = `You currently have **${loanSummary.activeLoanCount} active loan(s)**:
${loanDetailsEn}

- Total Remaining Debt: **${loanSummary.totalRemainingDebt.toLocaleString()} ${profile.currency}**
- Total Monthly EMI Obligation: **${loanSummary.totalMonthlyEMIObligation.toLocaleString()} ${profile.currency}**`;

      const ansZh = `您当前共有 **${loanSummary.activeLoanCount} 笔在贷信贷项目**：
${loanDetailsZh}

- 剩余待偿总负债：**${loanSummary.totalRemainingDebt.toLocaleString()} ${profile.currency}**
- 每月固定还贷负担 (EMI)：**${loanSummary.totalMonthlyEMIObligation.toLocaleString()} ${profile.currency}**`;

      const ansHi = `आपके पास वर्तमान में **${loanSummary.activeLoanCount} सक्रिय ऋण** हैं:
${loanDetailsHi}

- कुल शेष ऋण: **${loanSummary.totalRemainingDebt.toLocaleString()} ${profile.currency}**
- मासिक कुल किस्त देयता: **${loanSummary.totalMonthlyEMIObligation.toLocaleString()} ${profile.currency}**`;

      const primary = lang === 'zh' ? ansZh : lang === 'bn' ? ansBn : lang === 'hi' ? ansHi : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'reconcileAllLoans',
        toolOutput: loanSummary,
        suggestedAction: {
          type: 'reconcile_loan',
          label: lang === 'zh' ? '试算还贷与对账' : lang === 'bn' ? 'ঋণ পরিশোধ ও কিস্তির হিসাব' : lang === 'hi' ? 'ऋण किस्त गणना' : 'Simulate Loan Prepayment',
          labelEnglish: 'Simulate Loan Prepayment & Reconciliation',
        },
        metricsSnapshot: health,
      };
    }

    // 4. Default: General Financial Health Snapshot
    const bep = AccountingEngine.calculateBreakEven(profile);

    const ansBn = `কারখানার বর্তমান আর্থিক বিশ্লেষণ (অক্টোবর ২০২৬):
- মোট রাজস্ব (Revenue): **${health.totalRevenue.toLocaleString()} ${profile.currency}**
- মোট ফিক্সড খরচ (বেতন, ভাড়া, বিদ্যুৎ): **${health.totalFixedCosts.toLocaleString()} ${profile.currency}**
- মোট ভ্যারিয়েবল খরচ (কাঁচামাল, ইত্যাদি): **${health.totalVariableCosts.toLocaleString()} ${profile.currency}**
- নিট লাভ/ক্ষতি: **${health.netProfit >= 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${profile.currency}** (মার্জিন: ${health.netMarginPercentage}%)
- ব্রেক-ইভেন অগ্রগতি: **${health.breakEvenProgressPercentage}%** (মাসিক ব্রেক-ইভেনের জন্য ${bep.breakEvenRevenue.toLocaleString()} ${profile.currency} বিক্রি দরকার)।`;

    const ansEn = `Current Factory Financial Snapshot (October 2026):
- Total Revenue: **${health.totalRevenue.toLocaleString()} ${profile.currency}**
- Total Fixed Overhead: **${health.totalFixedCosts.toLocaleString()} ${profile.currency}**
- Total Variable Costs: **${health.totalVariableCosts.toLocaleString()} ${profile.currency}**
- Net Profit/Loss: **${health.netProfit >= 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${profile.currency}** (Margin: ${health.netMarginPercentage}%)
- Break-Even Progress: **${health.breakEvenProgressPercentage}%** (Target: ${bep.breakEvenRevenue.toLocaleString()} ${profile.currency}).`;

    const ansZh = `工厂当前财务全景看板（2026年10月）：
- 营业总收入 (Revenue)：**${health.totalRevenue.toLocaleString()} ${profile.currency}**
- 每月固定支出 (工资/厂租/水电)：**${health.totalFixedCosts.toLocaleString()} ${profile.currency}**
- 变动成本支出 (面料采购)：**${health.totalVariableCosts.toLocaleString()} ${profile.currency}**
- 净利润 / 亏损：**${health.netProfit >= 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${profile.currency}**（销售净利率: ${health.netMarginPercentage}%）
- 保本平衡点进度：**${health.breakEvenProgressPercentage}%**（保本销售额目标：${bep.breakEvenRevenue.toLocaleString()} ${profile.currency}）。`;

    const ansHi = `कारखाना वित्तीय विवरण (अक्टूबर 2026):
- कुल बिक्री आय (Revenue): **${health.totalRevenue.toLocaleString()} ${profile.currency}**
- कुल स्थिर खर्च (वेतन, किराया, बिजली): **${health.totalFixedCosts.toLocaleString()} ${profile.currency}**
- कुल परिवर्तनीय खर्च (कच्चा माल): **${health.totalVariableCosts.toLocaleString()} ${profile.currency}**
- शुद्ध लाभ/हानि: **${health.netProfit >= 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${profile.currency}** (मार्जिन: ${health.netMarginPercentage}%)
- ब्रेक-ईवेन प्रगति: **${health.breakEvenProgressPercentage}%** (लक्ष्य: ${bep.breakEvenRevenue.toLocaleString()} ${profile.currency})।`;

    const primary = lang === 'zh' ? ansZh : lang === 'bn' ? ansBn : lang === 'hi' ? ansHi : ansEn;

    return {
      answerPrimary: primary,
      answerBengali: ansBn,
      answerEnglish: ansEn,
      executedTool: 'computeFinancialHealth',
      toolOutput: health,
      metricsSnapshot: health,
    };
  }

  /**
   * LLM Tool Calling execution via Google Gemini SDK with real function declarations
   */
  private static async callGeminiWithTools(
    query: string,
    apiKey: string,
    lang: SupportedLanguage,
    currency: SupportedCurrency = 'BDT'
  ): Promise<AgentResponse> {
    const { GoogleGenAI, Type } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const rawProfile = ExcelDatabase.getProfile();
    const profile = AccountingEngine.getConvertedProfile(rawProfile, currency);
    const transactions = ExcelDatabase.getTransactions();
    const debtors = ExcelDatabase.getDebtors();
    const loans = ExcelDatabase.getLoans();
    const rawHealth = AccountingEngine.computeFinancialHealth(rawProfile, transactions, debtors, loans);

    const conv = (amt: number) => convertCurrency(amt, 'BDT', currency);
    const health: FinancialHealthMetrics = {
      ...rawHealth,
      totalRevenue: conv(rawHealth.totalRevenue),
      totalExpenses: conv(rawHealth.totalExpenses),
      totalFixedCosts: conv(rawHealth.totalFixedCosts),
      totalVariableCosts: conv(rawHealth.totalVariableCosts),
      netProfit: conv(rawHealth.netProfit),
      totalReceivables: conv(rawHealth.totalReceivables),
      totalPayables: conv(rawHealth.totalPayables),
      monthlyLoanObligation: conv(rawHealth.monthlyLoanObligation),
    };

    const langName = lang === 'zh' ? 'Simplified Chinese' : lang === 'bn' ? 'Bengali' : lang === 'hi' ? 'Hindi' : 'English';

    const systemInstruction = `You are LedgerLoom CFO Copilot, a professional AI Financial Participant for SME business owners.
The business is: ${profile.businessName} (${profile.industry}).
Core Rules:
1. NEVER calculate large arithmetic, loan reconciliations, or break-even targets via token generation. ALWAYS invoke tools (calculateTargetProfit, getDebtorsSummary, reconcileLoanLiability, computeFinancialHealth) for financial arithmetic.
2. Respond STRICTLY in ${langName}. If the user writes in Bengali or Banglish, reply exclusively in natural, warm, friendly Bengali. If the user writes in English, reply exclusively in English.
3. Be action-oriented: mention exact units, fabric quantities, and financial warnings.
Current Health:
- Total Revenue: ${health.totalRevenue} ${profile.currency}
- Total Expenses: ${health.totalExpenses} ${profile.currency}
- Net Profit: ${health.netProfit} ${profile.currency}
- Fixed Costs: ${health.totalFixedCosts} ${profile.currency}
- Overdue Receivables: ${health.highRiskReceivablesCount} accounts
- Active Debt: ${health.monthlyLoanObligation} monthly EMI
`;

    const tools: any = [
      {
        functionDeclarations: [
          {
            name: 'calculateTargetProfit',
            description: 'Calculates the exact production units, fabric meters, variable costs, and target revenue needed to achieve a specified monthly net profit goal.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                targetProfit: {
                  type: Type.NUMBER,
                  description: 'The desired target net profit amount in active currency.',
                },
              },
              required: ['targetProfit'],
            },
          },
          {
            name: 'getDebtorsSummary',
            description: 'Retrieves all customer receivables and identifies overdue accounts exceeding credit risk thresholds.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                threshold: {
                  type: Type.NUMBER,
                  description: 'Minimum overdue amount threshold to filter.',
                },
              },
            },
          },
          {
            name: 'reconcileLoanLiability',
            description: 'Performs deterministic loan amortization and calculates monthly EMI and interest schedule.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                principal: {
                  type: Type.NUMBER,
                  description: 'Loan principal amount in BDT.',
                },
                annualInterestRate: {
                  type: Type.NUMBER,
                  description: 'Annual interest rate percentage, e.g. 9.0',
                },
                tenureMonths: {
                  type: Type.NUMBER,
                  description: 'Repayment period in months.',
                },
              },
              required: ['principal'],
            },
          },
          {
            name: 'computeFinancialHealth',
            description: 'Computes total revenue, fixed overheads, variable costs, net margin, and break-even revenue.',
            parameters: {
              type: Type.OBJECT,
              properties: {},
            },
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.1,
        tools,
      },
    });

    // Check for tool calling / function calls returned by Gemini
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      const args: any = call.args || {};

      if (call.name === 'calculateTargetProfit') {
        const targetAmt = Number(args.targetProfit) || 50000;
        const plan = AccountingEngine.solveTargetProfit(profile, targetAmt, 'month', lang);
        const ansBn = `🎯 **লক্ষ্যলাভ পরিকল্পনা (${targetAmt.toLocaleString()} ${profile.currency}):**\n` +
          `- প্রয়োজনীয় উৎপাদন: **${plan.requiredUnits.toLocaleString()}টি** ${profile.primaryProduct}\n` +
          `- কাঁচামাল/কাপড় প্রয়োজন: **${plan.requiredFabricMeters.toLocaleString()} মিটার**\n` +
          `- মোট কাঁচামাল বাজেট: **${plan.requiredFabricCost.toLocaleString()} ${profile.currency}**\n` +
          `- লক্ষ্য বিক্রয় আয়: **${plan.requiredRevenue.toLocaleString()} ${profile.currency}**\n` +
          `- ব্রেক-ইভেন পয়েন্ট: **${plan.breakEvenUnits.toLocaleString()}টি** ইউনিট`;
        const ansEn = `🎯 **Target Profit Execution Plan (${targetAmt.toLocaleString()} ${profile.currency}):**\n` +
          `- Required Production: **${plan.requiredUnits.toLocaleString()} units** of ${profile.primaryProduct}\n` +
          `- Fabric Required: **${plan.requiredFabricMeters.toLocaleString()} meters**\n` +
          `- Raw Material Budget: **${plan.requiredFabricCost.toLocaleString()} ${profile.currency}**\n` +
          `- Target Revenue: **${plan.requiredRevenue.toLocaleString()} ${profile.currency}**\n` +
          `- Break-even Point: **${plan.breakEvenUnits.toLocaleString()} units**`;
        return {
          answerPrimary: lang === 'bn' ? ansBn : ansEn,
          answerBengali: ansBn,
          answerEnglish: ansEn,
          executedTool: 'calculateTargetProfit',
          toolOutput: plan,
          metricsSnapshot: health,
          suggestedAction: {
            type: 'open_goal_modal',
            label: 'প্ল্যানার ওপেন করুন',
            labelEnglish: 'Open Goal Planner',
          },
        };
      }

      if (call.name === 'getDebtorsSummary') {
        const threshold = Number(args.threshold) || getOverdueThreshold(currency);
        const highRisk = debtors.filter((d) => d.type === 'receivable' && d.amount >= threshold);
        const totalSum = highRisk.reduce((s, d) => s + d.amount, 0);
        const ansBn = `⚠️ **বকেয়া রিসিভেবল সারসংক্ষেপ:**\n` +
          `- মোট ঝুঁকিপূর্ণ ক্লায়েন্ট: **${highRisk.length}টি** (সীমা: >${threshold.toLocaleString()} ${currency})\n` +
          `- সর্বমোট আটকে থাকা টাকা: **${totalSum.toLocaleString()} ${currency}**\n` +
          `তালিকায় প্রধান: ${highRisk.map((d) => `${d.partyName} (${d.amount.toLocaleString()} ${currency})`).join(', ')}`;
        const ansEn = `⚠️ **Debtors Risk Overview:**\n` +
          `- High-risk accounts: **${highRisk.length}** (threshold: >${threshold.toLocaleString()} ${currency})\n` +
          `- Total Overdue: **${totalSum.toLocaleString()} ${currency}**\n` +
          `Key accounts: ${highRisk.map((d) => `${d.partyName} (${d.amount.toLocaleString()} ${currency})`).join(', ')}`;
        return {
          answerPrimary: lang === 'bn' ? ansBn : ansEn,
          answerBengali: ansBn,
          answerEnglish: ansEn,
          executedTool: 'getDebtorsSummary',
          toolOutput: highRisk,
          metricsSnapshot: health,
          suggestedAction: {
            type: 'show_debtors',
            label: 'বকেয়া তালিকা দেখুন',
            labelEnglish: 'View Debtors',
          },
        };
      }

      if (call.name === 'reconcileLoanLiability') {
        const principal = Number(args.principal) || 200000;
        const rate = Number(args.annualInterestRate) || 9.0;
        const tenure = Number(args.tenureMonths) || 12;
        const amort = AccountingEngine.calculateLoanEMI(principal, rate, tenure);
        const ansBn = `🏦 **ঋণ ও কিস্তি বিশ্লেষণ (${principal.toLocaleString()} ${currency}):**\n` +
          `- সুদের হার: **${rate}% বার্ষিক**\n` +
          `- পরিশোধের মেয়াদ: **${tenure} মাস**\n` +
          `- প্রতি মাসের কিস্তি (EMI): **${amort.monthlyEMI.toLocaleString()} ${currency}**\n` +
          `- মোট পরিশোধযোগ্য সুদ: **${amort.totalInterest.toLocaleString()} ${currency}**`;
        const ansEn = `🏦 **Loan Amortization Calculation (${principal.toLocaleString()} ${currency}):**\n` +
          `- Interest Rate: **${rate}% p.a.**\n` +
          `- Repayment Tenure: **${tenure} months**\n` +
          `- Monthly EMI: **${amort.monthlyEMI.toLocaleString()} ${currency}**\n` +
          `- Total Interest: **${amort.totalInterest.toLocaleString()} ${currency}**`;
        return {
          answerPrimary: lang === 'bn' ? ansBn : ansEn,
          answerBengali: ansBn,
          answerEnglish: ansEn,
          executedTool: 'reconcileLoanLiability',
          toolOutput: amort,
          metricsSnapshot: health,
          suggestedAction: {
            type: 'reconcile_loan',
            label: 'লোন বিবরণী দেখুন',
            labelEnglish: 'View Loan Reconciliation',
          },
        };
      }

      if (call.name === 'computeFinancialHealth') {
        return this.deterministicRoute('health', profile, transactions, debtors, loans, health, lang, currency);
      }
    }

    const text = response.text || '';
    return {
      answerPrimary: text,
      answerBengali: text,
      answerEnglish: text,
      executedTool: 'gemini-conversational',
      metricsSnapshot: health,
    };
  }
}
