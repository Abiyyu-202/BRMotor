import React, { useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const ToastItem: React.FC<{ toast: any; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  let bgColor = 'bg-slate-900/95';
  let iconColor = 'text-blue-400';
  let borderCol = 'border-slate-700/60';
  let Icon = Info;

  if (toast.type === 'success') {
    bgColor = 'bg-emerald-950/95';
    iconColor = 'text-emerald-400';
    borderCol = 'border-emerald-500/40';
    Icon = CheckCircle2;
  } else if (toast.type === 'error') {
    bgColor = 'bg-rose-950/95';
    iconColor = 'text-rose-400';
    borderCol = 'border-rose-500/40';
    Icon = AlertCircle;
  } else if (toast.type === 'warning') {
    bgColor = 'bg-amber-950/95';
    iconColor = 'text-amber-400';
    borderCol = 'border-amber-500/40';
    Icon = AlertTriangle;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-3 p-3.5 rounded-xl border ${bgColor} ${borderCol} shadow-xl backdrop-blur-md text-white`}
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 text-xs font-medium text-slate-100 leading-snug">
        {toast.message}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white transition-colors cursor-pointer rounded-md p-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

export const Toasts: React.FC = () => {
  const { toasts, dismissToast } = useWorkshop();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-auto no-print">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};
