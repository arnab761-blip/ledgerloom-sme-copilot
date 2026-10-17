import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import {
  BusinessProfile,
  Transaction,
  DebtorRecord,
  LoanLiability,
  AuditLogEntry,
} from './types';

const DB_FILE_PATH = path.join(process.cwd(), 'ledgerloom_database.xlsx');

// Initial realistic default data for an SME Factory ("Loom & Stitch Garments")
const DEFAULT_PROFILE: BusinessProfile = {
  businessName: 'Loom & Stitch Garments (SME)',
  industry: 'Apparel & Textile Manufacturing',
  startDate: '2024-03-01',
  initialInvestment: 600000, // 6,00,000 BDT
  workerCount: 14,
  workerSalariesMonthly: 145000, // 1,45,000 BDT total
  electricityBillMonthly: 22000, // 22,000 BDT
  rentMonthly: 30000, // 30,000 BDT
  maintenanceMonthly: 8000, // 8,000 BDT
  otherFixedCostsMonthly: 5000,
  primaryProduct: 'Export Quality Polo Shirt',
  unitSellingPrice: 520, // 520 BDT per piece
  unitVariableCost: 260, // fabric + stitching + buttons
  fabricMetersPerUnit: 1.4, // 1.4 meters per shirt
  fabricCostPerMeter: 130, // 130 BDT per meter
  currency: 'BDT',
};

const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-1001',
    date: '2026-10-01',
    type: 'income',
    category: 'sales',
    costType: 'variable',
    amount: 182000,
    description: 'Bulk Delivery to Dhaka Retailers (350 Polo Shirts)',
    partyName: 'Dhaka Fashion Hub',
    paymentMethod: 'bank_transfer',
    status: 'approved',
    source: 'manual_form',
    createdAt: '2026-10-01T10:30:00Z',
  },
  {
    id: 'TX-1002',
    date: '2026-10-03',
    type: 'expense',
    category: 'salary',
    costType: 'fixed',
    amount: 145000,
    description: 'Monthly Staff & Worker Wages (14 workers)',
    paymentMethod: 'bank_transfer',
    status: 'approved',
    source: 'manual_form',
    createdAt: '2026-10-03T09:00:00Z',
  },
  {
    id: 'TX-1003',
    date: '2026-10-05',
    type: 'expense',
    category: 'utility',
    costType: 'fixed',
    amount: 21850,
    description: 'DESCO Factory Electricity Bill (Commercial 3-Phase)',
    paymentMethod: 'mobile_money',
    status: 'approved',
    source: 'manual_form',
    createdAt: '2026-10-05T14:15:00Z',
  },
  {
    id: 'TX-1004',
    date: '2026-10-08',
    type: 'expense',
    category: 'raw_material',
    costType: 'variable',
    amount: 65000,
    description: '500 Meters Cotton Pique Fabric purchase',
    partyName: 'Narayanganj Spinning Mills',
    paymentMethod: 'bank_transfer',
    status: 'approved',
    source: 'receipt_ocr',
    createdAt: '2026-10-08T11:45:00Z',
  },
  {
    id: 'TX-1005',
    date: '2026-10-12',
    type: 'income',
    category: 'sales',
    costType: 'variable',
    amount: 104000,
    description: 'Corporate T-Shirt Order Delivery (200 units)',
    partyName: 'TechCorp BD',
    paymentMethod: 'cheque',
    status: 'approved',
    source: 'manual_form',
    createdAt: '2026-10-12T16:20:00Z',
  },
  {
    id: 'TX-1006',
    date: '2026-10-15',
    type: 'expense',
    category: 'raw_material',
    costType: 'variable',
    amount: 15400,
    description: 'Cash purchase for Sewing Threads & Extra Buttons (Urgent Batch)',
    partyName: 'Sadarghat Accessories',
    paymentMethod: 'cash',
    status: 'pending_approval',
    source: 'receipt_ocr',
    evidenceNote: 'Memo photo scanned. Pending owner verification.',
    createdAt: '2026-10-15T18:00:00Z',
  },
];

const DEFAULT_DEBTORS: DebtorRecord[] = [
  {
    id: 'DB-201',
    partyName: 'Bengal Garments Mart',
    contactNumber: '+8801711223344',
    type: 'receivable',
    amount: 45000, // > 30,000 threshold -> triggers urgent alert!
    originalAmount: 65000,
    issueDate: '2026-09-10',
    dueDate: '2026-10-10',
    status: 'overdue',
    alertThreshold: 30000,
    notes: 'Payment overdue by 6 days. Last promised date was Oct 10.',
    reminderSentCount: 1,
    lastReminderDate: '2026-10-11',
  },
  {
    id: 'DB-202',
    partyName: 'Metro Wearhouse Chawkbazar',
    contactNumber: '+8801819998877',
    type: 'receivable',
    amount: 32000, // > 30,000 threshold -> triggers alert!
    originalAmount: 32000,
    issueDate: '2026-09-25',
    dueDate: '2026-10-25',
    status: 'pending',
    alertThreshold: 30000,
    notes: 'Order delivered on credit. Due in 9 days.',
    reminderSentCount: 0,
  },
  {
    id: 'DB-203',
    partyName: 'Narayanganj Dyeing & Finishing',
    contactNumber: '+8801912345678',
    type: 'payable', // ঋণ/দেনা
    amount: 28000,
    originalAmount: 50000,
    issueDate: '2026-09-15',
    dueDate: '2026-10-30',
    status: 'pending',
    alertThreshold: 30000,
    notes: 'Supplier bill for dyeing 400kg fabric.',
    reminderSentCount: 0,
  },
];

const DEFAULT_LOANS: LoanLiability[] = [
  {
    id: 'LN-301',
    lenderName: 'SME Working Capital Loan (Bank)',
    lenderType: 'bank',
    principal: 300000,
    annualInterestRate: 9.0,
    tenureMonths: 18,
    monthlyEMI: 17875,
    startDate: '2025-06-01',
    totalPaid: 71500,
    remainingBalance: 236400,
    nextPaymentDate: '2026-11-05',
    status: 'active',
  },
];

// Realistic Competition Demo Scenario Preset 2: Artisan Café / Coffee Shop (Exact scenario from competition prompt)
const CAFE_PROFILE: BusinessProfile = {
  businessName: 'BrewCraft Artisan Café (SME)',
  industry: 'Specialty Coffee & Artisan Bakery',
  startDate: '2025-01-15',
  initialInvestment: 450000,
  workerCount: 6,
  workerSalariesMonthly: 68000,
  electricityBillMonthly: 24300, // +35% above baseline 18,000
  rentMonthly: 35000,
  maintenanceMonthly: 5000,
  otherFixedCostsMonthly: 4000,
  primaryProduct: 'Signature Cold Brew & Specialty Latte',
  unitSellingPrice: 320,
  unitVariableCost: 90,
  fabricMetersPerUnit: 0.15,
  fabricCostPerMeter: 600,
  currency: 'BDT',
};

const CAFE_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-C001',
    date: '2026-10-02',
    type: 'income',
    category: 'sales',
    costType: 'variable',
    amount: 125000,
    description: 'Weekly Walk-in Coffee & Bakery Sales Revenue',
    partyName: 'Retail Walk-in Customers',
    paymentMethod: 'mobile_money',
    status: 'approved',
    source: 'manual_form',
    createdAt: '2026-10-02T18:30:00Z',
  },
  {
    id: 'TX-C002',
    date: '2026-10-04',
    type: 'expense',
    category: 'salary',
    costType: 'fixed',
    amount: 68000,
    description: 'Monthly Staff & Barista Payroll (6 staff members)',
    paymentMethod: 'bank_transfer',
    status: 'approved',
    source: 'manual_form',
    createdAt: '2026-10-04T10:00:00Z',
  },
  {
    id: 'TX-C003',
    date: '2026-10-07',
    type: 'expense',
    category: 'utility',
    costType: 'fixed',
    amount: 24300,
    description: 'Commercial Refrigeration & Espresso Power Bill (35% Spike)',
    paymentMethod: 'mobile_money',
    status: 'approved',
    source: 'manual_form',
    createdAt: '2026-10-07T11:00:00Z',
  },
  {
    id: 'TX-C004',
    date: '2026-10-10',
    type: 'expense',
    category: 'raw_material',
    costType: 'variable',
    amount: 32000,
    description: 'Direct Trade Arabica Coffee Beans (50kg)',
    partyName: 'Artisan Roast Importers',
    paymentMethod: 'bank_transfer',
    status: 'approved',
    source: 'receipt_ocr',
    createdAt: '2026-10-10T14:00:00Z',
  },
  {
    id: 'TX-C005',
    date: '2026-10-12',
    type: 'income',
    category: 'sales',
    costType: 'variable',
    amount: 45000,
    description: 'Corporate Startup Summit Coffee Bar Catering',
    partyName: 'Fintech Hub Dhaka',
    paymentMethod: 'cheque',
    status: 'approved',
    source: 'manual_form',
    createdAt: '2026-10-12T16:00:00Z',
  },
  {
    id: 'TX-C006',
    date: '2026-10-14',
    type: 'expense',
    category: 'raw_material',
    costType: 'variable',
    amount: 8500,
    description: 'Urgent Pastry Butter & Organic Milk Supply',
    partyName: 'FarmFresh Agro Dairy',
    paymentMethod: 'cash',
    status: 'pending_approval',
    source: 'receipt_ocr',
    evidenceNote: 'Delivery receipt photographed. Awaiting owner review.',
    createdAt: '2026-10-14T09:30:00Z',
  },
];

const CAFE_DEBTORS: DebtorRecord[] = [
  {
    id: 'DB-C101',
    partyName: 'Customer X (Corporate Event Catering)',
    contactNumber: '+8801722334455',
    type: 'receivable',
    amount: 32000, // Overdue receivables matching prompt "Customer X $2,000 / 32k"
    originalAmount: 32000,
    issueDate: '2026-09-18',
    dueDate: '2026-10-08',
    status: 'overdue',
    alertThreshold: 30000,
    notes: 'Outstanding bill for tech symposium catering. Payment promised Oct 8.',
    reminderSentCount: 1,
    lastReminderDate: '2026-10-11',
  },
  {
    id: 'DB-C102',
    partyName: 'PureDairy Farms (Fresh Milk Supplier)',
    contactNumber: '+8801833445566',
    type: 'payable',
    amount: 38000, // Due next week on Oct 22, triggers liquidity deficit warning
    originalAmount: 48000,
    issueDate: '2026-09-22',
    dueDate: '2026-10-22',
    status: 'pending',
    alertThreshold: 30000,
    notes: 'Weekly fresh dairy delivery payable. Due in 6 days.',
    reminderSentCount: 0,
  },
];

const CAFE_LOANS: LoanLiability[] = [
  {
    id: 'LN-C201',
    lenderName: 'Merchant Instant Micro-Advance (7-Day Facility)',
    lenderType: 'mfi',
    principal: 60000,
    annualInterestRate: 8.5,
    tenureMonths: 6,
    monthlyEMI: 10425,
    startDate: '2026-07-01',
    totalPaid: 31275,
    remainingBalance: 31275,
    nextPaymentDate: '2026-11-01',
    status: 'active',
  },
];


export class ExcelDatabase {
  private static ensureDatabaseFile(): void {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Business Profile
      const profileRows = [
        { Field: 'Business Name', Value: DEFAULT_PROFILE.businessName },
        { Field: 'Industry', Value: DEFAULT_PROFILE.industry },
        { Field: 'Start Date', Value: DEFAULT_PROFILE.startDate },
        { Field: 'Initial Investment', Value: DEFAULT_PROFILE.initialInvestment },
        { Field: 'Worker Count', Value: DEFAULT_PROFILE.workerCount },
        { Field: 'Worker Salaries (Monthly)', Value: DEFAULT_PROFILE.workerSalariesMonthly },
        { Field: 'Electricity Bill (Monthly)', Value: DEFAULT_PROFILE.electricityBillMonthly },
        { Field: 'Rent (Monthly)', Value: DEFAULT_PROFILE.rentMonthly },
        { Field: 'Maintenance (Monthly)', Value: DEFAULT_PROFILE.maintenanceMonthly },
        { Field: 'Other Fixed Costs', Value: DEFAULT_PROFILE.otherFixedCostsMonthly },
        { Field: 'Primary Product', Value: DEFAULT_PROFILE.primaryProduct },
        { Field: 'Unit Selling Price', Value: DEFAULT_PROFILE.unitSellingPrice },
        { Field: 'Unit Variable Cost', Value: DEFAULT_PROFILE.unitVariableCost },
        { Field: 'Fabric Meters Per Unit', Value: DEFAULT_PROFILE.fabricMetersPerUnit },
        { Field: 'Fabric Cost Per Meter', Value: DEFAULT_PROFILE.fabricCostPerMeter },
        { Field: 'Currency', Value: DEFAULT_PROFILE.currency },
      ];
      const wsProfile = XLSX.utils.json_to_sheet(profileRows);
      XLSX.utils.book_append_sheet(wb, wsProfile, 'Business_Profile');

      // Sheet 2: Transactions
      const wsTx = XLSX.utils.json_to_sheet(DEFAULT_TRANSACTIONS);
      XLSX.utils.book_append_sheet(wb, wsTx, 'Daily_Transactions');

      // Sheet 3: Debtors & Creditors (বাকি ও দেনা)
      const wsDebtors = XLSX.utils.json_to_sheet(DEFAULT_DEBTORS);
      XLSX.utils.book_append_sheet(wb, wsDebtors, 'Debtors_Creditors');

      // Sheet 4: Loans & Liabilities (ঋণ)
      const wsLoans = XLSX.utils.json_to_sheet(DEFAULT_LOANS);
      XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans_Liabilities');

      // Sheet 5: Audit Log
      const initialLogs: AuditLogEntry[] = [
        {
          id: 'AUD-001',
          timestamp: new Date().toISOString(),
          actor: 'system_cron',
          action: 'DATABASE_INITIALIZATION',
          permissionTier: 'Tier-1-Read',
          targetEntity: 'Workbook',
          details: 'Initial Excel database instantiated with baseline SME profile and records.',
          status: 'success',
        },
      ];
      const wsAudit = XLSX.utils.json_to_sheet(initialLogs);
      XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit_Trail');

      XLSX.writeFile(wb, DB_FILE_PATH);
    }
  }

  public static getProfile(): BusinessProfile {
    this.ensureDatabaseFile();
    try {
      const wb = XLSX.readFile(DB_FILE_PATH);
      const ws = wb.Sheets['Business_Profile'];
      if (!ws) return DEFAULT_PROFILE;
      const rows: Array<{ Field: string; Value: any }> = XLSX.utils.sheet_to_json(ws);
      const map = new Map(rows.map((r) => [r.Field, r.Value]));

      return {
        businessName: String(map.get('Business Name') || DEFAULT_PROFILE.businessName),
        industry: String(map.get('Industry') || DEFAULT_PROFILE.industry),
        startDate: String(map.get('Start Date') || DEFAULT_PROFILE.startDate),
        initialInvestment: Number(map.get('Initial Investment') || DEFAULT_PROFILE.initialInvestment),
        workerCount: Number(map.get('Worker Count') || DEFAULT_PROFILE.workerCount),
        workerSalariesMonthly: Number(map.get('Worker Salaries (Monthly)') || DEFAULT_PROFILE.workerSalariesMonthly),
        electricityBillMonthly: Number(map.get('Electricity Bill (Monthly)') || DEFAULT_PROFILE.electricityBillMonthly),
        rentMonthly: Number(map.get('Rent (Monthly)') || DEFAULT_PROFILE.rentMonthly),
        maintenanceMonthly: Number(map.get('Maintenance (Monthly)') || DEFAULT_PROFILE.maintenanceMonthly),
        otherFixedCostsMonthly: Number(map.get('Other Fixed Costs') || DEFAULT_PROFILE.otherFixedCostsMonthly),
        primaryProduct: String(map.get('Primary Product') || DEFAULT_PROFILE.primaryProduct),
        unitSellingPrice: Number(map.get('Unit Selling Price') || DEFAULT_PROFILE.unitSellingPrice),
        unitVariableCost: Number(map.get('Unit Variable Cost') || DEFAULT_PROFILE.unitVariableCost),
        fabricMetersPerUnit: Number(map.get('Fabric Meters Per Unit') || DEFAULT_PROFILE.fabricMetersPerUnit),
        fabricCostPerMeter: Number(map.get('Fabric Cost Per Meter') || DEFAULT_PROFILE.fabricCostPerMeter),
        currency: (String(map.get('Currency') || DEFAULT_PROFILE.currency) as any),
      };
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  public static updateProfile(profile: Partial<BusinessProfile>): BusinessProfile {
    this.ensureDatabaseFile();
    const current = this.getProfile();
    const updated = { ...current, ...profile };

    const wb = XLSX.readFile(DB_FILE_PATH);
    const profileRows = [
      { Field: 'Business Name', Value: updated.businessName },
      { Field: 'Industry', Value: updated.industry },
      { Field: 'Start Date', Value: updated.startDate },
      { Field: 'Initial Investment', Value: updated.initialInvestment },
      { Field: 'Worker Count', Value: updated.workerCount },
      { Field: 'Worker Salaries (Monthly)', Value: updated.workerSalariesMonthly },
      { Field: 'Electricity Bill (Monthly)', Value: updated.electricityBillMonthly },
      { Field: 'Rent (Monthly)', Value: updated.rentMonthly },
      { Field: 'Maintenance (Monthly)', Value: updated.maintenanceMonthly },
      { Field: 'Other Fixed Costs', Value: updated.otherFixedCostsMonthly },
      { Field: 'Primary Product', Value: updated.primaryProduct },
      { Field: 'Unit Selling Price', Value: updated.unitSellingPrice },
      { Field: 'Unit Variable Cost', Value: updated.unitVariableCost },
      { Field: 'Fabric Meters Per Unit', Value: updated.fabricMetersPerUnit },
      { Field: 'Fabric Cost Per Meter', Value: updated.fabricCostPerMeter },
      { Field: 'Currency', Value: updated.currency },
    ];
    wb.Sheets['Business_Profile'] = XLSX.utils.json_to_sheet(profileRows);
    XLSX.writeFile(wb, DB_FILE_PATH);

    this.logAudit({
      actor: 'owner',
      action: 'UPDATE_PROFILE',
      permissionTier: 'Tier-4-Execute',
      targetEntity: 'Business_Profile',
      details: `Profile updated: Salaries=${updated.workerSalariesMonthly}, Rent=${updated.rentMonthly}`,
      status: 'success',
    });

    return updated;
  }

  public static getTransactions(): Transaction[] {
    this.ensureDatabaseFile();
    try {
      const wb = XLSX.readFile(DB_FILE_PATH);
      const ws = wb.Sheets['Daily_Transactions'];
      return ws ? XLSX.utils.sheet_to_json(ws) : DEFAULT_TRANSACTIONS;
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  }

  public static addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    this.ensureDatabaseFile();
    const txs = this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: `TX-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
    };
    txs.push(newTx);

    const wb = XLSX.readFile(DB_FILE_PATH);
    wb.Sheets['Daily_Transactions'] = XLSX.utils.json_to_sheet(txs);
    XLSX.writeFile(wb, DB_FILE_PATH);

    this.logAudit({
      actor: tx.source === 'ai_agent' || tx.source === 'receipt_ocr' ? 'ai_copilot' : 'owner',
      action: 'ADD_TRANSACTION',
      permissionTier: newTx.status === 'pending_approval' ? 'Tier-2-Simulate' : 'Tier-4-Execute',
      targetEntity: newTx.id,
      details: `${newTx.type.toUpperCase()}: ${newTx.amount} for ${newTx.description} (Status: ${newTx.status})`,
      status: 'success',
    });

    return newTx;
  }

  public static approveTransaction(id: string): Transaction | null {
    this.ensureDatabaseFile();
    const txs = this.getTransactions();
    const index = txs.findIndex((t) => t.id === id);
    if (index === -1) return null;

    txs[index].status = 'approved';
    const wb = XLSX.readFile(DB_FILE_PATH);
    wb.Sheets['Daily_Transactions'] = XLSX.utils.json_to_sheet(txs);
    XLSX.writeFile(wb, DB_FILE_PATH);

    this.logAudit({
      actor: 'owner',
      action: 'APPROVE_TRANSACTION',
      permissionTier: 'Tier-4-Execute',
      targetEntity: id,
      details: `Approved transaction ${id} amount ${txs[index].amount}`,
      status: 'success',
    });

    return txs[index];
  }

  public static rejectTransaction(id: string): boolean {
    this.ensureDatabaseFile();
    const txs = this.getTransactions();
    const index = txs.findIndex((t) => t.id === id);
    if (index === -1) return false;

    txs[index].status = 'rejected';
    const wb = XLSX.readFile(DB_FILE_PATH);
    wb.Sheets['Daily_Transactions'] = XLSX.utils.json_to_sheet(txs);
    XLSX.writeFile(wb, DB_FILE_PATH);

    this.logAudit({
      actor: 'owner',
      action: 'REJECT_TRANSACTION',
      permissionTier: 'Tier-4-Execute',
      targetEntity: id,
      details: `Rejected transaction ${id}`,
      status: 'success',
    });

    return true;
  }

  public static editTransaction(updated: Transaction): Transaction | null {
    this.ensureDatabaseFile();
    const txs = this.getTransactions();
    const index = txs.findIndex((t) => t.id === updated.id);
    if (index === -1) return null;

    const oldAmount = txs[index].amount;
    txs[index] = {
      ...txs[index],
      ...updated,
      isEdited: true,
      editedAt: new Date().toISOString(),
      previousAmount: oldAmount,
    };

    const wb = XLSX.readFile(DB_FILE_PATH);
    wb.Sheets['Daily_Transactions'] = XLSX.utils.json_to_sheet(txs);
    XLSX.writeFile(wb, DB_FILE_PATH);

    this.logAudit({
      actor: 'owner',
      action: 'EDIT_TRANSACTION',
      permissionTier: 'Tier-4-Execute',
      targetEntity: updated.id,
      details: `Edited transaction ${updated.id}: amount ${oldAmount} -> ${updated.amount}, note: ${updated.description}`,
      status: 'success',
    });

    return txs[index];
  }

  public static getDebtors(): DebtorRecord[] {
    this.ensureDatabaseFile();
    try {
      const wb = XLSX.readFile(DB_FILE_PATH);
      const ws = wb.Sheets['Debtors_Creditors'];
      return ws ? XLSX.utils.sheet_to_json(ws) : DEFAULT_DEBTORS;
    } catch {
      return DEFAULT_DEBTORS;
    }
  }

  public static addDebtor(record: Omit<DebtorRecord, 'id' | 'reminderSentCount'>): DebtorRecord {
    this.ensureDatabaseFile();
    const records = this.getDebtors();
    const newRecord: DebtorRecord = {
      ...record,
      id: `DB-${Date.now().toString().slice(-3)}`,
      reminderSentCount: 0,
    };
    records.push(newRecord);

    const wb = XLSX.readFile(DB_FILE_PATH);
    wb.Sheets['Debtors_Creditors'] = XLSX.utils.json_to_sheet(records);
    XLSX.writeFile(wb, DB_FILE_PATH);

    this.logAudit({
      actor: 'owner',
      action: 'ADD_DEBTOR_RECORD',
      permissionTier: 'Tier-4-Execute',
      targetEntity: newRecord.id,
      details: `${newRecord.type.toUpperCase()}: ${newRecord.partyName} owes ${newRecord.amount}`,
      status: 'success',
    });

    return newRecord;
  }

  public static updateDebtorStatus(id: string, status: 'pending' | 'overdue' | 'settled'): boolean {
    this.ensureDatabaseFile();
    const records = this.getDebtors();
    const item = records.find((r) => r.id === id);
    if (!item) return false;

    item.status = status;
    const wb = XLSX.readFile(DB_FILE_PATH);
    wb.Sheets['Debtors_Creditors'] = XLSX.utils.json_to_sheet(records);
    XLSX.writeFile(wb, DB_FILE_PATH);

    return true;
  }

  public static getLoans(): LoanLiability[] {
    this.ensureDatabaseFile();
    try {
      const wb = XLSX.readFile(DB_FILE_PATH);
      const ws = wb.Sheets['Loans_Liabilities'];
      return ws ? XLSX.utils.sheet_to_json(ws) : DEFAULT_LOANS;
    } catch {
      return DEFAULT_LOANS;
    }
  }

  public static recordLoanPayment(id: string, paidAmount: number): boolean {
    this.ensureDatabaseFile();
    const loans = this.getLoans();
    const loan = loans.find((l) => l.id === id);
    if (!loan) return false;

    loan.totalPaid = (loan.totalPaid || 0) + paidAmount;
    loan.remainingBalance = Math.max(0, (loan.remainingBalance || 0) - paidAmount);
    if (loan.remainingBalance === 0) {
      loan.status = 'closed';
    }

    const wb = XLSX.readFile(DB_FILE_PATH);
    wb.Sheets['Loans_Liabilities'] = XLSX.utils.json_to_sheet(loans);
    XLSX.writeFile(wb, DB_FILE_PATH);

    this.logAudit({
      actor: 'owner',
      action: 'LOAN_RECONCILIATION_PAYMENT',
      permissionTier: 'Tier-4-Execute',
      targetEntity: id,
      details: `Paid ${paidAmount} toward ${loan.lenderName}. Remaining: ${loan.remainingBalance}`,
      status: 'success',
    });

    return true;
  }

  public static getAuditLogs(): AuditLogEntry[] {
    this.ensureDatabaseFile();
    try {
      const wb = XLSX.readFile(DB_FILE_PATH);
      const ws = wb.Sheets['Audit_Trail'];
      return ws ? XLSX.utils.sheet_to_json(ws) : [];
    } catch {
      return [];
    }
  }

  public static logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    try {
      this.ensureDatabaseFile();
      const logs = this.getAuditLogs();
      const newEntry: AuditLogEntry = {
        ...entry,
        id: `AUD-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
      };
      logs.push(newEntry);

      const wb = XLSX.readFile(DB_FILE_PATH);
      wb.Sheets['Audit_Trail'] = XLSX.utils.json_to_sheet(logs);
      XLSX.writeFile(wb, DB_FILE_PATH);
    } catch (e) {
      console.error('Audit log failed', e);
    }
  }

  public static getRawWorkbookBuffer(): Buffer {
    this.ensureDatabaseFile();
    return fs.readFileSync(DB_FILE_PATH);
  }

  /**
   * Switches the active business scenario preset between Garments Factory and Artisan Café
   */
  public static switchPreset(preset: 'garments' | 'cafe'): { success: boolean; preset: string } {
    const profile = preset === 'cafe' ? CAFE_PROFILE : DEFAULT_PROFILE;
    const txs = preset === 'cafe' ? CAFE_TRANSACTIONS : DEFAULT_TRANSACTIONS;
    const debtors = preset === 'cafe' ? CAFE_DEBTORS : DEFAULT_DEBTORS;
    const loans = preset === 'cafe' ? CAFE_LOANS : DEFAULT_LOANS;

    const wb = XLSX.utils.book_new();

    const profileRows = [
      { Field: 'Business Name', Value: profile.businessName },
      { Field: 'Industry', Value: profile.industry },
      { Field: 'Start Date', Value: profile.startDate },
      { Field: 'Initial Investment', Value: profile.initialInvestment },
      { Field: 'Worker Count', Value: profile.workerCount },
      { Field: 'Worker Salaries (Monthly)', Value: profile.workerSalariesMonthly },
      { Field: 'Electricity Bill (Monthly)', Value: profile.electricityBillMonthly },
      { Field: 'Rent (Monthly)', Value: profile.rentMonthly },
      { Field: 'Maintenance (Monthly)', Value: profile.maintenanceMonthly },
      { Field: 'Other Fixed Costs', Value: profile.otherFixedCostsMonthly },
      { Field: 'Primary Product', Value: profile.primaryProduct },
      { Field: 'Unit Selling Price', Value: profile.unitSellingPrice },
      { Field: 'Unit Variable Cost', Value: profile.unitVariableCost },
      { Field: 'Fabric Meters Per Unit', Value: profile.fabricMetersPerUnit },
      { Field: 'Fabric Cost Per Meter', Value: profile.fabricCostPerMeter },
      { Field: 'Currency', Value: profile.currency },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(profileRows), 'Business_Profile');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txs), 'Daily_Transactions');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(debtors), 'Debtors_Creditors');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(loans), 'Loans_Liabilities');

    const logs = this.getAuditLogs();
    logs.push({
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      actor: 'owner',
      action: 'SWITCH_DEMO_SCENARIO',
      permissionTier: 'Tier-4-Execute',
      targetEntity: preset,
      details: `Switched demo scenario dataset to ${preset === 'cafe' ? 'BrewCraft Artisan Café (Specialty Coffee)' : 'Loom & Stitch Garments (Factory SME)'}`,
      status: 'success',
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logs), 'Audit_Trail');

    XLSX.writeFile(wb, DB_FILE_PATH);
    return { success: true, preset };
  }
}
