import * as Keychain from 'react-native-keychain';

import {generateDatabaseEncryptionKey} from './secureRandom';

const DATABASE_KEY_USERNAME = 'future-self-private-db';
const CONFIRMED_SERVICE = 'future-self.private-db-key.v1';
const PENDING_SERVICE = 'future-self.private-db-key.pending.v1';

function setOptions(service: string): Keychain.SetOptions {
  return {
    service,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
  };
}

async function readKey(service: string): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({service});
  if (credentials === false) {
    return null;
  }
  return credentials.password;
}

async function writeKey(service: string, key: string): Promise<void> {
  const result = await Keychain.setGenericPassword(
    DATABASE_KEY_USERNAME,
    key,
    setOptions(service),
  );
  if (result === false) {
    throw new Error(`Failed to persist database key for service: ${service}`);
  }
}

async function removeKey(service: string): Promise<void> {
  await Keychain.resetGenericPassword({service});
}

export interface DatabaseKeyStore {
  getConfirmed(): Promise<string | null>;
  getOrCreatePending(): Promise<string>;
  promotePending(key: string): Promise<void>;
  clearPending(): Promise<void>;
}

export const databaseKeyStore: DatabaseKeyStore = {
  getConfirmed: () => readKey(CONFIRMED_SERVICE),

  async getOrCreatePending(): Promise<string> {
    const existing = await readKey(PENDING_SERVICE);
    if (existing !== null) {
      return existing;
    }

    const key = generateDatabaseEncryptionKey();
    await writeKey(PENDING_SERVICE, key);
    return key;
  },

  async promotePending(key: string): Promise<void> {
    const pending = await readKey(PENDING_SERVICE);
    if (pending !== key) {
      throw new Error('Pending database key changed before promotion.');
    }

    await writeKey(CONFIRMED_SERVICE, key);
    await removeKey(PENDING_SERVICE);
  },

  clearPending: () => removeKey(PENDING_SERVICE),
};
