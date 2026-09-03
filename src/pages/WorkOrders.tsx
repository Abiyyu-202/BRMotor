/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { WorkOrderStatus, WorkOrder, SparePart, ServiceItem, UserRole } from '../types';
import {
  Wrench,
  Clock,
  CheckCircle,
  Plus,
  Search,
  MessageCircle,
  ArrowRight,
  Printer,
  ChevronRight,
  AlertTriangle,
  FileText,
  User,
  Trash2,
  Edit2,
  X,
  Sparkles,
  CheckSquare,
  Square
} from 'lucide-react';
import { QuickCheckInModal } from '../components/QuickCheckInModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const WorkOrders: React.FC = () => {
  const {
    workOrders,
    customers,
    vehicles,
    mechanics,
    spareParts,
    services: serviceItems,
    addWorkOrder,
    updateWorkOrderStatus,
    updateWorkOrder,
    deleteWorkOrder,
    requestDelete,
    showToast,
    shopInfo,
    formatRupiah,
    t,
    currentRole
  } = useWorkshop();

  // Role permissions
  const canTriggerDelete = (role: UserRole) => role === 'owner' || role === 'admin';
  const canDeleteDirectly = (role: UserRole) => role === 'owner';

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMechanicFilter, setSelectedMechanicFilter] = useState<string>('all');

  // Confirmation modal state before advancing WO
  const [advancingWO, setAdvancingWO] = useState<{ id: string; targetStatus: WorkOrderStatus; label: string } | null>(null);

  // Modal 1: Create Work Order
  const [isCreateWOOpen, setIsCreateWOOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [assignedMechanicId, setAssignedMechanicId] = useState('');
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ partId: string; qty: number }[]>([]);

  // Modal 2: Edit Work Order
  const [isEditWOOpen, setIsEditWOOpen] = useState(false);
  const [editingWO, setEditingWO] = useState<WorkOrder | null>(null);

  // Modal 3: Quick Check In for walk-ins
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState(false);

  // Modal 4: Confirm Delete Work Order
  const [woToDelete, setWoToDelete] = useState<string | null>(null);

  // Printable slip state
  const [printWO, setPrintWO] = useState<WorkOrder | null>(null);

  // Kanban Columns Definition
  const columns: { status: WorkOrderStatus; label: string; desc: string }[] = [
    {
      status: 'waiting',
      label: 'Antre Servis',
      desc: 'Motor telah tiba, menunggu slot pit mekanik'
    },
    {
      status: 'waiting_parts',
      label: 'Tunggu Part / Oli',
      desc: 'Menunggu konfirmasi pengambilan suku cadang'
    },
    {
      status: 'in_progress',
      label: 'Sedang Dikerjakan',
      desc: 'Mekanik sedang membongkar atau menyervis motor'
    },
    {
      status: 'quality_control',
      label: 'Uji Kelaikan (QC)',
      desc: 'Pemeriksaan akhir & uji coba fungsi jalan'
    },
    {
      status: 'completed',
      label: 'Selesai & Siap Diambil',
      desc: 'Pengerjaan tuntas, menunggu serah terima pelanggan'
    }
  ];

  // Filtered list
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchSearch =
        wo.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wo.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase());

      const matchMechanic =
        selectedMechanicFilter === 'all' ||
        String(wo.assignedMechanicId) === String(selectedMechanicFilter);

      return matchSearch && matchMechanic;
    });
  }, [workOrders, searchQuery, selectedMechanicFilter]);

  // Handle open create modal
  const handleOpenCreateModal = () => {
    setSelectedCustomerId(customers.length > 0 ? customers[0].id : '');
    setSelectedVehicleId('');
    setAssignedMechanicId(mechanics.length > 0 ? mechanics[0].id : '');
    setComplaint('');
    setDiagnosis('');
    setNotes('');
    setSelectedServices([serviceItems[0]?.id || 's1']);
    setSelectedParts([]);
    setIsCreateWOOpen(true);
  };

  // Vehicles belonging to selected customer in create modal
  const availableVehicles = useMemo(() => {
    if (!selectedCustomerId) return [];
    return vehicles.filter((v) => v.customerId === selectedCustomerId);
  }, [vehicles, selectedCustomerId]);

  // Handle customer change in create modal
  const handleCustomerChange = (cId: string) => {
    setSelectedCustomerId(cId);
    const related = vehicles.filter((v) => v.customerId === cId);
    if (related.length > 0) {
      setSelectedVehicleId(related[0].id);
    } else {
      setSelectedVehicleId('');
    }
  };

  // Handle open edit modal
  const handleOpenEditModal = (wo: WorkOrder) => {
    setEditingWO(wo);
    setAssignedMechanicId(wo.assignedMechanicId || '');
    setComplaint(wo.complaint || '');
    setDiagnosis(wo.diagnosis || '');
    setNotes(wo.notes || '');
    setSelectedServices(wo.services.map((s) => s.serviceId));
    setSelectedParts(
      wo.sparePartsUsed.map((p) => ({
        partId: p.partId,
        qty: p.quantity
      }))
    );
    setIsEditWOOpen(true);
  };

  // Toggle service selection
  const handleToggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  // Adjust part quantity
  const handlePartQtyChange = (partId: string, delta: number, maxStock: number) => {
    const existing = selectedParts.find((p) => p.partId === partId);
    if (!existing && delta > 0) {
      if (maxStock < 1) {
        showToast('Stok suku cadang ini kosong!', 'warning');
        return;
      }
      setSelectedParts([...selectedParts, { partId, qty: 1 }]);
    } else if (existing) {
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        setSelectedParts(selectedParts.filter((p) => p.partId !== partId));
      } else if (newQty > maxStock) {
        showToast(`Stok tidak mencukupi! Maksimal: ${maxStock} unit`, 'warning');
      } else {
        setSelectedParts(
          selectedParts.map((p) => (p.partId === partId ? { ...p, qty: newQty } : p))
        );
      }
    }
  };

  // Calculate live modal costs
  const calculateModalTotals = () => {
    let serviceCost = 0;
    selectedServices.forEach((sId) => {
      const s = serviceItems.find((item) => item.id === sId);
      if (s) serviceCost += s.price;
    });

    let partsCost = 0;
    selectedParts.forEach((p) => {
      const part = spareParts.find((item) => item.id === p.partId);
      if (part) partsCost += part.sellingPrice * p.qty;
    });

    return {
      serviceCost,
      partsCost,
      total: serviceCost + partsCost
    };
  };

  // Handle submit create work order
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId || !selectedVehicleId) {
      showToast('Pilih pelanggan dan sepeda motor!', 'warning');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
    const mechanic = mechanics.find((m) => m.id === assignedMechanicId);

    if (!customer || !vehicle) {
      showToast('Data pelanggan atau kendaraan tidak valid.', 'error');
      return;
    }

    // Build services list
    const finalServices = selectedServices
      .map((sId) => {
        const s = serviceItems.find((item) => item.id === sId);
        return s ? { serviceId: s.id, name: s.name, price: s.price } : null;
      })
      .filter(Boolean) as { serviceId: string; name: string; price: number }[];

    // Build parts list
    const finalParts = selectedParts
      .map((p) => {
        const part = spareParts.find((item) => item.id === p.partId);
        return part
          ? {
              sparePartId: part.id,
              name: part.name,
              quantity: p.qty,
              price: part.sellingPrice
            }
          : null;
      })
      .filter(Boolean) as { sparePartId: string; name: string; quantity: number; price: number }[];

    const costs = calculateModalTotals();

    addWorkOrder({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      vehicleId: vehicle.id,
      vehicleModel: `${vehicle.brand} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
      assignedMechanicId: mechanic?.id,
      assignedMechanicName: mechanic?.name,
      status: 'waiting',
      complaint: complaint.trim() || 'Servis berkala rutin',
      diagnosis: diagnosis.trim(),
      notes: notes.trim(),
      services: finalServices,
      sparePartsUsed: finalParts,
      costs,
      paymentStatus: 'unpaid'
    });

    showToast(`SPK baru untuk ${vehicle.licensePlate} berhasil dibuat!`, 'success');
    setIsCreateWOOpen(false);
  };

  // Handle submit edit work order
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWO) return;

    const mechanic = mechanics.find((m) => m.id === assignedMechanicId);

    const finalServices = selectedServices
      .map((sId) => {
        const s = serviceItems.find((item) => item.id === sId);
        return s ? { serviceId: s.id, name: s.name, price: s.price } : null;
      })
      .filter(Boolean) as { serviceId: string; name: string; price: number }[];

    const finalParts = selectedParts
      .map((p) => {
        const part = spareParts.find((item) => item.id === p.partId);
        return part
          ? {
              sparePartId: part.id,
              name: part.name,
              quantity: p.qty,
              price: part.sellingPrice
            }
          : null;
      })
      .filter(Boolean) as { sparePartId: string; name: string; quantity: number; price: number }[];

    const costs = calculateModalTotals();

    updateWorkOrder(editingWO.id, {
      assignedMechanicId: mechanic?.id,
      assignedMechanicName: mechanic?.name,
      complaint,
      diagnosis,
      notes,
      services: finalServices,
      sparePartsUsed: finalParts,
      costs
    });

    showToast(`Data SPK ${editingWO.id} berhasil diperbarui!`, 'success');
    setIsEditWOOpen(false);
  };

  // Initiate confirmation modal to move status forward
  const promptNextStatus = (woId: string, currentStatus: WorkOrderStatus) => {
    let nextStatus: WorkOrderStatus = currentStatus;
    let label = '';

    const targetWO = workOrders.find((w) => w.id === woId);
    const hasParts = targetWO && targetWO.sparePartsUsed && targetWO.sparePartsUsed.length > 0;

    if (currentStatus === 'waiting') {
      if (!hasParts) {
        nextStatus = 'waiting_parts';
        label = 'Tunggu Part / Oli (Menunggu Alokasi Part)';
      } else {
        nextStatus = 'in_progress';
        label = 'Sedang Dikerjakan Mekanik';
      }
    } else if (currentStatus === 'waiting_parts') {
      nextStatus = 'in_progress';
      label = 'Sedang Dikerjakan Mekanik';
    } else if (currentStatus === 'in_progress') {
      nextStatus = 'quality_control';
      label = 'Uji Kelaikan (Quality Control)';
    } else if (currentStatus === 'quality_control') {
      nextStatus = 'completed';
      label = 'Selesai & Siap Diambil Pelanggan';
    }

    if (nextStatus !== currentStatus) {
      setAdvancingWO({ id: woId, targetStatus: nextStatus, label });
    }
  };

  // Mechanic holds the job for parts
  const handleHoldForParts = (woId: string) => {
    setAdvancingWO({
      id: woId,
      targetStatus: 'waiting_parts',
      label: 'Tahan: Menunggu Suku Cadang'
    });
  };

  // Confirm advancing status
  const confirmAdvanceStatus = () => {
    if (!advancingWO) return;
    updateWorkOrderStatus(advancingWO.id, advancingWO.targetStatus);
    showToast(`SPK ${advancingWO.id} dipindahkan ke status: ${advancingWO.label}`, 'success');
    setAdvancingWO(null);
  };

  // Handle Delete Work Order
  const handleDeleteWorkOrder = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (canDeleteDirectly(currentRole)) {
      setWoToDelete(id);
    } else {
      requestDelete('workorder', id, `SPK Servis: ${id}`);
      showToast('Permintaan hapus SPK telah diajukan ke Pemilik (Owner).', 'info');
    }
  };

  const confirmDeleteWO = () => {
    if (woToDelete) {
      deleteWorkOrder(woToDelete);
      showToast(`SPK ${woToDelete} berhasil dihapus.`, 'success');
      setWoToDelete(null);
      setIsEditWOOpen(false);
    }
  };

  // Format WhatsApp message notification
  const handleSendWhatsAppUpdate = (wo: WorkOrder) => {
    const customer = customers.find((c) => c.id === wo.customerId);
    const phone = customer?.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const msg = `Halo Kak ${wo.customerName}, pengerjaan sepeda motor ${wo.vehicleModel} (${wo.licensePlate}) di *${shopInfo.name}* telah selesai diperiksa dan siap diambil. Total biaya: ${formatRupiah(wo.costs.total)}. Terima kasih!`;
    const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // Print physical handlebars service tag / SPK slip
  const handlePrintJobSheet = (wo: WorkOrder) => {
    setPrintWO(wo);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const modalTotals = calculateModalTotals();

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{t.workOrders.title}</h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
              {filteredWorkOrders.length} SPK Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Papan alur kerja pengerjaan motor (Kanban). Pantau progres dari antrean awal hingga uji kelaikan jalan.
          </p>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {['owner', 'admin', 'cashier', 'mechanic'].includes(currentRole) && (
            <button
              type="button"
              onClick={() => setIsQuickCheckInOpen(true)}
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-amber-300 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              + Catat Motor Masuk
            </button>
          )}
          {['owner', 'admin', 'cashier'].includes(currentRole) && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Plus className="w-4 h-4 text-inherit" />
              {t.workOrders.createWorkOrder}
            </button>
          )}
        </div>
      </div>

      {/* Quick Search & Mechanic Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs no-print">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Plat Motor, No. SPK, Pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-slate-800 transition-colors"
          />
        </div>

        {/* Mechanic filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSelectedMechanicFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 border ${
              selectedMechanicFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semua ({workOrders.length})
          </button>
          {mechanics.map((m) => {
            const count = workOrders.filter((wo) => String(wo.assignedMechanicId) === String(m.id)).length;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMechanicFilter(m.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
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
            <div key={col.status} className="flex flex-col rounded-xl bg-white border border-slate-200 p-3.5 h-[620px] w-full min-w-[250px] lg:min-w-0 shrink-0 lg:shrink shadow-xs">
              {/* Column Title */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
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
                  <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-[10px] text-center p-3 font-medium bg-slate-50">
                    Tidak ada motor di tahap ini
                  </div>
                ) : (
                  colWOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="p-3.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50/80 shadow-2xs transition-all flex flex-col justify-between min-h-[170px]"
                    >
                      <div>
                        {/* Top SPK & License Plate Badge */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200 font-bold">
                            {wo.id}
                          </span>
                          <span className="font-mono text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                            {wo.licensePlate}
                          </span>
                        </div>

                        {/* Motor Info */}
                        <div className="mt-2.5">
                          <p className="text-xs font-bold text-slate-900 leading-tight">{wo.vehicleModel}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                            {wo.customerName}
                          </p>
                        </div>

                        {/* Complaint preview */}
                        <div className="mt-2 text-[10px] bg-slate-50 border border-slate-200/80 p-2 rounded-md">
                          <p className="text-slate-600 italic line-clamp-2">
                            "{wo.complaint || 'Servis berkala'}"
                          </p>
                        </div>

                        {/* Parts / Oil Counter Badge */}
                        {wo.sparePartsUsed && wo.sparePartsUsed.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            <span>📦 {wo.sparePartsUsed.length} Suku Cadang Terpasang</span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-3 border-t border-slate-100 mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-slate-400 font-medium">Teknisi:</span>
                          <span className="font-bold text-slate-800">{wo.assignedMechanicName || 'Belum ditugaskan'}</span>
                        </div>

                        {/* Advance / Next Status Primary Button */}
                        {wo.status !== 'completed' ? (
                          <>
                            {/* If in waiting_parts stage and NO parts allocated yet, show quick add parts button & disable next */}
                            {wo.status === 'waiting_parts' && (!wo.sparePartsUsed || wo.sparePartsUsed.length === 0) ? (
                              <div className="space-y-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(wo)}
                                  className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider border border-amber-300 shadow-2xs active:scale-95"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  + Tambah Suku Cadang
                                </button>
                                <button
                                  type="button"
                                  disabled
                                  className="w-full py-2 px-3 bg-slate-100 border border-slate-200 text-slate-400 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed uppercase tracking-wider"
                                  title="Tambahkan suku cadang terlebih dahulu untuk melanjutkan pengerjaan"
                                >
                                  <span>Lanjut Pengerjaan (Terkunci)</span>
                                  <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => promptNextStatus(wo.id, wo.status)}
                                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-xs active:scale-98"
                              >
                                <span>
                                  {wo.status === 'waiting'
                                    ? (!wo.sparePartsUsed || wo.sparePartsUsed.length === 0
                                        ? 'Menunggu Part'
                                        : 'Mulai Dikerjakan')
                                    : wo.status === 'waiting_parts'
                                    ? 'Lanjut Pengerjaan'
                                    : wo.status === 'in_progress'
                                    ? 'Uji Kelaikan (QC)'
                                    : 'Selesai & Siap Ambil'}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppUpdate(wo)}
                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-xs"
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
                            className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] text-slate-700 rounded-lg font-bold cursor-pointer transition-colors text-center"
                          >
                            Detail
                          </button>

                          {/* Print Physical Handlebar SPK Slip */}
                          <button
                            type="button"
                            onClick={() => handlePrintJobSheet(wo)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-800 cursor-pointer transition-colors shrink-0 flex items-center justify-center"
                            title="Cetak Lembar SPK Stang Motor"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Let mechanic request a parts hold if they are waiting for stock */}
                          {(wo.status === 'waiting' || wo.status === 'in_progress') && (
                            <button
                              type="button"
                              onClick={() => handleHoldForParts(wo.id)}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 cursor-pointer transition-colors shrink-0 flex items-center justify-center"
                              title="Tahan: Menunggu Suku Cadang"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canTriggerDelete(currentRole) && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteWorkOrder(wo.id, e)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg cursor-pointer transition-colors shrink-0 flex items-center justify-center"
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
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl p-6 text-slate-900 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wide">Pindahkan Tahap SPK?</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Anda akan memindahkan SPK <span className="font-mono text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">{advancingWO.id}</span> ke tahap berikutnya.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-bold text-center">
              Tahap Tujuan: <span className="text-emerald-700 font-bold uppercase">{advancingWO.label}</span>
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <button
                type="button"
                onClick={() => setAdvancingWO(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmAdvanceStatus}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs"
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
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide text-xs">Buat Perintah Kerja (SPK) Servis Baru</h3>
              <button
                type="button"
                onClick={() => setIsCreateWOOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-1 cursor-pointer rounded-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Select Customer */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pilih Pelanggan</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pilih Motor Terdaftar</label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                >
                  <option value="" disabled>-- Pilih Sepeda Motor --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.brand} {v.model} [{v.licensePlate}]
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && selectedCustomerId && (
                  <p className="text-[10px] text-rose-600 mt-1 font-medium">
                    Pelanggan ini belum memiliki motor terdaftar. Harap daftarkan di menu Kendaraan terlebih dahulu.
                  </p>
                )}
              </div>

              {/* Assign Mechanic */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tugaskan Teknisi (Mekanik)</label>
                <select
                  value={assignedMechanicId}
                  onChange={(e) => setAssignedMechanicId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                >
                  <option value="">-- Belum Ditugaskan --</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.position}) - {m.activeJobsCount} tugas aktif
                    </option>
                  ))}
                </select>
              </div>

              {/* Complaint & Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Keluhan Pelanggan</label>
                  <textarea
                    placeholder="Contoh: Mesin berdecit, rem depan bunyi..."
                    rows={2}
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Diagnosa Teknisi Awal</label>
                  <textarea
                    placeholder="Contoh: Kampas rem depan aus, ganti oli mesin..."
                    rows={2}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Service Selection Grid */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Pilih Paket / Jasa Servis</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {serviceItems.map((s) => {
                    const isChecked = selectedServices.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleToggleService(s.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
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
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Alokasi Suku Cadang & Oli</label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {spareParts.map((part) => {
                    const selectedItem = selectedParts.find((p) => p.partId === part.id);

                    return (
                      <div key={part.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 uppercase tracking-tight truncate">{part.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            Stok: <span className={part.currentStock < 5 ? 'text-rose-600 font-bold' : 'text-slate-600 font-bold'}>{part.currentStock} unit</span> • {formatRupiah(part.sellingPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-md p-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePartQtyChange(part.id, -1, part.currentStock)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-bold text-center text-slate-900 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 font-mono text-center text-slate-900 font-bold">
                            {selectedItem ? selectedItem.qty : 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePartQtyChange(part.id, 1, part.currentStock)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-bold text-center text-slate-900 cursor-pointer"
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
                className={`p-3 rounded-lg border flex items-center justify-between text-xs font-bold transition-all ${
                  selectedServices.length > 0 || selectedParts.length > 0
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <div>
                  <span className="block uppercase text-[10px] tracking-wider">Estimasi Biaya Total</span>
                  <span className="text-[10px] font-normal opacity-80">
                    {selectedServices.length} Jasa • {selectedParts.reduce((acc, p) => acc + p.qty, 0)} Part/Oli
                  </span>
                </div>
                <span className="text-base font-mono font-extrabold">{formatRupiah(modalTotals.total)}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  placeholder="Catatan tambahan untuk tim teknisi..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              {/* Foot Controls */}
              <div className="flex gap-2.5 justify-end pt-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateWOOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
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
          <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col text-slate-900 animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase tracking-wide text-xs">Penyesuaian Teknis SPK ({editingWO.id})</h3>
              <div className="flex items-center gap-2">
                {canTriggerDelete(currentRole) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkOrder(editingWO.id)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer"
                    title="Hapus SPK Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus SPK</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsEditWOOpen(false)}
                  className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-1 cursor-pointer rounded-md transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Unit Info summary */}
              <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Pelanggan</span>
                  <p className="font-bold text-slate-900 text-xs">{editingWO.customerName}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{editingWO.customerPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Kendaraan</span>
                  <p className="font-bold text-slate-900 text-xs">{editingWO.vehicleModel}</p>
                  <span className="bg-slate-900 text-white font-mono text-[10px] px-2 py-0.5 rounded-md font-bold inline-block mt-0.5">
                    {editingWO.licensePlate}
                  </span>
                </div>
              </div>

              {/* Assign Mechanic */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ganti Teknisi Bertanggung Jawab</label>
                <select
                  value={assignedMechanicId}
                  onChange={(e) => setAssignedMechanicId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                >
                  <option value="">-- Belum Ditugaskan --</option>
                  {mechanics.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.position})
                    </option>
                  ))}
                </select>
              </div>

              {/* Complaint & Diagnosis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Keluhan Pelanggan</label>
                  <textarea
                    rows={2}
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Diagnosa Kerusakan Mekanik</label>
                  <textarea
                    rows={2}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* Service Selection */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Paket / Jasa Servis</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {serviceItems.map((s) => {
                    const isChecked = selectedServices.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleToggleService(s.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
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

              {/* Spare Parts Selection */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Penggantian Suku Cadang & Oli</label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {spareParts.map((part) => {
                    const selectedItem = selectedParts.find((p) => p.partId === part.id);

                    return (
                      <div key={part.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-[11px]">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-900 uppercase tracking-tight truncate">{part.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            Stok: <span className={part.currentStock < 5 ? 'text-rose-600 font-bold' : 'text-slate-600 font-bold'}>{part.currentStock} unit</span> • {formatRupiah(part.sellingPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-md p-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handlePartQtyChange(part.id, -1, part.currentStock)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-bold text-center text-slate-900 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 font-mono text-center text-slate-900 font-bold">
                            {selectedItem ? selectedItem.qty : 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => handlePartQtyChange(part.id, 1, part.currentStock)}
                            className="w-5 h-5 bg-white hover:bg-slate-200 border border-slate-200 rounded font-bold text-center text-slate-900 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total calculation banner */}
              <div className="p-3 rounded-lg border flex items-center justify-between text-xs font-bold bg-slate-900 text-white">
                <div>
                  <span className="block uppercase text-[10px] tracking-wider text-slate-400">Total Biaya Servis Baru</span>
                  <span className="text-[10px] font-normal text-slate-300">
                    Jasa: {formatRupiah(modalTotals.serviceCost)} • Part: {formatRupiah(modalTotals.partsCost)}
                  </span>
                </div>
                <span className="text-base font-mono font-extrabold text-white">{formatRupiah(modalTotals.total)}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Catatan Tambahan</label>
                <textarea
                  placeholder="Catatan teknis..."
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              {/* Submit & Cancel */}
              <div className="flex gap-2.5 justify-end pt-2 shrink-0 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditWOOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
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
              <span className="border-2 border-black px-3 py-1 font-black text-sm uppercase">LEMBAR SPK STANG</span>
              <p className="text-[10px] mt-1 text-gray-600">{new Date(printWO.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          {/* Unit Data box */}
          <div className="grid grid-cols-2 gap-4 border-b-2 border-black pb-3">
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-500">Nomor SPK:</span>
              <p className="font-black text-base">{printWO.id}</p>
              <span className="text-[9px] uppercase font-bold text-gray-500 mt-1 block">Pelanggan:</span>
              <p className="font-bold">{printWO.customerName} ({printWO.customerPhone})</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-gray-500">Nomor Polisi:</span>
              <p className="font-black text-xl tracking-wider">{printWO.licensePlate}</p>
              <span className="text-[9px] uppercase font-bold text-gray-500 mt-1 block">Tipe Motor:</span>
              <p className="font-bold">{printWO.vehicleModel}</p>
            </div>
          </div>

          {/* Mechanic & Complaints */}
          <div className="border-b-2 border-black pb-3 space-y-2">
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-500">Teknisi Bertanggung Jawab:</span>
              <p className="font-bold uppercase">{printWO.assignedMechanicName || 'Umum / Menunggu Penugasan'}</p>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-gray-500">Keluhan Pelanggan:</span>
              <p className="italic">"{printWO.complaint || 'Servis berkala'}"</p>
            </div>
            {printWO.diagnosis && (
              <div>
                <span className="text-[9px] uppercase font-bold text-gray-500">Diagnosa Mekanik:</span>
                <p>{printWO.diagnosis}</p>
              </div>
            )}
          </div>

          {/* Services & Parts Table */}
          <div>
            <span className="text-[9px] uppercase font-bold text-gray-500 mb-1 block">Rencana Pengerjaan & Suku Cadang:</span>
            <table className="w-full text-left border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="p-1 border-r border-black">Deskripsi Jasa / Part</th>
                  <th className="p-1 text-center border-r border-black w-12">Qty</th>
                  <th className="p-1 text-right w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {printWO.services.map((s, idx) => (
                  <tr key={`svc-${idx}`} className="border-b border-gray-300">
                    <td className="p-1 border-r border-black font-semibold">[JASA] {s.name}</td>
                    <td className="p-1 text-center border-r border-black">1</td>
                    <td className="p-1 text-right">{formatRupiah(s.price)}</td>
                  </tr>
                ))}
                {printWO.sparePartsUsed.map((p, idx) => (
                  <tr key={`part-${idx}`} className="border-b border-gray-300">
                    <td className="p-1 border-r border-black font-semibold">[PART] {p.name}</td>
                    <td className="p-1 text-center border-r border-black">{p.quantity}</td>
                    <td className="p-1 text-right">{formatRupiah(p.price * p.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 text-center text-[10px]">
            <div>
              <p className="font-bold">Paraf Pemilik Motor</p>
              <div className="h-12"></div>
              <p>( {printWO.customerName} )</p>
            </div>
            <div>
              <p className="font-bold">Teknisi / Kepala Mekanik</p>
              <div className="h-12"></div>
              <p>( {printWO.assignedMechanicName || 'Tim Bengkel'} )</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
