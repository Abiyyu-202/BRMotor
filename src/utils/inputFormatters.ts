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

// Formats Indonesian vehicle license plate numbers cleanly (e.g. "b 1234 xyz" -> "B 1234 XYZ")
export function formatPlateNumberInput(val: string): string {
  if (!val) return '';
  // Uppercase and replace multiple spaces with single space
  return val.toUpperCase().replace(/\s+/g, ' ');
}
