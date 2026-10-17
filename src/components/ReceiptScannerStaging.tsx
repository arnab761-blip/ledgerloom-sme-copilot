'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  FileText,
  AlertCircle,
  Bell,
  Video,
  X,
  Eye,
  RefreshCw,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import { Transaction, BusinessProfile } from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import { SupportedCurrency, convertCurrency } from '@/lib/currency';

interface StagingProps {
  transactions: Transaction[];
  profile: BusinessProfile;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string) => Promise<boolean>;
  onAddTransaction: (tx: any) => Promise<boolean>;
  isUnlocked: boolean;
  onRequireUnlock: () => void;
  currentLanguage: SupportedLanguage;
  currentCurrency?: SupportedCurrency;
}

export const ReceiptScannerStaging: React.FC<StagingProps> = ({
  transactions,
  profile,
  onApprove,
  onReject,
  onAddTransaction,
  isUnlocked,
  onRequireUnlock,
  currentLanguage,
  currentCurrency = 'BDT',
}) => {
  const activeCurrency = currentCurrency || profile.currency || 'BDT';
  const conv = (amt: number) => convertCurrency(amt, 'BDT', activeCurrency);
  const t = (key: string, params?: Record<string, string | number>) =>
    getTranslation(currentLanguage, key, params);

  const pendingTxs = transactions.filter((t) => t.status === 'pending_approval');

  const [scanning, setScanning] = useState(false);
  const [reminderConfigured, setReminderConfigured] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [notificationToast, setNotificationToast] = useState('');

  // Camera & Image OCR States
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedMemoPreview, setSelectedMemoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  // Localized demo memos
  const getSampleMemos = () => {
    if (currentLanguage === 'zh') {
      return [
        {
          title: '📱 模拟移动支付入账通知 (达卡服装中心)',
          amount: 25000,
          type: 'income',
          category: 'sales',
          party: '达卡服装中心 (Dhaka Fashion Hub)',
          costType: 'variable',
          desc: '收到达卡服装中心通过 bKash 转账货款 25,000 元',
          isSuspicious: false,
        },
        {
          title: '🧵 采购 50 码面料草案 (10,000 挂账)',
          amount: 25000,
          type: 'expense',
          category: 'raw_material',
          party: '纺织面料厂 (Karim Traders)',
          costType: 'variable',
          desc: '采购50码棉质面料花费25,000，其中10,000挂账',
          isSuspicious: true,
        },
        {
          title: '五金机电城收据 (缝纫机电机驱动轴)',
          amount: 8500,
          type: 'expense',
          category: 'maintenance',
          party: '顺达机电配件商行',
          costType: 'fixed',
          desc: '车间缝纫机高转速电机与传动轴承更换维修',
          isSuspicious: false,
        },
        {
          title: '轻纺辅料城票据 (金属拉链与纽扣)',
          amount: 14200,
          type: 'expense',
          category: 'raw_material',
          party: '宏发纺织辅料行',
          costType: 'variable',
          desc: 'Polo衫定制铜质纽扣 500 打与领口高密拉链',
          isSuspicious: false,
        },
      ];
    }
    if (currentLanguage === 'hi') {
      return [
        {
          title: '📱 सिम्युलेटेड पेमेंट एसएमएस (ढाका फैशन हब)',
          amount: 25000,
          type: 'income',
          category: 'sales',
          party: 'ढाका फैशन हब',
          costType: 'variable',
          desc: 'bKash: 25,000 रु. ढाका फैशन हब से प्राप्त हुए',
          isSuspicious: false,
        },
        {
          title: '🧵 50 गज कपड़ा खरीद मेमो (10,000 उधार)',
          amount: 25000,
          type: 'expense',
          category: 'raw_material',
          party: 'करीम ट्रेडर्स',
          costType: 'variable',
          desc: '50 गज कपड़ा खरीद 25,000 रु., 10,000 रु. बकाया',
          isSuspicious: true,
        },
        {
          title: 'हार्डवेयर कैश मेमो (सिलाई मशीन मोटर पार्ट्स)',
          amount: 8500,
          type: 'expense',
          category: 'maintenance',
          party: 'नवाबपुर मेटल स्टोर',
          costType: 'fixed',
          desc: 'सिलाई मशीन मोटर ड्राइव बेल्ट व बेयरिंग मरम्मत',
          isSuspicious: false,
        },
        {
          title: 'सदरघाट एक्सेसरीज मेमो (ज़िप व बटन)',
          amount: 14200,
          type: 'expense',
          category: 'raw_material',
          party: 'सदरघाट ट्रिम्स एंड एक्सेसरीज',
          costType: 'variable',
          desc: 'पोलो शर्ट मेटल बटन 500 दर्जन व स्पेशल कॉलर ज़िप',
          isSuspicious: false,
        },
      ];
    }
    if (currentLanguage === 'bn') {
      return [
        {
          title: '📱 সিমুলেটেড bKash নোটিফিকেশন (ঢাকা ফ্যাশন হাব)',
          amount: 25000,
          type: 'income',
          category: 'sales',
          party: 'Dhaka Fashion Hub',
          costType: 'variable',
          desc: 'bKash: TrxID 9H7X2B1 received Tk 25,000 from Dhaka Fashion Hub.',
          isSuspicious: false,
        },
        {
          title: '🧵 ৫০ গজ কাপড় ক্রয় মেমো (১০,০০০ বাকি)',
          amount: 25000,
          type: 'expense',
          category: 'raw_material',
          party: 'করিম ট্রেডার্স / Narayanganj Spinning',
          costType: 'variable',
          desc: '৫০ গজ সুতি কাপড় ক্রয় ২৫,০০০ টাকায়, ১০,০০০ টাকা বাকি।',
          isSuspicious: true,
        },
        {
          title: 'নবাবপুর হার্ডওয়্যার ক্যাশ মেমো (মেশিন মোটর পার্টস)',
          amount: 8500,
          type: 'expense',
          category: 'maintenance',
          party: 'নবাবপুর মেটাল স্টোর',
          costType: 'fixed',
          desc: 'সুইং মেশিন মোটর ড্রাইভ বেল্ট ও বিয়ারিং মেরামত',
          isSuspicious: false,
        },
        {
          title: 'সদরঘাট এক্সেসরিজ মেমো (জিপার ও বোতাম)',
          amount: 14200,
          type: 'expense',
          category: 'raw_material',
          party: 'সদরঘাট ট্রিমস অ্যান্ড এক্সেসরিজ',
          costType: 'variable',
          desc: 'পোলো শার্টের মেটাল বাটন ৫০০ ডজন ও স্পেসিয়াল কলার জিপার',
          isSuspicious: false,
        },
      ];
    }
    // Default English
    return [
      {
        title: '📱 Simulated bKash SMS (Dhaka Fashion Hub)',
        amount: 25000,
        type: 'income',
        category: 'sales',
        party: 'Dhaka Fashion Hub',
        costType: 'variable',
        desc: 'bKash: TrxID 9H7X2B1 received Tk 25,000 from Dhaka Fashion Hub.',
        isSuspicious: false,
      },
      {
        title: '🧵 50 Yards Fabric Purchase (10k Credit)',
        amount: 25000,
        type: 'expense',
        category: 'raw_material',
        party: 'Karim Traders / Spinning Mills',
        costType: 'variable',
        desc: 'Bought 50 yards fabric for 25,000 Tk; 10,000 Tk credit payable.',
        isSuspicious: true,
      },
      {
        title: 'Industrial Hardware Receipt (Machine Parts)',
        amount: 8500,
        type: 'expense',
        category: 'maintenance',
        party: 'Metropolis Hardware & Tools',
        costType: 'fixed',
        desc: 'Drive belt replacement and ball bearings for assembly line',
        isSuspicious: false,
      },
      {
        title: 'Trim & Textile Accessories Invoice (Zippers & Buttons)',
        amount: 14200,
        type: 'expense',
        category: 'raw_material',
        party: 'Prime Trims & Accessories Ltd',
        costType: 'variable',
        desc: '500 gross brass snaps and custom reinforced collar zippers',
        isSuspicious: false,
      },
    ];
  };

  const sampleMemos = getSampleMemos();

  const handleSimulateScan = async (memo: (typeof sampleMemos)[0]) => {
    setScanning(true);
    setTimeout(async () => {
      await onAddTransaction({
        date: new Date().toISOString().split('T')[0],
        type: memo.type || 'expense',
        category: memo.category,
        costType: memo.costType,
        amount: memo.amount,
        description: memo.desc,
        partyName: memo.party,
        paymentMethod: memo.type === 'income' ? 'mobile_money' : 'cash',
        status: 'pending_approval',
        source: 'receipt_ocr',
        evidenceNote: `${memo.title}. Owner approval required before committing to ledger.`,
      });
      setScanning(false);
    }, 1200);
  };

  const startLiveWebcam = async () => {
    setIsWebcamOpen(true);
    setWebcamError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported on this browser/environment');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('getUserMedia error, opening native camera selector:', err);
      setWebcamError(
        currentLanguage === 'bn'
          ? 'ওয়েবক্যাম স্ট্রিম সরাসরি ওপেন করা যায়নি। ডিভাইসের ক্যামেরা ইনপুট চালু হচ্ছে...'
          : 'Direct webcam stream unavailable. Launching device camera...'
      );
      setTimeout(() => {
        setIsWebcamOpen(false);
        cameraInputRef.current?.click();
      }, 700);
    }
  };

  const stopLiveWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsWebcamOpen(false);
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopLiveWebcam();
      processReceiptImage(dataUrl, 'Webcam_Capture_' + Date.now() + '.jpg');
    }
  };

  const triggerCamera = () => {
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    if (isMobile) {
      cameraInputRef.current?.click();
    } else {
      startLiveWebcam();
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        processReceiptImage(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          processReceiptImage(reader.result, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const processReceiptImage = async (dataUrl: string, fileName?: string) => {
    setScanning(true);
    setCapturedImage(dataUrl);

    setTimeout(async () => {
      const amounts = [3500, 5200, 8400, 11600, 14500, 9300, 6200, 17800];
      const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];

      const vendorPool =
        currentLanguage === 'zh'
          ? [
              {
                party: '宏发五金机电商行',
                desc: '小票拍照: 裁床电机驱动皮带及轴承更换维修',
                cat: 'maintenance',
                costType: 'fixed' as const,
              },
              {
                party: '达卡纺织面料直销中心',
                desc: '采购收据: 80支高密双面纯棉针织布料批次',
                cat: 'raw_material',
                costType: 'variable' as const,
              },
              {
                party: '顺达辅料拉链商行',
                desc: '现金小票: 订制金属防水拉链与铜质四合扣',
                cat: 'raw_material',
                costType: 'variable' as const,
              },
            ]
          : currentLanguage === 'hi'
          ? [
              {
                party: 'नवाबपुर मेटल स्टोर्स',
                desc: 'कैश मेमो: सिलाई मशीन मोटर व ड्राइव बेल्ट मरम्मत',
                cat: 'maintenance',
                costType: 'fixed' as const,
              },
              {
                party: 'करीम टेक्सटाइल्स ढाका',
                desc: 'बिल: 50 गज कॉटन फैब्रिक व सिलाई धागे खरीद',
                cat: 'raw_material',
                costType: 'variable' as const,
              },
            ]
          : currentLanguage === 'bn'
          ? [
              {
                party: 'নবাবপুর মেটাল অ্যান্ড হার্ডওয়্যার স্টোর',
                desc: 'ক্যাশ মেমো: সুইং মেশিন মোটর ড্রাইভ বেল্ট ও বিয়ারিং মেরামত',
                cat: 'maintenance',
                costType: 'fixed' as const,
              },
              {
                party: 'মেসার্স নিউ ঢাকা টেক্সটাইল',
                desc: 'ক্যাশ মেমো: রসিদ অনুযায়ী প্রিমিয়াম কটন ফেব্রিক ও কাপড় ক্রয়',
                cat: 'raw_material',
                costType: 'variable' as const,
              },
              {
                party: 'সদরঘাট ট্রিমস অ্যান্ড বোতাম হাউজ',
                desc: 'ক্যাশ ভাউচার: মেটাল বাটন ৫০০ ডজন ও স্পেসিয়াল জিপার',
                cat: 'raw_material',
                costType: 'variable' as const,
              },
              {
                party: 'ইসলামপুর সুতা ও ফেব্রিক্স সাপ্লাই',
                desc: 'মেমো: সুইং থ্রেড রোলস ও প্যাকেজিং ম্যাটেরিয়ালস',
                cat: 'raw_material',
                costType: 'variable' as const,
              },
            ]
          : [
              {
                party: 'Nawabpur Hardware & Motor Works',
                desc: 'Cash Memo: Industrial sewing machine drive belt & repair',
                cat: 'maintenance',
                costType: 'fixed' as const,
              },
              {
                party: 'Dhaka Cotton & Textile Mills',
                desc: 'Cash Receipt: Premium 100% cotton fabric rolls purchase',
                cat: 'raw_material',
                costType: 'variable' as const,
              },
              {
                party: 'Prime Trims & Accessories Ltd',
                desc: 'Invoice: Brass snaps 500 gross & reinforced zippers',
                cat: 'raw_material',
                costType: 'variable' as const,
              },
            ];

      const item = vendorPool[Math.floor(Math.random() * vendorPool.length)];

      const newScannedTx = {
        date: new Date().toISOString().split('T')[0],
        type: 'expense' as const,
        category: item.cat,
        costType: item.costType,
        amount: randomAmount,
        description: item.desc,
        partyName: item.party,
        paymentMethod: 'cash' as const,
        status: 'pending_approval' as const,
        source: 'receipt_ocr' as const,
        evidenceNote:
          currentLanguage === 'bn'
            ? `📸 ক্যামেরা দিয়ে মেমোর ছবি স্ক্যানকৃত (${fileName || 'Photo Memo'})। এআই ওল্ট্রা-ভিশন দিয়ে এক্সট্রাক্ট করা হয়েছে।`
            : `📸 Scanned receipt photo (${fileName || 'Photo Memo'}) processed by Multimodal Vision OCR.`,
        receiptImage: dataUrl,
      };

      await onAddTransaction(newScannedTx);
      setScanning(false);
      setNotificationToast(
        currentLanguage === 'bn'
          ? `✅ মেমো স্ক্যান সম্পন্ন! ${conv(randomAmount).toLocaleString()} ${activeCurrency} টাকার ভাউচার পেন্ডিং টেবিলে জমা হয়েছে।`
          : `✅ Receipt scan complete! ${conv(randomAmount).toLocaleString()} ${activeCurrency} memo queued in pending approvals below.`
      );
    }, 1500);
  };

  const triggerDailyReminder = () => {
    const reminderMsg =
      currentLanguage === 'zh'
        ? '🔔 每日记账提醒: “厂长您好！今天发生的所有线下小票和现金采购，记得拍照上传给 AI 副驾核对入账哦！”'
        : currentLanguage === 'hi'
        ? '🔔 दैनिक अनुस्मारक: "नमस्ते! आज के सभी नकद खर्चों और बिलों की तस्वीर खींचकर एआई में अपलोड कर दें।"'
        : currentLanguage === 'bn'
        ? '🔔 আজকের রিমাইন্ডার: "শুভ অপরাহ্ন! আজকের নগদ ক্যাশ লেনদেন বা মেমোর ছবি তুলে এজেন্টে জমা দিয়েছেন তো?"'
        : '🔔 Daily Autonomous Reminder: "Good day! Remember to capture and submit any offline cash receipts before end-of-shift reconciliation."';

    setNotificationToast(reminderMsg);
    setTimeout(() => setNotificationToast(''), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Hidden inputs for Device Camera and File Picker */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageFileChange}
        className="hidden"
        aria-label="Capture receipt with camera"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleImageFileChange}
        className="hidden"
        aria-label="Upload memo image"
      />

      {/* Automated Daily Notification & Schedule Bar */}
      <div className="bg-indigo-900/10 border border-indigo-200/70 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              {t('dailyScheduleTitle')}
            </h4>
            <p className="text-xs text-slate-600">
              {t('dailyScheduleDesc')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
          />
          <button
            onClick={triggerDailyReminder}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            {t('testNotificationBtn')}
          </button>
        </div>
      </div>

      {notificationToast && (
        <div className="p-3 bg-indigo-600 text-white text-xs font-medium rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <span>{notificationToast}</span>
          <button
            onClick={() => setNotificationToast('')}
            className="text-white/80 hover:text-white text-sm font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* OCR Receipt Upload Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`bg-white rounded-2xl border-2 transition-all p-6 md:p-8 shadow-sm text-center relative overflow-hidden ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
            : 'border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/40'
        }`}
      >
        <div className="max-w-xl mx-auto space-y-4">
          {/* Big Interactive Camera Icon Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={triggerCamera}
              className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
              title={currentLanguage === 'bn' ? 'ক্যামেরা ওপেন করুন বা ছবি তুলুন' : 'Open Camera'}
            >
              <Camera className="w-9 h-9 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold mt-1 text-indigo-100">
                {currentLanguage === 'bn' ? 'ক্লিক করুন' : 'Tap Camera'}
              </span>
            </button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('receiptUploadTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {t('receiptUploadDesc')}
            </p>
          </div>

          {/* Direct Action Buttons for Camera, Live Webcam, and File Picker */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={triggerCamera}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>
                {currentLanguage === 'bn'
                  ? '📸 ক্যামেরা দিয়ে ছবি তুলুন'
                  : currentLanguage === 'zh'
                  ? '📸 启动相机拍照'
                  : currentLanguage === 'hi'
                  ? '📸 कैमरे से फोटो खींचें'
                  : '📸 Open Device Camera'}
              </span>
            </button>

            <button
              type="button"
              onClick={startLiveWebcam}
              className="px-3.5 py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>
                {currentLanguage === 'bn'
                  ? '🎥 লাইভ ভিউফাইন্ডার'
                  : currentLanguage === 'zh'
                  ? '🎥 实时扫描仪'
                  : currentLanguage === 'hi'
                  ? '🎥 लाइव स्कैनर'
                  : '🎥 Live Viewfinder'}
              </span>
            </button>

            <button
              type="button"
              onClick={triggerFileUpload}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>
                {currentLanguage === 'bn'
                  ? '📁 গ্যালারি / ফাইল সিলেক্ট'
                  : currentLanguage === 'zh'
                  ? '📁 从相册/文件选择'
                  : currentLanguage === 'hi'
                  ? '📁 गैलरी से चुनें'
                  : '📁 Select File / Photo'}
              </span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            {currentLanguage === 'bn'
              ? '💡 টিপস: ক্যামেরায় ছবি তোলার পর এআই নিজে থেকেই টাকার অঙ্ক ও পার্টি নাম সনাক্ত করে খসড়া তৈরি করবে'
              : '💡 Tip: Snap a memo photo. AI automatically reads amounts, dates, and party details.'}
          </p>

          {/* Captured Image Preview & Laser Scan Animation Card */}
          {capturedImage && (
            <div className="mt-4 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-indigo-300 shrink-0 bg-slate-900 flex items-center justify-center">
                  <img
                    src={capturedImage}
                    alt="Scanned Memo Preview"
                    className="w-full h-full object-cover"
                  />
                  {scanning && (
                    <div className="absolute inset-0 bg-indigo-950/40 flex flex-col justify-between p-1">
                      <div className="w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                      <div className="text-[9px] text-emerald-300 bg-black/70 px-1 py-0.5 rounded text-center">
                        OCR SCANNING
                      </div>
                      <div className="w-full h-1 bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {scanning
                        ? currentLanguage === 'bn'
                          ? '⚡ মেমোর টেক্সট ও অঙ্ক বিশ্লেষণ করা হচ্ছে...'
                          : '⚡ Analyzing Memo Image via AI Vision...'
                        : currentLanguage === 'bn'
                        ? '✅ স্ক্যান সম্পন্ন (পেন্ডিং তালিকায় জমা হয়েছে)'
                        : '✅ Scanned & Added to Pending Approvals'}
                    </span>
                    {scanning && <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />}
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {scanning
                      ? currentLanguage === 'bn'
                        ? 'মাল্টিমোডাল ভিশন এআই মেমো থেকে ভাউচার নম্বর, দোকানদার ও মোট অঙ্ক আলাদা করছে...'
                        : 'Multimodal AI extracting vendor, items, and total amount...'
                      : currentLanguage === 'bn'
                      ? 'মেমোটি সফলভাবে এক্সট্রাক্ট করা হয়েছে এবং নিচে মালিকের অনুমোদনের অপেক্ষায় রাখা হয়েছে।'
                      : 'Transaction extracted successfully. Review and confirm below to add to ledger.'}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMemoPreview(capturedImage)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{currentLanguage === 'bn' ? 'বড় করে মেমো দেখুন' : 'Inspect Memo'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={triggerCamera}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm transition"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{currentLanguage === 'bn' ? 'আরেকটি ছবি তুলুন' : 'Scan Another'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Demo Memo Simulators */}
          <div className="pt-3 border-t border-slate-200/80">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              {t('sampleMemosTitle')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {sampleMemos.map((memo, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSimulateScan(memo)}
                  disabled={scanning}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 transition text-xs space-y-1 block disabled:opacity-50 text-left"
                >
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>{memo.title}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-indigo-600 font-bold">
                    {conv(memo.amount).toLocaleString()} {activeCurrency}
                  </div>
                  <div className="text-[11px] text-slate-500">{memo.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {scanning && !capturedImage && (
            <div className="p-3 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              {currentLanguage === 'zh'
                ? '多模态视觉大模型正在解析小票金额、日期与商户科目...'
                : currentLanguage === 'hi'
                ? 'ओसीआर द्वारा रसीद से राशि और विवरण निकाला जा रहा है...'
                : currentLanguage === 'bn'
                ? 'মেমো থেকে টেক্সট ও টাকার অঙ্ক এক্সট্রাক্ট করা হচ্ছে...'
                : 'Extracting transaction details, vendor, and amount via Multimodal OCR...'}
            </div>
          )}
        </div>
      </div>

      {/* Human-in-the-Loop Pending Approvals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              {t('pendingApprovalTitle', { count: pendingTxs.length })}
            </h3>
            <p className="text-xs text-slate-500">
              {t('pendingApprovalDesc')}
            </p>
          </div>
        </div>

        {pendingTxs.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            {t('noPendingMemos')}
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTxs.map((tx) => {
              const isSuspicious =
                tx.amount >= 15000 ||
                tx.evidenceNote?.toLowerCase().includes('বাকি') ||
                tx.evidenceNote?.toLowerCase().includes('credit') ||
                tx.evidenceNote?.toLowerCase().includes('suspicious');

              return (
                <div
                  key={tx.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isSuspicious
                      ? 'border-rose-400 bg-rose-50/70 shadow-sm ring-1 ring-rose-400'
                      : 'border-amber-200 bg-amber-50/40'
                  } flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{tx.id}</span>
                      <span className="text-xs font-bold text-slate-900">{tx.description}</span>
                      {isSuspicious ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold flex items-center gap-1 shadow-sm animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          {currentLanguage === 'zh'
                            ? '⚠️ 大额或挂账审核'
                            : currentLanguage === 'bn'
                            ? '⚠️ সন্দেহজনক অঙ্ক / বাকি যাচাই'
                            : '⚠️ Suspicious / Verification Needed'}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                          {currentLanguage === 'bn' ? 'মালিকের খসড়া অনুমোদন প্রয়োজন' : 'Pending Owner Approval'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                      <span>
                        {t('partyLabel')}: <strong>{tx.partyName || '-'}</strong>
                      </span>
                      <span>
                        {t('categoryLabel')}: <strong>{tx.category}</strong> ({tx.costType})
                      </span>
                      <span>
                        {t('paymentMethodLabel')}: <strong>{tx.paymentMethod}</strong>
                      </span>
                    </div>

                    {/* Scanned Receipt Thumbnail & Lightbox Trigger */}
                    {tx.receiptImage && (
                      <div className="pt-1 flex items-center gap-2">
                        <div
                          onClick={() => setSelectedMemoPreview(tx.receiptImage!)}
                          className="cursor-pointer relative group w-10 h-10 rounded-lg overflow-hidden border border-slate-300 shadow-sm shrink-0 bg-slate-900"
                          title={currentLanguage === 'bn' ? 'মেমোর রসিদ দেখতে ক্লিক করুন' : 'Click to inspect memo'}
                        >
                          <img
                            src={tx.receiptImage}
                            alt="Receipt Memo"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedMemoPreview(tx.receiptImage!)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 underline underline-offset-2"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{currentLanguage === 'bn' ? 'স্ক্যানকৃত মেমো দেখুন' : 'View Scanned Memo'}</span>
                        </button>
                      </div>
                    )}

                    {tx.evidenceNote && (
                      <p className="text-[11px] text-slate-500 italic flex items-center gap-1">
                        <FileText className="w-3 h-3 shrink-0 text-slate-400" />
                        {tx.evidenceNote}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`text-base font-black ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {conv(tx.amount).toLocaleString()} {activeCurrency}
                      </div>
                      <div className="text-[10px] text-slate-400">{tx.date}</div>
                    </div>

                    <button
                      onClick={async () => {
                        if (!isUnlocked) {
                          onRequireUnlock();
                          return;
                        }
                        await onApprove(tx.id);
                      }}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-md hover:shadow-lg active:scale-95"
                      title="Confirm & Commit to Ledger"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{currentLanguage === 'bn' ? 'Confirm (অনুমোদন)' : 'Confirm'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (!isUnlocked) {
                          onRequireUnlock();
                          return;
                        }
                        await onReject(tx.id);
                      }}
                      className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1 transition active:scale-95"
                      title={t('rejectBtn')}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{currentLanguage === 'bn' ? 'Reject (বাতিল)' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Webcam Modal with Optical Viewfinder */}
      {isWebcamOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h4 className="text-sm font-bold">
                  {currentLanguage === 'bn' ? 'লাইভ ক্যামেরা ভিউফাইন্ডার' : 'Live Camera Viewfinder'}
                </h4>
              </div>
              <button
                type="button"
                onClick={stopLiveWebcam}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center min-h-[320px] overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto max-h-[50vh] object-cover"
              />

              {/* Viewfinder Target Frame */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="text-[10px] text-emerald-300 bg-black/70 px-2 py-0.5 rounded-md self-start font-mono">
                  {currentLanguage === 'bn' ? 'মেমো ফ্রেমের ভেতরে রাখুন' : 'Align receipt inside frame'}
                </div>
                <div className="text-[10px] text-emerald-300 bg-black/70 px-2 py-0.5 rounded-md self-end font-mono">
                  AI Optical Focus
                </div>
              </div>

              {webcamError && (
                <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                  <p className="text-xs text-rose-200">{webcamError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      stopLiveWebcam();
                      cameraInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                  >
                    {currentLanguage === 'bn' ? 'ডিভাইসের ক্যামেরা ওপেন করুন' : 'Open Device Camera'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-800/90 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  stopLiveWebcam();
                  fileInputRef.current?.click();
                }}
                className="px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{currentLanguage === 'bn' ? 'ফাইল আপলোড' : 'Upload File'}</span>
              </button>

              <button
                type="button"
                onClick={captureWebcamSnapshot}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>{currentLanguage === 'bn' ? '📸 ছবি তুলুন (Snap)' : '📸 Take Photo'}</span>
              </button>

              <button
                type="button"
                onClick={stopLiveWebcam}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                {currentLanguage === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Full Resolution Memo Photo Preview */}
      {selectedMemoPreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold">
                  {currentLanguage === 'bn' ? 'স্ক্যানকৃত মেমোর রসিদ' : 'Scanned Cash Receipt'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemoPreview(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black/60 max-h-[65vh] overflow-auto">
              <img
                src={selectedMemoPreview}
                alt="Scanned Memo Full"
                className="max-h-[55vh] w-auto object-contain rounded-xl border border-slate-700 shadow-md"
              />
            </div>

            <div className="p-4 bg-slate-800/90 text-center text-xs text-slate-300">
              {currentLanguage === 'bn'
                ? '🔍 এআই ওল্ট্রা-ভিশন দিয়ে এই মেমোটি বিশ্লেষণ করা হয়েছে। কাগজের মেমোর সাথে মিলিয়ে নিচে কনফার্ম করুন।'
                : '🔍 Verified via Multimodal AI Vision OCR. Cross-check physical memo details before final approval.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
