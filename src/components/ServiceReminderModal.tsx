/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import {
  Bell,
  X,
  Search,
  Bike,
  User,
  Calendar,
  Clock,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface ServiceReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceReminderModal: React.FC<ServiceReminderModalProps> = ({ isOpen, onClose }) => {
  const {
    customers,
    vehicles,
    workOrders,
    shopInfo,
    showToast
  } = useWorkshop();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDays, setFilterDays] = useState<'all' | '30' | '60'>('30');

  // Compute reminders for each vehicle
  const reminderItems = useMemo(() => {
    const now = new Date();

    return vehicles.map((v) => {
      const owner = customers.find((c) => String(c.id) === String(v.customerId));
      const vOrders = workOrders
        .filter((w) => String(w.vehicleId) === String(v.id) || w.licensePlate === v.licensePlate)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const lastOrder = vOrders[0];
      let lastDate: Date;
      if (lastOrder && lastOrder.createdAt) {
        lastDate = new Date(lastOrder.createdAt);
      } else if (owner && owner.createdAt) {
        lastDate = new Date(owner.createdAt);
      } else {
        // Fallback: estimate 35 days ago for unregistered history
        lastDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
      }

      const diffMs = now.getTime() - lastDate.getTime();
      const daysElapsed = isNaN(diffMs) ? 35 : Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let urgency: 'urgent' | 'due' | 'fresh' = 'fresh';
      if (daysElapsed >= 60) {
        urgency = 'urgent';
      } else if (daysElapsed >= 30) {
        urgency = 'due';
      }

      return {
        vehicle: v,
        owner,
        lastOrder,
        lastDate,
        daysElapsed,
        urgency
      };
    });
  }, [vehicles, customers, workOrders]);

  // Filter based on selected tabs and search
  const filteredList = useMemo(() => {
    return reminderItems.filter((item) => {
      // Filter days
      if (filterDays === '30' && item.daysElapsed < 30) return false;
      if (filterDays === '60' && item.daysElapsed < 60) return false;

      // Filter search
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;

      const plate = item.vehicle.licensePlate.toLowerCase();
      const model = item.vehicle.model.toLowerCase();
      const ownerName = item.owner?.name.toLowerCase() || '';
      const ownerPhone = item.owner?.phone || '';

      return (
        plate.includes(q) ||
        model.includes(q) ||
        ownerName.includes(q) ||
        ownerPhone.includes(q)
      );
    }).sort((a, b) => b.daysElapsed - a.daysElapsed);
  }, [reminderItems, filterDays, searchTerm]);

  if (!isOpen) return null;

  const handleSendWhatsAppReminder = (item: typeof reminderItems[0]) => {
    const rawPhone = item.owner?.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62') && cleanPhone) {
      cleanPhone = '62' + cleanPhone;
    }

    if (!cleanPhone) {
      showToast(`Nomor WhatsApp untuk ${item.owner?.name || 'pelanggan'} tidak valid!`, 'warning');
      return;
    }

    const customerName = item.owner?.name || 'Pelanggan';
    const vehicleName = `${item.vehicle.brand} ${item.vehicle.model}`;
    const plate = item.vehicle.licensePlate;
    const formattedLastDate = item.lastDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const message = `*${shopInfo.name.toUpperCase()} - PENGINGAT SERVIS RUTIN & GANTI OLI* 🛵\n━━━━━━━━━━━━━━━━━━━━\nHalo Bpk/Ibu *${customerName}*,\nMotor kesayangan Anda *${vehicleName}* (*${plate}*) tercatat terakhir kali diservis pada tanggal *${formattedLastDate}* (sekitar *${item.daysElapsed} hari* yang lalu).\n\nAgar performa mesin tetap prima, tarikan responsif, dan konsumsi bensin hemat, yuk luangkan waktu untuk:\n• Ganti Oli Mesin & Gardan\n• Pembersihan CVT / Tune Up\n• Cek Kampas Rem & Tekanan Ban\n\n📍 *Alamat Bengkel:* ${shopInfo.address}\n⏰ *Jam Operasional:* 08.00 - 17.00 WIB\n━━━━━━━━━━━━━━━━━━━━\nIngin booking kedatangan atau tanya stok sparepart? Silakan balas pesan WhatsApp ini ya. Terima kasih! 🙏`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    showToast(`Membuka WhatsApp untuk mengirim pengingat ke ${customerName}`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-2xl font-bold shadow-sm">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide flex items-center gap-2">
                Pengingat Servis Berkala & Ganti Oli
              </h2>
              <p className="text-xs text-slate-300">
                Deteksi motor yang sudah waktunya servis berkala dan kabari pelanggan via WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari plat, motor, atau nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800"
              />
            </div>

            {/* Filter Days Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterDays('30')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterDays === '30' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                30+ Hari ({reminderItems.filter((i) => i.daysElapsed >= 30).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDays('60')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterDays === '60' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                60+ Hari ({reminderItems.filter((i) => i.daysElapsed >= 60).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDays('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterDays === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({reminderItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredList.length === 0 ? (
            <div className="py-14 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Semua motor pelanggan baru saja servis!</p>
              <p className="text-[11px] text-slate-500">Tidak ada motor yang lewat batas waktu servis berkala.</p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isUrgent = item.daysElapsed >= 60;
              const isDue = item.daysElapsed >= 30 && item.daysElapsed < 60;

              return (
                <div
                  key={item.vehicle.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-0.5 rounded-md uppercase">
                        {item.vehicle.licensePlate}
                      </span>
                      <span className="font-bold text-xs text-slate-900">
                        {item.vehicle.brand} {item.vehicle.model}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Mendesak: {item.daysElapsed} Hari Lalu
                        </span>
                      )}
                      {isDue && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Waktunya Servis: {item.daysElapsed} Hari Lalu
                        </span>
                      )}
                      {!isUrgent && !isDue && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Servis Terakhir: {item.daysElapsed} Hari Lalu
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Pemilik: <strong className="text-slate-800">{item.owner?.name || 'Pelanggan Umum'}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        WA: {item.owner?.phone || '-'}
                      </span>
                      {item.lastOrder && (
                        <span className="text-[11px] text-slate-500">
                          (Servis Terakhir: {item.lastOrder.complaint || 'Servis rutin'})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReminder(item)}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Kirim Pengingat WA
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredList.length} motor terdata</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
