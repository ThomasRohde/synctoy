// AES-256-GCM encryption utilities using Web Crypto API
// For Sensitive Mode as specified in PRD

import type { CryptoParams, EncryptedContent, PlainContent } from '../types';

// PBKDF2 configuration
const PBKDF2_ITERATIONS = 100000; // High iteration count for security
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for GCM
const KEY_LENGTH = 256; // AES-256
const CRYPTO_VERSION = 1;

// Convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
}

// Convert base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Derive encryption key from passphrase using PBKDF2
async function deriveKey(
    passphrase: string,
    salt: Uint8Array
): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passphraseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(passphrase),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt.buffer as ArrayBuffer,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        passphraseKey,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt content with passphrase
export async function encryptContent(
    content: PlainContent,
    passphrase: string
): Promise<EncryptedContent> {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Derive key from passphrase
    const key = await deriveKey(passphrase, salt);

    // Serialize content to JSON
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(content));

    // Encrypt using AES-256-GCM
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext
    );

    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        crypto: {
            alg: 'AES-GCM',
            keyDerivation: 'PBKDF2',
            salt: arrayBufferToBase64(salt.buffer),
            iv: arrayBufferToBase64(iv.buffer),
            iterations: PBKDF2_ITERATIONS,
            version: CRYPTO_VERSION,
        },
    };
}

// Decrypt content with passphrase
export async function decryptContent(
    encryptedContent: EncryptedContent,
    passphrase: string
): Promise<PlainContent> {
    const { ciphertext, crypto: cryptoParams } = encryptedContent;

    // Validate version
    if (cryptoParams.version !== CRYPTO_VERSION) {
        throw new Error(`Unsupported encryption version: ${cryptoParams.version}`);
    }

    // Decode salt and IV
    const salt = new Uint8Array(base64ToArrayBuffer(cryptoParams.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(cryptoParams.iv));

    // Derive key from passphrase
    const key = await deriveKey(passphrase, salt);

    // Decode ciphertext
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);

    try {
        // Decrypt using AES-256-GCM
        const plaintext = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertextBuffer
        );

        // Parse JSON content
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(plaintext)) as PlainContent;
    } catch {
        throw new Error('Decryption failed. Incorrect passphrase or corrupted data.');
    }
}

// Check if browser supports Web Crypto API
export function isCryptoSupported(): boolean {
    return !!(
        typeof crypto !== 'undefined' &&
        crypto.subtle &&
        typeof crypto.subtle.encrypt === 'function'
    );
}
