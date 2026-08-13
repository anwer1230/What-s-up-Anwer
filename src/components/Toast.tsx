import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  WifiOff, 
  Info, 
  X, 
  RefreshCw, 
  ExternalLink 
} from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  timestamp?: string;
  actionText?: string;
  onAction?: () => void;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-5 left-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none"
      dir="rtl"
    >
      {toasts.map((toast) => {
        let borderClass = 'border-amber-500/40 bg-amber-950/90 text-amber-100';
        let icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;

        if (toast.type === 'error') {
          borderClass = 'border-rose-500/50 bg-rose-950/90 text-rose-100 shadow-rose-950/50';
          icon = <WifiOff className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />;
        } else if (toast.type === 'success') {
          borderClass = 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100 shadow-emerald-950/50';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
        } else if (toast.type === 'info') {
          borderClass = 'border-sky-500/40 bg-sky-950/90 text-sky-100 shadow-sky-950/50';
          icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-2xl p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slideIn ${borderClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{icon}</div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm leading-tight flex items-center gap-2">
                    {toast.title}
                  </h4>
                  <p className="text-xs text-zinc-200/90 leading-relaxed font-medium">
                    {toast.message}
                  </p>

                  {toast.actionText && toast.onAction && (
                    <div className="pt-1.5">
                      <button
                        onClick={() => {
                          toast.onAction?.();
                          onDismiss(toast.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg border border-white/20 transition-all text-white"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {toast.actionText}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
