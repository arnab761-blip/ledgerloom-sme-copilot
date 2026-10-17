'use client';

import * as XLSX from 'xlsx';
import {
  BusinessProfile,
  Transaction,
  DebtorRecord,
  LoanLiability,
  AuditLogEntry,
} from './types';
import {
  DEFAULT_PROFILE,
  DEFAULT_TRANSACTIONS,
  DEFAULT_DEBTORS,
  DEFAULT_LOANS,
  DEFAULT_AUDIT_LOGS,
} from './default-datasets';

/**
 * Pure client-side browser Excel database exporter.
 * Generates an authentic .XLSX workbook with all 5 database sheets:
 * 1. Business_Profile
 * 2. Daily_Transactions
 * 3. Debtors_Creditors
 * 4. Loans_Liabilities
 * 5. Audit_Trail
 * 
 * Works 100% offline and on static edge hosts (Cloudflare Pages, Vercel, Netlify)
 * with zero reliance on server API endpoints.
 */
export function exportExcelDatabaseInBrowser(
  profile?: BusinessProfile | null,
  transactions?: Transaction[],
  debtors?: DebtorRecord[],
  loans?: LoanLiability[],
  auditLogs?: AuditLogEntry[],
  filename = 'LedgerLoom_Database.xlsx'
): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const p = profile || DEFAULT_PROFILE;
    const txs = transactions && transactions.length > 0 ? transactions : DEFAULT_TRANSACTIONS;
    const debts = debtors && debtors.length > 0 ? debtors : DEFAULT_DEBTORS;
    const ln = loans && loans.length > 0 ? loans : DEFAULT_LOANS;
    const audits = auditLogs && auditLogs.length > 0 ? auditLogs : DEFAULT_AUDIT_LOGS;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Business_Profile
    const profileRows = [
      { Field: 'Business Name', Value: p.businessName },
      { Field: 'Industry', Value: p.industry },
      { Field: 'Start Date', Value: p.startDate },
      { Field: 'Initial Investment', Value: p.initialInvestment },
      { Field: 'Worker Count', Value: p.workerCount },
      { Field: 'Worker Salaries (Monthly)', Value: p.workerSalariesMonthly },
      { Field: 'Electricity Bill (Monthly)', Value: p.electricityBillMonthly },
      { Field: 'Rent (Monthly)', Value: p.rentMonthly },
      { Field: 'Maintenance (Monthly)', Value: p.maintenanceMonthly },
      { Field: 'Other Fixed Costs', Value: p.otherFixedCostsMonthly },
      { Field: 'Primary Product', Value: p.primaryProduct },
      { Field: 'Unit Selling Price', Value: p.unitSellingPrice },
      { Field: 'Unit Variable Cost', Value: p.unitVariableCost },
      { Field: 'Fabric Meters Per Unit', Value: p.fabricMetersPerUnit },
      { Field: 'Fabric Cost Per Meter', Value: p.fabricCostPerMeter },
      { Field: 'Currency', Value: p.currency },
    ];
    const wsProfile = XLSX.utils.json_to_sheet(profileRows);
    XLSX.utils.book_append_sheet(wb, wsProfile, 'Business_Profile');

    // Sheet 2: Daily_Transactions
    const wsTx = XLSX.utils.json_to_sheet(txs);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Daily_Transactions');

    // Sheet 3: Debtors_Creditors
    const wsDebtors = XLSX.utils.json_to_sheet(debts);
    XLSX.utils.book_append_sheet(wb, wsDebtors, 'Debtors_Creditors');

    // Sheet 4: Loans_Liabilities
    const wsLoans = XLSX.utils.json_to_sheet(ln);
    XLSX.utils.book_append_sheet(wb, wsLoans, 'Loans_Liabilities');

    // Sheet 5: Audit_Trail
    const wsAudit = XLSX.utils.json_to_sheet(audits);
    XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit_Trail');

    // Generate binary buffer using SheetJS
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Trigger instant native browser download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);

    return true;
  } catch (err) {
    console.error('Failed to export Excel database in browser:', err);
    return false;
  }
}
