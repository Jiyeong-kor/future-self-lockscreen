import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  private struct SnapshotCover {
    let view: UIView
    weak var contentView: UIView?
    let contentWasAccessibilityHidden: Bool
  }

  private var snapshotCovers: [ObjectIdentifier: SnapshotCover] = [:]

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "FutureSelf",
      in: window,
      launchOptions: launchOptions
    )

    if application.applicationState != .active {
      showSnapshotCovers()
    }
    return true
  }

  func applicationWillResignActive(_ application: UIApplication) {
    showSnapshotCovers()
  }

  func applicationDidEnterBackground(_ application: UIApplication) {
    // iOS가 스냅샷을 찍기 전에 동기적으로 다시 가린다. 애니메이션과 JS 콜백을 기다리지 않는다.
    showSnapshotCovers()
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    // 이 처리는 앱 잠금 인증이 아니다. 앱 잠금 도입 시에는 인증 게이트를 별도로 유지한다.
    for cover in snapshotCovers.values {
      cover.contentView?.accessibilityElementsHidden = cover.contentWasAccessibilityHidden
      cover.view.removeFromSuperview()
    }
    snapshotCovers.removeAll()
  }

  private func showSnapshotCovers() {
    guard let mainWindow = window else { return }
    let windows = mainWindow.windowScene?.windows ?? [mainWindow]

    for target in windows where !target.isHidden && target.windowLevel == .normal {
      let identifier = ObjectIdentifier(target)
      if let existing = snapshotCovers[identifier] {
        existing.view.frame = target.bounds
        target.bringSubviewToFront(existing.view)
        continue
      }

      let contentView = target.rootViewController?.viewIfLoaded
      let wasHidden = contentView?.accessibilityElementsHidden ?? false
      let cover = UIView(frame: target.bounds)
      cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      cover.backgroundColor = .systemBackground
      cover.isOpaque = true
      cover.isUserInteractionEnabled = true
      cover.isAccessibilityElement = true
      cover.accessibilityViewIsModal = true
      cover.accessibilityLabel = "화면이 가려져 있습니다."
      cover.accessibilityIdentifier = "future-self-privacy-cover"
      contentView?.accessibilityElementsHidden = true
      target.addSubview(cover)
      target.bringSubviewToFront(cover)
      target.layoutIfNeeded()
      snapshotCovers[identifier] = SnapshotCover(
        view: cover,
        contentView: contentView,
        contentWasAccessibilityHidden: wasHidden
      )
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
