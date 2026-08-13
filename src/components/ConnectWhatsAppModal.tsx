import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  Copy, 
  Check, 
  AlertTriangle, 
  Wifi, 
  Lock, 
  Info,
  Loader2,
  Database,
  MessageSquare,
  Users
} from 'lucide-react';

interface ConnectWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: 'connected' | 'disconnected' | 'connecting';
  onToggleStatus: (targetStatus?: 'connected' | 'disconnected' | 'connecting') => void;
}

export const ConnectWhatsAppModal: React.FC<ConnectWhatsAppModalProps> = ({
  isOpen,
  onClose,
  status = 'connected',
  onToggleStatus
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'code' | 'guide'>('qr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [generatedCode, setGeneratedCode] = useState('WA-8924-K93X');
  const [copied, setCopied] = useState(false);
  const [qrRefreshing, setQrRefreshing] = useState(false);

  // Message Sync Progress State
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStageIndex, setSyncStageIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);

  const syncStages = [
    { text: 'جاري المصادقة وتأكيد رمز التشفير...', icon: Lock },
    { text: 'استلام مفاتيح التشفير بين الطرفين (End-to-End Keys)...', icon: ShieldCheck },
    { text: 'مزامنة محادثات واتساب والرسائل الأخيرة (1,420 رسالة)...', icon: MessageSquare },
    { text: 'مزامنة قائمة المجموعات وجدول البيانات...', icon: Users },
    { text: 'اكتملت المزامنة بنجاح وحسابك متصل الآن!', icon: CheckCircle2 }
  ];

  // Animate progress when status is 'connecting'
  useEffect(() => {
    if (status === 'connecting') {
      setSyncProgress(0);
      setSyncStageIndex(0);
      setCountdown(3);

      const interval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          const next = prev + 5;
          if (next > 80) setSyncStageIndex(3);
          else if (next > 55) setSyncStageIndex(2);
          else if (next > 25) setSyncStageIndex(1);
          else setSyncStageIndex(0);
          return next;
        });
      }, 120);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => {
        clearInterval(interval);
        clearInterval(countdownInterval);
      };
    } else if (status === 'connected') {
      setSyncProgress(100);
      setSyncStageIndex(4);
    }
  }, [status]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNewCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'WA-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += '-';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    setGeneratedCode(code);
  };

  const handleRefreshQr = () => {
    setQrRefreshing(true);
    setTimeout(() => setQrRefreshing(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl text-zinc-100 relative">
        
        {/* Header */}
        <div className="bg-zinc-950 px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-100">ربط واتساب كجهاز مصاحب (Linked Device)</h2>
              <p className="text-xs text-zinc-400 mt-0.5">مراقبة اتصال Socket.io الفورية وإدارة الإقران المباشر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-zinc-900/90 px-6 py-3 border-b border-zinc-800/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">حالة خادم واتساب الحالية:</span>
            {status === 'connected' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                متصل كجهاز مصاحب (نشط)
              </span>
            )}
            {status === 'connecting' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                جاري الاتصال والمزامنة...
              </span>
            )}
            {status === 'disconnected' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                غير متصل
              </span>
            )}
          </div>

          <button
            onClick={() => onToggleStatus(status === 'connected' ? 'disconnected' : 'connecting')}
            disabled={status === 'connecting'}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              status === 'connected'
                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                : status === 'connecting'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-wait'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950/40'
            }`}
          >
            {status === 'connected' && 'فصل الجهاز الآن'}
            {status === 'connecting' && (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                جاري الإقران...
              </>
            )}
            {status === 'disconnected' && 'بدء الإقران والاتصال الآن'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800/80 bg-zinc-950/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl border-t border-x transition-all ${
              activeTab === 'qr'
                ? 'bg-zinc-900 border-zinc-800 text-emerald-400 border-b-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            مسح رمز QR
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl border-t border-x transition-all ${
              activeTab === 'code'
                ? 'bg-zinc-900 border-zinc-800 text-emerald-400 border-b-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            رمز الإقران برقم الهاتف
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl border-t border-x transition-all ${
              activeTab === 'guide'
                ? 'bg-zinc-900 border-zinc-800 text-emerald-400 border-b-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            تعليمات الأمان ومنع الحظر
          </button>
        </div>

        {/* Sync Progress Header Banner */}
        <div className="px-6 pt-4">
          {(status === 'connecting' || (syncProgress > 0 && syncProgress < 100)) && (
            <div className="bg-zinc-950/90 border border-emerald-500/40 rounded-2xl p-4 space-y-3 shadow-2xl relative overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                    {syncProgress < 100 ? (
                      <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                      <span>مزامنة رسائل ومحادثات واتساب المباشرة</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {syncProgress}%
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5 font-medium">
                      {React.createElement(syncStages[syncStageIndex]?.icon || Database, { className: "w-3.5 h-3.5 text-emerald-400 shrink-0" })}
                      <span>{syncStages[syncStageIndex]?.text}</span>
                    </p>
                  </div>
                </div>

                <div className="text-left shrink-0 font-mono text-xs">
                  <span className="text-zinc-400 block text-[10px]">الوقت المتبقي:</span>
                  <span className="font-bold text-amber-400">
                    {syncProgress < 100 ? `~${countdown} ثوانٍ` : 'مكتمل'}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 h-full rounded-full transition-all duration-300 ease-out shadow-md shadow-emerald-500/50 relative"
                  style={{ width: `${syncProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                </div>
              </div>

              {/* Sync Details Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-zinc-300 text-center font-mono">
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/80">
                  <span className="block text-zinc-500 text-[10px]">الرسائل المزمونة</span>
                  <span className="font-bold text-emerald-400">{Math.round((syncProgress / 100) * 1420)} / 1,420</span>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/80">
                  <span className="block text-zinc-500 text-[10px]">المجموعات النشطة</span>
                  <span className="font-bold text-emerald-400">{Math.round((syncProgress / 100) * 48)} / 48</span>
                </div>
                <div className="bg-zinc-900/90 p-2 rounded-xl border border-zinc-800/80">
                  <span className="block text-zinc-500 text-[10px]">سرعة الاتصال</span>
                  <span className="font-bold text-cyan-400">480 msg/s</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          
          {/* TAB 1: QR CODE */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-white rounded-2xl border-4 border-emerald-500/30 shadow-2xl relative group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WhatsAppCompanionPairSession_${Date.now()}`}
                  alt="WhatsApp QR Code"
                  className={`w-48 h-48 transition-opacity ${qrRefreshing ? 'opacity-30' : 'opacity-100'}`}
                />
                <button
                  onClick={handleRefreshQr}
                  className="absolute inset-0 m-auto w-10 h-10 bg-zinc-950/90 text-emerald-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg border border-emerald-500/40"
                  title="تحديث الرمز"
                >
                  <RefreshCw className={`w-5 h-5 ${qrRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="max-w-md space-y-2 text-right bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  خطوات المسح السريع من جوالك:
                </h4>
                <ol className="text-xs text-zinc-300 space-y-1.5 list-decimal list-inside leading-relaxed font-medium">
                  <li>افتح تطبيق **واتساب** في جوالك الرئيسي.</li>
                  <li>انتقل إلى **الإعدادات** (أو الثلاث نقاط بالأعلى) ← اختر **الأجهزة المرتبطة (Linked Devices)**.</li>
                  <li>اضغط على **ربط جهاز (Link a Device)**.</li>
                  <li>وجّه كاميرا الجوال نحو **رمز QR** أعلاه ليتم الاقتران فوراً.</li>
                </ol>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => onToggleStatus('connecting')}
                    disabled={status === 'connecting'}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {status === 'connecting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جاري المزامنة مع الجوال...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>تأكيد مسح QR وبدء المزامنة الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAIRING CODE */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3">
                <label className="block text-xs font-bold text-zinc-300">
                  أدخل رقم جوالك مع مفتاح الدولة (مثل 966500000000)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="9665xxxxxxxx"
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleGenerateNewCode}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    توليد الرمز
                  </button>
                </div>
              </div>

              <div className="bg-zinc-950 p-6 rounded-2xl border border-emerald-500/30 text-center space-y-3">
                <span className="text-xs text-zinc-400 block font-semibold">رمز الإقران الخاص بجهازك:</span>
                <div className="text-3xl font-mono font-black tracking-widest text-emerald-400 bg-zinc-900 py-3 rounded-xl border border-zinc-800 inline-block px-6">
                  {generatedCode}
                </div>
                <div>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'تم النسخ' : 'نسخ الرمز'}
                  </button>
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed space-y-1">
                <p className="font-bold text-emerald-400">طريقة إدخال الرمز في واتساب:</p>
                <p>1. افتح واتساب ← **الأجهزة المرتبطة** ← **ربط جهاز**.</p>
                <p>2. اختر **الربط باستخدام رقم الهاتف بدلاً من ذلك** بالأسفل.</p>
                <p>3. أدخل الرمز الظاهر أعلاه لتأكيد الربط.</p>
              </div>
            </div>
          )}

          {/* TAB 3: ANTI-BAN GUIDANCE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs">
              
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-300 text-sm">ميزة الجهاز المصاحب الرسمية (Multi-Device Protocol)</h4>
                  <p className="text-zinc-300 mt-1 leading-relaxed">
                    يعتمد هذا النظام على بروتوكول واتساب الرسمي المعتمد للأجهزة المرتبطة. هذا يعني أن ربط حسابك يستمر بالعمل حتى لو كان جوالك مغلقاً أو غير متصل بالإنترنت، ودون حذف أو التأثير على محادثاتك.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <h5 className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    قواعد منع حظر الرقم:
                  </h5>
                  <ul className="space-y-1.5 text-zinc-300 list-disc list-inside leading-relaxed">
                    <li>تجنب إرسال مئات الرسائل دفعة واحدة لأرقام لم تراسلك من قبل.</li>
                    <li>استخدم **الفاصل الزمني التلقائي** (مثلاً 5-10 ثوانٍ) بين كل رسالة.</li>
                    <li>فعّل **وضع سلام الذكي (salam)** للحفاظ على طبيعية النشر في المجموعات.</li>
                  </ul>
                </div>

                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                  <h5 className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    الحماية والتشفير:
                  </h5>
                  <ul className="space-y-1.5 text-zinc-300 list-disc list-inside leading-relaxed">
                    <li>جميع البيانات مشفرة بين طرفين (End-to-End Encrypted).</li>
                    <li>يمكنك إلغاء ربط الجهاز في أي لحظة مباشرة من جوالك من قائمة الأجهزة المرتبطة.</li>
                    <li>لا يستطيع أي طرف ثالث الاطلاع على محادثاتك الشخصية.</li>
                  </ul>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-zinc-950 px-6 py-4 border-t border-zinc-800/80 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>نظام الإقران يعمل بتقنية Multi-Device 2.0</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
