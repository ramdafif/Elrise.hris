// Cryptographic & Secrets Protection Engine
// Implements bcrypt hashing, AES-256-GCM application-level encryption, and password policy checks.

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const BCRYPT_SALT_ROUNDS = 12;

// Standard AES-256-GCM specification
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Common insecure passwords list for blacklist enforcement
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password123', 'admin', 'admin123', 'nusantara', 'nusantara123',
  '123456', '12345678', '123456789', 'qwerty', 'secret', 'welcome', 'welcome1',
  'letmein', 'monkey', 'dragon', 'football', 'master', 'superadmin', 'indonesia'
]);

export interface PasswordPolicyValidation {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates password against Enterprise Password Policy
 * - Min 12 characters
 * - Uppercase, Lowercase, Number, Special Character
 * - Not in common password blacklist
 */
export function validatePasswordPolicy(password: string): PasswordPolicyValidation {
  const errors: string[] = [];

  if (!password || password.length < 12) {
    errors.push('Kata sandi minimal harus terdiri dari 12 karakter.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Kata sandi harus mengandung setidaknya satu huruf besar (A-Z).');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Kata sandi harus mengandung setidaknya satu huruf kecil (a-z).');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Kata sandi harus mengandung setidaknya satu angka (0-9).');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Kata sandi harus mengandung setidaknya satu karakter khusus (!@#$%^&* dll).');
  }

  const normalized = password.toLowerCase().trim();
  const stripped1 = normalized.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+[a-z0-9]?$/i, '');
  const stripped2 = normalized.replace(/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/i, '');
  const isBlacklisted =
    COMMON_PASSWORDS.has(normalized) ||
    COMMON_PASSWORDS.has(stripped1) ||
    COMMON_PASSWORDS.has(stripped2);

  if (isBlacklisted) {
    errors.push('Kata sandi terlalu umum dan mudah ditebak. Silakan gunakan kombinasi lain.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hashes a plaintext password using bcrypt (adaptive cost 12 rounds)
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash
 */
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  if (!plaintext || !hash) return false;
  return bcrypt.compare(plaintext, hash);
}

/**
 * Generates a cryptographically random token (e.g. for single-use password reset or MFA recovery)
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Creates a SHA-256 hash of a token for secure database storage
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Resolves or derives a 32-byte encryption key for AES-256-GCM
 */
function getDerivedKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY || 'NusantaraHRISSecureSecretKey2026';
  // Use SHA-256 to ensure exact 32-byte key regardless of input format
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Application-Level Encryption for Sensitive Fields (AES-256-GCM with AEAD)
 * Returns formatted string: "enc:iv:authTag:ciphertext"
 */
export function encryptField(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getDerivedKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
}

/**
 * Decrypts an application-level encrypted field
 */
export function decryptField(encryptedValue: string): string {
  if (!encryptedValue || !encryptedValue.startsWith('enc:')) {
    return encryptedValue; // Return as-is if not encrypted
  }

  try {
    const parts = encryptedValue.split(':');
    if (parts.length !== 4) return encryptedValue;

    const [, ivHex, authTagHex, ciphertextHex] = parts;
    const key = getDerivedKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption failure: authentication tag or key mismatch', err);
    return '[DATA_DECRYPTION_ERROR]';
  }
}
