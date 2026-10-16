'use client';

import React, { useState, useRef } from 'react';
import {
  Lock,
  Unlock,
  Download,
  Upload,
  Globe,
  ChevronDown,
} from 'lucide-react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getTranslation,
} from '@/lib/i18n';

interface HeaderProps {
  isUnlocked: boolean;
  remainingMinutes: number;
  onOpenSecurityModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingApprovalsCount: number;
  onRefreshData?: () => void;
  currentLanguage: SupportedLanguage;
  onChangeLanguage: (lang: SupportedLanguage) => void;
  currentPreset?: 'garments' | 'cafe';
  onSwitchPreset?: (preset: 'garments' | 'cafe') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isUnlocked,
  remainingMinutes,
  onOpenSecurityModal,
  activeTab,
  setActiveTab,
  pendingApprovalsCount,
  onRefreshData,
  currentLanguage,
  onChangeLanguage,
  currentPreset = 'garments',
  onSwitchPreset,
}) => {
  const [uploading, setUploading] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

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
        alert('✅ ' + (data.message || 'Excel synced!'));
        if (onRefreshData) onRefreshData();
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch {
      alert('❌ Upload failed!');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const tabs = [
    { id: 'dashboard', label: t('tabDashboard') },
    { id: 'data_entry', label: t('tabDataEntry') },
    {
      id: 'staging',
      label: t('tabStaging'),
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'debtors', label: t('tabDebtors') },
    { id: 'loans', label: t('tabLoans') },
    { id: 'financing', label: t('tabFinancing') },
    { id: 'goal_planner', label: t('tabGoalPlanner') },
    { id: 'copilot', label: t('tabCopilot') },
    { id: 'audit', label: t('tabAudit') },
  ];

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

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
                  {t('appTitle')}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    {t('appBadge')}
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                {t('competitionTrack')}
              </p>
            </div>
          </div>

          {/* Quick Actions, Language Switcher & Security Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scenario Preset Switcher */}
            <div className="flex items-center bg-slate-800 border border-slate-700/80 rounded-lg p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => onSwitchPreset?.('garments')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                  currentPreset === 'garments'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Loom & Stitch Garments (Textile Factory SME)"
              >
                <span>🏭</span>
                <span className="hidden sm:inline">গার্মেন্টস ফ্যাক্টরি</span>
              </button>
              <button
                type="button"
                onClick={() => onSwitchPreset?.('cafe')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                  currentPreset === 'cafe'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="BrewCraft Artisan Café (Competition Coffee Shop Scenario)"
              >
                <span>☕</span>
                <span className="hidden sm:inline">ক্যাফে ডেমো (Café)</span>
              </button>
            </div>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm"
                title="Change Language"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>{currentLangObj.flag} {currentLangObj.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                    Select Language / 语言设置
                  </div>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        onChangeLanguage(l.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/80 transition ${
                        currentLanguage === l.code
                          ? 'text-indigo-400 font-bold bg-slate-700/50'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.nativeName}</span>
                      </span>
                      {currentLanguage === l.code && <span className="text-emerald-400 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
              {uploading ? t('syncing') : t('uploadExcel')}
            </button>

            {/* Download Excel */}
            <a
              href="/api/export-excel"
              download="LedgerLoom_Database.xlsx"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              title="Download actual Excel workbook"
            >
              <Download className="w-3.5 h-3.5" />
              {t('downloadExcel')}
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
                  <span>
                    {t('vaultUnlocked')} ({remainingMinutes}{t('remainingMin')})
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t('vaultLocked')}</span>
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
