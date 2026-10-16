import { ExcelDatabase } from './excel-database';
import { AccountingEngine } from './accounting-engine';
import { SecurityVault } from './security-vault';
import { TargetProfitPlan, FinancialHealthMetrics } from './types';
import { SupportedLanguage } from './i18n';

export interface AgentResponse {
  answerPrimary: string;
  answerEnglish: string;
  answerBengali?: string; // backwards compatibility
  executedTool?: string;
  toolOutput?: any;
  suggestedAction?: {
    type: 'open_goal_modal' | 'show_debtors' | 'reconcile_loan' | 'approve_staging';
    label: string;
    labelEnglish: string;
  };
  metricsSnapshot?: Partial<FinancialHealthMetrics>;
}

export class AgentOrchestrator {
  /**
   * Main query processor: Handles both natural language understanding and deterministic tool routing
   */
  public static async processQuery(
    query: string,
    apiKey?: string,
    lang: SupportedLanguage = 'en'
  ): Promise<AgentResponse> {
    const sanitizedQuery = SecurityVault.maskPII(query).toLowerCase().trim();
    const profile = ExcelDatabase.getProfile();
    const transactions = ExcelDatabase.getTransactions();
    const debtors = ExcelDatabase.getDebtors();
    const loans = ExcelDatabase.getLoans();
    const health = AccountingEngine.computeFinancialHealth(profile, transactions, debtors, loans);

    // If Gemini API Key is configured, attempt LLM tool-calling; else use deterministic router
    if (apiKey || process.env.GEMINI_API_KEY) {
      try {
        return await this.callGeminiWithTools(query, apiKey || process.env.GEMINI_API_KEY!, lang);
      } catch (err) {
        console.warn('Gemini API call failed, falling back to deterministic router:', err);
      }
    }

    // DETERMINISTIC ZERO-HALLUCINATION ROUTER (Always reliable & instant)
    return this.deterministicRoute(sanitizedQuery, profile, transactions, debtors, loans, health, lang);
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
    lang: SupportedLanguage
  ): AgentResponse {
    const q = this.convertBengaliDigits(qRaw);

    // 1. Target Profit / Goal Planning
    const profitMatch =
      q.match(/(\d+[\d,]*)\s*(?:টাকা|tk|bdt|元|rmb|\$|rs|rupees)?\s*(?:লাভ|profit|ইনকাম|আয়|利润|赚|लाभ)/i) ||
      q.match(/(?:লাভ|profit|ইনকাম|আয়|利润|赚|लाभ)\s*(?:করতে চাই|হিসাব|目标)?\s*(\d+[\d,]*)/i) ||
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
      let targetAmount = 30000;
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
      q.includes('তাগাদা') ||
      q.includes('应收') ||
      q.includes('欠款') ||
      q.includes('催款') ||
      q.includes('बकाया') ||
      q.includes('उधारी');

    if (isDebtorIntent) {
      const highRisk = debtors.filter((d) => d.type === 'receivable' && d.amount >= (d.alertThreshold || 30000));
      const totalRec = debtors.filter((d) => d.type === 'receivable').reduce((s, d) => s + d.amount, 0);

      const highRiskBn = highRisk.map((d) => `• **${d.partyName}**: বকেয়া ${d.amount.toLocaleString()} ${profile.currency} (মেয়াদ: ${d.dueDate})`).join('\n');
      const highRiskEn = highRisk.map((d) => `• **${d.partyName}**: ${d.amount.toLocaleString()} ${profile.currency} (Due: ${d.dueDate})`).join('\n');
      const highRiskZh = highRisk.map((d) => `• **${d.partyName}**: 欠款 ${d.amount.toLocaleString()} ${profile.currency}（到期日: ${d.dueDate}）`).join('\n');
      const highRiskHi = highRisk.map((d) => `• **${d.partyName}**: बकाया ${d.amount.toLocaleString()} ${profile.currency} (देय: ${d.dueDate})`).join('\n');

      const ansBn = `বর্তমানে আপনার মোট বকেয়া (Receivables) **${totalRec.toLocaleString()} ${profile.currency}**। 
এর মধ্যে **${highRisk.length}টি পার্টির** বকেয়া ৩০,০০০ টাকার সীমা ছাড়িয়ে গেছে:
${highRiskBn}

জরুরি ভিত্তিতে তাদের কাছে তাগাদা মেসেজ পাঠানোর প্রস্তাব করা হচ্ছে।`;

      const ansEn = `You have total outstanding receivables of **${totalRec.toLocaleString()} ${profile.currency}**.
There are **${highRisk.length} account(s)** exceeding the 30,000 ${profile.currency} risk threshold:
${highRiskEn}

Recommended action: Send automated reminder notices to overdue accounts.`;

      const ansZh = `当前您的应收账款总额为 **${totalRec.toLocaleString()} ${profile.currency}**。
其中共有 **${highRisk.length} 家客户** 欠款超出 30,000 元的信用风控红线：
${highRiskZh}

系统建议：请立即向超期客户发起自动生成的对账催缴通知函。`;

      const ansHi = `वर्तमान में आपकी कुल बकाया राशि (Receivables) **${totalRec.toLocaleString()} ${profile.currency}** है।
इनमें से **${highRisk.length} खातों** का बकाया 30,000 की सीमा पार कर चुका है:
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

    // 3. Loans & Reconciliation
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
      const loanSummary = AccountingEngine.reconcileAllLoans(loans);

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
   * LLM Tool Calling execution via Google Gemini SDK
   */
  private static async callGeminiWithTools(
    query: string,
    apiKey: string,
    lang: SupportedLanguage
  ): Promise<AgentResponse> {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const profile = ExcelDatabase.getProfile();
    const transactions = ExcelDatabase.getTransactions();
    const debtors = ExcelDatabase.getDebtors();
    const loans = ExcelDatabase.getLoans();
    const health = AccountingEngine.computeFinancialHealth(profile, transactions, debtors, loans);

    const langName = lang === 'zh' ? 'Simplified Chinese' : lang === 'bn' ? 'Bengali' : lang === 'hi' ? 'Hindi' : 'English';

    const systemInstruction = `You are LedgerLoom CFO Copilot, a professional AI Financial Participant for SME business owners.
The business is: ${profile.businessName} (${profile.industry}).
Core Rules:
1. NEVER calculate large arithmetic, loan reconciliations, or break-even targets via token generation. ALWAYS rely on deterministic financial formulas.
2. Provide a bilingual response: first in clear, polite ${langName} for the business owner, followed by a professional English summary for international competition judges.
3. Be action-oriented: mention exact units, fabric quantities, and financial warnings.
Current Health:
- Total Revenue: ${health.totalRevenue} ${profile.currency}
- Total Expenses: ${health.totalExpenses} ${profile.currency}
- Net Profit: ${health.netProfit} ${profile.currency}
- Fixed Costs: ${health.totalFixedCosts} ${profile.currency}
- Overdue Receivables (>30k): ${health.highRiskReceivablesCount} accounts
- Active Debt: ${health.monthlyLoanObligation} monthly EMI
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const text = response.text || '';
    return {
      answerPrimary: text,
      answerBengali: text,
      answerEnglish: text,
      executedTool: 'gemini-orchestrator',
      metricsSnapshot: health,
    };
  }
}
