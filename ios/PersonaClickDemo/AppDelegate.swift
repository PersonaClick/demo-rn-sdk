import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Configuring Firebase is the host app's job, not the SDK's.
    // The configuration is read from GoogleService-Info.plist in the bundle.
    if FirebaseApp.app() == nil, shouldConfigureFirebaseFromPlist() {
      FirebaseApp.configure()
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "PersonaClickDemo",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  /// Configure only when the app actually carries a Firebase config, so the project still builds
  /// and runs for anyone who removed it. The check stays on the file being present and readable —
  /// guessing at key formats would silently disable push on a perfectly valid config.
  private func shouldConfigureFirebaseFromPlist() -> Bool {
    guard
      let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
      let dict = NSDictionary(contentsOfFile: path) as? [String: Any],
      let apiKey = dict["API_KEY"] as? String, !apiKey.isEmpty,
      let appID = dict["GOOGLE_APP_ID"] as? String, !appID.isEmpty
    else {
      NSLog("[Firebase] Skipping FirebaseApp.configure(): GoogleService-Info.plist is missing or incomplete.")
      return false
    }

    return true
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
