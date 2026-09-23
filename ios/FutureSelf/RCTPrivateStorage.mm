#import "RCTPrivateStorage.h"
#import <UIKit/UIKit.h>
#import <React/RCTInvalidating.h>

@interface RCTPrivateStorage () <RCTInvalidating>
@property(nonatomic) BOOL observing;
@property(nonatomic) BOOL allowed;
@property(nonatomic) BOOL invalidated;
@property(nonatomic) NSUInteger generation;
@end

@implementation RCTPrivateStorage

+ (NSString *)moduleName { return @"NativePrivateStorage"; }
+ (BOOL)requiresMainQueueSetup { return YES; }

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
  (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativePrivateStorageSpecJSI>(params);
}

- (void)beginObserving {
  NSAssert(NSThread.isMainThread, @"Protection state must use the main queue.");
  if (self.observing || self.invalidated) { return; }
  self.observing = YES;
  UIApplication *app = UIApplication.sharedApplication;
  self.allowed = app.isProtectedDataAvailable && app.applicationState != UIApplicationStateBackground;
  NSNotificationCenter *center = NSNotificationCenter.defaultCenter;
  [center addObserver:self selector:@selector(blockAccess:) name:UIApplicationProtectedDataWillBecomeUnavailable object:nil];
  [center addObserver:self selector:@selector(blockAccess:) name:UIApplicationDidEnterBackgroundNotification object:nil];
  [center addObserver:self selector:@selector(recheckAccess:) name:UIApplicationProtectedDataDidBecomeAvailable object:nil];
  [center addObserver:self selector:@selector(recheckAccess:) name:UIApplicationDidBecomeActiveNotification object:nil];
}

- (NSDictionary *)state {
  return @{@"available": @(self.allowed && !self.invalidated), @"generation": @(self.generation)};
}

- (void)setAllowedState:(BOOL)allowed {
  if (self.allowed == allowed || self.invalidated) { return; }
  self.allowed = allowed;
  self.generation += 1;
  [self emitOnProtectionChanged:[self state]];
}

- (void)blockAccess:(NSNotification *)notification { [self setAllowedState:NO]; }

- (void)recheckAccess:(NSNotification *)notification {
  UIApplication *app = UIApplication.sharedApplication;
  [self setAllowedState:app.isProtectedDataAvailable && app.applicationState == UIApplicationStateActive];
}

- (void)getState:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self beginObserving];
    // 잠금 예고 이후 OS 값이 잠깐 true여도 해제 알림 전에는 접근을 허용하지 않는다.
    if (!UIApplication.sharedApplication.isProtectedDataAvailable ||
        UIApplication.sharedApplication.applicationState == UIApplicationStateBackground) {
      [self setAllowedState:NO];
    }
    resolve([self state]);
  });
}

- (BOOL)protectFile:(NSURL *)url required:(BOOL)required error:(NSError **)error {
  NSFileManager *manager = NSFileManager.defaultManager;
  NSDictionary *attributes = [manager attributesOfItemAtPath:url.path error:error];
  if (attributes == nil) {
    if (!required && [(*error).domain isEqualToString:NSCocoaErrorDomain] && ((*error).code == NSFileReadNoSuchFileError || (*error).code == NSFileNoSuchFileError)) {
      *error = nil;
      return YES;
    }
    return NO;
  }
  // 심볼릭 링크와 디렉터리를 거부하며 기존 데이터를 덮어쓰지 않는다.
  if (![attributes[NSFileType] isEqual:NSFileTypeRegular]) { return NO; }
  if (![manager setAttributes:@{NSFileProtectionKey: NSFileProtectionComplete} ofItemAtPath:url.path error:error]) { return NO; }
  if (![url setResourceValue:@YES forKey:NSURLIsExcludedFromBackupKey error:error]) { return NO; }
  attributes = [manager attributesOfItemAtPath:url.path error:error];
  NSNumber *excluded = nil;
  if (![url getResourceValue:&excluded forKey:NSURLIsExcludedFromBackupKey error:error]) { return NO; }
  return [attributes[NSFileProtectionKey] isEqual:NSFileProtectionComplete] && excluded.boolValue;
}

- (void)protectFiles:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self beginObserving];
    if (!self.allowed || self.invalidated || !UIApplication.sharedApplication.isProtectedDataAvailable ||
        UIApplication.sharedApplication.applicationState == UIApplicationStateBackground) {
      reject(@"PROTECTED_DATA_UNAVAILABLE", @"기기 잠금이 해제된 뒤 다시 시도해 주세요.", nil);
      return;
    }
    // 기본 Library 경로만 다룬다. App Group 또는 외부 경로로 바뀌면 검증 없이 진행하지 않는다.
    if ([NSBundle.mainBundle objectForInfoDictionaryKey:@"OPSQLite_AppGroup"] != nil) {
      reject(@"PRIVATE_STORAGE_PATH_MISMATCH", @"개인 데이터베이스는 App Group에 저장할 수 없습니다.", nil);
      return;
    }
    NSURL *library = [NSFileManager.defaultManager URLsForDirectory:NSLibraryDirectory inDomains:NSUserDomainMask].firstObject;
    if (library == nil) {
      reject(@"PRIVATE_STORAGE_PATH_UNAVAILABLE", @"개인 저장소 경로를 확인하지 못했습니다.", nil);
      return;
    }
    NSArray<NSString *> *suffixes = @[@"", @"-wal", @"-shm", @"-journal"];
    NSError *error = nil;
    NSURL *database = [library URLByAppendingPathComponent:@"future-self.sqlite"];
    NSDictionary *attributes = [NSFileManager.defaultManager attributesOfItemAtPath:database.path error:&error];
    if (attributes == nil && [error.domain isEqualToString:NSCocoaErrorDomain] && (error.code == NSFileReadNoSuchFileError || error.code == NSFileNoSuchFileError)) {
      // 본체 없이 보조 파일만 남았다면 복구가 필요하다. 빈 DB를 만들지 않는다.
      for (NSString *suffix in @[@"-wal", @"-shm", @"-journal"]) {
        NSURL *sidecar = [library URLByAppendingPathComponent:[@"future-self.sqlite" stringByAppendingString:suffix]];
        NSError *sidecarError = nil;
        NSDictionary *sidecarAttributes = [NSFileManager.defaultManager attributesOfItemAtPath:sidecar.path error:&sidecarError];
        BOOL missing = [sidecarError.domain isEqualToString:NSCocoaErrorDomain] &&
          (sidecarError.code == NSFileReadNoSuchFileError || sidecarError.code == NSFileNoSuchFileError);
        if (sidecarAttributes != nil || !missing) {
          reject(@"PRIVATE_STORAGE_RECOVERY_REQUIRED", @"기존 데이터베이스의 복구가 필요합니다. 파일을 초기화하지 않습니다.", nil);
          return;
        }
      }
      // 파일 부재만 신규로 판단한다. 접근 오류를 빈 DB로 대체하지 않는다.
      NSData *empty = [NSData data];
      if (![empty writeToURL:database options:(NSDataWritingWithoutOverwriting | NSDataWritingFileProtectionComplete) error:&error]) {
        reject(@"PRIVATE_STORAGE_PREPARATION_FAILED", @"개인 저장소를 준비하지 못했습니다.", nil);
        return;
      }
    } else if (attributes == nil) {
      reject(@"PRIVATE_STORAGE_PREPARATION_FAILED", @"개인 저장소를 확인하지 못했습니다.", nil);
      return;
    }
    for (NSString *suffix in suffixes) {
      error = nil;
      NSURL *url = [library URLByAppendingPathComponent:[@"future-self.sqlite" stringByAppendingString:suffix]];
      if (![self protectFile:url required:suffix.length == 0 error:&error]) {
        // NSError에는 앱 경로가 포함될 수 있으므로 JS와 운영 로그에는 원인을 그대로 보내지 않는다.
        reject(@"PRIVATE_STORAGE_PROTECTION_FAILED", @"개인 저장소의 파일 보호를 확인하지 못했습니다.", nil);
        return;
      }
    }
    resolve(@YES);
  });
}

- (void)invalidate {
  dispatch_async(dispatch_get_main_queue(), ^{
    self.invalidated = YES;
    self.allowed = NO;
    [NSNotificationCenter.defaultCenter removeObserver:self];
  });
}

- (void)dealloc { [NSNotificationCenter.defaultCenter removeObserver:self]; }
@end
