export function cleanDNI(value) {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
}

export function formatDNI(value) {
  const digits = cleanDNI(value);
  if (!digits || digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  if (rest.length <= 3) return `${rest}.${last3}`;
  const next3 = rest.slice(-3);
  const first = rest.slice(0, -3);
  return `${first}.${next3}.${last3}`;
}

export function normalizeDNI(value) {
  return cleanDNI(value);
}
