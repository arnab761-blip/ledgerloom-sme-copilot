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

    // Default Overview
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
