/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useWorkshop } from '../context/WorkshopContext';
import { CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';

export const DeletionApprovalPanel: React.FC = () => {
  const { deletionRequests, approveDeletion, rejectDeletion, language } = useWorkshop();

  const pendingRequests = deletionRequests.filter((r) => r.status === 'pending');
  const processedRequests = deletionRequests.filter((r) => r.status !== 'pending');

  if (pendingRequests.length === 0 && processedRequests.length === 0) return null;

  const entityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      customer: 'Pelanggan',
      vehicle: 'Kendaraan',
      booking: 'Booking',
      work_order: 'SPK',
      sparepart: 'Suku Cadang',
      mechanic: 'Mekanik',
    };
    return labels[type] || type;
  };

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
        <Trash2 className="w-4 h-4 text-slate-500" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {language === 'id' ? 'Persetujuan Penghapusan Data' : 'Data Deletion Approvals'}
        </h3>
        {pendingRequests.length > 0 && (
          <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-md">
            {pendingRequests.length} {language === 'id' ? 'menunggu' : 'pending'}
          </span>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-2.5 mb-5">
          <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
            {language === 'id' ? 'Menunggu Persetujuan' : 'Awaiting Approval'}
          </p>
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {entityTypeLabel(req.entityType)}: {req.entityLabel}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Diminta oleh {req.requestedByName} ({req.requestedByRole}) &bull; {new Date(req.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => approveDeletion(req.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  {language === 'id' ? 'Setujui' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={() => rejectDeletion(req.id)}
                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  {language === 'id' ? 'Tolak' : 'Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Processed Requests (history) */}
      {processedRequests.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {language === 'id' ? 'Riwayat' : 'History'}
          </p>
          {processedRequests.slice(0, 10).map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-lg"
            >
              {req.status === 'approved' ? (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-700 truncate">
                  {entityTypeLabel(req.entityType)}: {req.entityLabel}
                </p>
                <p className="text-[10px] text-slate-400">
                  {req.status === 'approved' ? 'Disetujui' : 'Ditolak'} oleh {req.reviewedByName || '-'}
                </p>
              </div>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {req.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
