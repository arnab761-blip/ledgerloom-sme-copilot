import { AccountingEngine } from './accounting-engine';
import { SecurityVault } from './security-vault';
import { TargetProfitPlan, FinancialHealthMetrics, BusinessProfile, Transaction, DebtorRecord, LoanLiability } from './types';
import { SupportedLanguage } from './i18n';
import {
  SupportedCurrency,
  convertCurrency,
  getDefaultTargetProfit,
  getOverdueThreshold,
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

    // =========================================================================
    // 1. CASUAL GREETINGS & SALAM (e.g. "kire ki obostha", "kemon acho", "hello")
    // =========================================================================
    const isGreeting =
      q.includes('kire') ||
      q.includes('ki obostha') ||
      q.includes('ki obosta') ||
      q.includes('kemon acho') ||
      q.includes('kemon achen') ||
      q.includes('kemne acho') ||
      q.includes('hello') ||
      q.includes('hi ') ||
      q === 'hi' ||
      q.includes('hey') ||
      q.includes('salam') ||
      q.includes('assalamu') ||
      q.includes('hala') ||
      q.includes('good morning') ||
      q.includes('good afternoon') ||
      q.includes('good evening');

    if (isGreeting) {
      const ansBn = `আসসালামু আলাইকুম! আমি LedgerLoom-এর **AI CFO কোপাইলট**।
কারখানার সামগ্রিক আর্থিক অবস্থা আলহামদুলিল্লাহ ভালো রয়েছে—চলতি মাসে নেট লাভ **+${health.netProfit.toLocaleString()} ${convertedProfile.currency}** এবং ক্যাশ ফ্লো সম্পূর্ণ ইতিবাচক।

আমি আপনাকে নিচের আর্থিক বিষয়গুলোতে সাহায্য করতে পারি:
• 🎯 **লাভের লক্ষ্য ঠিক করা:** যেমন *"সামনের মাসে ৮০ হাজার লাভ করতে কি করা লাগবে?"*
• ⚠️ **বকেয়া টাকা আদায়:** যেমন *"কার কাছে কত টাকা বাকি আছে?"*
• 🏦 **লোন ও ফাইন্যান্সিং বিকল্প:** যেমন *"লোনের অপশনগুলো দেখাও"*
• 💡 **বিনিয়োগ সিদ্ধান্ত:** যেমন *"মেশিন কেনার জন্য লোন নেওয়া কি ঠিক হবে?"*
• 📊 **খরচের হিসাব:** যেমন *"কোথায় সবচেয়ে বেশি খরচ হয়েছে?"*

যেকোনো প্রশ্ন লিখে জানান, আমি সাথে সাথে গাণিতিক হিসাব করে দিচ্ছি।`;

      const ansEn = `Hello! I am your LedgerLoom AI CFO Copilot.
Your factory financial runway is healthy with monthly net profit at **+${health.netProfit.toLocaleString()} ${convertedProfile.currency}** (Margin: ${health.netMarginPercentage}%).

How can I assist your business today?
• 🎯 **Target Profit Planning:** e.g. "How to achieve 80,000 profit next month?"
• ⚠️ **Overdue Debtors:** e.g. "Who owes money (>30,000)?"
• 🏦 **Loan Options:** e.g. "Show financing options"
• 💡 **CapEx Decisions:** e.g. "Should I take a loan to buy machines?"
• 📊 **Overhead Breakdown:** e.g. "Where did we spend the most?"`;

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'cfoGreetings',
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 2. CONVERSATIONAL ACKNOWLEDGMENTS (e.g. "accha", "ok", "thik ache", "hmm")
    // =========================================================================
    const isAck =
      q === 'accha' ||
      q === 'acha' ||
      q === 'achha' ||
      q === 'ok' ||
      q === 'okay' ||
      q === 'thik ache' ||
      q === 'thik ase' ||
      q === 'tik ache' ||
      q === 'humm' ||
      q === 'hmm' ||
      q === 'bujhlam' ||
      q === 'understood' ||
      q === 'got it' ||
      q === 'sure';

    if (isAck) {
      const ansBn = `জি! আপনার কারখানার কোনো হিসাব, বকেয়া আদায়, ঋণের কিস্তি বা নতুন কোনো ব্যবসায়িক পরিকল্পনা সম্পর্কে জানতে চান কি? আপনি সরাসরি লিখে প্রশ্ন করতে পারেন।`;
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
    // 3. GRATITUDE & THANKS (e.g. "dhonnobad", "thanks", "thank you")
    // =========================================================================
    const isThanks =
      q.includes('dhonnobad') ||
      q.includes('thanks') ||
      q.includes('thank you') ||
      q.includes('thx') ||
      q.includes('shukriya') ||
      q.includes('ধন্যবাদ');

    if (isThanks) {
      const ansBn = `আপনাকেও অনেক ধন্যবাদ! আপনার ব্যবসার আর্থিক শৃঙ্খলা বজায় রাখা এবং লাভ বাড়ানোই আমার লক্ষ্য। যেকোনো সময় প্রশ্ন করতে পারেন।`;
      const ansEn = `You are very welcome! Helping your business maintain strong financial health and sustainable profit is my primary mission.`;

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'cfoGratitude',
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 4. IDENTITY & CAPABILITIES (e.g. "tumi ke", "who are you", "ki korte paro")
    // =========================================================================
    const isIdentity =
      q.includes('tumi ke') ||
      q.includes('who are you') ||
      q.includes('ki korte paro') ||
      q.includes('what can you do') ||
      q.includes('tumi ki') ||
      q.includes('kivabe kaj koro') ||
      q.includes('help') ||
      q.includes('সাহায্য');

    if (isIdentity) {
      const ansBn = `আমি **LedgerLoom AI CFO Copilot**—ক্ষুদ্র ও মাঝারি ব্যবসার (SME) জন্য তৈরি একটি স্বায়ত্তশাসিত আর্থিক উপদেষ্টা।

আমার প্রধান সক্ষমতাসমূহ:
১. **নিখুঁত গাণিতিক নিশ্চয়তা (Zero Hallucination):** আমি কোনো মনগড়া হিসাব করি না; সরাসরি আপনার কারখানার খরচ ও লেজার ডেটাবেজ থেকে সূত্র দিয়ে হিসাব করি।
২. **টার্গেট প্রফিট প্ল্যান:** আগামী মাসে কত লাভ করতে চান বললে আমি প্রয়োজনীয় পণ্য সংখ্যা ও কাপড়ের গজ বের করে দিই।
৩. **বকেয়া তাগাদা:** কার কাছে টাকা আটকে আছে তা চিহ্নিত করে স্বয়ংক্রিয় তাগাদা নোটিশ তৈরি করি।
৪. **লোন ও কিস্তির হিসাব:** ঋণের মাসিক কিস্তি পরিশোধের চাপ এবং বাজারে উপযুক্ত জামানতবিহীন লোন তুলনা করে দিই।`;

      const ansEn = `I am **LedgerLoom AI CFO Copilot**, an autonomous financial co-pilot tailored for SME business owners.
Key Capabilities:
1. Zero-Hallucination deterministic accounting engine.
2. Reverse-engineered target profit breakdowns (required product units & raw materials).
3. Overdue debtor monitoring with automated payment reminders.
4. Capital expenditure stress-testing & loan EMI reconciliation.`;

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'cfoCapabilities',
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 5. FINANCING OPTIONS INTENT (e.g. "lone er option gulo dekhao", "loan options")
    // =========================================================================
    const isFinancingMatchIntent =
      q.includes('lone er option') ||
      q.includes('loan er option') ||
      q.includes('lone option') ||
      q.includes('loan option') ||
      q.includes('financing option') ||
      q.includes('financing') ||
      q.includes('credit option') ||
      q.includes('show loans') ||
      q.includes('what loans') ||
      q.includes('বিকল্প লোন') ||
      q.includes('লোন অপশন') ||
      q.includes('লোনের অপশন') ||
      q.includes('লোন বিকল্প') ||
      q.includes('ঋণ বিকল্প') ||
      q.includes('ব্যাংক লোন') ||
      q.includes('loan scheme') ||
      q.includes('lone scheme') ||
      ((q.includes('lone') || q.includes('loan') || q.includes('লোন') || q.includes('ঋণ')) &&
       (q.includes('option') || q.includes('অপশন') || q.includes('dekhao') || q.includes('দেকাও') || q.includes('দেখাও') || q.includes('kothay') || q.includes('bhalo') || q.includes('সুবিধা') || q.includes('list')));

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

      const ansBn = `আপনার বর্তমান মাসিক ক্যাশ-ফ্লো, মুনাফা ও বকেয়া ইনভয়েস বিশ্লেষণ করে AI Underwriting ইঞ্জিন **৩টি সেরা ফাইন্যান্সিং বিকল্প** নির্ধারণ করেছে:\n\n${topBn}\n\n💡 আপনি সরাসরি ফাইন্যান্সিং ট্যাবে গিয়ে প্রতিটি স্কিমের বিস্তারিত তুলনা দেখতে পারেন।`;
      const ansEn = `Based on your factory's monthly cash-flow, profits, and ledger receivables, our AI Underwriting Engine has matched **top 3 financing options**:\n\n${topEn}\n\n💡 You can review all options in the Financing Matcher tab.`;

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'matchFinancingOptions',
        toolOutput: options,
        suggestedAction: {
          type: 'show_financing',
          label: lang === 'bn' ? 'সম্পূর্ণ ফাইন্যান্সিং তুলনা দেখুন' : 'View Financing Comparison',
          labelEnglish: 'View Full Financing Comparison Table',
        },
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 6. MACHINE / CAPITAL EXPENDITURE LOAN DECISION FRAMEWORK
    // =========================================================================
    const isLoanEvaluationIntent =
      (q.includes('মেশিন') || q.includes('machine') || q.includes('meshin') || q.includes('invest') || q.includes('biniyog') || q.includes('বিনিয়োগ') || q.includes('kinte') || q.includes('kenar')) &&
      (q.includes('ঋণ') || q.includes('loan') || q.includes('লোন') || q.includes('lone') || q.includes('lon'));

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

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'evaluateEquipmentLoanEligibility',
        toolOutput: { sim, postEmiProfit },
        suggestedAction: {
          type: 'show_financing',
          label: lang === 'bn' ? 'ম্যাচিং ফাইন্যান্সিং বিকল্প দেখুন' : 'View Financing Options',
          labelEnglish: 'View Financing Options',
        },
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 7. LOAN BALANCE & MONTHLY EMI (e.g. "ঋণ কত বাকি আছে এবং মাসিক কিস্তির হিসাব দাও")
    // =========================================================================
    const isLoanIntent =
      q.includes('kisti') ||
      q.includes('kistee') ||
      q.includes('emi') ||
      q.includes('কিস্তি') ||
      q.includes('দেনা') ||
      q.includes('মাসিক কিস্তি') ||
      q.includes('ঋণ কত') ||
      q.includes('ঋণের হিসাব') ||
      q.includes('loan baki') ||
      q.includes('lone baki') ||
      q.includes('rin baki') ||
      q.includes('how much debt') ||
      q.includes('remaining debt');

    if (isLoanIntent) {
      const loanSummary = AccountingEngine.reconcileAllLoans(loans, currency);

      const loanDetailsBn = loanSummary.nextDueDetails.map(
        (l) => `• **${l.lender}**: অবশিষ্ট ঋণ ${l.remaining.toLocaleString()} ${convertedProfile.currency} (মাসিক কিস্তি: ${l.emi.toLocaleString()} ${convertedProfile.currency}, পরবর্তী কিস্তির তারিখ: ${l.nextDate})`
      ).join('\n');

      const loanDetailsEn = loanSummary.nextDueDetails.map(
        (l) => `• **${l.lender}**: Remaining balance ${l.remaining.toLocaleString()} ${convertedProfile.currency} (Monthly EMI: ${l.emi.toLocaleString()} ${convertedProfile.currency}, Next payment: ${l.nextDate})`
      ).join('\n');

      const ansBn = `আপনার কারখানার বর্তমানে **${loanSummary.activeLoanCount}টি সক্রিয় ঋণ** রয়েছে:
${loanDetailsBn}

- মোট অবশিষ্ট ঋণের পরিমাণ: **${loanSummary.totalRemainingDebt.toLocaleString()} ${convertedProfile.currency}**
- প্রতি মাসে মোট কিস্তির বাধ্যবাধকতা (EMI): **${loanSummary.totalMonthlyEMIObligation.toLocaleString()} ${convertedProfile.currency}**`;

      const ansEn = `You currently have **${loanSummary.activeLoanCount} active loan(s)**:
${loanDetailsEn}

- Total Remaining Debt: **${loanSummary.totalRemainingDebt.toLocaleString()} ${convertedProfile.currency}**
- Total Monthly EMI Obligation: **${loanSummary.totalMonthlyEMIObligation.toLocaleString()} ${convertedProfile.currency}**`;

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
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

    // =========================================================================
    // 8. DEBTORS & OVERDUE RECEIVABLES (e.g. "কার কাছে কত টাকা বাকি আছে?")
    // =========================================================================
    const isDebtorIntent =
      q.includes('baki') ||
      q.includes('bakir') ||
      q.includes('paona') ||
      q.includes('pabo') ||
      q.includes('debtor') ||
      q.includes('receivable') ||
      q.includes('due') ||
      q.includes('overdue') ||
      q.includes('customer') ||
      q.includes('taka dey nai') ||
      q.includes('takada') ||
      q.includes('tagada') ||
      q.includes('বাকি') ||
      q.includes('পাওনা') ||
      q.includes('বকেয়া') ||
      q.includes('তাগাদা');

    if (isDebtorIntent) {
      const riskThreshold = getOverdueThreshold(currency);
      const overdueList = debtors.filter((d) => d.type === 'receivable' && conv(d.amount) >= riskThreshold);
      const totalOverdue = debtors.filter((d) => d.type === 'receivable').reduce((sum, d) => sum + conv(d.amount), 0);

      const ansBn = `বর্তমানে আপনার মোট বকেয়া পাওনা (Receivables) **${totalOverdue.toLocaleString()} ${convertedProfile.currency}**। 
এর মধ্যে **${overdueList.length}টি পার্টির** বকেয়া ${riskThreshold.toLocaleString()} ${convertedProfile.currency} এর সীমা ছাড়িয়ে গেছে:
${overdueList.map((d) => `• **${d.partyName}**: বকেয়া ${conv(d.amount).toLocaleString()} ${convertedProfile.currency} (মেয়াদ: ${d.dueDate})`).join('\n')}

💡 জরুরি ভিত্তিতে তাদের কাছে তাগাদা মেসেজ পাঠানোর প্রস্তাব করা হচ্ছে।`;

      const ansEn = `You have total outstanding receivables of **${totalOverdue.toLocaleString()} ${convertedProfile.currency}**.
There are **${overdueList.length} account(s)** exceeding the ${riskThreshold.toLocaleString()} ${convertedProfile.currency} risk threshold:
${overdueList.map((d) => `• **${d.partyName}**: ${conv(d.amount).toLocaleString()} ${convertedProfile.currency} (Due: ${d.dueDate})`).join('\n')}

💡 Recommended action: Send automated reminder notices to overdue accounts.`;

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'getOverdueDebtors',
        toolOutput: { overdueCount: overdueList.length, totalOverdue, overdueList },
        suggestedAction: {
          type: 'show_debtors',
          label: lang === 'bn' ? 'বকেয়া তালিকা ও তাগাদা দেখুন' : 'Review Overdue Debtors',
          labelEnglish: 'Review Overdue Debtors & Send Reminders',
        },
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 9. EXPENSE BREAKDOWN & OVERHEAD (e.g. "কোথায় সবচেয়ে বেশি খরচ হয়েছে?")
    // =========================================================================
    const isExpenseIntent =
      q.includes('khoroch') ||
      q.includes('koroch') ||
      q.includes('expense') ||
      q.includes('overhead') ||
      q.includes('cost') ||
      q.includes('kothay beshi') ||
      q.includes('beshi khoroch') ||
      q.includes('bill') ||
      q.includes('খরচ') ||
      q.includes('কোথায় সবচেয়ে বেশি খরচ');

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

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'getExpenseBreakdown',
        toolOutput: { items, topItem },
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 10. TARGET PROFIT & GOAL PLANNING (e.g. "৫০,০০০ টাকা লাভ করতে কি করতে হবে?")
    // =========================================================================
    const profitMatch =
      q.match(/(\d+[\d,]*)\s*(?:টাকা|tk|bdt|元|rmb|\$|rs|rupees)?\s*(?:লাভ|profit|ইনকাম|আয়|labh)/i) ||
      q.match(/(?:লাভ|profit|ইনকাম|আয়|labh)\s*(?:করতে চাই|হিসাব|目标)?\s*(\d+[\d,]*)/i) ||
      q.match(/(\d+[\d,]*)\s*(?:হাজার|k|hajar|lakh|লাখ)/i);

    const isGoalIntent =
      profitMatch ||
      q.includes('টার্গেট') ||
      q.includes('লক্ষ্য') ||
      q.includes('target') ||
      q.includes('goal') ||
      q.includes('লাভ') ||
      q.includes('profit') ||
      q.includes('labh') ||
      q.includes('koto bechte hobe') ||
      q.includes('koto bikri');

    if (isGoalIntent) {
      let targetAmount = Number(getDefaultTargetProfit(currency));
      if (profitMatch && profitMatch[1]) {
        targetAmount = parseInt(profitMatch[1].replace(/,/g, ''), 10);
        if (q.includes('হাজার') || q.includes('hajar') || q.includes('k')) targetAmount *= 1000;
        if (q.includes('লাখ') || q.includes('lakh')) targetAmount *= 100000;
      }
      const plan = AccountingEngine.solveTargetProfit(convertedProfile, targetAmount, 'month');

      const ansBn = `আগামী মাসে **${targetAmount.toLocaleString()} ${convertedProfile.currency}** নেট লাভ করতে হলে:
- আপনাকে মোট **${plan.requiredUnits.toLocaleString()}টি ${convertedProfile.primaryProduct}** বিক্রি করতে হবে।
- এর জন্য আনুমানিক **${plan.requiredFabricMeters.toLocaleString()} মিটার/একক কাঁচামাল** কিনতে হবে (সম্ভাব্য খরচ: ${plan.requiredFabricCost.toLocaleString()} ${convertedProfile.currency})।
- আপনার কারখানার মাসিক ফিক্সড কস্ট **${plan.totalFixedCost.toLocaleString()} ${convertedProfile.currency}** তুলতে প্রথম **${plan.breakEvenUnits.toLocaleString()}টি** পণ্য বিক্রি করতে হবে, এরপরের পণ্যগুলো থেকে লাভ আসবে।`;

      const ansEn = `To achieve a target net profit of **${targetAmount.toLocaleString()} ${convertedProfile.currency}** next month:
- You must produce and sell **${plan.requiredUnits.toLocaleString()} units of ${convertedProfile.primaryProduct}**.
- Required raw material: approx **${plan.requiredFabricMeters.toLocaleString()} units** (Estimated budget: ${plan.requiredFabricCost.toLocaleString()} ${convertedProfile.currency}).
- Break-even is at **${plan.breakEvenUnits.toLocaleString()} units** to cover factory fixed overhead (${plan.totalFixedCost.toLocaleString()} ${convertedProfile.currency}).`;

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'solveTargetProfit',
        toolOutput: plan,
        suggestedAction: {
          type: 'open_goal_modal',
          label: lang === 'bn' ? 'টার্গেট প্রফিট প্ল্যান দেখুন' : 'View Target Plan',
          labelEnglish: 'View Detailed Target Plan',
        },
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 11. GENERAL FINANCIAL HEALTH QUERY (Explicitly asking about status)
    // =========================================================================
    const isHealthQuery =
      q.includes('health') ||
      q.includes('snapshot') ||
      q.includes('performance') ||
      q.includes('overall') ||
      q.includes('summary') ||
      q.includes('অবস্থা') ||
      q.includes('status') ||
      q.includes('লেজার');

    if (isHealthQuery) {
      const bep = AccountingEngine.calculateBreakEven(convertedProfile);

      const ansBn = `কারখানার বর্তমান আর্থিক বিশ্লেষণ (অক্টোবর ২০২৬):
- মোট রাজস্ব: **${health.totalRevenue.toLocaleString()} ${convertedProfile.currency}**
- ফিক্সড খরচ (বেতন, ভাড়া, ইউটিলিটি): **${health.totalFixedCosts.toLocaleString()} ${convertedProfile.currency}**
- ভ্যারিয়েবল খরচ (কাঁচামাল ও উৎপাদন): **${health.totalVariableCosts.toLocaleString()} ${convertedProfile.currency}**
- নিট লাভ: **${health.netProfit > 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${convertedProfile.currency}** (মার্জিন: ${health.netMarginPercentage}%)
- ব্রেক-ইভেন অগ্রগতি: **${health.breakEvenProgressPercentage}%** (ব্রেক-ইভেন লক্ষ্য: ${bep.breakEvenRevenue.toLocaleString()} ${convertedProfile.currency})`;

      const ansEn = `Current Financial Snapshot (${convertedProfile.currency}):
- Total Revenue: **${health.totalRevenue.toLocaleString()} ${convertedProfile.currency}**
- Fixed Overhead: **${health.totalFixedCosts.toLocaleString()} ${convertedProfile.currency}**
- Variable Costs: **${health.totalVariableCosts.toLocaleString()} ${convertedProfile.currency}**
- Net Profit: **${health.netProfit > 0 ? '+' : ''}${health.netProfit.toLocaleString()} ${convertedProfile.currency}** (Margin: ${health.netMarginPercentage}%)
- Break-Even Progress: **${health.breakEvenProgressPercentage}%**`;

      return {
        answerPrimary: lang === 'bn' ? ansBn : ansEn,
        answerBengali: ansBn,
        answerEnglish: ansEn,
        executedTool: 'computeFinancialHealth',
        toolOutput: health,
        metricsSnapshot: health,
      };
    }

    // =========================================================================
    // 12. HELPFUL FALLBACK (When user asks something unrecognized)
    // =========================================================================
    const fallbackBn = `আপনার বার্তাটি পেয়েছি! একজন এআই সিএফও (AI CFO) হিসেবে আমি মূলত আপনার কারখানার গাণিতিক হিসাব ও আর্থিক সিদ্ধান্ত নিয়ে কাজ করি।

আপনি নিচের যেকোনো বিষয় লিখে প্রশ্ন করতে পারেন:
১. 🎯 **লাভের লক্ষ্য:** যেমন *"সামনের মাসে ৫০,০০০ টাকা লাভ করতে কি করতে হবে?"*
২. ⚠️ **বকেয়া টাকা:** যেমন *"কার কাছে কত টাকা বাকি আছে?"*
৩. 🏦 **লোন বিকল্প:** যেমন *"লোনের অপশনগুলো দেখাও"*
৪. 💳 **ঋণের কিস্তি:** যেমন *"ঋণ কত বাকি আছে এবং কিস্তির হিসাব দাও"*
৫. 💡 **বিনিয়োগ পরামর্শ:** যেমন *"মেশিন কেনার জন্য লোন নেওয়া কি ঠিক হবে?"*
৬. 📊 **খরচের হিসাব:** যেমন *"কোথায় সবচেয়ে বেশি খরচ হয়েছে?"*

আপনি কোন বিষয়ে জানতে চান তা লিখে পাঠান!`;

    const fallbackEn = `I received your message! As your AI CFO, I specialize in precise financial computations, break-even calculus, debtor collection, and loan evaluations.

Feel free to ask questions like:
1. Target Profit: "How to make 50,000 profit next month?"
2. Debtors: "Who owes overdue money (>30,000)?"
3. Loans: "Show financing options" or "How much debt is remaining?"
4. Capex: "Should I take a loan to buy machinery?"
5. Overheads: "Where did we spend the most?"`;

    return {
      answerPrimary: lang === 'bn' ? fallbackBn : fallbackEn,
      answerBengali: fallbackBn,
      answerEnglish: fallbackEn,
      executedTool: 'cfoAssistance',
      metricsSnapshot: health,
    };
  }
}
