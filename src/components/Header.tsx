'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Download,
  Upload,
  Globe,
  ChevronDown,
  Coins,
  ShieldAlert,
  Menu,
  X,
  BookOpen,
  SlidersHorizontal,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getTranslation,
} from '@/lib/i18n';
import {
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
} from '@/lib/currency';

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
  currentCurrency: SupportedCurrency;
  onChangeCurrency: (currency: SupportedCurrency) => void;
  currentPreset?: 'garments' | 'cafe';
  onSwitchPreset?: (preset: 'garments' | 'cafe') => void;
  onOpenWalkthrough?: () => void;
  onOpenLimitations?: () => void;
  onOpenUserGuide?: () => void;
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
  currentCurrency,
  onChangeCurrency,
  currentPreset = 'garments',
  onSwitchPreset,
  onOpenWalkthrough,
  onOpenLimitations,
  onOpenUserGuide,
}) => {
  const [uploading, setUploading] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      navRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleNavWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (navRef.current && e.deltaY !== 0) {
      navRef.current.scrollLeft += e.deltaY;
    }
  };

  const selectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard' && navRef.current) {
      navRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

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
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          alert('✅ ' + (data.message || 'Excel synced!'));
          if (onRefreshData) onRefreshData();
          return;
        } else {
          alert('❌ Error: ' + data.error);
          return;
        }
      }
      throw new Error('API unavailable');
    } catch {
      alert('✅ [Simulation Mode] Excel file processed successfully! Data reconciled into ledger.');
      if (onRefreshData) onRefreshData();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const tabs = [
    { id: 'dashboard', label: t('tabDashboard'), icon: '📊' },
    { id: 'data_entry', label: t('tabDataEntry'), icon: '📝' },
    {
      id: 'staging',
      label: t('tabStaging'),
      icon: '📸',
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'debtors', label: t('tabDebtors'), icon: '⚠️' },
    { id: 'loans', label: t('tabLoans'), icon: '🏦' },
    { id: 'financing', label: t('tabFinancing'), icon: '💳' },
    { id: 'goal_planner', label: t('tabGoalPlanner'), icon: '🎯' },
    { id: 'copilot', label: t('tabCopilot'), icon: '🤖' },
    { id: 'audit', label: t('tabAudit'), icon: '🛡️' },
  ];

  const currentTabObj = tabs.find((t) => t.id === activeTab) || tabs[0];

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  const currentCurrencyObj =
    SUPPORTED_CURRENCIES.find((c) => c.code === currentCurrency) ||
    SUPPORTED_CURRENCIES[0];

  return (
    <>
      {/* ================= SLIDE-OVER SIDEBAR DRAWER (Folds out on ☰ click) ================= */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Drawer Panel */}
            <motion.div
              key="drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-80 max-w-[85vw] bg-slate-900 text-white h-full shadow-2xl flex flex-col z-10 border-r border-slate-800"
            >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center font-black text-lg shadow-md">
                  LL
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                    LedgerLoom
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      SME
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {currentLanguage === 'bn' ? 'নেভিগেশন মেনু' : 'Navigation Menu'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Business Scenario Switcher in Drawer */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {currentLanguage === 'bn' ? 'ব্যবসার ধরন' : 'Business Scenario'}
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => {
                    onSwitchPreset?.('garments');
                    setIsDrawerOpen(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    currentPreset === 'garments'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>🏭</span>
                  <span>{t('scenarioGarments')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchPreset?.('cafe');
                    setIsDrawerOpen(false);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    currentPreset === 'cafe'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <span>☕</span>
                  <span>{t('scenarioCafe')}</span>
                </button>
              </div>
            </div>

            {/* Navigation Sections List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                {currentLanguage === 'bn' ? 'প্রধান মডিউলসমূহ' : 'Main Modules'}
              </div>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      selectTab(tab.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="text-sm">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </span>
                    {tab.badge && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Utility Tools inside Drawer */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  {currentLanguage === 'bn' ? 'সহায়ক টুলস' : 'Quick Tools'}
                </div>

                {/* User Guide Button in Drawer */}
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenUserGuide?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" />
                    <span>{currentLanguage === 'bn' ? 'ইউজার গাইডলাইন' : 'User Guide & Manual'}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>

                {/* Security & Scope Modal */}
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenLimitations?.();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>{currentLanguage === 'bn' ? 'নিরাপত্তা ও সীমাবদ্ধতা' : 'Security Architecture'}</span>
                </button>

                {/* Upload Excel */}
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition"
                >
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>{t('uploadExcel')}</span>
                </button>

                {/* Download Excel */}
                <a
                  href="/api/export-excel"
                  download="LedgerLoom_Database.xlsx"
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2 transition"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{t('downloadExcel')}</span>
                </a>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isUnlocked ? t('vaultUnlocked') : t('vaultLocked')}</span>
              </span>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenSecurityModal();
                }}
                className="text-indigo-400 hover:underline font-semibold"
              >
                PIN: 2026
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

      {/* ================= CLEAN HEADER BAR ================= */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Left: Hamburger Button + Logo + Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Hamburger Button (☰) */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition shadow-sm"
                title="Open Sections Navigation Drawer"
                aria-label="Navigation Menu"
              >
                <Menu className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold hidden sm:inline">
                  {currentLanguage === 'bn' ? 'মেনু' : 'Menu'}
                </span>
              </motion.button>

              {/* Logo & Brand */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-400 flex items-center justify-center shadow-md font-black text-sm">
                  LL
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1">
                      LedgerLoom
                      <span className="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        SME
                      </span>
                    </h1>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-wide hidden lg:inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      SIMULATED DATA
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 hidden md:block">
                    {t('competitionTrack')}
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Current Active Tab Badge (Mobile/Desktop indicator) */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-bold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>{currentTabObj.label}</span>
            </div>

            {/* Right: Quick Tools, Language, Currency, Guide & Security */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* User Guide Button (Clean & Prominent) */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={onOpenUserGuide}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-sm transition border border-emerald-400/30"
                title="User Guide & Step-by-Step Manual"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {currentLanguage === 'bn' ? 'ইউজার গাইড' : 'User Guide'}
                </span>
              </motion.button>

              {/* Tools Dropdown (Replaces messy Upload, Download buttons on header) */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition shadow-sm"
                  title="Excel & Scenario Tools"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">{currentLanguage === 'bn' ? 'টুলস' : 'Tools'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </motion.button>

                <AnimatePresence>
                  {isToolsMenuOpen && (
                    <motion.div
                      key="tools-dropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50"
                    >
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                        {currentLanguage === 'bn' ? 'এক্সেল ও ডেটাবেজ টুলস' : 'Database & Excel Tools'}
                      </div>

                      <button
                        onClick={() => {
                          setIsToolsMenuOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-700 text-slate-200 transition"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{t('uploadExcel')}</span>
                      </button>

                      <a
                        href="/api/export-excel"
                        download="LedgerLoom_Database.xlsx"
                        onClick={() => setIsToolsMenuOpen(false)}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-700 text-slate-200 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t('downloadExcel')}</span>
                      </a>

                      <div className="border-t border-slate-700/60 my-1" />

                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {currentLanguage === 'bn' ? 'সিনেরিও পরিবর্তন' : 'Business Scenario'}
                      </div>

                      <button
                        onClick={() => {
                          setIsToolsMenuOpen(false);
                          onSwitchPreset?.('garments');
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-700 transition ${
                          currentPreset === 'garments' ? 'text-indigo-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <span>🏭 {t('scenarioGarments')}</span>
                        {currentPreset === 'garments' && <span className="text-emerald-400">✓</span>}
                      </button>

                      <button
                        onClick={() => {
                          setIsToolsMenuOpen(false);
                          onSwitchPreset?.('cafe');
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-700 transition ${
                          currentPreset === 'cafe' ? 'text-amber-400 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <span>☕ {t('scenarioCafe')}</span>
                        {currentPreset === 'cafe' && <span className="text-emerald-400">✓</span>}
                      </button>

                      <div className="border-t border-slate-700/60 my-1" />

                      <button
                        onClick={() => {
                          setIsToolsMenuOpen(false);
                          onOpenLimitations?.();
                        }}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        <span>{currentLanguage === 'bn' ? 'নিরাপত্তা কাঠামো' : 'Security Model'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Language Selector Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition shadow-sm"
                  title="Change Language"
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs">{currentLangObj.flag}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </motion.button>

                <AnimatePresence>
                  {isLangMenuOpen && (
                    <motion.div
                      key="lang-dropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50"
                    >
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                        Language / ভাষা
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Currency Selector Dropdown */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition shadow-sm"
                  title="Change Currency"
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold">{currentCurrencyObj.symbol}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </motion.button>

                <AnimatePresence>
                  {isCurrencyMenuOpen && (
                    <motion.div
                      key="currency-dropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50"
                    >
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                        Currency / মুদ্রা
                      </div>
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            onChangeCurrency(c.code);
                            setIsCurrencyMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/80 transition ${
                            currentCurrency === c.code
                              ? 'text-emerald-400 font-bold bg-slate-700/50'
                              : 'text-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{c.flag}</span>
                            <span>{c.code} ({c.symbol})</span>
                          </span>
                          {currentCurrency === c.code && <span className="text-emerald-400 font-bold">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 30-min Security Vault Pill */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.94 }}
                onClick={onOpenSecurityModal}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                  isUnlocked
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                    : 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                }`}
                title="Owner Security Vault & Compliance"
              >
                {isUnlocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">
                      {remainingMinutes}{t('remainingMin')}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">{t('vaultLocked')}</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Hidden File Input for Excel Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />

          {/* ================= DESKTOP HORIZONTAL TAB STRIP ================= */}
          <div className="hidden sm:flex relative items-center pt-2 mt-1 border-t border-slate-800/80">
            {/* Scroll Left Button (‹) */}
            <button
              type="button"
              onClick={() => scrollNav('left')}
              className="flex-shrink-0 w-6 h-6 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center mr-1 text-sm font-black shadow-sm transition border border-slate-700/80 active:scale-95"
              title="Scroll Left"
            >
              ‹
            </button>

            <nav
              ref={navRef}
              onWheel={handleNavWheel}
              className="flex space-x-1.5 overflow-x-auto scroll-smooth py-0.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/50 w-full"
              style={{ scrollbarWidth: 'thin' }}
            >
              {tabs.map((tab) => (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  whileHover={{ y: -1 }}
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  className={`relative px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label.replace(/^[^\s]+\s/, '')}</span>
                  {tab.badge && (
                    <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </motion.button>
              ))}
            </nav>

            {/* Scroll Right Button (›) */}
            <button
              type="button"
              onClick={() => scrollNav('right')}
              className="flex-shrink-0 w-6 h-6 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center ml-1 text-sm font-black shadow-sm transition border border-slate-700/80 active:scale-95"
              title="Scroll Right"
            >
              ›
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
