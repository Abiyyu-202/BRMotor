/**
 * Input Ergonomics & Auto-Formatters for BRMotor
 */

// Formats a number or string into a clean thousands-separated string (e.g. 50000 -> "50.000")
export function formatCurrencyInput(val: number | string): string {
  if (val === undefined || val === null || val === '') return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  const num = parseInt(clean, 10);
  return isNaN(num) ? '' : num.toLocaleString('id-ID');
}

// Parses a formatted currency string into pure number (e.g. "50.000" -> 50000)
export function parseCurrencyInput(formatted: string): number {
  if (!formatted) return 0;
  const clean = String(formatted).replace(/\D/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

export interface PlateValidationResult {
  isValid: boolean;
  message?: string;
}

// Formats Indonesian vehicle license plate numbers cleanly (e.g. "b 1234 xyz" -> "B 1234 XYZ")
export function formatPlateNumberInput(val: string): string {
  if (!val) return '';
  // Uppercase and replace multiple spaces with single space
  return val.toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Validates Indonesian vehicle license plate format (TNKB).
 * Standard format:
 * - Prefix: 1-2 uppercase letters (Kode Wilayah)
 * - Number: 1-4 digits without leading zero (Nomor Polisi)
 * - Suffix: 1-3 uppercase letters (Seri Wilayah)
 * Separated by single space.
 */
export function validateIndonesianPlate(plate: string): PlateValidationResult {
  if (!plate || typeof plate !== 'string' || !plate.trim()) {
    return {
      isValid: false,
      message: 'Plat nomor tidak boleh kosong.'
    };
  }

  const clean = plate.trim().toUpperCase().replace(/\s+/g, ' ');

  const indonesianPlateRegex = /^[A-Z]{1,2} [1-9][0-9]{0,3} [A-Z]{1,3}$/;

  if (!indonesianPlateRegex.test(clean)) {
    const parts = clean.split(' ');
    if (parts.length === 1) {
      return {
        isValid: false,
        message: 'Format plat nomor tidak lengkap. Gunakan spasi pemisah (contoh: B 1234 BKM).'
      };
    }
    if (parts.length === 2) {
      if (/^[A-Z]{1,2}$/.test(parts[0]) && /^[0-9]+$/.test(parts[1])) {
        return {
          isValid: false,
          message: 'Format plat nomor tidak lengkap. Huruf seri belakang wajib diisi (contoh: B 1234 BKM).'
        };
      }
      if (/^[0-9]+$/.test(parts[0]) && /^[A-Z]{1,3}$/.test(parts[1])) {
        return {
          isValid: false,
          message: 'Format plat nomor tidak lengkap. Kode wilayah depan wajib diisi (contoh: B 1234 BKM).'
        };
      }
      if (/^[A-Z]{1,2}$/.test(parts[0]) && /^[A-Z]{1,3}$/.test(parts[1])) {
        return {
          isValid: false,
          message: 'Format plat nomor tidak lengkap. Nomor polisi wajib diisi (contoh: B 1234 BKM).'
        };
      }
      return {
        isValid: false,
        message: 'Format plat nomor tidak lengkap. Format standar: [Kode Wilayah] [Nomor Polisi] [Seri Belakang] (contoh: B 1234 BKM).'
      };
    }
    if (parts.length === 3) {
      const [prefix, num, suffix] = parts;
      if (!/^[A-Z]{1,2}$/.test(prefix)) {
        return {
          isValid: false,
          message: 'Kode wilayah depan tidak valid. Harus berupa 1-2 huruf kapital (contoh: B, D, AB).'
        };
      }
      if (/^0/.test(num)) {
        return {
          isValid: false,
          message: 'Nomor polisi tidak boleh diawali dengan angka 0.'
        };
      }
      if (!/^[0-9]{1,4}$/.test(num)) {
        return {
          isValid: false,
          message: 'Nomor polisi tidak valid. Nomor polisi harus berupa 1-4 digit angka.'
        };
      }
      if (!/^[A-Z]{1,3}$/.test(suffix)) {
        return {
          isValid: false,
          message: 'Huruf seri belakang tidak valid. Harus berupa 1-3 huruf kapital (contoh: A, AB, BKM).'
        };
      }
    }
    return {
      isValid: false,
      message: 'Format plat nomor tidak valid. Format standar: [1-2 Huruf] [1-4 Angka] [1-3 Huruf] (contoh: B 1234 BKM).'
    };
  }

  return {
    isValid: true
  };
}
