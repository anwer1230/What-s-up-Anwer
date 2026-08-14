import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  X, 
  CheckCircle2, 
  Share, 
  PlusSquare, 
  Info, 
  Sparkles,
  ExternalLink,
  Monitor
} from 'lucide-react';

interface PwaInstallBannerProps {
  onInstalledStateChange?: (installed: boolean) => void;
  externalOpenGuide?: boolean;
  onCloseGuide?: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  onInstalledStateChange,
  externalOpenGuide,
  onCloseGuide
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Detect if running inside a standalone PWA window
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      if (isStandaloneMode) {
        setIsInstalled(true);
        if (onInstalledStateChange) onInstalledStateChange(true);
      }
    };

    checkStandalone();

    // Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture the beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] Captured beforeinstallprompt event');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Capture appinstalled event
    const handleAppInstalled = () => {
      console.log('[PWA] App successfully installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallSuccess(true);
      if (onInstalledStateChange) onInstalledStateChange(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstalledStateChange]);

  useEffect(() => {
    if (externalOpenGuide) {
      setShowGuideModal(true);
    }
  }, [externalOpenGuide]);

  // Trigger PWA installation
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        console.log('[PWA] Prompting native install dialog...');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[PWA] User response to install prompt:', outcome);
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setInstallSuccess(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('[PWA] Error triggering install prompt:', err);
        setShowGuideModal(true);
      }
    } else {
      // If prompt event is not available (e.g., iOS Safari or manual guide request)
      setShowGuideModal(true);
    }
  };

  const handleCloseGuideModal = () => {
    setShowGuideModal(false);
    if (onCloseGuide) onCloseGuide();
  };

  // If already running as standalone PWA app, do not show install prompt bar
  if (isStandalone || (isInstalled && !installSuccess)) return null;

  return (
    <>
      {/* 1. Main Floating PWA Install Banner */}
      {!isInstalled && !bannerDismissed && (
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-emerald-500/30 px-4 py-3 shadow-2xl relative z-40 animate-fadeIn">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Left Content */}
            <div className="flex items-center gap-3 text-right w-full sm:w-auto">
              <div className="relative shrink-0">
                <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 text-emerald-400 shadow-md">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-zinc-950 shadow-sm">
                  PWA
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-zinc-100 flex items-center gap-1.5">
                    <span>تثبيت تطبيق "أتمتة تليجرام" على الجوال (PWA)</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </h3>
                  {deferredPrompt ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      جاهز للتثبيت بنقرة واحدة
                    </span>
                  ) : (
                    <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-bold border border-zinc-700">
                      تطبيق ويب تقدمي مستقل
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                  ثبّت المنصة على شاشة هاتفك الرئيسية لتفتح في نافذة مستقلة كـ تطبيق حقيقي بدون شريط المتصفح.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleInstallClick}
                className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 border border-emerald-400/30 active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 animate-bounce" />
                <span>{deferredPrompt ? 'تثبيت التطبيق الآن 📱' : 'تثبيت التطبيق على الجوال'}</span>
              </button>

              <button
                onClick={() => setShowGuideModal(true)}
                className="px-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold rounded-xl transition-all border border-zinc-700/60 flex items-center gap-1.5 cursor-pointer"
                title="شرح طريقة التثبيت"
              >
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden xs:inline">طريقة التثبيت</span>
              </button>

              <button
                onClick={() => setBannerDismissed(true)}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-xl transition-all cursor-pointer"
                title="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Step-by-Step PWA Install Instructions Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 text-right overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-100">تثبيت التطبيق كـ PWA على الشاشة الرئيسية</h3>
                  <p className="text-xs text-zinc-400">خطوات بسيطة لإضافة التطبيق لشاشتك الرئيسية وفتحه في نافذة مستقلة</p>
                </div>
              </div>
              <button
                onClick={handleCloseGuideModal}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct One-Click Install Action if beforeinstallprompt is active */}
            {deferredPrompt && (
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-300 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>متصفحك يتيح التثبيت المباشر بنقرة واحدة!</span>
                </div>
                <button
                  onClick={handleInstallClick}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
                >
                  <Download className="w-4 h-4" />
                  <span>تثبيت التطبيق على جهازك فوراً</span>
                </button>
              </div>
            )}

            {/* Guided Instructions for iOS and Android */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* iPhone / iOS Instructions */}
              <div className={`p-4 rounded-2xl border transition-all ${
                isIOS ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-zinc-950/80 border-zinc-800/80'
              }`}>
                <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs mb-3">
                  <Share className="w-4 h-4 text-cyan-400" />
                  <span>1. أجهزة آيفون والـ iOS (متصفح Safari):</span>
                </div>
                <ol className="text-xs text-zinc-300 space-y-2.5 font-medium list-decimal list-inside pr-1">
                  <li>افتح رابط التطبيق في متصفح **Safari** على جهاز الآيفون.</li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>اضغط على زر المشاركة</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700 text-[10px] font-bold">
                      <Share className="w-3 h-3" /> Share
                    </span>
                    <span>في أسفل متصفح Safari.</span>
                  </li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>اختر **"إضافة إلى الشاشة الرئيسية"**</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 border border-zinc-700 text-[10px] font-bold">
                      <PlusSquare className="w-3 h-3" /> Add to Home Screen
                    </span>
                  </li>
                  <li>اضغط **"إضافة" (Add)** بالزاوية العلوية ليتم تثبيت التطبيق وتوليد أيقونته على الشاشة الرئيسية.</li>
                </ol>
              </div>

              {/* Android / Chrome Instructions */}
              <div className={`p-4 rounded-2xl border transition-all ${
                !isIOS ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-zinc-950/80 border-zinc-800/80'
              }`}>
                <div className="flex items-center gap-2 text-zinc-100 font-bold text-xs mb-3">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>2. أجهزة أندرويد والحاسوب (Chrome / Edge / Brave):</span>
                </div>
                <ol className="text-xs text-zinc-300 space-y-2.5 font-medium list-decimal list-inside pr-1">
                  <li>افتح القائمة (⋮) أعلى متصفح كروم.</li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    <span>اختر **"تثبيت التطبيق"**</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 border border-zinc-700 text-[10px] font-bold">
                      <Download className="w-3 h-3" /> Install App
                    </span>
                    <span>أو "إضافة إلى الشاشة الرئيسية".</span>
                  </li>
                  <li>أكّد التثبيت وستفتح المنصة في نافذة مستقلة كـ تطبيق PWA كامل!</li>
                </ol>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-zinc-800">
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                تطبيق PWA بدون متصفح مع شاشة كاملة وأداء سريع
              </span>
              <button
                onClick={handleCloseGuideModal}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. Success Modal when App Installed */}
      {installSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-emerald-500/40 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-100">تم تثبيت التطبيق بنجاح! 📱</h3>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                تطبيق "أتمتة تليجرام" موجود الآن في شاشة جوالك الرئيسية وجاهز للاستخدام في نافذة مستقلة كـ PWA.
              </p>
            </div>
            <button
              onClick={() => setInstallSuccess(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              افتح التطبيق وابدأ الاستخدام
            </button>
          </div>
        </div>
      )}
    </>
  );
};
