import type {CodegenTypes, TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export type ProtectionState = {
  available: boolean;
  generation: number;
};

export interface Spec extends TurboModule {
  getState(): Promise<ProtectionState>;
  protectFiles(): Promise<boolean>;
  readonly onProtectionChanged: CodegenTypes.EventEmitter<ProtectionState>;
}

// Android에는 아직 이 iOS 전용 모듈을 요구하지 않는다.
export default TurboModuleRegistry.get<Spec>('NativePrivateStorage');
