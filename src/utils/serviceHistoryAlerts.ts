import { WorkOrder } from '../types';

export interface RecurringIssueAlert {
  keyword: string;
  previousWoId: string;
  previousDate: string;
  previousComplaint: string;
  advice: string;
}

const PROBLEM_DOMAINS = [
  {
    topic: 'karburator / suplai bensin',
    keywords: ['brebet', 'karbu', 'karburator', 'spuyer', 'injeksi', 'nyendat', 'tersendat', 'gas kosong'],
    advice: (prevDate: string, prevWoId: string) =>
      `Motor ini pernah ditangani terkait karburator/brebet pada ${prevDate} (${prevWoId}). Hindari langsung mengganti karburator kembali; prioritaskan pengecekan busi, pengapian, spuyer, intake manifold bocor, atau setelan klep.`
  },
  {
    topic: 'transmisi CVT & tarikan',
    keywords: ['cvt', 'roller', 'v-belt', 'vanbelt', 'gredek', 'getar', 'tarikan berat', 'berat', 'mangkok ganda', 'kampas ganda', 'loyo'],
    advice: (prevDate: string, prevWoId: string) =>
      `Motor ini pernah diservis terkait transmisi CVT/tarikan berat pada ${prevDate} (${prevWoId}). Cek kondisi per CVT, sliding sheave, mangkok kopling, dan kebersihan pulley sebelum mengganti part lagi.`
  },
  {
    topic: 'kelistrikan & mogok',
    keywords: ['mati', 'mogok', 'starter', 'stater', 'aki', 'kelistrikan', 'sekring', 'spul', 'pengapian'],
    advice: (prevDate: string, prevWoId: string) =>
      `Kendaraan pernah mengalami mati/mogok pada ${prevDate} (${prevWoId}). Periksa jalur pengisian strum aki, kiprok/regulator, dan spul kelistrikan selain busi.`
  },
  {
    topic: 'pengereman',
    keywords: ['rem', 'blong', 'berdecit', 'kaliper', 'cakram', 'tromol', 'kampas rem', 'minyak rem'],
    advice: (prevDate: string, prevWoId: string) =>
      `Masalah pengereman pernah ditangani pada ${prevDate} (${prevWoId}). Cek kerataan piringan cakram/tromol dan kuras minyak rem selain sekadar mengganti kampas.`
  },
  {
    topic: 'mesin & pelumasan',
    keywords: ['bocor', 'panas', 'overheat', 'asap', 'ngebul', 'rembes', 'oli mesin'],
    advice: (prevDate: string, prevWoId: string) =>
      `Masalah pelumasan/mesin pernah ditangani pada ${prevDate} (${prevWoId}). Cek paking/seal mesin, sil klep, dan kondisi ring piston.`
  }
];

export function detectRecurringIssue(
  licensePlate: string | undefined,
  vehicleId: string | undefined,
  complaintText: string | undefined,
  allWorkOrders: WorkOrder[],
  currentWoId?: string
): RecurringIssueAlert | null {
  const cleanPlate = (licensePlate || '').toUpperCase().replace(/\s+/g, '');
  const cleanVehId = vehicleId ? String(vehicleId) : '';
  const text = (complaintText || '').toLowerCase().trim();

  if ((!cleanPlate && !cleanVehId) || !text) {
    return null;
  }

  // Find prior work orders for the same vehicle
  const priorOrders = (allWorkOrders || [])
    .filter((wo) => {
      if (currentWoId && wo.id === currentWoId) return false;
      const matchPlate = cleanPlate && wo.licensePlate && wo.licensePlate.toUpperCase().replace(/\s+/g, '') === cleanPlate;
      const matchId = cleanVehId && wo.vehicleId && String(wo.vehicleId) === cleanVehId;
      return Boolean(matchPlate || matchId);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (priorOrders.length === 0) {
    return null;
  }

  // 1. Check keyword-based problem domains
  for (const domain of PROBLEM_DOMAINS) {
    const matchedKw = domain.keywords.find((kw) => text.includes(kw));
    if (matchedKw) {
      for (const prev of priorOrders) {
        const prevFullText = [
          prev.complaint,
          prev.diagnosis,
          ...(prev.services || []).map((s) => s.name),
          ...(prev.sparePartsUsed || []).map((p) => p.name)
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const prevMatched = domain.keywords.some((kw) => prevFullText.includes(kw));
        if (prevMatched) {
          const prevDate = prev.createdAt
            ? new Date(prev.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : '-';

          return {
            keyword: matchedKw,
            previousWoId: prev.id,
            previousDate: prevDate,
            previousComplaint: prev.complaint || 'Keluhan servis sebelumnya',
            advice: domain.advice(prevDate, prev.id)
          };
        }
      }
    }
  }

  // 2. Fallback: match significant shared words (>= 4 letters) in complaint
  const ignoreWords = new Set(['servis', 'rutin', 'berkala', 'ganti', 'cek', 'pasang', 'bongkar', 'pemeriksaan', 'motor', 'rusak', 'bunyi']);
  const words = text
    .split(/[\s,./\\;:'"-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !ignoreWords.has(w));

  for (const word of words) {
    for (const prev of priorOrders) {
      const prevComplaint = (prev.complaint || '').toLowerCase();
      if (prevComplaint.includes(word)) {
        const prevDate = prev.createdAt
          ? new Date(prev.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          : '-';

        return {
          keyword: word,
          previousWoId: prev.id,
          previousDate: prevDate,
          previousComplaint: prev.complaint || 'Keluhan servis sebelumnya',
          advice: `Kendaraan ini pernah tercatat dengan keluhan serupa ('${prev.complaint || word}') pada ${prevDate} (${prev.id}). Lakukan evaluasi penyebab mendasar sebelum mengulang tindakan atau penggantian suku cadang yang sama.`
        };
      }
    }
  }

  return null;
}
