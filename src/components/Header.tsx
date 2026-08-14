import React from 'react';
import { MessageSquare, Play, Square, RefreshCw, Smartphone, ShieldCheck, Zap, Download } from 'lucide-react';

interface HeaderProps {
  monitoringActive: boolean;
  whatsappStatus?: 'connected' | 'disconnected' | 'connecting';
  stats: { sent: number; errors: number; received: number };
  onStartMonitoring: () => void;
  onStopMonitoring: () => void;
  onRefresh: () => void;
  onOpenConnectModal?: () => void;
  onOpenPwaGuide?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  monitoringActive,
  whatsappStatus = 'connected',
  stats,
  onStartMonitoring,
  onStopMonitoring,
  onRefresh,
  onOpenConnectModal,
  onOpenPwaGuide
}) => {
  return (
    <header className="bg-zinc-900/90 border-b border-zinc-800/90 shadow-2xl backdrop-blur-xl relative z-30">
      {/* Top subtle glow line */}
      <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 w-full"></div>
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Status */}
          <div className="flex items-center gap-3.5 text-right">
            <div className="p-3 bg-emerald-500/10 backdrop-blur-md rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-950/40">
              <MessageSquare className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100 font-['Cairo',sans-serif]">
                  مركز سرعة إنجاز
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-400" />
                  <span>v2.5 برو</span>
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {/* Connection Status Badge */}
                <button
                  onClick={onOpenConnectModal}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    whatsappStatus === 'connected'
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20'
                      : whatsappStatus === 'connecting'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 animate-pulse'
                  }`}
                  title="انقر لربط أو توثيق حساب Telegram (API_ID: 22043994)"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    whatsappStatus === 'connected' ? 'bg-sky-400 shadow-sm shadow-sky-400' :
                    whatsappStatus === 'connecting' ? 'bg-amber-500 animate-ping' :
                    'bg-rose-500'
                  }`}></span>
                  <span>
                    {whatsappStatus === 'connected' ? 'تليجرام متصل (MTProto)' :
                     whatsappStatus === 'connecting' ? 'جاري المزامنة...' :
                     'تليجرام غير متصل (اضغط للربط)'}
                  </span>
                </button>

                {/* Session Guard Badge */}
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700/60 rounded-full text-[11px]">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>نظام الاستمرارية مُفعل</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Metrics */}
          <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto">
            <div className="bg-zinc-950/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800/80 text-center shadow-inner">
              <span className="text-[11px] text-zinc-400 font-semibold block">إجمالي المرسل</span>
              <span className="text-lg font-black text-zinc-100">{stats.sent}</span>
            </div>
            <div className="bg-zinc-950/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800/80 text-center shadow-inner">
              <span className="text-[11px] text-zinc-400 font-semibold block">المستلمة</span>
              <span className="text-lg font-black text-emerald-400">{stats.received}</span>
            </div>
            <div className="bg-zinc-950/70 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800/80 text-center shadow-inner">
              <span className="text-[11px] text-zinc-400 font-semibold block">الأخطاء</span>
              <span className="text-lg font-black text-rose-400">{stats.errors}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPwaGuide}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-bold rounded-xl transition-all border border-emerald-500/30 text-xs shadow-sm cursor-pointer"
              title="تثبيت التطبيق على الجوال كـ PWA"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline">تثبيت التطبيق</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PWA
              </span>
            </button>
            <button
              onClick={onOpenConnectModal}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-sky-600 to-teal-500 hover:from-sky-500 hover:to-teal-400 text-white font-bold rounded-xl transition-all border border-sky-400/30 text-xs shadow-md shadow-sky-950/40 cursor-pointer"
              title="تسجيل الدخول لحساب تليجرام برقم الهاتف وكود التحقق"
            >
              <Smartphone className="w-4 h-4 text-sky-200" />
              <span>تسجيل الدخول بالهاتف والكود</span>
            </button>
            <button
              onClick={onRefresh}
              className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 rounded-xl transition-all border border-zinc-700/50 shadow-sm cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
