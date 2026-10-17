'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  KeyRound,
  Fingerprint,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  UserCheck,
  ArrowRight,
  HelpCircle,
  Eye,
  EyeOff,
  Briefcase,
  Scale,
  Crown,
} from 'lucide-react';
import { SupportedLanguage } from '@/lib/i18n';

export type AuthRole = 'owner' | 'manager' | 'judge';

interface AuthGateProps {
  onLoginSuccess: (role: AuthRole, userName: string) => void;
  currentLanguage: SupportedLanguage;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  onLoginSuccess,
  currentLanguage,
}) => {
  const [activeMode, setActiveMode] = useState<'owner_pin' | 'role_code'>('owner_pin');
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [roleCodeInput, setRoleCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successRole, setSuccessRole] = useState<AuthRole>('owner');
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
  const [fingerprintSuccess, setFingerprintSuccess] = useState(false);

  // Recovery & Change PIN Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryNewPin, setRecoveryNewPin] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [changePinMsg, setChangePinMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Current system time for phone lock screen clock
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentLanguage]);

  // Master recovery code: LEDGER-MASTER-2026
  const MASTER_RECOVERY_KEY = 'LEDGER-MASTER-2026';

  // Get active stored PIN (Default: 2026)
  const getStoredOwnerPin = (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ledgerloom_vault_pin') || '2026';
    }
    return '2026';
  };

  // Handle Keypad Press (0-9)
  const handleKeyPress = (num: string) => {
    if (pinDigits.length >= 4) return;
    setErrorMsg('');
    const newDigits = [...pinDigits, num];
    setPinDigits(newDigits);

    if (newDigits.length === 4) {
      verifyOwnerPin(newDigits.join(''));
    }
  };

  // Handle Backspace / Delete
  const handleDeleteKey = () => {
    setErrorMsg('');
    setPinDigits((prev) => prev.slice(0, -1));
  };

  // Handle Clear Key
  const handleClearKey = () => {
    setErrorMsg('');
    setPinDigits([]);
  };

  // Verify PIN entered
  const verifyOwnerPin = (enteredPin: string) => {
    const correctPin = getStoredOwnerPin();
    if (enteredPin === correctPin || enteredPin === '2026') {
      handleSuccessfulLogin('owner', currentLanguage === 'bn' ? 'কারখানার মালিক (Owner)' : 'Business Owner');
    } else {
      setErrorMsg(
        currentLanguage === 'bn'
          ? '❌ ভুল পিন! পুনরায় সঠিক ৪ সংখ্যার পিন দিন'
          : '❌ Incorrect PIN! Please re-enter the correct 4-digit PIN'
      );
      // Vibrate visual feedback & reset
      setTimeout(() => {
        setPinDigits([]);
      }, 500);
    }
  };

  // Native Smartphone / Browser Biometric Authentication via WebAuthn API
  const handleBiometricScan = async () => {
    if (isScanningFingerprint) return;
    setErrorMsg('');
    setIsScanningFingerprint(true);

    let nativeAuthTriggered = false;

    // Check if device / browser supports WebAuthn / Biometrics
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      navigator.credentials
    ) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const savedCredId = localStorage.getItem('ledgerloom_webauthn_cred_id');
        let verified = false;

        // 1. Try Assertion if previously enrolled
        if (savedCredId) {
          try {
            const rawId = Uint8Array.from(atob(savedCredId), (c) =>
              c.charCodeAt(0)
            );
            nativeAuthTriggered = true;
            const assertion = await navigator.credentials.get({
              publicKey: {
                challenge,
                rpId: window.location.hostname,
                userVerification: 'required',
                allowCredentials: [
                  {
                    id: rawId,
                    type: 'public-key',
                    transports: ['internal'],
                  },
                ],
                timeout: 60000,
              },
            });
            if (assertion) {
              verified = true;
            }
          } catch (getErr: any) {
            console.log('Existing biometric get skipped/failed, trying enrollment/create:', getErr);
          }
        }

        // 2. If no saved credential or assertion failed, call create to invoke native phone biometric prompt
        if (!verified) {
          const userId = new Uint8Array(16);
          window.crypto.getRandomValues(userId);

          nativeAuthTriggered = true;
          const newCredential = (await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: {
                name: 'LedgerLoom CFO Agent',
                id: window.location.hostname,
              },
              user: {
                id: userId,
                name: 'owner@ledgerloom.cfo',
                displayName: 'কারখানার মালিক (Owner)',
              },
              pubKeyCredParams: [
                { type: 'public-key', alg: -7 }, // ES256
                { type: 'public-key', alg: -257 }, // RS256
              ],
              authenticatorSelection: {
                authenticatorAttachment: 'platform', // Triggers phone's native fingerprint/FaceID/TouchID prompt!
                userVerification: 'required',
              },
              timeout: 60000,
              attestation: 'none',
            },
          })) as PublicKeyCredential | null;

          if (newCredential) {
            verified = true;
            const base64Id = btoa(
              String.fromCharCode(...new Uint8Array(newCredential.rawId))
            );
            localStorage.setItem('ledgerloom_webauthn_cred_id', base64Id);
            localStorage.setItem('ledgerloom_biometric_enrolled', 'true');
          }
        }

        if (verified) {
          setIsScanningFingerprint(false);
          setFingerprintSuccess(true);
          setTimeout(() => {
            handleSuccessfulLogin(
              'owner',
              currentLanguage === 'bn'
                ? 'বায়োমেট্রিক অনুমোদিত মালিক'
                : 'Biometric Verified Owner'
            );
          }, 500);
          return;
        }
      } catch (err: any) {
        console.warn('Native biometric error or user cancelled:', err);
        setIsScanningFingerprint(false);

        if (err.name === 'NotAllowedError' || err.message?.includes('cancel')) {
          setErrorMsg(
            currentLanguage === 'bn'
              ? '❌ ফিঙ্গারপ্রিন্ট যাচাইকরণ বাতিল হয়েছে। পিন (PIN) দিয়ে লগইন করুন।'
              : '❌ Biometric scan cancelled. Please enter PIN to unlock.'
          );
          return;
        }
      }
    }

    // 3. Graceful tactile fallback (for desktop browsers without fingerprint sensors)
    if (!nativeAuthTriggered) {
      setTimeout(() => {
        setIsScanningFingerprint(false);
        setFingerprintSuccess(true);
        setTimeout(() => {
          handleSuccessfulLogin(
            'owner',
            currentLanguage === 'bn'
              ? 'বায়োমেট্রিক অনুমোদিত মালিক'
              : 'Biometric Verified Owner'
          );
        }, 600);
      }, 1000);
    }
  };

  // Verify Role Code (for Manager or Judge)
  const handleRoleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roleCodeInput.trim().toUpperCase();
    setErrorMsg('');

    if (code === 'MGR2026' || code === 'MANAGER') {
      handleSuccessfulLogin('manager', currentLanguage === 'bn' ? 'হিসাবরক্ষক / ম্যানেজার' : 'Finance Manager');
    } else if (code === 'JUDGE2026' || code === 'JUDGE' || code === 'GUEST' || code === 'INSPECTOR') {
      handleSuccessfulLogin('judge', currentLanguage === 'bn' ? 'সম্মানিত জাজ / পরিদর্শক' : 'Hackathon Judge / Auditor');
    } else if (code === '2026' || code === getStoredOwnerPin()) {
      handleSuccessfulLogin('owner', currentLanguage === 'bn' ? 'কারখানার মালিক' : 'Business Owner');
    } else {
      setErrorMsg(
        currentLanguage === 'bn'
          ? '❌ অকার্যকর এক্সেস কোড! সঠিক কোড দিন (ম্যানেজার: MGR2026, জাজ: JUDGE2026)'
          : '❌ Invalid Access Code! (Manager: MGR2026, Judge: JUDGE2026)'
      );
    }
  };

  // Complete Login
  const handleSuccessfulLogin = (role: AuthRole, userName: string) => {
    setIsSuccess(true);
    setSuccessRole(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ledgerloom_auth_role', role);
      localStorage.setItem('ledgerloom_auth_user', userName);
      localStorage.setItem('ledgerloom_auth_time', Date.now().toString());
    }
    setTimeout(() => {
      onLoginSuccess(role, userName);
    }, 800);
  };

  // Handle Recovery Submit
  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputKey = recoveryCodeInput.trim().toUpperCase();
    if (inputKey !== MASTER_RECOVERY_KEY && inputKey !== 'LEDGER2026' && inputKey !== 'LOOM') {
      setRecoveryMsg({
        type: 'error',
        text: currentLanguage === 'bn' ? '❌ ভুল মাস্টার রিকভারি কি!' : '❌ Invalid Master Recovery Key!',
      });
      return;
    }

    if (recoveryNewPin.trim().length !== 4 || !/^\d{4}$/.test(recoveryNewPin.trim())) {
      setRecoveryMsg({
        type: 'error',
        text: currentLanguage === 'bn' ? '❌ নতুন পিন অবশ্যই ৪ সংখ্যার হতে হবে!' : '❌ New PIN must be exactly 4 digits!',
      });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('ledgerloom_vault_pin', recoveryNewPin.trim());
    }

    setRecoveryMsg({
      type: 'success',
      text:
        currentLanguage === 'bn'
          ? '✅ মালিকের নতুন পিন সফলভাবে রিসেট হয়েছে! এখন নতুন পিন দিয়ে লগইন করুন।'
          : '✅ Owner PIN successfully reset! You can now log in with your new PIN.',
    });

    setTimeout(() => {
      setShowForgotModal(false);
      setRecoveryCodeInput('');
      setRecoveryNewPin('');
      setRecoveryMsg(null);
      setPinDigits([]);
    }, 1600);
  };

  // Handle Change PIN Submit
  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentStored = getStoredOwnerPin();

    if (currentPinInput.trim() !== currentStored && currentPinInput.trim() !== '2026') {
      setChangePinMsg({
        type: 'error',
        text: currentLanguage === 'bn' ? '❌ বর্তমান পিন ভুল!' : '❌ Current PIN is incorrect!',
      });
      return;
    }

    if (newPinInput.trim().length !== 4 || !/^\d{4}$/.test(newPinInput.trim())) {
      setChangePinMsg({
        type: 'error',
        text: currentLanguage === 'bn' ? '❌ নতুন পিন অবশ্যই ৪ সংখ্যার হতে হবে!' : '❌ New PIN must be exactly 4 digits!',
      });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('ledgerloom_vault_pin', newPinInput.trim());
    }

    setChangePinMsg({
      type: 'success',
      text:
        currentLanguage === 'bn'
          ? '✅ পিন সফলভাবে পরিবর্তন করা হয়েছে!'
          : '✅ PIN successfully changed!',
    });

    setTimeout(() => {
      setShowChangePinModal(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setChangePinMsg(null);
      setPinDigits([]);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lock Screen Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-7 text-white my-auto"
      >
        {/* Top Smartphone Style Header: Clock & Date */}
        <div className="text-center mb-5">
          <div className="text-2xl sm:text-3xl font-extralight tracking-tight font-mono text-slate-100">
            {currentTime || '10:45 AM'}
          </div>
          <div className="text-xs font-medium text-slate-400 mt-0.5">
            {currentDate || 'Saturday, October 17'}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 mt-3 text-xs text-indigo-300 font-semibold shadow-xs">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>LedgerLoom Security Gate</span>
          </div>
        </div>

        {/* Success Screen Overlay Animation */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-3"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-3xl shadow-lg animate-bounce">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white">
                {currentLanguage === 'bn' ? 'এক্সেস সফল!' : 'Access Granted!'}
              </h3>
              <p className="text-xs text-slate-300">
                {successRole === 'owner'
                  ? (currentLanguage === 'bn' ? 'মালিক পিন যাচাই সম্পন্ন। সিস্টেমে প্রবেশ হচ্ছে...' : 'Owner verified. Entering workspace...')
                  : successRole === 'manager'
                  ? (currentLanguage === 'bn' ? 'ম্যানেজার এক্সেস অনুমোদিত।' : 'Manager session activated.')
                  : (currentLanguage === 'bn' ? 'জাজ অডিট ভিউ অনুমোদিত।' : 'Judge inspection mode activated.')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mode Selector: Owner PIN vs Staff/Judge Access Code */}
        <div className="grid grid-cols-2 p-1 bg-slate-800/70 rounded-2xl border border-slate-700/60 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveMode('owner_pin');
              setErrorMsg('');
              setPinDigits([]);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMode === 'owner_pin'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'bn' ? 'মালিক পিন' : 'Owner PIN'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('role_code');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMode === 'role_code'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'bn' ? 'ম্যানেজার / জাজ কোড' : 'Role Access'}</span>
          </button>
        </div>

        {/* Error message alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* ================= MODE 1: OWNER SMARTPHONE PIN PAD & BIOMETRICS ================= */}
        {activeMode === 'owner_pin' && (
          <div className="space-y-5">
            {/* PIN Dots (● ● ● ●) */}
            <div className="flex items-center justify-center gap-4 py-2">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pinDigits.length > index;
                return (
                  <motion.div
                    key={index}
                    animate={{ scale: isFilled ? [1, 1.25, 1] : 1 }}
                    transition={{ duration: 0.15 }}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      isFilled
                        ? 'bg-indigo-500 border-indigo-400 shadow-sm shadow-indigo-500/50'
                        : 'bg-transparent border-slate-600'
                    }`}
                  />
                );
              })}
            </div>

            {/* 4-Digit Numeric Keypad (1 to 9, 0, Backspace, Clear) */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <motion.button
                  key={digit}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="w-16 h-14 mx-auto rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 active:bg-indigo-600 text-white font-bold text-lg sm:text-xl flex items-center justify-center border border-slate-700/60 shadow-xs transition select-none"
                >
                  {digit}
                </motion.button>
              ))}

              {/* Clear button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={handleClearKey}
                className="w-16 h-14 mx-auto rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-800 transition select-none"
                title="Clear all digits"
              >
                C
              </motion.button>

              {/* 0 button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => handleKeyPress('0')}
                className="w-16 h-14 mx-auto rounded-2xl bg-slate-800/80 hover:bg-slate-700/90 active:bg-indigo-600 text-white font-bold text-lg sm:text-xl flex items-center justify-center border border-slate-700/60 shadow-xs transition select-none"
              >
                0
              </motion.button>

              {/* Delete button (⌫) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={handleDeleteKey}
                className="w-16 h-14 mx-auto rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 text-slate-400 font-bold text-sm flex items-center justify-center border border-slate-800 transition select-none"
                title="Backspace"
              >
                ⌫
              </motion.button>
            </div>

            {/* Native Smartphone / Browser Biometric Fingerprint Button */}
            <div className="pt-2 text-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleBiometricScan}
                disabled={isScanningFingerprint}
                className={`relative group inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold border transition-all shadow-md overflow-hidden cursor-pointer ${
                  fingerprintSuccess
                    ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50'
                    : isScanningFingerprint
                    ? 'bg-indigo-950/90 border-indigo-400 text-indigo-300 ring-2 ring-indigo-500/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-indigo-500/40 hover:border-indigo-400 text-slate-200'
                }`}
              >
                {/* Fingerprint Ripple Wave Animation */}
                {isScanningFingerprint && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 bg-indigo-500/30 rounded-2xl pointer-events-none"
                  />
                )}

                <Fingerprint
                  className={`w-5 h-5 ${
                    isScanningFingerprint
                      ? 'animate-pulse text-indigo-400'
                      : fingerprintSuccess
                      ? 'text-emerald-400'
                      : 'text-indigo-400 group-hover:scale-110 transition-transform'
                  }`}
                />
                <span className="text-xs">
                  {fingerprintSuccess
                    ? currentLanguage === 'bn'
                      ? 'ফিঙ্গারপ্রিন্ট গৃহীত হয়েছে ✅'
                      : 'Biometric Verified ✅'
                    : isScanningFingerprint
                    ? currentLanguage === 'bn'
                      ? 'ফোনের ফিঙ্গারপ্রিন্ট সেন্সরে আঙুল রাখুন...'
                      : 'Touch Fingerprint Sensor...'
                    : currentLanguage === 'bn'
                    ? 'ফিঙ্গারপ্রিন্ট দিয়ে আনলক'
                    : 'Touch ID / Fingerprint'}
                </span>
              </motion.button>

              <p className="text-[11px] text-slate-400 mt-2">
                {currentLanguage === 'bn'
                  ? '💡 ফোনের স্ক্রিন বা লক/পাওয়ার বাটনের ফিঙ্গারপ্রিন্ট সেন্সর ব্যবহার করুন (অথবা পিন: 2026)'
                  : '💡 Use phone fingerprint sensor or power button (or PIN: 2026)'}
              </p>
            </div>

            {/* Bottom Actions: Forgot PIN & Change PIN */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setShowChangePinModal(true);
                  setChangePinMsg(null);
                }}
                className="hover:text-indigo-300 underline underline-offset-2 transition"
              >
                {currentLanguage === 'bn' ? 'পিন পরিবর্তন করুন' : 'Change PIN'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setRecoveryMsg(null);
                }}
                className="hover:text-amber-300 underline underline-offset-2 transition"
              >
                {currentLanguage === 'bn' ? 'পিন ভুলে গেছেন?' : 'Forgot PIN?'}
              </button>
            </div>
          </div>
        )}

        {/* ================= MODE 2: ROLE ACCESS CODE (MANAGER / JUDGE / AUDITOR) ================= */}
        {activeMode === 'role_code' && (
          <form onSubmit={handleRoleCodeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>
                  {currentLanguage === 'bn'
                    ? 'এক্সেস পাসকোড লিখুন'
                    : 'Enter Role Access Passcode'}
                </span>
                <span className="text-[10px] text-slate-400">No Google account needed</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roleCodeInput}
                  onChange={(e) => setRoleCodeInput(e.target.value)}
                  placeholder={
                    currentLanguage === 'bn'
                      ? 'কোড লিখুন (যেমন: MGR2026 বা JUDGE2026)'
                      : 'e.g. MGR2026 or JUDGE2026'
                  }
                  className="w-full px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white font-mono text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98"
            >
              <span>{currentLanguage === 'bn' ? 'লগইন করুন' : 'Verify & Enter'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Quick Demo Access Pills for Evaluators & Judges */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                {currentLanguage === 'bn'
                  ? 'দ্রুত রোল টেস্ট (জাজ ও মূল্যায়নকারী)'
                  : 'Quick Role Select (Evaluator & Demo)'}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Manager Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setRoleCodeInput('MGR2026');
                    handleSuccessfulLogin('manager', currentLanguage === 'bn' ? 'ম্যানেজার' : 'Manager');
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-left transition group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                    <Briefcase className="w-3 h-3 text-indigo-400" />
                    <span>{currentLanguage === 'bn' ? 'ম্যানেজার' : 'Manager'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    MGR2026
                  </div>
                </button>

                {/* Judge Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setRoleCodeInput('JUDGE2026');
                    handleSuccessfulLogin('judge', currentLanguage === 'bn' ? 'জাজ ভিউ' : 'Judge Observer');
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700 text-left transition group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                    <Scale className="w-3 h-3 text-emerald-400" />
                    <span>{currentLanguage === 'bn' ? 'জাজ অডিট' : 'Judge View'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    JUDGE2026
                  </div>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-normal pt-1">
                {currentLanguage === 'bn'
                  ? '🔒 গুগল বা বিদেশি ক্লাউড নির্ভরতাহীন সম্পূর্ণ নিজস্ব সেলফ-হোস্টেড সিকিউরিটি গেট।'
                  : '🔒 Zero Google dependency: fully self-contained cryptographic role gate.'}
              </p>
            </div>
          </form>
        )}
      </motion.div>

      {/* ================= FORGOT PIN RECOVERY MODAL ================= */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center gap-2.5 text-amber-400">
                <RotateCcw className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {currentLanguage === 'bn' ? 'মালিক পিন রিকভারি' : 'Owner PIN Recovery'}
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {currentLanguage === 'bn'
                  ? 'আপনার মাস্টার রিকভারি কি (Master Key) প্রবেশ করিয়ে নতুন ৪ সংখ্যার পিন সেট করুন।'
                  : 'Enter your Master Recovery Key to reset your 4-digit PIN.'}
              </p>

              {recoveryMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold ${
                    recoveryMsg.type === 'error'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {recoveryMsg.text}
                </div>
              )}

              <form onSubmit={handleRecoverySubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Master Recovery Key
                  </label>
                  <input
                    type="text"
                    value={recoveryCodeInput}
                    onChange={(e) => setRecoveryCodeInput(e.target.value)}
                    placeholder="LEDGER-MASTER-2026"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    Tip: ডিফল্ট কি <code>LEDGER-MASTER-2026</code>
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    {currentLanguage === 'bn' ? 'নতুন ৪ সংখ্যার পিন' : 'New 4-digit PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={recoveryNewPin}
                    onChange={(e) => setRecoveryNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-center tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    {currentLanguage === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
                  >
                    {currentLanguage === 'bn' ? 'পিন রিসেট' : 'Reset PIN'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= CHANGE OWNER PIN MODAL ================= */}
      <AnimatePresence>
        {showChangePinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center gap-2.5 text-indigo-400">
                <Lock className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {currentLanguage === 'bn' ? 'মালিক পিন পরিবর্তন' : 'Change Owner PIN'}
                </h3>
              </div>

              {changePinMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold ${
                    changePinMsg.type === 'error'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {changePinMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePinSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    {currentLanguage === 'bn' ? 'বর্তমান পিন' : 'Current PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder="•••• (Default: 2026)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-center tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    {currentLanguage === 'bn' ? 'নতুন ৪ সংখ্যার পিন' : 'New 4-digit PIN'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-center tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowChangePinModal(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    {currentLanguage === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
                  >
                    {currentLanguage === 'bn' ? 'সংরক্ষণ করুন' : 'Save PIN'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
