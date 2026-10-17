import { SupportedCurrency } from './currency';
export type { SupportedCurrency };

export type TransactionType = 'income' | 'expense';
export type CostClassification = 'fixed' | 'variable';

export interface BusinessProfile {
  businessName: string;
  industry: string; // e.g. "Garments & Apparel Manufacturing"
  startDate: string; // e.g. "2024-01-15"
  initialInvestment: number; // e.g. 500000 BDT
  workerCount: number; // e.g. 12
  workerSalariesMonthly: number; // total wages e.g. 120000 BDT
  electricityBillMonthly: number; // e.g. 18000 BDT
  rentMonthly: number; // e.g. 25000 BDT
  maintenanceMonthly: number; // e.g. 5000 BDT
  otherFixedCostsMonthly: number; // e.g. 4000 BDT
  primaryProduct: string; // e.g. "Cotton T-Shirt"
  unitSellingPrice: number; // e.g. 450 BDT
  unitVariableCost: number; // fabric + thread + wash e.g. 220 BDT
  fabricMetersPerUnit: number; // e.g. 1.25 meters
  fabricCostPerMeter: number; // e.g. 120 BDT
  currency: SupportedCurrency; // "BDT" | "CNY" | "USD"
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  costType: CostClassification;
  amount: number;
  description: string;
  partyName?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque';
  status: 'pending_approval' | 'approved' | 'rejected';
  source: 'manual_form' | 'receipt_ocr' | 'automated_import' | 'ai_agent';
  evidenceNote?: string;
  createdAt: string;
  isEdited?: boolean;
  editedAt?: string;
  editReason?: string;
  previousAmount?: number;
  receiptImage?: string;
}

export interface DebtorRecord {
  id: string;
  partyName: string;
  contactNumber: string;
  type: 'receivable' | 'payable'; // receivable = বাকি টাকা পাই; payable = ঋণ/দেনা
  amount: number;
  originalAmount: number;
  issueDate: string;
  dueDate: string;
  status: 'pending' | 'overdue' | 'settled';
  alertThreshold: number; // default 30000
  notes?: string;
  reminderSentCount: number;
  lastReminderDate?: string;
}

export interface LoanLiability {
  id: string;
  lenderName: string;
  lenderType: 'bank' | 'mfi' | 'individual' | 'supplier_credit';
  principal: number;
  annualInterestRate: number; // e.g. 9.5%
  tenureMonths: number;
  monthlyEMI: number;
  startDate: string;
  totalPaid: number;
  remainingBalance: number;
  nextPaymentDate: string;
  status: 'active' | 'closed';
}

export interface TargetProfitPlan {
  targetProfit: number;
  period: 'month' | 'quarter' | 'year';
  totalFixedCost: number;
  unitContributionMargin: number; // Selling Price - Variable Cost
  requiredUnits: number;
  requiredRevenue: number;
  requiredFabricMeters: number;
  requiredFabricCost: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  marginOfSafetyPercentage: number;
  actionableSteps: string[];
}

export interface FinancialHealthMetrics {
  totalRevenue: number;
  totalExpenses: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  netProfit: number;
  netMarginPercentage: number;
  breakEvenProgressPercentage: number;
  cashRunwayDays: number;
  totalReceivables: number;
  totalPayables: number;
  highRiskReceivablesCount: number; // > threshold
  monthlyLoanObligation: number;
  debtToIncomeRatio: number;
}

export type PermissionTier = 'Tier-1-Read' | 'Tier-2-Simulate' | 'Tier-3-Communicate' | 'Tier-4-Execute';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: 'owner' | 'ai_copilot' | 'system_cron';
  action: string;
  permissionTier: PermissionTier;
  targetEntity: string;
  details: string;
  status: 'success' | 'flagged' | 'blocked';
}

export interface SecuritySessionState {
  isUnlocked: boolean;
  unlockedAt: number | null;
  expiresAt: number | null;
  timeoutMinutes: number; // 30 mins
}

export interface FinancingOption {
  id: string;
  name: string;
  provider: string; // e.g. WeBank Digital SME, Partner Bank
  type: 'working_capital' | 'invoice_factoring' | 'equipment_lease' | 'micro_advance';
  minAmount: number;
  maxAmount: number;
  interestRateText: string;
  tenureMonths: number;
  processingTime: string;
  collateralRequired: boolean;
  fitScorePercentage: number;
  eligibilityStatus: 'eligible' | 'conditional' | 'not_eligible';
  explainableMatchReason: string;
  hiddenFees: string;
}

export interface AnomalyAlert {
  id: string;
  type: 'expense_spike' | 'liquidity_shortage' | 'overdue_debtor' | 'payroll_dip';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendedAction: string;
  projectedDate: string;
}

export interface ProductProfitabilityItem {
  id: string;
  productName: string;
  unitSellingPrice: number;
  unitVariableCost: number;
  contributionMargin: number;
  marginPercentage: number;
  monthlyVolumeEstimate: number;
  totalMonthlyMarginContribution: number;
  status: 'high_profit' | 'profitable' | 'thin_margin' | 'loss_making';
  recommendation: string;
}

export type DemoScenarioPreset = 'garments' | 'cafe';

