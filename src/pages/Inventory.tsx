/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { SparePart } from '../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Database,
  Truck,
  Edit2,
  Trash2,
  X,
  PlusCircle,
  Filter
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

export const Inventory: React.FC = () => {
  const {
    spareParts,
    addSparePart,
    updateSparePart,
    deleteSparePart,
    restockSparePart,
    showToast,
    formatRupiah,
    t,
    currentRole
  } = useWorkshop();

  // Role permissions
  const canTriggerAdd = (role: string) => role === 'owner' || role === 'admin';
  const canTriggerDelete = (role: string) => role === 'owner';

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [currentStock, setCurrentStock] = useState<number | ''>('');
  const [minimumStock, setMinimumStock] = useState<number | ''>('');
  const [supplier, setSupplier] = useState('');

  // Quick category pills
  const quickCategories = [
    { id: 'all', label: 'Semua Kategori' },
    { id: 'Oli & Pelumas', label: 'Oli & Pelumas' },
    { id: 'Pengereman', label: 'Pengereman' },
    { id: 'Mesin & CVT', label: 'Mesin & CVT' },
    { id: 'Kelistrikan', label: 'Kelistrikan' },
    { id: 'Roda & Ban', label: 'Roda & Ban' },
  ];

  // Filtered parts
  const filteredParts = spareParts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || part.category.toLowerCase().includes(categoryFilter.toLowerCase());

    const matchesLowStock = onlyLowStock ? part.currentStock <= part.minimumStock : true;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleOpenAddModal = () => {
    if (!canTriggerAdd(currentRole)) {
      showToast('Akses dibatasi. Hanya Owner & Admin yang dapat menambah suku cadang.', 'warning');
      return;
    }
    setEditingPart(null);
    setName('');
    setSku('');
    setCategory('');
    setPurchasePrice('');
    setSellingPrice('');
    setCurrentStock('');
    setMinimumStock('');
    setSupplier('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (part: SparePart) => {
    if (!canTriggerAdd(currentRole)) {
      showToast('Akses dibatasi. Hanya Owner & Admin yang dapat mengubah suku cadang.', 'warning');
      return;
    }
    setEditingPart(part);
    setName(part.name);
    setSku(part.sku);
    setCategory(part.category);
    setPurchasePrice(part.purchasePrice);
    setSellingPrice(part.sellingPrice);
    setCurrentStock(part.currentStock);
    setMinimumStock(part.minimumStock);
    setSupplier(part.supplier);
    setIsModalOpen(true);
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      showToast('Nama suku cadang dan kode SKU wajib diisi!', 'warning');
      return;
    }

    const numPurchase = typeof purchasePrice === 'number' ? purchasePrice : 0;
    const numSelling = typeof sellingPrice === 'number' ? sellingPrice : 0;
    const numCurrent = typeof currentStock === 'number' ? currentStock : 0;
    const numMin = typeof minimumStock === 'number' ? minimumStock : 0;

    if (editingPart) {
      updateSparePart(editingPart.id, {
        name,
        sku,
        category: category || 'Umum',
        purchasePrice: numPurchase,
        sellingPrice: numSelling,
        currentStock: numCurrent,
        minimumStock: numMin,
        supplier: supplier || 'Distributor Lokal'
      });
      showToast(`Suku cadang ${name} berhasil diperbarui!`, 'success');
    } else {
      addSparePart({
        name,
        sku,
        category: category || 'Umum',
        purchasePrice: numPurchase,
        sellingPrice: numSelling,
        currentStock: numCurrent,
        minimumStock: numMin,
        supplier: supplier || 'Distributor Lokal'
      });
      showToast(`Suku cadang baru ${name} berhasil didaftarkan!`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canTriggerDelete(currentRole)) {
      showToast('Akses ditolak. Hanya Owner yang dapat menghapus data suku cadang.', 'warning');
      return;
    }
    setPartToDelete(id);
  };

  const confirmDelete = () => {
    if (partToDelete) {
      deleteSparePart(partToDelete);
      showToast('Suku cadang berhasil dihapus dari inventaris.', 'success');
      setPartToDelete(null);
    }
  };

  const handleQuickRestock = (part: SparePart) => {
    const amountStr = window.prompt(`Tambah berapa unit stok untuk ${part.name}?`, '10');
    if (amountStr) {
      const amount = parseInt(amountStr, 10);
      if (!isNaN(amount) && amount > 0) {
        restockSparePart(part.id, amount);
        showToast(`Berhasil menambah +${amount} unit ${part.name}!`, 'success');
      }
    }
  };

  // Metrics summary
  const totalSkuCount = spareParts.length;
  const lowStockCount = spareParts.filter((p) => p.currentStock <= p.minimumStock).length;
  const totalWarehouseValue = spareParts.reduce((acc, p) => acc + p.currentStock * p.purchasePrice, 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{t.inventory.title}</h1>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 uppercase">
              {filteredParts.length} SKU Terdata
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Katalog suku cadang motor resmi & original, pantau stok kritis, dan kelola alokasi gudang bengkel.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <Plus className="w-4 h-4" />
          {t.inventory.addPart}
        </button>
      </div>

      {/* Stats overview boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => { setCategoryFilter('all'); setOnlyLowStock(false); }}
          className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Jenis Barang (SKU)</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{totalSkuCount} item</h4>
          </div>
          <Database className="w-8 h-8 text-slate-300 shrink-0" />
        </div>

        <div 
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`p-4 rounded-xl border flex items-center justify-between shadow-2xs cursor-pointer transition-all ${
            onlyLowStock 
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Stok Menipis / Kritis</p>
            <h4 className={`text-xl font-bold mt-1 leading-none ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {lowStockCount} item perlu restock
            </h4>
            <span className="text-[9px] font-bold text-slate-400 mt-1 block">
              {onlyLowStock ? '✓ Filter aktif (Klik untuk reset)' : 'Klik untuk filter hanya stok kritis'}
            </span>
          </div>
          <AlertTriangle className={`w-8 h-8 shrink-0 ${lowStockCount > 0 ? 'text-rose-500' : 'text-slate-300'}`} />
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Nilai Aset Stok</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">
              {formatRupiah(totalWarehouseValue)}
            </h4>
          </div>
          <Truck className="w-8 h-8 text-slate-300 shrink-0" />
        </div>
      </div>

      {/* Filter and query bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col gap-3 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
            {quickCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Low Stock Toggle Button */}
          <button
            type="button"
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              onlyLowStock
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Stok Kritis ({lowStockCount})</span>
          </button>
        </div>

        {/* Text Filter Input */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-medium">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari suku cadang berdasarkan nama, kode part, atau supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none w-full font-medium"
          />
        </div>
      </div>

      {/* Main Table of Spare Parts */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama Part & SKU</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Harga Modal</th>
                <th className="px-4 py-3 text-right">Harga Jual</th>
                <th className="px-4 py-3 text-center">Sisa Stok</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    Tidak ada suku cadang yang sesuai dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => {
                  const isLow = part.currentStock <= part.minimumStock;
                  return (
                    <tr key={part.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 text-xs">{part.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{part.sku}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {part.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatRupiah(part.purchasePrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(part.sellingPrice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md ${
                            isLow
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {part.currentStock} {isLow && '⚠️'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-[11px] truncate max-w-[140px]">
                        {part.supplier}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickRestock(part)}
                            title="Tambah Stok (Restock Cepat)"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(part)}
                            title="Edit Data"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {canTriggerDelete(currentRole) && (
                            <button
                              type="button"
                              onClick={() => handleDelete(part.id)}
                              title="Hapus"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT SPARE PART */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">{editingPart ? 'Edit Suku Cadang' : 'Tambah Suku Cadang Baru'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePart} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Nama Barang / Suku Cadang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kampas Rem Depan Honda Beat"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Kode SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: KMP-REM-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Kategori</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pengereman / Oli / Mesin"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Harga Beli (Modal)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    placeholder="Contoh: 35000"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    placeholder="Contoh: 50000"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Contoh: 10"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Batas Minimal Stok</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Contoh: 3"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pemasok / Supplier</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Sumber Rejeki Motor / AHM"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-bold transition-all cursor-pointer"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold transition-all cursor-pointer shadow-xs"
                >
                  {t.actions.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!partToDelete}
        title="Hapus Suku Cadang"
        message="Apakah Anda yakin ingin menghapus suku cadang ini dari daftar inventaris?"
        onConfirm={confirmDelete}
        onClose={() => setPartToDelete(null)}
      />
    </div>
  );
};
