const HASH_PREFIX = 'sha256$';

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function isPasswordHash(value) {
  return typeof value === 'string' && value.startsWith(HASH_PREFIX) && value.length === HASH_PREFIX.length + 64;
}

export async function hashPassword(plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(plaintext || ''));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return `${HASH_PREFIX}${bufferToHex(digest)}`;
}

export async function verifyPassword(plaintext, hash) {
  if (!isPasswordHash(hash)) return false;
  const nextHash = await hashPassword(plaintext);
  return nextHash === hash;
}
