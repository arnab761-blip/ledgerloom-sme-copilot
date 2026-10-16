'use client';

import React from 'react';
import { Lock, Unlock, Download, ShieldCheck, Cpu } from 'lucide-react';

interface HeaderProps {
  isUnlocked: boolean;
  remainingMinutes: number;
  onOpenSecurityModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isUnlocked,
  remainingMinutes,
  onOpenSecurityModal,
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  onRefreshData,
}) => {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ এক্সেল ফাইল সফলভাবে সিঙ্ক হয়েছে!');
        if (onRefreshData) onRefreshData();
      } else {
        alert('❌ এরর: ' + data.error);
      }
    } catch {
      alert('❌ আপলোড করতে সমস্যা হয়েছে!');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'data_entry', label: '📝 Data Entry & Excel Sync' },
    {
      id: 'staging',
      label: '📸 Receipt OCR & Staging',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'debtors', label: '⚠️ Debtors Alert (>30k)' },
    { id: 'loans', label: '🏦 Loan Reconcile' },
    { id: 'goal_planner', label: '🎯 Target Profit Plan' },
    { id: 'copilot', label: '🤖 AI CFO Copilot' },
    { id: 'audit', label: '🛡️ Security Audit Log' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-xl">
              LL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  LedgerLoom
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    SME Copilot
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                2026 8th FinTechathon (WeBank) • Topic E: Autonomous SME Finance Participant
              </p>
            </div>
          </div>

          {/* Quick Actions & Security Status */}
          <div className="flex items-center gap-3">
            {/* Hidden File Input for Excel Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />

            {/* Upload Excel Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm disabled:opacity-50"
              title="Upload modified Excel file directly"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'সিঙ্ক হচ্ছে...' : 'Upload .XLSX'}
            </button>

            {/* Download Excel */}
            <a
              href="/api/export-excel"
              download="LedgerLoom_Database.xlsx"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              title="Download actual Excel workbook"
            >
              <Download className="w-3.5 h-3.5" />
              Download .XLSX
            </a>

            {/* 30-min Security Vault Pill */}
            <button
              onClick={onOpenSecurityModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                isUnlocked
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60 animate-pulse'
              }`}
            >
              {isUnlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Vault Unlocked ({remainingMinutes}m)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Vault Locked (Click to Unlock)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto pt-3 mt-1 scrollbar-none border-t border-slate-800/80">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
