import * as Keychain from 'react-native-keychain';

import {generateDatabaseEncryptionKey} from './secureRandom';
import {createDatabaseKeyStore} from './databaseKeyStoreCore';
export type {DatabaseKeyStore} from './databaseKeyStoreCore';

function setOptions(service: string): Keychain.SetOptions {
  return {
    service,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
  };
}

export const databaseKeyStore = createDatabaseKeyStore({
  async read(service) {
    const credentials = await Keychain.getGenericPassword({service});
    return credentials === false ? null : {
      username: credentials.username,
      password: credentials.password,
    };
  },

  async write(service, credentials) {
    const result = await Keychain.setGenericPassword(
      credentials.username,
      credentials.password,
      setOptions(service),
    );
    if (result === false) {
      throw new Error('암호화 키 저장을 확인하지 못했습니다.');
    }
  },

  async remove(service) {
    // 삭제 결과는 코어에서 다시 읽어 확인한다. 실패를 성공으로 간주하지 않는다.
    await Keychain.resetGenericPassword({service});
  },
}, generateDatabaseEncryptionKey);
