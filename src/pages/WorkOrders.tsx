/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { WorkOrder, WorkOrderStatus } from '../types';
import {
  Wrench,
  Plus,
  ArrowRight,
  Clock,
  X,
  AlertTriangle,
  HelpCircle,
  CheckSquare,
  Trash2,
  Sparkles,
  MessageCircle,
  Printer,
  Search,
  Users
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { QuickCheckInModal } from '../components/QuickCheckInModal';
import { canTriggerDelete, canDeleteDirectly } from '../utils/permissions';

interface WorkOrdersProps {
  prefilledBooking: any;
  clearPrefilledBooking: () => void;
}

export const WorkOrders: React.FC<WorkOrdersProps> = ({ prefilledBooking, clearPrefilledBooking }) => {
  const {
    workOrders,
    customers,
    vehicles,
    mechanics,
    serviceItems,
    spareParts,
    createWorkOrder,
    updateWorkOrderStatus,
    updateWorkOrder,
    deleteWorkOrder,
    formatRupiah,
    showToast,
    shopInfo,
    currentRole,
    language,
    t,
    requestDelete
  } = useWorkshop();

  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);
  const [selectedMechanicFilter, setSelectedMechanicFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [printWO, setPrintWO] = useState<WorkOrder | null>(null);

  // 1. Kanban Column definitions
  const columns: { status: WorkOrderStatus; label: string; color: string; desc: string }[] = [
    {
      status: 'waiting',
      label: t.workOrders.waiting,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      desc: language === 'id' ? 'Dalam antrean area diagnosa' : 'Queued for service bay'
    },
    {
      status: 'waiting_parts',
      label: language === 'id' ? 'Menunggu Part' : 'Waiting Parts',
      color: 'bg-orange-50 text-orange-900 border-orange-200',
      desc: language === 'id' ? 'Menunggu suku cadang' : 'Awaiting stock delivery'
    },
    {
      status: 'in_progress',
      label: t.workOrders.inProgress,
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      desc: language === 'id' ? 'Sedang dikerjakan mekanik' : 'Active mechanic wrenching'
    },
    {
      status: 'quality_control',
      label: t.workOrders.testing,
      color: 'bg-indigo-50 text-indigo-900 border-indigo-200',
      desc: language === 'id' ? 'Pengujian akhir & QC' : 'Final audit & safety checks'
    },
    {
      status: 'completed',
      label: t.workOrders.done,
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      desc: language === 'id' ? 'Selesai & siap bayar' : 'Ready for payment & pickup'
    }
  ];

  // 2. Modals State
  const [isCreateWOOpen, setIsCreateWOOpen] = useState(false);
  const [isEditWOOpen, setIsEditWOOpen] = useState(false);
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(null);

  // Security Confirmation Modal for advancing status
  const [advancingWO, setAdvancingWO] = useState<{ id: string; status: WorkOrderStatus; label: string } | null>(null);
  const [woToDelete, setWoToDelete] = useState<string | null>(null);

  // Form Fields for Creation
  const [customerId, setCustomerId] = useState('');
  const [bookingId, setBookingId] = useState<string | undefined>();
  const [vehicleId, setVehicleId] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [estCompletion, setEstCompletion] = useState('13:30');
  const [notes, setNotes] = useState('');

  // Selected Services & Parts lists
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; qty: number }[]>([]);

  // Vehicles matching selected customer
  const relatedVehicles = vehicles.filter((v) => v.customerId === customerId);

  // Handle incoming Booking prefill from Queue list
  useEffect(() => {
    if (prefilledBooking) {
      setBookingId(prefilledBooking.id);
      setCustomerId(prefilledBooking.customerId);
      setVehicleId(prefilledBooking.vehicleId);
      setComplaint(prefilledBooking.notes || '');
      setDiagnosis('');
      setMechanicId(mechanics.find((m) => m.status === 'available')?.id || mechanics[0]?.id || '');
      setSelectedServices([]);
      setSelectedParts([]);
      setIsCreateWOOpen(true);
      clearPrefilledBooking();
    }
  }, [prefilledBooking]);

  const handleOpenCreateModal = () => {
    setBookingId(undefined);
    setCustomerId(customers[0]?.id || '');
    setVehicleId(vehicles.filter((v) => v.customerId === (customers[0]?.id || ''))[0]?.id || '');
    setMechanicId(mechanics.find((m) => m.status === 'available')?.id || mechanics[0]?.id || '');
    setComplaint('');
    setDiagnosis('');
    setEstCompletion('13:30');
    setNotes('');
    setSelectedServices([]);
    setSelectedParts([]);
    setIsCreateWOOpen(true);
  };

  const handleOpenEditModal = (wo: WorkOrder) => {
    setEditingWO(wo);
    setCustomerId(wo.customerId);
    setVehicleId(wo.vehicleId);
    setMechanicId(wo.assignedMechanicId);
    setComplaint(wo.complaint);
    setDiagnosis(wo.diagnosis);
    setEstCompletion(wo.estimatedCompletionTime);
    setNotes(wo.notes);
    setSelectedServices(wo.services.map((s) => s.serviceId));
    setSelectedParts(wo.sparePartsUsed.map((p) => ({ partId: p.partId, qty: p.quantity })));
    setIsEditWOOpen(true);
  };

  const handleCustomerChange = (cid: string) => {
    setCustomerId(cid);
    const firstVeh = vehicles.find((v) => v.customerId === cid);
    setVehicleId(firstVeh?.id || '');
  };

  // Toggle Services checked state
  const handleToggleService = (sid: string) => {
    setSelectedServices((prev) =>
      prev.includes(sid) ? prev.filter((id) => id !== sid) : [...prev, sid]
    );
  };

  // Adjust Parts Qty Counter
  const handlePartQtyChange = (partId: string, delta: number, maxStock: number) => {
    setSelectedParts((prev) => {
      const match = prev.find((p) => p.partId === partId);
      if (match) {
        const nextQty = match.qty + delta;
        if (nextQty <= 0) {
          return prev.filter((p) => p.partId !== partId);
        }
        if (nextQty > maxStock) {
          showToast('Jumlah melebihi batas stok suku cadang di gudang!', 'warning');
          return prev;
        }
        return prev.map((p) => (p.partId === partId ? { ...p, qty: nextQty } : p));
      } else {
        if (delta > 0) {
          if (maxStock < 1) {
            showToast('Stok suku cadang sedang kosong!', 'error');
            return prev;
          }
          return [...prev, { partId, qty: 1 }];
        }
        return prev;
      }
    });
  };

  // Submit Work Order Spawn Form
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !vehicleId || !mechanicId) {
      showToast('Pilih Pelanggan, Kendaraan, dan Mekanik yang valid!', 'error');
      return;
    }
    if (selectedServices.length === 0 && selectedParts.length === 0) {
      showToast('Harap pilih minimal satu paket jasa servis atau suku cadang!', 'warning');
      return;
    }

    // Map out service & part schemas
    const resolvedServices = selectedServices.map((sid) => {
      const match = serviceItems.find((s) => s.id === sid)!;
      return { serviceId: sid, name: match.name, price: match.price };
    });

    const resolvedParts = selectedParts.map((item) => {
      const match = spareParts.find((p) => p.id === item.partId)!;
      return {
        partId: item.partId,
        name: match.name,
        quantity: item.qty,
        pricePerUnit: match.sellingPrice,
        totalPrice: match.sellingPrice * item.qty
      };
    });

    const mechName = mechanics.find((m) => m.id === mechanicId)?.name || 'Mekanik Tidak Diketahui';
    const customerName = customers.find((c) => c.id === customerId)?.name || 'N/A';
    const vehicle = vehicles.find((v) => v.id === vehicleId)!;

    createWorkOrder({
      bookingId,
      customerId,
      customerName,
      vehicleId,
      licensePlate: vehicle.licensePlate,
      vehicleModel: `${vehicle.brand} ${vehicle.model}`,
      complaint,
      diagnosis,
      assignedMechanicId: mechanicId,
      assignedMechanicName: mechName,
      services: resolvedServices,
      sparePartsUsed: resolvedParts,
      estimatedCompletionTime: estCompletion,
      notes
    });

    showToast('SPK Servis berhasil dibuat!', 'success');
    setIsCreateWOOpen(false);
  };

  // Submit Edit Work Order
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWO) return;

    if (selectedServices.length === 0 && selectedParts.length === 0) {
      showToast('Harap pilih minimal satu paket jasa servis atau suku cadang!', 'warning');
      return;
    }

    const resolvedServices = selectedServices.map((sid) => {
      const match = serviceItems.find((s) => s.id === sid)!;
      return { serviceId: sid, name: match.name, price: match.price };
    });

    const resolvedParts = selectedParts.map((item) => {
      const match = spareParts.find((p) => p.id === item.partId)!;
      return {
        partId: item.partId,
        name: match.name,
        quantity: item.qty,
        pricePerUnit: match.sellingPrice,
        totalPrice: match.sellingPrice * item.qty
      };
    });

    const mechName = mechanics.find((m) => m.id === mechanicId)?.name || 'Mekanik Tidak Diketahui';

    updateWorkOrder(editingWO.id, {
      complaint,
      diagnosis,
      assignedMechanicId: mechanicId,
      assignedMechanicName: mechName,
      services: resolvedServices,
      sparePartsUsed: resolvedParts,
      estimatedCompletionTime: estCompletion,
      notes
    });

    showToast('Data SPK berhasil diperbarui!', 'success');
    setIsEditWOOpen(false);
  };

  // Open Security Advance Confirmation
  const promptNextStatus = (id: string, currentStatus: WorkOrderStatus) => {
    // Security Access Check
    const allowedRoles = ['owner', 'admin', 'mechanic'];
    if (!allowedRoles.includes(currentRole)) {
      showToast('Akses Ditolak: Hanya Mekanik, Admin, atau Pemilik Bengkel yang dapat memindahkan tahap SPK.', 'error');
      return;
    }

    const wo = workOrders.find((w) => w.id === id);
    const hasParts = Boolean(wo && wo.sparePartsUsed && wo.sparePartsUsed.length > 0);

    let nextLabel = '';
    if (currentStatus === 'waiting') {
      nextLabel = 'Dalam Pengerjaan';
    } else if (currentStatus === 'waiting_parts') {
      nextLabel = 'Dalam Pengerjaan';
    } else if (currentStatus === 'in_progress') {
      nextLabel = 'Quality Control (Uji Coba)';
    } else if (currentStatus === 'quality_control') {
      nextLabel = 'Selesai (Siap Bayar)';
    }

    if (!nextLabel) {
      showToast('Status SPK sudah di tahap akhir', 'warning');
      return;
    }

    setAdvancingWO({ id, status: currentStatus, label: nextLabel });
  };

  // Confirmed Progression
  const confirmAdvanceStatus = () => {
    if (!advancingWO) return;
    const { id, status } = advancingWO;

    let next: WorkOrderStatus | undefined;
    if (status === 'waiting') {
      next = 'in_progress';
    } else if (status === 'waiting_parts') {
      next = 'in_progress';
    } else if (status === 'in_progress') {
      next = 'quality_control';
    } else if (status === 'quality_control') {
      next = 'completed';
    }

    if (next) {
      updateWorkOrderStatus(id, next);
      if (next === 'waiting_parts') {
        showToast(`SPK ${id} belum memilih suku cadang/oli. Otomatis masuk ke tahap Menunggu Suku Cadang.`, 'warning');
      } else {
        showToast(`SPK ${id} berhasil dipindahkan ke tahap ${advancingWO.label}`, 'success');
      }
    }
    setAdvancingWO(null);
  };

  // Action: Put order to 'waiting_parts' stage with security check
  const handleHoldForParts = (id: string) => {
    const allowedRoles = ['owner', 'admin', 'mechanic'];
    if (!allowedRoles.includes(currentRole)) {
      showToast('Akses Ditolak: Anda tidak memiliki izin untuk menahan status SPK.', 'error');
      return;
    }
    updateWorkOrderStatus(id, 'waiting_parts');
    showToast(`SPK ${id} ditahan untuk menunggu stok suku cadang`, 'warning');
  };

  const handleDeleteWorkOrder = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!canTriggerDelete(currentRole)) return;
    if (canDeleteDirectly(currentRole)) {
      setWoToDelete(id);
    } else {
      const wo = workOrders.find((w) => w.id === id);
      requestDelete('work_order', id, `SPK ${id} - ${wo?.customerName || ''}`);
    }
  };

  const confirmDeleteWO = () => {
    if (woToDelete) {
      deleteWorkOrder(woToDelete);
      if (editingWO?.id === woToDelete) {
        setIsEditWOOpen(false);
      }
      setWoToDelete(null);
    }
  };

  const handlePrintJobSheet = (wo: WorkOrder) => {
    setPrintWO(wo);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleSendWhatsAppUpdate = (wo: WorkOrder) => {
    const customer = customers.find(c => String(c.id) === String(wo.customerId));
    const rawPhone = customer?.phone || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62') && cleanPhone) {
      cleanPhone = '62' + cleanPhone;
    }

    const serviceList = wo.services.map(s => `• ${s.name}: ${formatRupiah(s.price)}`).join('\n');
    const partList = wo.sparePartsUsed.map(p => `• ${p.name} (x${p.quantity}): ${formatRupiah(p.totalPrice)}`).join('\n');

    let detailsText = '';
    if (serviceList) detailsText += `\n*Jasa Servis:*\n${serviceList}`;
    if (partList) detailsText += `\n*Suku Cadang/Oli:*\n${partList}`;

    const message = `*${shopInfo.name.toUpperCase()} - NOTIFIKASI SERVIS SELESAI* 🛵\n━━━━━━━━━━━━━━━━━━━━\nHalo Bpk/Ibu *${wo.customerName}*,\nMotor *${wo.vehicleModel}* (${wo.licensePlate}) Anda telah *SELESAI DISERVIS* dan siap diambil!\n\n*Keluhan/Pengerjaan:* ${wo.complaint || 'Servis berkala'}${detailsText}\n\n*Total Biaya:* ${formatRupiah(wo.costs.total)}\nMekanik PJ: *${wo.assignedMechanicName.split(' ')[0]}*\n━━━━━━━━━━━━━━━━━━━━\nSilakan datang ke bengkel kami untuk serah terima dan pembayaran. Terima kasih! 🙏`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Filter work orders based on search and mechanic
  const filteredWorkOrders = workOrders.filter((wo) => {
    if (selectedMechanicFilter !== 'all' && String(wo.assignedMechanicId) !== String(selectedMechanicFilter)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = wo.id.toLowerCase().includes(q);
      const matchPlate = wo.licensePlate.toLowerCase().includes(q);
      const matchCust = wo.customerName.toLowerCase().includes(q);
      const matchModel = wo.vehicleModel.toLowerCase().includes(q);
      if (!matchId && !matchPlate && !matchCust && !matchModel) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <Wrench className="w-5 h-5 text-slate-800" />
            {t.workOrders.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {language === 'id'
              ? 'Atur tugas diagnosa, tugaskan teknisi, dan pantau pengerjaan perbaikan di pit bengkel.'
              : 'Dispatch diagnostic tasks, assign technicians, and track active mechanical repair workflows.'}
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {['owner', 'admin', 'cashier', 'mechanic'].includes(currentRole) && (
            <button
              type="button"
              onClick={() => setIsQuickCheckInOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-amber-300"
            >
              <Sparkles className="w-4 h-4" />
              + Catat Motor Masuk
            </button>
          )}
          {['owner', 'admin', 'cashier'].includes(currentRole) && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-inherit" />
              {t.workOrders.createWorkOrder}
            </button>
          )}
        </div>
      </div>

      {/* Quick Search & Mechanic Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs no-print">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Plat Motor, No. SPK, Pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-800 transition-colors"
          />
        </div>

        {/* Mechanic filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSelectedMechanicFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 border ${
              selectedMechanicFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua ({workOrders.length})
          </button>
          {mechanics.map((m) => {
            const count = workOrders.filter((wo) => String(wo.assignedMechanicId) === String(m.id)).length;
            const isMe = currentRole === 'mechanic' && m.name.toLowerCase().includes('mekanik');
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMechanicFilter(m.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                  selectedMechanicFilter === m.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{m.name.split(' ')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  selectedMechanicFilter === m.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Kanban Board Pipeline */}
      <div className="flex lg:grid lg:grid-cols-5 gap-3.5 items-start select-none overflow-x-auto lg:overflow-x-visible pb-4 no-print">
        {columns.map((col) => {
          const colWOrders = filteredWorkOrders.filter((wo) => wo.status === col.status);

          return (
            <div key={col.status} className="flex flex-col rounded-2xl bg-white border border-slate-200 p-3.5 h-[620px] w-full min-w-[250px] lg:min-w-0 shrink-0 lg:shrink shadow-sm">
              {/* Column Title */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{col.label}</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-medium leading-none">{col.desc}</p>
                </div>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-full">
                  {colWOrders.length}
                </span>
              </div>

              {/* Order Cards container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colWOrders.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-[10px] text-center p-3 font-medium bg-slate-50">
                    Tidak ada SPK di tahap ini
                  </div>
                ) : (
                  colWOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50/80 shadow-sm transition-all flex flex-col justify-between min-h-[170px]"
                    >
                      <div>
                        {/* ID, Plate */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-900">
                            {wo.id}
                          </span>
                          <span className="text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md uppercase">
                            {wo.licensePlate}
                          </span>
                        </div>

                        {/* Customer & Vehicle */}
                        <h4 className="text-xs font-bold text-slate-900 mt-2 truncate uppercase tracking-tight">
                          {wo.customerName}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate font-medium">{wo.vehicleModel}</p>

                        {/* Spare Parts Badge Indicator */}
                        {wo.sparePartsUsed && wo.sparePartsUsed.length > 0 ? (
                          <span className="inline-block mt-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            ✓ {wo.sparePartsUsed.length} Part
                          </span>
                        ) : (
                          <span className="inline-block mt-1.5 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            ! Tanpa Part
                          </span>
                        )}

                        <div className="border-t border-slate-100 mt-3 pt-3 space-y-1.5 text-[10px]">
                          {/* Mechanic assigned */}
                          <p className="text-slate-600 flex items-center gap-1.5 font-medium">
                            <span className="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0" />
                            Mekanik: <span className="font-bold text-slate-900">{wo.assignedMechanicName.split(' ')[0]}</span>
                          </p>
                        </div>
                      </div>

                      {/* Card Action Controls - 2-row spacious layout */}
                      <div className="space-y-2 border-t border-slate-100 pt-3 mt-3">
                        {/* Primary Progression Button */}
                        {wo.status !== 'completed' ? (
                          <button
                            type="button"
                            onClick={() => promptNextStatus(wo.id, wo.status)}
                            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-sm active:scale-98"
                          >
                            <span>
                              {wo.status === 'waiting'
                                ? 'Mulai Dikerjakan'
                                : wo.status === 'waiting_parts'
                                ? 'Lanjut Pengerjaan'
                                : wo.status === 'in_progress'
                                ? 'Uji Kelaikan (QC)'
                                : 'Selesai & Siap Ambil'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppUpdate(wo)}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Kabari via WhatsApp</span>
                          </button>
                        )}

                        {/* Secondary Action Controls Row */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(wo)}
                            className="flex-1 py-2 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-700 rounded-xl font-bold cursor-pointer transition-colors text-center"
                          >
                            Detail
                          </button>

                          {/* Print Physical Handlebar SPK Slip */}
                          <button
                            type="button"
                            onClick={() => handlePrintJobSheet(wo)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-800 cursor-pointer transition-colors shrink-0 flex items-center justify-center"
                            title="Cetak Lembar SPK Stang Motor"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Let mechanic request a parts hold if they are waiting for stock */}
                          {(wo.status === 'waiting' || wo.status === 'in_progress') && (
                            <button
                              type="button"
                              onClick={() => handleHoldForParts(wo.id)}
                              className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-amber-700 cursor-pointer transition-colors shrink-0 flex items-center justify-center"
                              title="Tahan: Menunggu Suku Cadang"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canTriggerDelete(currentRole) && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteWorkOrder(wo.id, e)}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl cursor-pointer transition-colors shrink-0 flex items-center justify-center"
                              title="Hapus SPK"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECURITY ADVANCE CONFIRMATION MODAL */}
      {advancingWO && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl p-6 text-slate-900 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide">Pindahkan Tahap SPK?</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Anda akan memindahkan SPK <span className="font-mono text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{advancingWO.id}</span> ke tahap berikutnya.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-bold text-center">
              Tahap Tujuan: <span className="text-emerald-700 font-bold uppercase">{advancingWO.label}</span>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAdvancingWO(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmAdvanceStatus}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                Ya, Pindahkan Tahap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE WORK ORDER */}
      {isCreateWOOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide text-xs">Buat Perintah Kerja (SPK) Servis Baru</h3>
              <button
                type="button"
                onClick={() => setIsCreateWOOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-1 cursor-pointer rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Customer */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Akun Pelanggan</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="" disabled>-- Pilih Pelanggan --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Vehicle */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Motor / Kendaraan</label>
                  <select
                    required
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  >
                    <option value="" disabled>-- Pilih Kendaraan --</option>
                    {relatedVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} [{v.licensePlate}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Mechanic */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pilih Mekanik Penanggung Jawab</label>
                  <select
                    required
                    value={mechanicId}
                    onChange={(e) => setMechanicId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  >
                    {mechanics.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.position}) - {m.status === 'available' ? 'TERSEDIA' : 'SEDANG KERJA'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Est Completion Time */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Estimasi Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={estCompletion}
                    onChange={(e) => setEstCompletion(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Complaints & Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Keluhan Pelanggan</label>
                  <textarea
                    required
                    placeholder="Contoh: Suara mesin kasar, rem decit..."
                    rows={2}
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Diagnosis Awal Mekanik</label>
                  <textarea
                    placeholder="Contoh: Celah busi renggang, oli mesin hitam..."
                    rows={2}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Service Selection Grid */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Pilih Paket / Jasa Servis</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {serviceItems.map((s) => {
                    const isChecked = selectedServices.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleToggleService(s.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <CheckSquare className={`w-4 h-4 shrink-0 ${isChecked ? 'opacity-100' : 'opacity-30'}`} />
                          <span className="font-bold uppercase tracking-tight text-[11px] truncate">{s.name}</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold shrink-0">{formatRupiah(s.price)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spare Parts Allocation with stock check */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Alokasi Suku Cadang & Oli</label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {spareParts.map((part) => {
                    const selectedItem = selectedParts.find((p) => p.partId === part.id);

                    return (
                      <div key={part.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 uppercase tracking-tight truncate">{part.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            Stok: <span className={part.currentStock < 5 ? 'text-rose-600 font-bold' : 'text-slate-600 font-bold'}>{part.currentStock} unit</span> • {formatRupiah(part.sellingPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg p-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePartQtyChange(part.id, -1, part.currentStock)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 border border-slate-200 rounded-md font-bold text-center text-slate-900 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 font-mono text-center text-slate-900 font-bold">
                            {selectedItem ? selectedItem.qty : 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePartQtyChange(part.id, 1, part.currentStock)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 border border-slate-200 rounded-md font-bold text-center text-slate-900 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selection Summary Verification Box */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  selectedServices.length > 0 || selectedParts.length > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Verifikasi Item Terpilih:</span>
                  <span>
                    {selectedServices.length} Jasa Servis, {selectedParts.reduce((a, b) => a + b.qty, 0)} Suku Cadang
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Estimasi Total</span>
                  <span className="font-mono text-xs font-extrabold text-emerald-700">
                    {formatRupiah(
                      selectedServices.reduce((sum, sid) => sum + (serviceItems.find((s) => s.id === sid)?.price || 0), 0) +
                        selectedParts.reduce(
                          (sum, p) => sum + (spareParts.find((sp) => sp.id === p.partId)?.sellingPrice || 0) * p.qty,
                          0
                        )
                    )}
                  </span>
                </div>
              </div>

              {/* Tech Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Catatan Tambahan</label>
                <textarea
                  placeholder="Instruksi khusus mekanik, kembalikan sparepart bekas, dll..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none"
                />
              </div>

              {/* Foot Controls */}
              <div className="flex gap-3 justify-end pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateWOOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  Buat SPK Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT WORK ORDER DETAILS / FORM */}
      {isEditWOOpen && editingWO && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col text-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide text-xs">Penyesuaian Teknis SPK ({editingWO.id})</h3>
              <div className="flex items-center gap-2">
                {canTriggerDelete(currentRole) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkOrder(editingWO.id)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    title="Hapus SPK Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus SPK</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditWOOpen(false)}
                  className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-1 cursor-pointer rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Customer Account & Vehicle details (readonly in edit) */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Nama Pelanggan</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 uppercase tracking-tight">{editingWO.customerName}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Motor & Plat Nomor</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5 uppercase tracking-tight">{editingWO.vehicleModel} ({editingWO.licensePlate})</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Mechanic */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Mekanik Penanggung Jawab</label>
                  <select
                    required
                    value={mechanicId}
                    onChange={(e) => setMechanicId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  >
                    {mechanics.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.position})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Est Completion Time */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Estimasi Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={estCompletion}
                    onChange={(e) => setEstCompletion(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Complaints & Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Keluhan Pelanggan</label>
                  <textarea
                    required
                    placeholder="Suara mesin kasar..."
                    rows={2}
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Diagnosis Mekanik</label>
                  <textarea
                    required
                    placeholder="Setel celah klep & ganti oli..."
                    rows={2}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Service Selection Grid */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Daftar Jasa Servis</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {serviceItems.map((s) => {
                    const isChecked = selectedServices.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleToggleService(s.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <CheckSquare className={`w-4 h-4 shrink-0 ${isChecked ? 'opacity-100' : 'opacity-30'}`} />
                          <span className="font-bold uppercase tracking-tight text-[11px] truncate">{s.name}</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold shrink-0">{formatRupiah(s.price)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spare Parts Allocation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Alokasi Suku Cadang & Oli</label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {spareParts.map((part) => {
                    const selectedItem = selectedParts.find((p) => p.partId === part.id);

                    return (
                      <div key={part.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-[11px]">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 uppercase tracking-tight truncate">{part.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            Stok: <span className={part.currentStock < 5 ? 'text-rose-600 font-bold' : 'text-slate-600 font-bold'}>{part.currentStock} unit</span> • {formatRupiah(part.sellingPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg p-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePartQtyChange(part.id, -1, part.currentStock)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 border border-slate-200 rounded-md font-bold text-center text-slate-900 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 font-mono text-center text-slate-900 font-bold">
                            {selectedItem ? selectedItem.qty : 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePartQtyChange(part.id, 1, part.currentStock)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 border border-slate-200 rounded-md font-bold text-center text-slate-900 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selection Summary Verification Box */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                  selectedServices.length > 0 || selectedParts.length > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Verifikasi Item Terpilih:</span>
                  <span>
                    {selectedServices.length} Jasa Servis, {selectedParts.reduce((a, b) => a + b.qty, 0)} Suku Cadang
                  </span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Estimasi Total</span>
                  <span className="font-mono text-xs font-extrabold text-emerald-700">
                    {formatRupiah(
                      selectedServices.reduce((sum, sid) => sum + (serviceItems.find((s) => s.id === sid)?.price || 0), 0) +
                        selectedParts.reduce(
                          (sum, p) => sum + (spareParts.find((sp) => sp.id === p.partId)?.sellingPrice || 0) * p.qty,
                          0
                        )
                    )}
                  </span>
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Catatan Tambahan</label>
                <textarea
                  placeholder="Catatan teknis..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-medium focus:outline-none"
                />
              </div>

              {/* Submit & Cancel */}
              <div className="flex gap-3 justify-end pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditWOOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!woToDelete}
        title="Hapus SPK / Work Order"
        message={`Apakah Anda yakin ingin menghapus perintah kerja (SPK) ${woToDelete || ''}?`}
        onConfirm={confirmDeleteWO}
        onClose={() => setWoToDelete(null)}
      />

      {/* Quick Check-In Walk-in Modal */}
      <QuickCheckInModal isOpen={isQuickCheckInOpen} onClose={() => setIsQuickCheckInOpen(false)} />

      {/* --- PRINT ONLY PHYSICAL WORK ORDER / JOB SHEET (Gantungan Stang Motor) --- */}
      {printWO && (
        <div className="print-only hidden p-6 bg-white text-black font-mono text-xs max-w-2xl mx-auto space-y-4 border-2 border-black">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-3">
            <div>
              <h1 className="font-black text-lg uppercase tracking-tight">{shopInfo.name}</h1>
              <p className="text-[10px] text-gray-700">{shopInfo.address}</p>
              <p className="text-[10px] text-gray-700">WA/Telp: {shopInfo.phone}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-black text-white font-bold text-xs uppercase tracking-wider rounded">
                LEMBAR KERJA MEKANIK
              </span>
              <p className="text-xs font-bold mt-1">SPK: {printWO.id}</p>
              <p className="text-[10px]">Tgl: {new Date(printWO.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          {/* Big License Plate & Motorcycle Banner */}
          <div className="p-3 bg-gray-100 border-2 border-black rounded-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-600">Nomor Polisi (Plat):</p>
              <h2 className="text-2xl font-black tracking-wider uppercase">{printWO.licensePlate}</h2>
              <p className="text-xs font-bold text-gray-800">{printWO.vehicleModel}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-gray-600">Target Selesai:</p>
              <p className="text-lg font-black text-black font-mono">
                {printWO.estimatedCompletionTime || '14:30'} WIB
              </p>
              <p className="text-xs font-semibold">Mekanik: {printWO.assignedMechanicName}</p>
            </div>
          </div>

          {/* Customer & Complaint Info */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-black p-3 rounded">
            <div>
              <p className="font-bold text-[10px] uppercase text-gray-600">Nama Pelanggan:</p>
              <p className="font-bold">{printWO.customerName}</p>
            </div>
            <div>
              <p className="font-bold text-[10px] uppercase text-gray-600">Keluhan Pelanggan:</p>
              <p className="font-bold">{printWO.complaint || 'Servis Berkala'}</p>
            </div>
            {printWO.diagnosis && (
              <div className="col-span-2 pt-1 border-t border-dashed border-gray-400">
                <p className="font-bold text-[10px] uppercase text-gray-600">Diagnosa Mekanik Awal:</p>
                <p>{printWO.diagnosis}</p>
              </div>
            )}
          </div>

          {/* Checklist Services & Parts */}
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-xs uppercase border-b border-black pb-1 mb-2">
                Checklist Jasa & Pengerjaan Servis:
              </h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-300 text-left text-[10px] uppercase text-gray-600">
                    <th className="py-1 w-8">Check</th>
                    <th className="py-1">Nama Jasa / Tindakan</th>
                    <th className="py-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {printWO.services.map((s, idx) => (
                    <tr key={s.serviceId || idx} className="border-b border-gray-200">
                      <td className="py-1 font-bold">[  ]</td>
                      <td className="py-1 font-semibold">{s.name}</td>
                      <td className="py-1 text-right text-[10px]">Belum / Selesai</td>
                    </tr>
                  ))}
                  {printWO.services.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-1 text-gray-500 italic">Pemeriksaan umum</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {printWO.sparePartsUsed.length > 0 && (
              <div>
                <h3 className="font-bold text-xs uppercase border-b border-black pb-1 mb-2">
                  Checklist Suku Cadang & Oli yang Diganti:
                </h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 text-left text-[10px] uppercase text-gray-600">
                      <th className="py-1 w-8">Check</th>
                      <th className="py-1">Nama Part / Oli</th>
                      <th className="py-1 text-center w-16">Jumlah</th>
                      <th className="py-1 text-right">Fisik Bekas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printWO.sparePartsUsed.map((p, idx) => (
                      <tr key={p.partId || idx} className="border-b border-gray-200">
                        <td className="py-1 font-bold">[  ]</td>
                        <td className="py-1 font-semibold">{p.name}</td>
                        <td className="py-1 text-center font-bold">x{p.quantity}</td>
                        <td className="py-1 text-right text-[10px]">Diserahkan / Dibuang</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {printWO.notes && (
            <div className="p-2 border border-dashed border-gray-400 rounded text-[10px]">
              <span className="font-bold uppercase">Catatan Khusus:</span> {printWO.notes}
            </div>
          )}

          {/* Signature Boxes */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-black text-center text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-600">Penerima / Front Desk</p>
              <div className="h-12" />
              <p className="border-t border-black pt-1 font-bold">( ............................. )</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-600">Mekanik Pelaksana</p>
              <div className="h-12" />
              <p className="border-t border-black pt-1 font-bold">{printWO.assignedMechanicName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-600">Quality Control (QC)</p>
              <div className="h-12" />
              <p className="border-t border-black pt-1 font-bold">( ............................. )</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
