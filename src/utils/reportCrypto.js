// src/utils/reportCrypto.js

/**
 * Computes a standard SHA-256 hash string from test result data
 * Serves as tamper-evident proof for jury audit
 */
export async function generateReportDigest(reportData) {
  const rawString = JSON.stringify(reportData);
  const encoder = new TextEncoder();
  const data = encoder.encode(rawString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}