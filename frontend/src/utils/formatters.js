/**
 * Format paise to standard INR string
 * @param {number} paise
 * @returns {string} e.g. "₹100.00"
 */
export function formatCurrency(paise = 0) {
  const rupees = (Number(paise) || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Format ISO date string into readable date
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
