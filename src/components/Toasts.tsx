/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const Toasts: React.FC = () => {
  const { toasts, dismissToast } = useWorkshop();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full no-print">
      <AnimatePresence>
        {toasts.map((toast) => {
          let bgColor = 'bg-slate-800';
          let iconColor = 'text-blue-400';
          let borderCol = 'border-slate-700';
          let Icon = Info;

          if (toast.type === 'success') {
            bgColor = 'bg-emerald-950/90';
            iconColor = 'text-emerald-400';
            borderCol = 'border-emerald-500/30';
            Icon = CheckCircle2;
          } else if (toast.type === 'error') {
            bgColor = 'bg-rose-950/90';
            iconColor = 'text-rose-400';
            borderCol = 'border-rose-500/30';
            Icon = AlertCircle;
          } else if (toast.type === 'warning') {
            bgColor = 'bg-amber-950/90';
            iconColor = 'text-amber-400';
            borderCol = 'border-amber-500/30';
            Icon = AlertTriangle;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-3 p-4 rounded-xl border ${bgColor} ${borderCol} shadow-xl backdrop-blur-md`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium text-slate-100">
                {toast.message}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer rounded p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
