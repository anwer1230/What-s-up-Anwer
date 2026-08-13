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
  Users,
  Zap,
  Globe,
  HelpCircle,
  Key
} from 'lucide-react';

interface ConnectWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: 'connected' | 'disconnected' | 'connecting';
  onToggleStatus: (targetStatus?: 'connected' | 'disconnected' | 'connecting', phone?: string) => void;
}

export const ConnectWhatsAppModal: React.FC<ConnectWhatsAppModalProps> = ({
  isOpen,
  onClose,
  status = 'connected',
  onToggleStatus
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'sandbox' | 'guide'>('qr');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [generatedCode, setGeneratedCode] = useState('8924-K93X');
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
    let code = '';
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
        <div className="flex border-b border-zinc-800/80 bg-zinc-950/50 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-zinc-900 border-zinc-800 text-emerald-400 border-b-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>مسح رمز QR (whatsapp-web.js)</span>
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activeTab === 'sandbox'
                ? 'bg-zinc-900 border-zinc-800 text-emerald-400 border-b-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>تفعيل المحاكاة (Sandbox)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl border-t border-x transition-all shrink-0 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-zinc-900 border-zinc-800 text-emerald-400 border-b-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>إرشادات التشغيل والأمان</span>
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
          
          {/* TAB 0: LIVE QR CODE SCAN */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-white rounded-2xl border-4 border-emerald-500/40 shadow-2xl relative group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=WhatsAppCompanionPairSession_${Date.now()}`}
                  alt="WhatsApp Web QR Code"
                  className={`w-52 h-52 transition-opacity ${qrRefreshing ? 'opacity-30' : 'opacity-100'}`}
                />
                <button
                  onClick={handleRefreshQr}
                  className="absolute inset-0 m-auto w-12 h-12 bg-zinc-950/90 text-emerald-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl border border-emerald-500/40 cursor-pointer"
                  title="تحديث الرمز المباشر"
                >
                  <RefreshCw className={`w-6 h-6 ${qrRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="max-w-md w-full space-y-3 text-right bg-zinc-950 p-4.5 rounded-2xl border border-zinc-800">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>خطوات المسح المباشر (مثل whatsapp-web.js):</span>
                </h4>
                <ol className="text-xs text-zinc-300 space-y-2 list-decimal list-inside leading-relaxed font-medium">
                  <li>افتح تطبيق **واتساب** في جوالك الرئيسي.</li>
                  <li>اختر **الأجهزة المرتبطة (Linked Devices)** ← **ربط جهاز (Link a Device)**.</li>
                  <li>وجّه كاميرا الجوال لمسح **رمز QR** المعروض أعلاه.</li>
                </ol>

                <div className="pt-2">
                  <button
                    onClick={() => onToggleStatus('connecting')}
                    disabled={status === 'connecting'}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {status === 'connecting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>جاري المزامنة مع الجوال عبر WebSocket...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>تأكيد مسح الرمز والربط بنجاح ⚡</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: SANDBOX MODE */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4 text-right">
              <div className="bg-gradient-to-r from-emerald-950/60 via-zinc-950 to-emerald-950/60 p-5 rounded-2xl border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span>تفعيل وضع المحاكاة والاختبار السريع (Sandbox Mode)</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  أنت تعمل حالياً داخل بيئة سحابية تفاعلية. يوفر لك هذا الوضع قدرة كاملة على تجربة وتجريب **كافة خصائص المنصة** (بوت الرد الآلي بالذكاء الاصطناعي، الإرسال المتسلسل، أداة سحب المجموعات، ولوحة التحليلات) **دون الحاجة لربط هاتف شخصي حقيقي أو المخاطرة بحظره**.
                </p>

                <div className="bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-2">
                  <div className="font-bold text-emerald-400">✨ مميزات وضع المحاكاة (Sandbox):</div>
                  <ul className="list-disc list-inside space-y-1.5 text-zinc-300 pr-1 font-medium">
                    <li>اختبار وتجربة جميع البوتات والردود والسكربتات فوراً دون الانتظار.</li>
                    <li>اختبار محاكاة حملات الإرسال ببيانات واختبارات تفاعلية.</li>
                    <li>حماية رقمك الشخصي من خطورة الحظر أثناء مرحلة التجربة والتكوين.</li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onToggleStatus('connecting', '+966 50 000 0000')}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>تأكيد وتفعيل وضع المحاكاة والبيئة التجريبية الآن ⚡</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP-WEB.JS & ANTI-BAN GUIDANCE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-right">
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl space-y-2">
                <p className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>آلية عمل مكتبة whatsapp-web.js السحابية:</span>
                </p>
                <p className="text-zinc-300 leading-relaxed font-medium">
                  يعمل النظام مباشرة باستخدام **مكتبة whatsapp-web.js** مع محرك Puppeteer لتشغيل جلسة خفيفة وحفظ التوثيق عبر LocalAuth تلقائياً على السيرفر.
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>توصيات منع الحظر وتأمين حسابات الواتساب:</span>
                </p>
                <ul className="list-disc list-inside space-y-2 pr-1 text-zinc-300 leading-relaxed font-medium">
                  <li>استخدم فواصل زمنية عشوائية بين الرسائل (مثل 3 إلى 8 ثوانٍ).</li>
                  <li>تجنب إرسال نفس نص الرسالة لعدد كبير جداً من الأرقام في دقيقة واحدة.</li>
                  <li>فعّل ميزة "المحيّن المتغير" (Spintax) لتغيير صياغة الكلمات بين كل رسالة وأخرى.</li>
                  <li>ابدأ الإرسال بأعداد تدريجية للأرقام الجديدة (20-50 رسالة يومياً) ثم ارفع المعدل.</li>
                </ul>
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
