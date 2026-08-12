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
  Trash2
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

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
    currentRole,
    language,
    t
  } = useWorkshop();

  // 1. Kanban Column definitions
  const columns: { status: WorkOrderStatus; label: string; color: string; desc: string }[] = [
    {
      status: 'waiting',
      label: t.workOrders.waiting,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      desc: language === 'id' ? 'Dalam antrean area diagnosa' : 'Queued for service bay'
    },
    {
      status: 'in_progress',
      label: t.workOrders.inProgress,
      color: 'bg-amber-50 text-amber-900 border-amber-200',
      desc: language === 'id' ? 'Sedang dikerjakan mekanik' : 'Active mechanic wrenching'
    },
    {
      status: 'waiting_parts',
      label: language === 'id' ? 'Menunggu Part' : 'Waiting Parts',
      color: 'bg-orange-50 text-orange-900 border-orange-200',
      desc: language === 'id' ? 'Menunggu suku cadang' : 'Awaiting stock delivery'
    },
    {
      status: 'quality_control',
      label: t.workOrders.testing,
      color: 'bg-indigo-50 text-indigo-900 border-indigo-200',
      desc: language === 'id' ? 'Pengujian akhir & pengecekan' : 'Final audit & safety checks'
    },
    {
      status: 'completed',
      label: t.workOrders.done,
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      desc: language === 'id' ? 'Selesai & siap diambil' : 'Ready for customer pickup'
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
      nextLabel = hasParts ? 'Dalam Pengerjaan' : 'Menunggu Suku Cadang';
    } else if (currentStatus === 'waiting_parts') {
      if (!hasParts) {
        showToast('Suku cadang belum dipilih! Silakan klik "Detail" / Edit SPK dan tambahkan suku cadang/oli terlebih dahulu untuk melanjutkan pengerjaan.', 'warning');
        return;
      }
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

    const wo = workOrders.find((w) => w.id === id);
    const hasParts = Boolean(wo && wo.sparePartsUsed && wo.sparePartsUsed.length > 0);

    let next: WorkOrderStatus | undefined;
    if (status === 'waiting') {
      next = hasParts ? 'in_progress' : 'waiting_parts';
    } else if (status === 'waiting_parts') {
      if (!hasParts) {
        showToast('Suku cadang belum dipilih! Silakan tambahkan suku cadang/oli terlebih dahulu.', 'warning');
        setAdvancingWO(null);
        return;
      }
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
    setWoToDelete(id);
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

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        {/* Only allow authorized roles to initialize new orders */}
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

      {/* Visual Kanban Board Pipeline */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start select-none">
        {columns.map((col) => {
          const colWOrders = workOrders.filter((wo) => wo.status === col.status);

          return (
            <div key={col.status} className="flex flex-col rounded-2xl bg-white border border-slate-200 p-4 h-[600px] shrink-0 min-w-[240px] shadow-sm">
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
                            ✓ {wo.sparePartsUsed.length} Part/Oli
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

                      {/* Card Action Controls - Fixed layout to prevent offside/overflow */}
                      <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 mt-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(wo)}
                          className="px-2 py-1 bg-slate-100 border border-slate-200 text-[10px] text-slate-700 rounded-lg font-bold hover:bg-slate-200 cursor-pointer transition-colors shrink-0"
                        >
                          Detail
                        </button>

                        {/* Status Progression buttons */}
                        {wo.status !== 'completed' && (
                          <button
                            type="button"
                            onClick={() => promptNextStatus(wo.id, wo.status)}
                            className="flex-1 min-w-0 px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 font-bold text-[9px] rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer uppercase tracking-wider shadow-sm truncate"
                          >
                            <span className="truncate">Lanjut</span>
                            <ArrowRight className="w-3 h-3 shrink-0" />
                          </button>
                        )}

                        {/* Let mechanic request a parts hold if they are stuck */}
                        {wo.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => handleHoldForParts(wo.id)}
                            className="p-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 cursor-pointer shrink-0"
                            title="Menunggu Suku Cadang"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteWorkOrder(wo.id, e)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg cursor-pointer transition-colors shrink-0"
                          title="Hapus SPK"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                <button
                  type="button"
                  onClick={() => handleDeleteWorkOrder(editingWO.id)}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  title="Hapus SPK Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus SPK</span>
                </button>
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
    </div>
  );
};
