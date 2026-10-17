import { NextResponse } from 'next/server';
import { ExcelDatabase } from '@/lib/excel-database';
import { AccountingEngine } from '@/lib/accounting-engine';

import { SupportedLanguage } from '@/lib/i18n';
import { SupportedCurrency } from '@/lib/currency';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const lang = (url.searchParams.get('lang') || 'en') as SupportedLanguage;
    const currency = (url.searchParams.get('currency') || 'BDT') as SupportedCurrency;

    const profile = ExcelDatabase.getProfile();
    const transactions = ExcelDatabase.getTransactions();
    const debtors = ExcelDatabase.getDebtors();
    const loans = ExcelDatabase.getLoans();
    const auditLogs = ExcelDatabase.getAuditLogs();

    const healthMetrics = AccountingEngine.computeFinancialHealth(
      profile,
      transactions,
      debtors,
      loans
    );
    const breakEven = AccountingEngine.calculateBreakEven(profile);
    const financingOptions = AccountingEngine.matchFinancingOptions(
      profile,
      healthMetrics,
      debtors,
      lang,
      currency
    );
    const anomalies = AccountingEngine.detectAnomalies(
      profile,
      healthMetrics,
      transactions,
      debtors,
      lang,
      currency
    );

    return NextResponse.json({
      success: true,
      profile,
      transactions,
      debtors,
      loans,
      auditLogs,
      healthMetrics,
      breakEven,
      financingOptions,
      anomalies,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'add_transaction': {
        const newTx = ExcelDatabase.addTransaction(payload);
        return NextResponse.json({ success: true, transaction: newTx });
      }

      case 'approve_transaction': {
        const approved = ExcelDatabase.approveTransaction(payload.id);
        return NextResponse.json({ success: true, transaction: approved });
      }

      case 'reject_transaction': {
        const success = ExcelDatabase.rejectTransaction(payload.id);
        return NextResponse.json({ success });
      }

      case 'edit_transaction': {
        const updated = ExcelDatabase.editTransaction(payload);
        return NextResponse.json({ success: !!updated, transaction: updated });
      }

      case 'update_profile': {
        const updated = ExcelDatabase.updateProfile(payload);
        return NextResponse.json({ success: true, profile: updated });
      }

      case 'add_debtor': {
        const newDebtor = ExcelDatabase.addDebtor(payload);
        return NextResponse.json({ success: true, debtor: newDebtor });
      }

      case 'update_debtor_status': {
        const success = ExcelDatabase.updateDebtorStatus(payload.id, payload.status);
        return NextResponse.json({ success });
      }

      case 'record_loan_payment': {
        const success = ExcelDatabase.recordLoanPayment(payload.id, payload.amount);
        return NextResponse.json({ success });
      }

      case 'switch_preset': {
        const result = ExcelDatabase.switchPreset(payload.preset);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
