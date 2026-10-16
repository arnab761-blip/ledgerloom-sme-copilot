import {
  BusinessProfile,
  Transaction,
  DebtorRecord,
  LoanLiability,
  TargetProfitPlan,
  FinancialHealthMetrics,
} from './types';

/**
 * DETERMINISTIC ACCOUNTING ENGINE
 * 
 * Crucial Rule for Competition & Real-world Fintech:
 * Large numbers, break-even calculus, compound interest, and loan amortization
 * MUST be computed via pure deterministic formulas, NOT LLM token generation.
 * The AI Agent calls these mathematical functions via Tool Calling.
 */

export class AccountingEngine {
  /**
   * Sums all recurring monthly fixed costs:
   * Fixed Costs = Worker Salaries + Rent + Electricity + Maintenance + Other Overheads
   */
  public static calculateMonthlyFixedCosts(profile: BusinessProfile): number {
    return (
      (profile.workerSalariesMonthly || 0) +
      (profile.rentMonthly || 0) +
      (profile.electricityBillMonthly || 0) +
      (profile.maintenanceMonthly || 0) +
      (profile.otherFixedCostsMonthly || 0)
    );
  }

  /**
   * Break-Even Point (BEP) Analysis:
   * BEP Units = Fixed Costs / (Selling Price - Unit Variable Cost)
   * BEP Revenue = BEP Units * Selling Price
   */
  public static calculateBreakEven(profile: BusinessProfile): {
    breakEvenUnits: number;
    breakEvenRevenue: number;
    unitContributionMargin: number;
    contributionMarginRatio: number;
  } {
    const fixedCosts = this.calculateMonthlyFixedCosts(profile);
    const unitPrice = profile.unitSellingPrice || 1;
    const unitVarCost = profile.unitVariableCost || 0;
    const unitContributionMargin = Math.max(0.01, unitPrice - unitVarCost);
    const contributionMarginRatio = unitContributionMargin / unitPrice;

    const breakEvenUnits = Math.ceil(fixedCosts / unitContributionMargin);
    const breakEvenRevenue = Math.round(breakEvenUnits * unitPrice);

    return {
      breakEvenUnits,
      breakEvenRevenue,
      unitContributionMargin: Math.round(unitContributionMargin * 100) / 100,
      contributionMarginRatio: Math.round(contributionMarginRatio * 1000) / 1000,
    };
  }

  /**
   * Reverse Target Profit Solver (লক্ষ্য-লাভ থেকে কাঁচামাল ও বিক্রির হিসাব):
   * Owner specifies: "I want $10,000 profit next month."
   * Formula:
   * Target Units = (Fixed Costs + Target Profit) / (Selling Price - Unit Variable Cost)
   * Required Fabric = Target Units * Fabric Per Unit (meters/yards)
   */
  public static solveTargetProfit(
    profile: BusinessProfile,
    targetProfit: number,
    period: 'month' | 'quarter' | 'year' = 'month'
  ): TargetProfitPlan {
    const monthlyFixed = this.calculateMonthlyFixedCosts(profile);
    const multiplier = period === 'quarter' ? 3 : period === 'year' ? 12 : 1;
    const totalFixedCost = monthlyFixed * multiplier;

    const unitPrice = profile.unitSellingPrice || 1;
    const unitVarCost = profile.unitVariableCost || 0;
    const unitContributionMargin = Math.max(0.01, unitPrice - unitVarCost);

    // Required Units to cover Fixed Costs + Desired Profit
    const requiredUnits = Math.ceil((totalFixedCost + targetProfit) / unitContributionMargin);
    const requiredRevenue = Math.round(requiredUnits * unitPrice);

    // Raw Material & Fabric requirements
    const fabricPerUnit = profile.fabricMetersPerUnit || 1.25;
    const fabricCostPerMeter = profile.fabricCostPerMeter || 120;
    const requiredFabricMeters = Math.round(requiredUnits * fabricPerUnit * 10) / 10;
    const requiredFabricCost = Math.round(requiredFabricMeters * fabricCostPerMeter);

    // Break-even benchmark
    const bep = this.calculateBreakEven(profile);
    const marginOfSafetyPercentage =
      requiredUnits > bep.breakEvenUnits
        ? Math.round(((requiredUnits - bep.breakEvenUnits) / requiredUnits) * 1000) / 10
        : 0;

    const actionableSteps = [
      `নির্ধারিত লক্ষ্য ${targetProfit.toLocaleString()} ${profile.currency} লাভ অর্জনের জন্য আপনাকে ${requiredUnits.toLocaleString()}টি ${profile.primaryProduct || 'পণ্য'} তৈরি ও বিক্রি করতে হবে।`,
      `এর জন্য মোট আনুমানিক ${requiredFabricMeters.toLocaleString()} মিটার/গজ কাপড় (ফেব্রিক) কিনতে হবে, যার সম্ভাব্য খরচ প্রায় ${requiredFabricCost.toLocaleString()} ${profile.currency}।`,
      `ব্রেক-ইভেন পার করার জন্য প্রথম ${bep.breakEvenUnits.toLocaleString()}টি পণ্য বিক্রি থেকে ফিক্সড খরচ (${totalFixedCost.toLocaleString()} ${profile.currency}) উঠবে।`,
      `পরবর্তী ${(requiredUnits - bep.breakEvenUnits).toLocaleString()}টি পণ্য বিক্রি থেকে আপনার লক্ষ্যমাত্রা লাভ তৈরি হবে।`,
    ];

    return {
      targetProfit,
      period,
      totalFixedCost,
      unitContributionMargin: Math.round(unitContributionMargin * 100) / 100,
      requiredUnits,
      requiredRevenue,
      requiredFabricMeters,
      requiredFabricCost,
      breakEvenUnits: bep.breakEvenUnits,
      breakEvenRevenue: bep.breakEvenRevenue,
      marginOfSafetyPercentage,
      actionableSteps,
    };
  }

  /**
   * Deterministic Loan Amortization & Reconciliation (ঋণ মিলানো):
   * EMI = [P * r * (1+r)^n] / [(1+r)^n - 1]
   * Calculates precise monthly repayment, interest vs principal breakdown.
   */
  public static calculateLoanEMI(
    principal: number,
    annualInterestRatePercent: number,
    tenureMonths: number
  ): {
    monthlyEMI: number;
    totalRepayment: number;
    totalInterest: number;
  } {
    if (annualInterestRatePercent <= 0) {
      const emi = Math.round(principal / tenureMonths);
      return { monthlyEMI: emi, totalRepayment: principal, totalInterest: 0 };
    }

    const monthlyRate = annualInterestRatePercent / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    const emi = Math.round((principal * monthlyRate * factor) / (factor - 1));
    const totalRepayment = emi * tenureMonths;
    const totalInterest = totalRepayment - principal;

    return {
      monthlyEMI: emi,
      totalRepayment,
      totalInterest,
    };
  }

  /**
   * Reconciles multiple active loans and evaluates monthly debt burden:
   */
  public static reconcileAllLoans(loans: LoanLiability[]): {
    totalRemainingDebt: number;
    totalMonthlyEMIObligation: number;
    activeLoanCount: number;
    nextDueDetails: Array<{ lender: string; emi: number; remaining: number; nextDate: string }>;
  } {
    const active = loans.filter((l) => l.status === 'active');
    const totalRemainingDebt = active.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
    const totalMonthlyEMIObligation = active.reduce((sum, l) => sum + (l.monthlyEMI || 0), 0);

    const nextDueDetails = active.map((l) => ({
      lender: l.lenderName,
      emi: l.monthlyEMI,
      remaining: l.remainingBalance,
      nextDate: l.nextPaymentDate,
    }));

    return {
      totalRemainingDebt,
      totalMonthlyEMIObligation,
      activeLoanCount: active.length,
      nextDueDetails,
    };
  }

  /**
   * Evaluates overall Business Financial Health & Receivables Risk:
   */
  public static computeFinancialHealth(
    profile: BusinessProfile,
    transactions: Transaction[],
    debtors: DebtorRecord[],
    loans: LoanLiability[]
  ): FinancialHealthMetrics {
    const approved = transactions.filter((t) => t.status === 'approved');

    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalFixedCosts = 0;
    let totalVariableCosts = 0;

    for (const tx of approved) {
      if (tx.type === 'income') {
        totalRevenue += tx.amount;
      } else {
        totalExpenses += tx.amount;
        if (tx.costType === 'fixed') {
          totalFixedCosts += tx.amount;
        } else {
          totalVariableCosts += tx.amount;
        }
      }
    }

    // Include baseline profile monthly fixed costs if no transactions yet
    const monthlyBaselineFixed = this.calculateMonthlyFixedCosts(profile);
    if (totalFixedCosts === 0) {
      totalFixedCosts = monthlyBaselineFixed;
      totalExpenses += monthlyBaselineFixed;
    }

    const netProfit = totalRevenue - totalExpenses;
    const netMarginPercentage =
      totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

    const bep = this.calculateBreakEven(profile);
    const breakEvenProgressPercentage =
      bep.breakEvenRevenue > 0
        ? Math.min(100, Math.round((totalRevenue / bep.breakEvenRevenue) * 100))
        : 0;

    // Debtors (বাকি টাকা)
    const receivables = debtors.filter((d) => d.type === 'receivable' && d.status !== 'settled');
    const payables = debtors.filter((d) => d.type === 'payable' && d.status !== 'settled');

    const totalReceivables = receivables.reduce((sum, d) => sum + d.amount, 0);
    const totalPayables = payables.reduce((sum, d) => sum + d.amount, 0);

    // High risk = Receivables exceeding threshold (default 30,000)
    const highRiskReceivablesCount = receivables.filter((d) => d.amount >= (d.alertThreshold || 30000)).length;

    // Loans
    const loanSummary = this.reconcileAllLoans(loans);
    const debtToIncomeRatio =
      totalRevenue > 0
        ? Math.round((loanSummary.totalMonthlyEMIObligation / totalRevenue) * 1000) / 10
        : 0;

    // Cash runway in days (based on current net cash / daily burn rate)
    const estimatedCashOnHand = Math.max(10000, profile.initialInvestment + netProfit - totalReceivables);
    const dailyBurnRate = Math.max(1, totalExpenses / 30);
    const cashRunwayDays = Math.round(estimatedCashOnHand / dailyBurnRate);

    return {
      totalRevenue,
      totalExpenses,
      totalFixedCosts,
      totalVariableCosts,
      netProfit,
      netMarginPercentage,
      breakEvenProgressPercentage,
      cashRunwayDays,
      totalReceivables,
      totalPayables,
      highRiskReceivablesCount,
      monthlyLoanObligation: loanSummary.totalMonthlyEMIObligation,
      debtToIncomeRatio,
    };
  }
}
