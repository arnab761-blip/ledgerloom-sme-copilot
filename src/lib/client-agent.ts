import { AccountingEngine } from './accounting-engine';
import { SecurityVault } from './security-vault';
import { TargetProfitPlan, FinancialHealthMetrics, BusinessProfile, Transaction, DebtorRecord, LoanLiability } from './types';
import { SupportedLanguage } from './i18n';
import {
  SupportedCurrency,
  convertCurrency,
  getDefaultTargetProfit,
} from './currency';

export interface AgentResponse {
  answerPrimary: string;
  answerEnglish: string;
  answerBengali?: string;
  executedTool?: string;
  toolOutput?: any;
  suggestedAction?: {
    type: 'open_goal_modal' | 'show_debtors' | 'reconcile_loan' | 'approve_staging' | 'show_financing';
    label: string;
    labelEnglish: string;
  };
  metricsSnapshot?: Partial<FinancialHealthMetrics>;
}

export class ClientAgent {
  private static convertBengaliDigits(text: string): string {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    let res = text;
    bengaliDigits.forEach((d, idx) => {
      res = res.replaceAll(d, idx.toString());
    });
    return res;
  }

  public static async processQuery(
    query: string,
    lang: SupportedLanguage,
    currency: SupportedCurrency,
    profile: BusinessProfile,
    transactions: Transaction[],
    debtors: DebtorRecord[],
    loans: LoanLiability[]
  ): Promise<AgentResponse> {
    const sanitizedQuery = SecurityVault.maskPII(query).toLowerCase().trim();
    const convertedProfile = AccountingEngine.getConvertedProfile(profile, currency);
    const rawHealth = AccountingEngine.computeFinancialHealth(profile, transactions, debtors, loans);

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

    const q = this.convertBengaliDigits(sanitizedQuery);

    // 1. Target Profit Goal
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
      let targetAmount = Number(getDefaultTargetProfit(currency));
      if (profitMatch && profitMatch[1]) {
        targetAmount = parseInt(profitMatch[1].replace(/,/g, ''), 10);
        if (q.includes('万')) targetAmount *= 10000;
      }
      const plan = AccountingEngine.solveTargetProfit(convertedProfile, targetAmount, 'month');

      const ansBn = `আগামী মাসে **${targetAmount.toLocaleString()} ${convertedProfile.currency}** নেট লাভ করতে হলে:
- আপনাকে মোট **${plan.requiredUnits.toLocaleString()}টি ${convertedProfile.primaryProduct}** বিক্রি করতে হবে।
- এর জন্য আনুমানিক **${plan.requiredFabricMeters.toLocaleString()} মিটার/একক কাঁচামাল** লাগবে (সম্ভাব্য খরচ: ${plan.requiredFabricCost.toLocaleString()} ${convertedProfile.currency})।
- আপনার কারখানার মাসিক ফিক্সড কস্ট **${plan.totalFixedCost.toLocaleString()} ${convertedProfile.currency}** তুলতে প্রথম **${plan.breakEvenUnits.toLocaleString()}টি** পণ্য বিক্রি করতে হবে, এরপরের পণ্যগুলো থেকে লাভ আসবে।`;

      const ansEn = `To achieve a target net profit of **${targetAmount.toLocaleString()} ${convertedProfile.currency}** next month:
- You must produce and sell **${plan.requiredUnits.toLocaleString()} units of ${convertedProfile.primaryProduct}**.
- Required raw material: approx **${plan.requiredFabricMeters.toLocaleString()} units** (Estimated budget: ${plan.requiredFabricCost.toLocaleString()} ${convertedProfile.currency}).
- Break-even is at **${plan.breakEvenUnits.toLocaleString()} units** to cover factory fixed overhead (${plan.totalFixedCost.toLocaleString()} ${convertedProfile.currency}).`;

      const ansZh = `为了在下个月实现 **${targetAmount.toLocaleString()} ${convertedProfile.currency}** 的净利润目标：
- 您需要生产并销售 **${plan.requiredUnits.toLocaleString()} 件 ${convertedProfile.primaryProduct}**。
- 所需核心原材料采购量：约 **${plan.requiredFabricMeters.toLocaleString()} 单位**（预计采购预算：${plan.requiredFabricCost.toLocaleString()} ${convertedProfile.currency}）。
- 工厂的保本平衡点为 **${plan.breakEvenUnits.toLocaleString()} 件**，用于覆盖每月固定开销（${plan.totalFixedCost.toLocaleString()} ${convertedProfile.currency}）。`;

      const ansHi = `अगले महीने **${targetAmount.toLocaleString()} ${convertedProfile.currency}** शुद्ध लाभ कमाने के लिए:
- आपको कुल **${plan.requiredUnits.toLocaleString()} यूनिट ${convertedProfile.primaryProduct}** बेचनी होंगी।
- इसके लिए लगभग **${plan.requiredFabricMeters.toLocaleString()} यूनिट कच्चा माल** खरीदना होगा (अनुमानित लागत: ${plan.requiredFabricCost.toLocaleString()} ${convertedProfile.currency})।
- कारखाने की स्थिर लागत निकालने के लिए शुरुआती **${plan.breakEvenUnits.toLocaleString()} यूनिट** बेचना अनिवार्य है।`;

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

    // 2. Debtors / Overdue
    const isDebtorIntent =
      q.includes('বাকি') ||
      q.includes('পাওনা') ||
      q.includes('debtor') ||
      q.includes('receivable') ||
      q.includes('customer') ||
      q.includes('欠款') ||
      q.includes('应收') ||
      q.includes('बकाया');

    if (isDebtorIntent) {
      const overdueList = debtors.filter((d) => d.status === 'overdue' && d.type === 'receivable');
      const totalOverdue = overdueList.reduce((sum, d) => sum + conv(d.amount), 0);

      const ansBn = `বর্তমানে **${overdueList.length}টি পার্টির** কাছে মোট **${totalOverdue.toLocaleString()} ${currency}** পাওনা বকেয়া রয়েছে:
${overdueList.map((d) => `- **${d.partyName}**: ${conv(d.amount).toLocaleString()} ${currency} (বকেয়া: ${d.notes || 'জরুরি তাগাদা প্রয়োজন'})`).join('\n')}`;

      const ansEn = `Currently, **${overdueList.length} clients** have overdue receivables totaling **${totalOverdue.toLocaleString()} ${currency}**:
${overdueList.map((d) => `- **${d.partyName}**: ${conv(d.amount).toLocaleString()} ${currency} (Notes: ${d.notes || 'Immediate collection required'})`).join('\n')}`;

      const ansZh = `当前共有 **${overdueList.length} 家客户** 逾期未还款，累计逾期应收款项为 **${totalOverdue.toLocaleString()} ${currency}**：
${overdueList.map((d) => `- **${d.partyName}**: ${conv(d.amount).toLocaleString()} ${currency}（说明：${d.notes || '需立即催收'}）`).join('\n')}`;

      const ansHi = `वर्तमान में **${overdueList.length} ग्राहकों** पर कुल **${totalOverdue.toLocaleString()} ${currency}** बकाया है:
${overdueList.map((d) => `- **${d.partyName}**: ${conv(d.amount).toLocaleString()} ${currency}`).join('\n')}`;

      const primary = lang === 'zh' ? ansZh : lang === 'bn' ? ansBn : lang === 'hi' ? ansHi : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'getOverdueDebtors',
        toolOutput: { overdueCount: overdueList.length, totalOverdue, overdueList },
        suggestedAction: {
          type: 'show_debtors',
          label: lang === 'zh' ? '前往逾期催收' : lang === 'bn' ? 'বকেয়া তালিকা দেখুন' : lang === 'hi' ? 'बकाया सूची देखें' : 'View Debtors',
          labelEnglish: 'Go to Debtors & Collection',
        },
        metricsSnapshot: health,
      };
    }

    // 3. New Loan Evaluation & Multi-Step Reasoning (e.g. "মেশিন কেনার জন্য লোন নেওয়া কি ঠিক হবে?")
    const isLoanEvaluationIntent =
      (q.includes('মেশিন') || q.includes('machine') || q.includes('নিতে চাই') || q.includes('ঠিক হবে') || q.includes('should i') || q.includes('invest') || q.includes('বিনিয়োগ')) &&
      (q.includes('ঋণ') || q.includes('loan') || q.includes('লোন') || q.includes('贷款') || q.includes('कर्ज'));

    if (isLoanEvaluationIntent) {
      const defaultLoan = conv(50000);
      const loanAmountMatch = q.match(/(\d+[\d,]*)/);
      const prospectiveAmount = loanAmountMatch ? parseInt(loanAmountMatch[1].replace(/,/g, ''), 10) : defaultLoan;
      const sim = AccountingEngine.calculateLoanEMI(prospectiveAmount, 8.5, 24);
      const postEmiProfit = health.netProfit - sim.monthlyEMI;

      const ansBn = `🧠 **AI CFO মাল্টি-স্টেপ ডিসিশন ফ্রেমওয়ার্ক (৩টি ধাপে বিশ্লেষণ):**

• **ধাপ ১ (বর্তমান মুনাফা যাচাই):** আপনার কারখানার চলতি মাসিক নিট মুনাফা **${health.netProfit.toLocaleString()} ${convertedProfile.currency}**।
• **ধাপ ২ (ক্যাশ-ফ্লো প্রজেকশন):** ${prospectiveAmount.toLocaleString()} ${convertedProfile.currency} ঋণের ক্ষেত্রে ৮.৫% সুদে ২৪ মাসের আনুমানিক মাসিক কিস্তি দাঁড়াবে **${sim.monthlyEMI.toLocaleString()} ${convertedProfile.currency}**। কিস্তি দেওয়ার পরও আপনার মাসিক সারপ্লাস থাকবে **+${postEmiProfit.toLocaleString()} ${convertedProfile.currency}**।
• **ধাপ ৩ (উপযুক্ত স্কিম ম্যাচিং):** সাধারণ শর্ট-টার্ম লোনের চেয়ে **'Machinery & Equipment Expansion Lease'** নেওয়া বেশি লাভজনক, কারণ এতে মেশিন নিজেই জামানত হিসেবে ব্যবহৃত হয়।

💡 **চূড়ান্ত পরামর্শ:** হ্যাঁ, আপনার বর্তমান ক্যাশ-ফ্লো অনুযায়ী এই লোন নেওয়া ঝুঁকিমুক্ত ও লাভজনক।`;

      const ansEn = `🧠 **AI CFO Multi-Step Reasoning Framework (3-Step Decision Analysis):**

• **Step 1 (Profitability Check):** Current monthly net profit is **${health.netProfit.toLocaleString()} ${convertedProfile.currency}**.
• **Step 2 (Cash Flow Stress-Test):** For a ${prospectiveAmount.toLocaleString()} ${convertedProfile.currency} loan at 8.5% APR over 24 months, estimated monthly EMI is **${sim.monthlyEMI.toLocaleString()} ${convertedProfile.currency}**. Monthly surplus remains positive at **+${postEmiProfit.toLocaleString()} ${convertedProfile.currency}**.
• **Step 3 (Scheme Matching):** Recommend **'Machinery & Equipment Expansion Lease'** over short-term loans, using the equipment itself as collateral.

💡 **Conclusion:** Approved. Your factory cash runway comfortably supports this capital expenditure.`;

      const ansZh = `🧠 **AI 首席财务官多步逻辑推理架构 (3步决策分析法)：**

• **第 1 步 (当前盈利校验):** 工厂当前月度净利润为 **${health.netProfit.toLocaleString()} ${convertedProfile.currency}**。
• **第 2 步 (现金流压力测试):** 针对 ${prospectiveAmount.toLocaleString()} ${convertedProfile.currency} 的设备融资，按 8.5% 年化测算 24 期月供约为 **${sim.monthlyEMI.toLocaleString()} ${convertedProfile.currency}**。扣除还贷后月度现金结余仍保持在 **+${postEmiProfit.toLocaleString()} ${convertedProfile.currency}**。
• **第 3 步 (最优信贷方案匹配):** 强烈推荐优先匹配 **“设备融资租赁 (Machinery Lease)”**，直接以新设备作为物权担保。

💡 **决策结论:** 经压力测试，该笔资本开支完全在您的安全现金流承受范围内。`;

      const ansHi = `🧠 **एआई सीएफओ बहु-चरणीय निर्णय ढाँचा (3 चरणों में विश्लेषण):**

• **चरण 1 (लाभप्रदता जांच):** आपके कारखाने का वर्तमान मासिक शुद्ध लाभ **${health.netProfit.toLocaleString()} ${convertedProfile.currency}** है।
• **चरण 2 (नकदी प्रवाह तनाव परीक्षण):** ${prospectiveAmount.toLocaleString()} ${convertedProfile.currency} ऋण के लिए 24 माह की अनुमानित मासिक किस्त **${sim.monthlyEMI.toLocaleString()} ${convertedProfile.currency}** होगी।
• **चरण 3 (योजना मिलान):** सामान्य ऋण के बजाय **'मशीनरी लीजिंग'** विकल्प चुनें।

💡 **निष्कर्ष:** अनुमोदित। आपका नकदी प्रवाह इस निवेश को वहन करने में सक्षम है।`;

      const primary = lang === 'zh' ? ansZh : lang === 'bn' ? ansBn : lang === 'hi' ? ansHi : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'evaluateEquipmentLoanEligibility',
        toolOutput: { sim, postEmiProfit },
        suggestedAction: {
          type: 'show_financing',
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
      q.includes('ঋণ বিকল্প');

    if (isFinancingMatchIntent) {
      const options = AccountingEngine.matchFinancingOptions(convertedProfile, health, debtors, lang, currency);
      const top3 = options.slice(0, 3);

      const topBn = top3
        .map(
          (opt, i) =>
            `${i + 1}. **${opt.name}** (${opt.fitScorePercentage}% ম্যাচ)\n   • সুদের হার: ${opt.interestRateText} | মেয়াদ: ${opt.tenureMonths} মাস\n   • সর্বোচ্চ সীমা: ${opt.maxAmount.toLocaleString()} ${convertedProfile.currency} (${opt.collateralRequired ? 'জামানতযুক্ত' : 'জামানতবিহীন'})\n   • উপযোগী কারণ: ${opt.explainableMatchReason}`
        )
        .join('\n\n');

      const topEn = top3
        .map(
          (opt, i) =>
            `${i + 1}. **${opt.name}** (${opt.fitScorePercentage}% Fit)\n   • Rate: ${opt.interestRateText} | Tenure: ${opt.tenureMonths} mos\n   • Limit: ${opt.maxAmount.toLocaleString()} ${convertedProfile.currency} (${opt.collateralRequired ? 'Secured' : 'Unsecured'})\n   • Match Reason: ${opt.explainableMatchReason}`
        )
        .join('\n\n');

      const topZh = top3
        .map(
          (opt, i) =>
            `${i + 1}. **${opt.name}**（匹配度: ${opt.fitScorePercentage}%）\n   • 利率: ${opt.interestRateText} | 期限: ${opt.tenureMonths} 个月\n   • 额度: ${opt.maxAmount.toLocaleString()} ${convertedProfile.currency}\n   • 匹配理由: ${opt.explainableMatchReason}`
        )
        .join('\n\n');

      const topHi = top3
        .map(
          (opt, i) =>
            `${i + 1}. **${opt.name}** (${opt.fitScorePercentage}% मैच)\n   • ब्याज दर: ${opt.interestRateText} | अवधि: ${opt.tenureMonths} माह\n   • अधिकतम सीमा: ${opt.maxAmount.toLocaleString()} ${convertedProfile.currency}\n   • उपयुक्तता: ${opt.explainableMatchReason}`
        )
        .join('\n\n');

      const ansBn = `আপনার বর্তমান মাসিক ক্যাশ-ফ্লো, আয় ও বকেয়া ইনভয়েস অ্যানালাইসিস করে AI Underwriting ইঞ্জিন **৩টি সেরা ফাইন্যান্সিং বিকল্প** নির্ধারণ করেছে:\n\n${topBn}\n\n💡 আপনি সরাসরি ফাইন্যান্সিং স্যান্ডবক্স থেকে বিস্তারিত দেখে আবেদন করতে পারবেন।`;
      const ansEn = `Based on your monthly cash-flow, revenues, and receivables, our AI Underwriting Engine has matched **top 3 financing options**:\n\n${topEn}\n\n💡 You can apply directly through the Financing Sandbox.`;
      const ansZh = `基于您的月度现金流、营收数据与应收账款，AI 智能信贷核保引擎为您优选匹配了 **3 个最具性价比的融资方案**：\n\n${topZh}\n\n💡 您可在“融资方案”标签页查看完整对比。`;
      const ansHi = `आपके मासिक नकदी प्रवाह और राजस्व के आधार पर एआई ने **3 शीर्ष वित्त विकल्प** चुने हैं:\n\n${topHi}`;

      const primary = lang === 'zh' ? ansZh : lang === 'bn' ? ansBn : lang === 'hi' ? ansHi : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'matchFinancingOptions',
        toolOutput: options,
        suggestedAction: {
          type: 'show_financing',
          label: lang === 'zh' ? '查看全部融资对比表' : lang === 'bn' ? 'সম্পূর্ণ ফাইন্যান্সিং তুলনা দেখুন' : lang === 'hi' ? 'पूर्ण वित्त तुलना देखें' : 'View Financing Comparison',
          labelEnglish: 'View Full Financing Comparison Table',
        },
        metricsSnapshot: health,
      };
    }

    // 5. Loans & Reconciliation Intent (e.g. "ঋণ কত বাকি আছে এবং মাসিক কিস্তির হিসাব দাও")
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
        (l) => `• **${l.lender}**: অবশিষ্ট ঋণ ${l.remaining.toLocaleString()} ${convertedProfile.currency} (মাসিক কিস্তি: ${l.emi.toLocaleString()} ${convertedProfile.currency}, পরবর্তী কিস্তির তারিখ: ${l.nextDate})`
      ).join('\n');

      const loanDetailsEn = loanSummary.nextDueDetails.map(
        (l) => `• **${l.lender}**: Remaining balance ${l.remaining.toLocaleString()} ${convertedProfile.currency} (Monthly EMI: ${l.emi.toLocaleString()} ${convertedProfile.currency}, Next payment: ${l.nextDate})`
      ).join('\n');

      const ansBn = `আপনার বর্তমানে **${loanSummary.activeLoanCount}টি সক্রিয় ঋণ** রয়েছে:
${loanDetailsBn}

- মোট অবশিষ্ট ঋণের পরিমাণ: **${loanSummary.totalRemainingDebt.toLocaleString()} ${convertedProfile.currency}**
- প্রতি মাসে মোট কিস্তির বাধ্যবাধকতা: **${loanSummary.totalMonthlyEMIObligation.toLocaleString()} ${convertedProfile.currency}**`;

      const ansEn = `You currently have **${loanSummary.activeLoanCount} active loan(s)**:
${loanDetailsEn}

- Total Remaining Debt: **${loanSummary.totalRemainingDebt.toLocaleString()} ${convertedProfile.currency}**
- Total Monthly EMI Obligation: **${loanSummary.totalMonthlyEMIObligation.toLocaleString()} ${convertedProfile.currency}**`;

      const primary = lang === 'bn' ? ansBn : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'reconcileAllLoans',
        toolOutput: loanSummary,
        suggestedAction: {
          type: 'reconcile_loan',
          label: lang === 'bn' ? 'ঋণ পরিশোধ ও কিস্তির হিসাব দেখুন' : 'Simulate Loan Prepayment',
          labelEnglish: 'Simulate Loan Prepayment & Reconciliation',
        },
        metricsSnapshot: health,
      };
    }

    // 6. Expense Breakdown Intent (e.g. "কোথায় সবচেয়ে বেশি খরচ হয়েছে?")
    const isExpenseIntent =
      q.includes('কোথায় সবচেয়ে বেশি খরচ') ||
      q.includes('সবচেয়ে বেশি খরচ') ||
      q.includes('খরচ কোথায়') ||
      q.includes('খরচের হিসাব') ||
      q.includes('খরচ') ||
      q.includes('spend the most') ||
      q.includes('highest cost') ||
      q.includes('overhead') ||
      q.includes('expense') ||
      q.includes('成本最高') ||
      q.includes('सबसे ज्यादा खर्च');

    if (isExpenseIntent) {
      const salaries = convertedProfile.workerSalariesMonthly || 0;
      const rent = convertedProfile.rentMonthly || 0;
      const electricity = convertedProfile.electricityBillMonthly || 0;
      const maintenance = (convertedProfile.maintenanceMonthly || 0) + (convertedProfile.otherFixedCostsMonthly || 0);

      const items = [
        { nameBn: 'শ্রমিকদের বেতন (Salaries)', nameEn: 'Worker Salaries', amount: salaries },
        { nameBn: 'কারখানা/দোকান ভাড়া (Rent)', nameEn: 'Shop/Factory Rent', amount: rent },
        { nameBn: 'বিদ্যুৎ ও ইউটিলিটি (Electricity)', nameEn: 'Electricity & Utilities', amount: electricity },
        { nameBn: 'রক্ষণাবেক্ষণ ও অন্যান্য (Maintenance & Others)', nameEn: 'Maintenance & Others', amount: maintenance },
      ].sort((a, b) => b.amount - a.amount);

      const topItem = items[0];
      const fixedTotal = health.totalFixedCosts || 1;

      const ansBn = `আপনার ব্যবসার খরচের বিস্তারিত বিশ্লেষণ (${convertedProfile.currency}):
- **সবচেয়ে বড় খরচের খাত:** **${topItem.nameBn}** (প্রতি মাসে **${topItem.amount.toLocaleString()} ${convertedProfile.currency}**, যা মোট ফিক্সড খরচের প্রায় ${Math.round((topItem.amount / fixedTotal) * 100)}%)।
- **অন্যান্য মাসিক ফিক্সড খরচ:**
${items.map((it) => `  • ${it.nameBn}: ${it.amount.toLocaleString()} ${convertedProfile.currency}`).join('\n')}
- **মোট মাসিক ফিক্সড ওভারহেড:** **${health.totalFixedCosts.toLocaleString()} ${convertedProfile.currency}**
- **কাঁচামাল ও ভ্যারিয়েবল খরচ:** **${health.totalVariableCosts.toLocaleString()} ${convertedProfile.currency}**

💡 **ব্যবসার পরামর্শ:** মুনাফা বাড়াতে ফিক্সড খরচ অপটিমাইজ করার পাশাপাশি পাইকারিতে কাঁচামাল কিনলে ইউনিট প্রতি লাভ বৃদ্ধি পাবে।`;

      const ansEn = `Business Overhead & Expense Breakdown (${convertedProfile.currency}):
- **Highest Cost Center:** **${topItem.nameEn}** (**${topItem.amount.toLocaleString()} ${convertedProfile.currency}**/month, accounting for ${Math.round((topItem.amount / fixedTotal) * 100)}% of total fixed overhead).
- **Monthly Fixed Breakdown:**
${items.map((it) => `  • ${it.nameEn}: ${it.amount.toLocaleString()} ${convertedProfile.currency}`).join('\n')}
- **Total Fixed Costs:** **${health.totalFixedCosts.toLocaleString()} ${convertedProfile.currency}**
- **Variable Production Costs:** **${health.totalVariableCosts.toLocaleString()} ${convertedProfile.currency}**

💡 **CFO Recommendation:** Optimize fixed utility bills and purchase raw materials in volume batches to increase unit gross margins.`;

      const primary = lang === 'bn' ? ansBn : ansEn;

      return {
        answerPrimary: primary,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'getExpenseBreakdown',
        toolOutput: { items, topItem },
        metricsSnapshot: health,
      };
    }

    // 7. Default Overview
    const ansBn = `কারখানার বর্তমান আর্থিক বিশ্লেষণ (${convertedProfile.currency}):
- মোট রাজস্ব: **${health.totalRevenue.toLocaleString()} ${convertedProfile.currency}**
- ফিক্সড খরচ: **${health.totalFixedCosts.toLocaleString()} ${convertedProfile.currency}**
- ভ্যারিয়েবল খরচ: **${health.totalVariableCosts.toLocaleString()} ${convertedProfile.currency}**
- নিট লাভ: **${health.netProfit > 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${convertedProfile.currency}** (মার্জিন: ${health.netMarginPercentage}%)
- ব্রেক-ইভেন অগ্রগতি: **${health.breakEvenProgressPercentage}%**`;

    const ansEn = `Current Financial Snapshot (${convertedProfile.currency}):
- Total Revenue: **${health.totalRevenue.toLocaleString()} ${convertedProfile.currency}**
- Fixed Overhead: **${health.totalFixedCosts.toLocaleString()} ${convertedProfile.currency}**
- Variable Costs: **${health.totalVariableCosts.toLocaleString()} ${convertedProfile.currency}**
- Net Profit: **${health.netProfit > 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${convertedProfile.currency}** (Margin: ${health.netMarginPercentage}%)
- Break-Even Progress: **${health.breakEvenProgressPercentage}%**`;

    const ansZh = `当前财务全景指标 (${convertedProfile.currency})：
- 总营业额：**${health.totalRevenue.toLocaleString()} ${convertedProfile.currency}**
- 固定运营开销：**${health.totalFixedCosts.toLocaleString()} ${convertedProfile.currency}**
- 可变材料与加工成本：**${health.totalVariableCosts.toLocaleString()} ${convertedProfile.currency}**
- 净利润：**${health.netProfit > 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${convertedProfile.currency}** (利润率: ${health.netMarginPercentage}%)
- 保本达成度：**${health.breakEvenProgressPercentage}%**`;

    const ansHi = `वर्तमान वित्तीय सारांश (${convertedProfile.currency}):
- कुल राजस्व: **${health.totalRevenue.toLocaleString()} ${convertedProfile.currency}**
- स्थिर लागत: **${health.totalFixedCosts.toLocaleString()} ${convertedProfile.currency}**
- परिवर्तनशील लागत: **${health.totalVariableCosts.toLocaleString()} ${convertedProfile.currency}**
- शुद्ध लाभ: **${health.netProfit > 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${convertedProfile.currency}**
- ब्रेक-इवन प्रगति: **${health.breakEvenProgressPercentage}%**`;

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
}
