import { WorkOrder, ShopInfo } from '../types';

export interface PrintThermalReceiptOptions {
  workOrder: WorkOrder;
  shopInfo: ShopInfo;
  paperWidth?: '58mm' | '80mm';
  formatRupiah: (val: number) => string;
}

export const getSavedPaperWidth = (): '58mm' | '80mm' => {
  try {
    const saved = localStorage.getItem('brmotor_thermal_paper_width');
    if (saved === '80mm' || saved === '58mm') {
      return saved;
    }
  } catch {
    // ignore
  }
  return '58mm';
};

export const savePaperWidth = (width: '58mm' | '80mm') => {
  try {
    localStorage.setItem('brmotor_thermal_paper_width', width);
  } catch {
    // ignore
  }
};

export const printThermalReceipt = ({
  workOrder,
  shopInfo,
  paperWidth = '58mm',
  formatRupiah,
}: PrintThermalReceiptOptions) => {
  const serviceCost = workOrder.costs?.serviceCost || 0;
  const sparePartCost = workOrder.costs?.sparePartCost || 0;
  const discount = workOrder.costs?.discount || 0;
  const grandTotal = workOrder.costs?.total || (serviceCost + sparePartCost - discount);

  const createdAt = workOrder.createdAt ? new Date(workOrder.createdAt) : new Date();
  const dateStr = createdAt.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = createdAt.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const is58 = paperWidth === '58mm';
  const widthMm = is58 ? '58mm' : '80mm';
  const fontSize = is58 ? '10px' : '11.5px';
  const headerFontSize = is58 ? '12px' : '14px';
  const padding = is58 ? '3mm 2.5mm 5mm 2.5mm' : '4mm 4mm 6mm 4mm';

  const barcodeBars = [2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 3];
  const barcodeHtml = barcodeBars
    .map((w) => `<span style="display:inline-block;height:100%;background:#000;width:${w}px;margin:0 0.5px;"></span>`)
    .join('');

  const servicesHtml = workOrder.services
    .map(
      (s) => `
      <div class="row">
        <span class="col-left">${escapeHtml(s.name)}</span>
        <span class="col-right">${formatRupiah(s.price)}</span>
      </div>`
    )
    .join('');

  const sparePartsHtml = (workOrder.sparePartsUsed || [])
    .map((p) => {
      const unitPrice = p.pricePerUnit ?? (p as any).price ?? 0;
      const total = p.totalPrice ?? unitPrice * p.quantity;
      return `
      <div class="row">
        <div class="col-left">
          <div>${escapeHtml(p.name)}</div>
          <div class="sub-text">${p.quantity}x @${formatRupiah(unitPrice)}</div>
        </div>
        <span class="col-right">${formatRupiah(total)}</span>
      </div>`;
    })
    .join('');

  const receiptHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Struk_${workOrder.id}</title>
  <style id="receipt-base-styles">
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&display=swap');
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'JetBrains Mono', ui-monospace, 'Liberation Mono', 'Courier New', monospace;
      width: ${widthMm};
      max-width: ${widthMm};
      margin: 0 auto;
      padding: ${padding};
      font-size: ${fontSize};
      line-height: 1.28;
      color: #000000;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .black { font-weight: 900; }
    .uppercase { text-transform: uppercase; }
    .sub-text {
      font-size: 85%;
      color: #333333;
    }
    .badge {
      display: inline-block;
      border: 1px solid #000;
      padding: 0 3px;
      font-size: 85%;
      font-weight: bold;
      border-radius: 2px;
    }
    .divider {
      border-top: 1px dashed #000000;
      margin: 4px 0;
    }
    .double-divider {
      border-top: 2px dashed #000000;
      margin: 6px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4px;
      margin-bottom: 2px;
    }
    .col-left {
      flex: 1;
      text-align: left;
      word-break: break-word;
    }
    .col-right {
      text-align: right;
      white-space: nowrap;
      font-weight: 600;
      margin-left: 4px;
    }
    .header-logo {
      width: 26px;
      height: 26px;
      border: 1.5px solid #000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 3px auto;
      font-weight: 900;
      font-size: 11px;
    }
    .barcode-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 22px;
      margin: 5px 0 2px 0;
      overflow: hidden;
    }
    .status-stamp {
      display: inline-block;
      border: 1.5px solid #000;
      padding: 1px 8px;
      font-weight: 900;
      font-size: 9px;
      letter-spacing: 0.5px;
      margin-top: 3px;
    }
  </style>
  <style id="dynamic-page-size">
    @page {
      size: ${widthMm} 165mm;
      margin: 0mm;
    }
    @media print {
      html {
        width: ${widthMm} !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      body {
        width: ${widthMm} !important;
        margin: 0 auto !important;
        padding: ${padding} !important;
        background: #ffffff !important;
        color: #000000 !important;
        overflow: hidden !important;
      }
    }
  </style>
</head>
<body>
  <div class="text-center" style="margin-bottom: 4px;">
    <div class="header-logo">BR</div>
    <div class="bold uppercase" style="font-size: ${headerFontSize}; line-height: 1.1;">
      ${escapeHtml(shopInfo.name)}
    </div>
    <div class="sub-text" style="margin-top: 2px;">${escapeHtml(shopInfo.address)}</div>
    <div class="sub-text bold">Telp/WA: ${escapeHtml(shopInfo.phone)}</div>
  </div>

  <div class="double-divider"></div>

  <div class="row">
    <span class="sub-text">No. SPK:</span>
    <span class="bold">#${escapeHtml(workOrder.id)}</span>
  </div>
  <div class="row">
    <span class="sub-text">Waktu:</span>
    <span>${dateStr} ${timeStr}</span>
  </div>
  <div class="row">
    <span class="sub-text">Pelanggan:</span>
    <span class="bold">${escapeHtml(workOrder.customerName)}</span>
  </div>
  <div class="row">
    <span class="sub-text">No. Polisi:</span>
    <span class="badge">${escapeHtml(workOrder.licensePlate)}</span>
  </div>
  <div class="row">
    <span class="sub-text">Unit:</span>
    <span>${escapeHtml(workOrder.vehicleModel)}</span>
  </div>
  <div class="row">
    <span class="sub-text">Teknisi:</span>
    <span>${escapeHtml(workOrder.assignedMechanicName || '-')}</span>
  </div>

  <div class="divider"></div>

  <div class="bold uppercase sub-text" style="margin-bottom: 2px;">Jasa & Servis</div>
  ${servicesHtml}

  ${
    sparePartsHtml
      ? `
  <div class="bold uppercase sub-text" style="margin-top: 4px; margin-bottom: 2px;">Suku Cadang</div>
  ${sparePartsHtml}
  `
      : ''
  }

  <div class="divider"></div>

  <div class="row">
    <span class="sub-text">Subtotal:</span>
    <span>${formatRupiah(serviceCost + sparePartCost)}</span>
  </div>
  ${
    discount > 0
      ? `
  <div class="row">
    <span class="sub-text">Diskon:</span>
    <span>-${formatRupiah(discount)}</span>
  </div>
  `
      : ''
  }
  <div class="row bold" style="font-size: 105%; margin-top: 3px; padding-top: 3px; border-top: 1px solid #000;">
    <span>TOTAL:</span>
    <span>${formatRupiah(grandTotal)}</span>
  </div>
  <div class="row" style="margin-top: 2px;">
    <span class="sub-text">Metode:</span>
    <span class="bold uppercase">${escapeHtml(workOrder.paymentMethod || 'TUNAI')}</span>
  </div>
  ${
    workOrder.paymentMethod === 'cash'
      ? `
  <div class="row">
    <span class="sub-text">Uang Diterima:</span>
    <span>${formatRupiah(workOrder.cashTendered || grandTotal)}</span>
  </div>
  <div class="row bold">
    <span>Kembali:</span>
    <span>${formatRupiah(workOrder.changeAmount || 0)}</span>
  </div>
  `
      : ''
  }

  <div class="double-divider"></div>

  <div class="text-center">
    <div class="barcode-container">
      ${barcodeHtml}
    </div>
    <div class="sub-text" style="letter-spacing: 2px; font-size: 8px;">*${escapeHtml(workOrder.id)}*</div>
    <div>
      <span class="status-stamp">LUNAS</span>
    </div>
  </div>

  <div class="text-center sub-text" style="margin-top: 6px; line-height: 1.3;">
    <div class="bold" style="color: #000;">★ TERIMA KASIH ATAS KUNJUNGAN ANDA ★</div>
    <div>Simpan struk ini sebagai bukti resmi garansi servis selama 7 hari kalender.</div>
    <div style="font-size: 8px; margin-top: 3px; color: #666;">BRMotor Management System</div>
  </div>
</body>
</html>`;

  // Use hidden iframe to isolate the print context so @page dimensions apply strictly
  let iframe = document.getElementById('thermal-receipt-print-frame') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'thermal-receipt-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    return;
  }

  iframeDoc.open();
  iframeDoc.write(receiptHtml);
  iframeDoc.close();

  // Allow browser time to render content, measure actual height, then apply exact @page dimensions
  setTimeout(() => {
    try {
      const doc = iframe?.contentWindow?.document;
      if (doc && doc.body) {
        const body = doc.body;
        const docEl = doc.documentElement;
        const scrollHeight = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          docEl ? docEl.scrollHeight : 0
        );

        // Convert px to mm: 1 px = 25.4 / 96 mm (~0.264583 mm). Add buffer for thermal tear margin
        const calculatedHeightMm = Math.ceil(scrollHeight * (25.4 / 96)) + 10;
        const finalHeightMm = Math.max(calculatedHeightMm, 120);

        const styleEl = doc.getElementById('dynamic-page-size');
        if (styleEl) {
          styleEl.textContent = `
            @page {
              size: ${widthMm} ${finalHeightMm}mm;
              margin: 0mm;
            }
            @media print {
              html {
                width: ${widthMm} !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              body {
                width: ${widthMm} !important;
                margin: 0 auto !important;
                padding: ${padding} !important;
                background: #ffffff !important;
                color: #000000 !important;
                overflow: hidden !important;
              }
            }
          `;
        }
      }

      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch {
      // Fallback to window.print if iframe print is blocked
      window.print();
    }
  }, 250);
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
