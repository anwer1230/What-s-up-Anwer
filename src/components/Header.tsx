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
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black tracking-tight text-zinc-100">منصة أتمتة وإدارة واتساب</h1>
                
                {/* Real-time Socket.io Status Indicator */}
                <button
                  onClick={onOpenConnectModal}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    whatsappStatus === 'connected'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                      : whatsappStatus === 'connecting'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                  }`}
                  title="اضغط لإدارة إقران واتساب"
                >
                  {whatsappStatus === 'connected' && (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                      </span>
                      <span>متصل كجهاز مصاحب</span>
                    </>
                  )}

                  {whatsappStatus === 'connecting' && (
                    <>
                      <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                      <span>جاري الاتصال بواتساب...</span>
                    </>
                  )}

                  {whatsappStatus === 'disconnected' && (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span>غير متصل بواتساب</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                النظام الشامل لإدارة الإرسال، الرد التلقائي، الانضمام، التعلم الذكي، والتحليل الأكاديمي
              </p>
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
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold rounded-xl transition-all border border-emerald-500/20 text-xs shadow-sm cursor-pointer"
              title="ربط واتساب كجهاز مصاحب"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">ربط جهاز</span>
            </button>
            <button
              onClick={onRefresh}
              className="p-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-zinc-100 rounded-xl transition-all border border-zinc-700/50 shadow-sm"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {monitoringActive ? (
              <button
                onClick={onStopMonitoring}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600/90 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 transition-all border border-rose-500/30 active:scale-95 text-xs sm:text-sm"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                إيقاف المراقبة
              </button>
            ) : (
              <button
                onClick={onStartMonitoring}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50 transition-all border border-emerald-500/30 active:scale-95 text-xs sm:text-sm"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                بدء المراقبة
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
