import {Platform} from 'react-native';
import NativePrivateStorage from '../../specs/NativePrivateStorage';
import type {PrivateStoragePort} from '../database/ProtectedDataAccess';

export function createPrivateStoragePort(): PrivateStoragePort | null {
  if (Platform.OS !== 'ios') { return null; }
  const native = NativePrivateStorage;
  if (native === null) {
    // 보안 모듈이 누락된 iOS 빌드에서는 보호를 생략한 DB 연결을 허용하지 않는다.
    throw new Error('iOS 개인 저장소 보호 모듈을 불러오지 못했습니다.');
  }
  return {
    getState: () => native.getState(),
    protectFiles: async () => {
      if (await native.protectFiles() !== true) {
        throw new Error('개인 저장소 파일의 보호 설정을 확인하지 못했습니다.');
      }
    },
    subscribe: listener => {
      const subscription = native.onProtectionChanged(listener);
      return () => subscription.remove();
    },
  };
}
