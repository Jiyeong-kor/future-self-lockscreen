import 'react-native-get-random-values';

type CryptoProvider = {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
};

function getCryptoProvider(): CryptoProvider {
  const crypto = (globalThis as unknown as {crypto?: CryptoProvider}).crypto;
  if (crypto?.getRandomValues === undefined) {
    throw new Error('Secure random provider is unavailable.');
  }
  return crypto;
}

export function secureRandomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('Secure random byte length must be a positive integer.');
  }

  const bytes = new Uint8Array(length);
  return getCryptoProvider().getRandomValues(bytes);
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
}

export function generateDatabaseEncryptionKey(): string {
  return bytesToHex(secureRandomBytes(32));
}

export function generateUuidV4(): string {
  const bytes = secureRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytesToHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}
