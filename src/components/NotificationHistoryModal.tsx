import React from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { Bell, CheckCircle2, AlertCircle, AlertTriangle, Info, Trash2, X, Clock } from 'lucide-react';

interface NotificationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationHistoryModal: React.FC<NotificationHistoryModalProps> = ({ isOpen, onClose }) => {
  const { notificationHistory, clearNotificationHistory } = useWorkshop();

  if (!isOpen) return null;

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Baru saja';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit lalu`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam lalu`;
      return date.toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                Histori Notifikasi Sistem
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                {notificationHistory.length} notifikasi tercatat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {notificationHistory.length > 0 && (
              <button
                type="button"
                onClick={clearNotificationHistory}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                title="Bersihkan Semua Histori"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-100">
          {notificationHistory.length === 0 ? (
            <div className="p-10 text-center space-y-2 text-slate-400">
              <Bell className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">Belum ada histori notifikasi</p>
              <p className="text-[11px] text-slate-400">Aktivitas baru seperti SPK, kasir, dan check-in akan terekam di sini.</p>
            </div>
          ) : (
            notificationHistory.map((item) => {
              let Icon = Info;
              let iconColor = 'text-blue-500 bg-blue-50 border-blue-100';

              if (item.type === 'success') {
                Icon = CheckCircle2;
                iconColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
              } else if (item.type === 'error') {
                Icon = AlertCircle;
                iconColor = 'text-rose-600 bg-rose-50 border-rose-100';
              } else if (item.type === 'warning') {
                Icon = AlertTriangle;
                iconColor = 'text-amber-600 bg-amber-50 border-amber-100';
              }

              return (
                <div key={item.id} className="pt-2.5 first:pt-0 flex items-start gap-3">
                  <div className={`p-1.5 rounded-xl border shrink-0 mt-0.5 ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-snug">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-medium">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
