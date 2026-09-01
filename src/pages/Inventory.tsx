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
  Filter,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Truck,
  Database
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { canTriggerDelete, canDeleteDirectly } from '../utils/permissions';

export const Inventory: React.FC = () => {
  const {
    spareParts,
    addSparePart,
    updateSparePart,
    deleteSparePart,
    restockSparePart,
    showToast,
    language,
    t,
    currentRole,
    requestDelete,
    formatRupiah
  } = useWorkshop();

  // 1. Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Common quick categories in motorcycle workshops
  const quickCategories = [
    { id: 'all', label: 'Semua Kategori' },
    { id: 'Oli & Pelumas', label: '🛢️ Oli & Pelumas' },
    { id: 'Ban & Velg', label: '🛞 Ban & Velg' },
    { id: 'Pengereman', label: '🛑 Kampas & Rem' },
    { id: 'CVT & Transmisi', label: '⚙️ CVT & Roller' },
    { id: 'Kelistrikan & Aki', label: '🔋 Aki & Lampu' },
    { id: 'Suku Cadang Mesin', label: '🔧 Mesin & Busi' },
  ];

  // Dynamic categories from existing spare parts
  const existingCategories = spareParts.map((p) => p.category).filter((val, idx, self) => self.indexOf(val) === idx);

  // 2. Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [currentStock, setCurrentStock] = useState(10);
  const [minimumStock, setMinimumStock] = useState(5);
  const [supplier, setSupplier] = useState('');
  const [partToDelete, setPartToDelete] = useState<string | null>(null);

  // 3. Actions
  const handleOpenAddModal = () => {
    setEditingPart(null);
    setName('');
    setSku('');
    setCategory('Oli & Pelumas');
    setPurchasePrice(0);
    setSellingPrice(0);
    setCurrentStock(10);
    setMinimumStock(5);
    setSupplier('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: SparePart) => {
    setEditingPart(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setPurchasePrice(p.purchasePrice);
    setSellingPrice(p.sellingPrice);
    setCurrentStock(p.currentStock);
    setMinimumStock(p.minimumStock);
    setSupplier(p.supplier);
    setIsModalOpen(true);
  };

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !category.trim() || !supplier.trim()) {
      showToast('Semua field wajib diisi untuk menyimpan suku cadang', 'error');
      return;
    }

    if (sellingPrice < purchasePrice) {
      showToast('Peringatan: Harga jual lebih rendah dari harga beli!', 'warning');
    }

    const partData = {
      name,
      sku: sku.toUpperCase(),
      category,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      currentStock: Number(currentStock),
      minimumStock: Number(minimumStock),
      supplier
    };

    if (editingPart) {
      updateSparePart(editingPart.id, partData);
    } else {
      addSparePart(partData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canTriggerDelete(currentRole)) return;
    if (canDeleteDirectly(currentRole)) {
      setPartToDelete(id);
    } else {
      const part = spareParts.find((p) => p.id === id);
      requestDelete('sparepart', id, part?.name || id);
    }
  };

  const confirmDeletePart = () => {
    if (partToDelete) {
      deleteSparePart(partToDelete);
      setPartToDelete(null);
    }
  };

  // 4. Filters logic
  const filteredParts = spareParts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      categoryFilter === 'all' || 
      p.category.toLowerCase().includes(categoryFilter.toLowerCase()) ||
      categoryFilter.toLowerCase().includes(p.category.toLowerCase());

    const matchesLowStock = onlyLowStock ? p.currentStock <= p.minimumStock : true;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Calculate stats
  const totalSkuCount = spareParts.length;
  const lowStockCount = spareParts.filter((p) => p.currentStock <= p.minimumStock).length;
  const totalWarehouseValue = spareParts.reduce((sum, p) => sum + p.purchasePrice * p.currentStock, 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-900">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
            <Package className="w-5 h-5 text-slate-800" />
            {t.inventory.title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {language === 'id'
              ? 'Kelola kuantitas persediaan suku cadang, atur batas minimal stok, dan daftar pemasok.'
              : 'Maintain stock quantities, configure safety minimum margins, and manage parts suppliers.'}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t.inventory.addPart}
        </button>
      </div>

      {/* Stats overview boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => { setCategoryFilter('all'); setOnlyLowStock(false); }}
          className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm cursor-pointer hover:border-slate-300 transition-all"
        >
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Jenis Barang (SKU)</p>
            <h4 className="text-xl font-bold text-slate-900 mt-1 leading-none">{totalSkuCount} item</h4>
          </div>
          <Database className="w-8 h-8 text-slate-300 shrink-0" />
        </div>

        <div 
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm cursor-pointer transition-all ${
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

        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
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
      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
            {quickCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
              onlyLowStock
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Stok Kritis ({lowStockCount})</span>
          </button>
        </div>

        {/* Text Filter Input */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-medium">
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

      {/* Tabular data panel */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800 text-[10px] uppercase tracking-wider font-bold">
                <th className="p-4">SKU / Nama Barang</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Harga (Beli / Jual)</th>
                <th className="p-4 text-center">Batas Min Stok</th>
                <th className="p-4">Pemasok / Supplier</th>
                <th className="p-4 text-center">Jumlah Stok</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs font-medium">
                    Tidak ada suku cadang yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredParts.map((p) => {
                  const isLow = p.currentStock <= p.minimumStock;

                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-100 bg-white transition-colors hover:bg-slate-50 ${
                        isLow ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Name / SKU */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900 uppercase tracking-tight">{p.name}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase font-bold">{p.sku}</p>
                      </td>

                      {/* Category */}
                      <td className="p-4">
                        <span className="bg-slate-100 border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {p.category.toUpperCase()}
                        </span>
                      </td>

                      {/* Buy / Sell Price */}
                      <td className="p-4 text-right font-mono">
                        <p className="text-slate-500 font-medium">Beli: {formatRupiah(p.purchasePrice)}</p>
                        <p className="font-bold text-emerald-600 mt-0.5">Jual: {formatRupiah(p.sellingPrice)}</p>
                      </td>

                      {/* Min Safety Stock */}
                      <td className="p-4 text-center font-medium text-slate-600">{p.minimumStock} unit</td>

                      {/* Supplier */}
                      <td className="p-4">
                        <p className="font-medium text-slate-900">{p.supplier}</p>
                      </td>

                      {/* Current Stock */}
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                              isLow
                                ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            Sisa {p.currentStock}
                          </span>
                          {isLow && (
                            <span className="text-[8px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> RESTOK
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Inline Restock Shortcut */}
                          <button
                            onClick={() => restockSparePart(p.id, 10)}
                            className="px-2 py-1 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                            title="Tambah 10 Unit"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {canTriggerDelete(currentRole) && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                              title="Hapus"
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
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-xl animate-scale-in">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">{editingPart ? 'Edit Suku Cadang' : 'Tambah Suku Cadang Baru'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer p-1 rounded-lg transition-all"
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
                  placeholder="Contoh: Ban Tubeless Michelin 90/90-14"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Kode SKU</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BAN-MCH-909014"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Kategori</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ban, Oli, Rem, Mesin"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Harga Beli (Modal)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Harga Jual</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={currentStock}
                    onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Batas Minimal Stok</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pemasok / Supplier</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Sumber Rejeki Motor"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 font-medium focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Simpan Suku Cadang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!partToDelete}
        title="Hapus Suku Cadang"
        message="Apakah Anda yakin ingin menghapus suku cadang ini dari katalog? Data riwayat servis mungkin terpengaruh."
        onConfirm={confirmDeletePart}
        onClose={() => setPartToDelete(null)}
      />
    </div>
  );
};
