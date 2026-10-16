'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { DataEntryAndExcelSync } from '@/components/DataEntryAndExcelSync';
import { ReceiptScannerStaging } from '@/components/ReceiptScannerStaging';
import { DebtorsAlerts } from '@/components/DebtorsAlerts';
import { LoanReconciliation } from '@/components/LoanReconciliation';
import { TargetProfitPlanner } from '@/components/TargetProfitPlanner';
import { CopilotChat } from '@/components/CopilotChat';
import { SecurityAuditModal } from '@/components/SecurityAuditModal';
import {
  BusinessProfile,
  Transaction,
  DebtorRecord,
  LoanLiability,
  AuditLogEntry,
  FinancialHealthMetrics,
} from '@/lib/types';

export default function HomePage() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Security Session State (30-Minute Sliding Lock)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  // Financial Data State
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debtors, setDebtors] = useState<DebtorRecord[]>([]);
  const [loans, setLoans] = useState<LoanLiability[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [metrics, setMetrics] = useState<FinancialHealthMetrics | null>(null);

  // Load Financial Data
  const loadFinancialData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      if (json.success) {
        setProfile(json.profile);
        setTransactions(json.transactions);
        setDebtors(json.debtors);
        setLoans(json.loans);
        setAuditLogs(json.auditLogs);
        setMetrics(json.healthMetrics);
        setDataLoaded(true);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    }
  }, []);

  useEffect(() => {
    loadFinancialData();
  }, [loadFinancialData]);

  // Session Expiration Countdown (Sliding window check)
  useEffect(() => {
    const checkSession = () => {
      if (expiresAt && Date.now() < expiresAt) {
        setIsUnlocked(true);
        const minsLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000));
        setRemainingMinutes(minsLeft);
      } else {
        setIsUnlocked(false);
        setRemainingMinutes(0);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 10000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Unlock Session with PIN
  const handleUnlockSession = async (pin: string) => {
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_pin', pin }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setIsUnlocked(true);
        setExpiresAt(data.session.expiresAt);
        setRemainingMinutes(30);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'সার্ভার এরর' };
    }
  };

  // Renew Sliding Session (+30 mins)
  const handleRefreshSession = async () => {
    try {
      const res = await fetch('/api/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_session', expiresAt }),
      });
      const data = await res.json();
      if (data.success) {
        setExpiresAt(data.expiresAt);
        setRemainingMinutes(30);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Actions
  const handleAddTransaction = async (txData: any) => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_transaction', payload: txData }),
      });
      const data = await res.json();
      if (data.success) {
        await loadFinancialData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleApproveTransaction = async (id: string) => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_transaction', payload: { id } }),
      });
      const data = await res.json();
      if (data.success) {
        await loadFinancialData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleRejectTransaction = async (id: string) => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_transaction', payload: { id } }),
      });
      const data = await res.json();
      if (data.success) {
        await loadFinancialData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUpdateProfile = async (updated: Partial<BusinessProfile>) => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_profile', payload: updated }),
      });
      const data = await res.json();
      if (data.success) {
        await loadFinancialData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleAddDebtor = async (debtorData: any) => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_debtor', payload: debtorData }),
      });
      const data = await res.json();
      if (data.success) {
        await loadFinancialData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleUpdateDebtorStatus = async (id: string, status: 'pending' | 'overdue' | 'settled') => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_debtor_status', payload: { id, status } }),
      });
      const data = await res.json();
      if (data.success) {
        await loadFinancialData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleRecordPayment = async (id: string, amount: number) => {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'record_loan_payment', payload: { id, amount } }),
      });
      const data = await res.json();
      if (data.success) {
        await loadFinancialData();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  if (!dataLoaded || !profile || !metrics) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center font-black text-2xl shadow-2xl mb-4 animate-bounce">
          LL
        </div>
        <h2 className="text-xl font-bold tracking-tight">LedgerLoom SME Copilot</h2>
        <p className="text-xs text-slate-400 mt-1">
          এক্সেলে ডেটাবেস এবং অ্যাকাউন্টিং ইঞ্জিন লোড হচ্ছে...
        </p>
      </div>
    );
  }

  const pendingApprovalsCount = transactions.filter((t) => t.status === 'pending_approval').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        isUnlocked={isUnlocked}
        remainingMinutes={remainingMinutes}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingApprovalsCount={pendingApprovalsCount}
        onRefreshData={loadFinancialData}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            metrics={metrics}
            profile={profile}
            debtors={debtors}
            loans={loans}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'data_entry' && (
          <DataEntryAndExcelSync
            profile={profile}
            transactions={transactions}
            onRefreshData={loadFinancialData}
            onUpdateProfile={handleUpdateProfile}
            onAddTransaction={handleAddTransaction}
            isUnlocked={isUnlocked}
            onRequireUnlock={() => setIsSecurityModalOpen(true)}
          />
        )}

        {activeTab === 'staging' && (
          <ReceiptScannerStaging
            transactions={transactions}
            profile={profile}
            onApprove={handleApproveTransaction}
            onReject={handleRejectTransaction}
            onAddTransaction={handleAddTransaction}
            isUnlocked={isUnlocked}
            onRequireUnlock={() => setIsSecurityModalOpen(true)}
          />
        )}

        {activeTab === 'debtors' && (
          <DebtorsAlerts
            debtors={debtors}
            profile={profile}
            onUpdateDebtorStatus={handleUpdateDebtorStatus}
            onAddDebtor={handleAddDebtor}
            isUnlocked={isUnlocked}
            onRequireUnlock={() => setIsSecurityModalOpen(true)}
          />
        )}

        {activeTab === 'loans' && (
          <LoanReconciliation
            loans={loans}
            profile={profile}
            onRecordPayment={handleRecordPayment}
            isUnlocked={isUnlocked}
            onRequireUnlock={() => setIsSecurityModalOpen(true)}
          />
        )}

        {activeTab === 'goal_planner' && <TargetProfitPlanner profile={profile} />}

        {activeTab === 'copilot' && <CopilotChat onNavigateTab={setActiveTab} />}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              সিকিউরিটি ও কমপ্লায়েন্স অডিট ট্রেইল (Deliverables 05 & 06)
            </h3>
            <p className="text-xs text-slate-500">
              কারখানার প্রতিটি হিসাব পরিবর্তন, এপ্রুভাল এবং এআই টাস্কের অপরিবর্তনীয় অডিট লগ
            </p>
            <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 hover:bg-slate-50 transition flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{log.id}</span>
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-700">
                        {log.permissionTier}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.details}</p>
                    <div className="text-[10px] text-slate-400">
                      Actor: {log.actor} • Time: {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[9px]">
                    {log.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <SecurityAuditModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        isUnlocked={isUnlocked}
        remainingMinutes={remainingMinutes}
        onUnlockSession={handleUnlockSession}
        onRefreshSession={handleRefreshSession}
        auditLogs={auditLogs}
      />
    </div>
  );
}
