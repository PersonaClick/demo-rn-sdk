# PersonaClick React Native SDK — demo

A minimal app showing how to integrate the PersonaClick React Native SDK and how push
notifications and in-app popups behave.

The SDK is published on npm as
[`@personaclick/rn-sdk`](https://www.npmjs.com/package/@personaclick/rn-sdk).

The demo is deliberately small: everything related to the SDK lives in `src` and reads in
a couple of minutes.

## What it demonstrates

| Scenario | Where to look |
| --- | --- |
| The push token is created and sent automatically | [`src/sdk.ts`](src/sdk.ts), the Push tab |
| Push opens and clicks are tracked by the SDK | [`src/screens/PushScreen.tsx`](src/screens/PushScreen.tsx) |
| A notification with an image is rendered by the SDK | [`src/screens/PushScreen.tsx`](src/screens/PushScreen.tsx) |
| In-app popups: auto and delegate modes | [`src/screens/PopupScreen.tsx`](src/screens/PopupScreen.tsx) |
| Basic event tracking | [`src/screens/EventsScreen.tsx`](src/screens/EventsScreen.tsx) |

## The parameters that drive this behaviour

```ts
// src/sdk.ts
PersonaClick.initialize({
  shopId: SHOP_ID,
  stream: STREAM,
  debug: __DEV__,
  autoSendPushToken: true, // send_token
})
```

| Parameter | Where it is set | Value in the demo | What it gives you |
| --- | --- | --- | --- |
| `send_token` | `autoSendPushToken` in `initialize` | `true` | the SDK obtains and sends the push token |
| `receive` | 2nd `initPush` argument | `false` | the SDK displays foreground notifications |
| `background_receive` | 3rd `initPush` argument | `false` | the SDK displays background notifications |
| `click` | 1st `initPush` argument | a listener | see [`src/clickTracking.ts`](src/clickTracking.ts) |

The rule is simple: **as long as you pass no function of your own, the SDK does the work** — it
presents the notification and reports delivery, impressions and clicks. Pass one and you take that
part over, including its tracking call.

The demo follows that rule everywhere except `click`, and for a reason: the SDK only reports a click
for a push it stored itself while receiving it, and pushes that arrive while the app is not running
never go through that path. The listener in `clickTracking.ts` reports them instead.

### Background and killed state

[`src/backgroundPush.ts`](src/backgroundPush.ts) registers an FCM background handler at module
scope, from [`index.js`](index.js). When the app is not running, FCM starts a headless task the
moment a message arrives, and React Native Firebase only delivers it to a handler that was
registered synchronously while the bundle evaluated. The SDK installs its own handler at the end of
an async chain (init → permission → token), which lands after that task is gone — so without this
bootstrap a killed app shows nothing at all. Once the SDK is up it replaces these handlers, so a
running app keeps the SDK-managed behaviour and nothing is shown twice.

## Running the demo

Requires Node 18+, Xcode for iOS and Android Studio with the Android SDK.

```sh
yarn install
cd ios && pod install && cd ..

yarn android
# or
yarn ios
```

The bundled Firebase configuration is for the demo project, so push works out of the box on
Android. iOS needs two more things that cannot be shipped in a repository — see below.

## Configuration

### 1. Your shop_id

In `src/config.ts`, replace `SHOP_ID` with your own shop identifier from the dashboard.

### 2. Firebase

The demo ships with a working configuration for the PersonaClick demo Firebase project. To point
it at your own project, replace both files:

- Android: `android/app/google-services.json`
- iOS: `ios/PersonaClickDemo/GoogleService-Info.plist`, added to the app target in Xcode
  (Copy Bundle Resources)

Remove them and the project still builds: the Google Services Gradle plugin is only applied when
the file is present, and `FirebaseApp.configure()` is skipped when the plist is missing or invalid.

### 3. Push on iOS

What the demo already carries:

- `PersonaClickDemo.entitlements` with `aps-environment`, wired into the app target
- `remote-notification` in `UIBackgroundModes`
- a **NotificationService** extension in [`ios/NotificationService`](ios/NotificationService) —
  iOS never downloads media on its own, so a push with an image is handed to this extension first
  and it attaches the picture. It reads `image`, `image_url`, `attachment-url` and
  `fcm_options.image`, and it only runs for payloads marked `mutable-content: 1`.

Two things exist purely to keep the **APNs** token registered, and both are easy to break:

- `firebase.json` sets `messaging_ios_auto_register_for_remote_messages` to `true`. iOS hands an
  APNs token only to an app that called `registerForRemoteNotifications` during the current launch,
  and the SDK calls it only while it has no token cached. With the flag off, the token arrives on
  the first launch and is `null` on every launch after that.
- [`src/pushToken.ts`](src/pushToken.ts) puts the APNs token back after Firebase replaces it.
  Firebase mints an FCM token of its own as soon as it sees the APNs token, and the SDK forwards
  every refreshed token to the backend without checking which platform it belongs to — so within a
  second of launch the shop holds an FCM token labelled `platform: ios`, which is the one thing
  APNs cannot deliver to. The module re-registers the APNs token, and does it again on every
  refresh. Delete it once the SDK tells the two apart (the native iOS SDK already does: it sends
  `ios_firebase` for Firebase tokens).

`GoogleService-Info.plist` is required on iOS even though nothing is delivered through Firebase:
the SDK reads the APNs token through the Firebase messaging module, so Firebase has to be
configured for the token to exist at all.

What is still on you, because neither can live in a repository:

1. An Apple Developer account: replace `DEVELOPMENT_TEAM` in the Xcode project with your own team
   (it is committed here as the PersonaClick one, and both the app and the extension carry it), and
   enable the **Push Notifications** capability on the app target. Without a provisioning profile
   carrying `aps-environment`, iOS refuses to register for remote messages and the token stays
   empty.
2. An APNs key (`.p8`, from Certificates, Identifiers & Profiles → Keys), uploaded in the
   PersonaClick dashboard. Without it nothing is delivered, however correct the app is.

So on iOS the SDK registers an **APNs** token and PersonaClick pushes to APNs directly; Firebase
serves the Android transport only.

That has one consequence worth knowing about, because it is invisible until tracking silently stops
working. React Native Firebase decides whether a notification is one of its own by looking for
`gcm.message_id` and drops everything else before any JavaScript handler runs — and a push sent
straight to APNs has no such key. Delivery and the image are unaffected (iOS renders the
notification and the extension attaches the picture), but nothing reaches the SDK, so opens and
clicks go unreported.

The extension closes that gap: it copies the push's own id into `gcm.message_id` before the
notification is delivered, which is the last moment anything can touch the payload. From there on
iOS behaves like Android — `track/delivered`, `track/opened` and `track/clicked` all fire. Only
payloads marked `mutable-content: 1` pass through the extension, so a push without that flag is
still shown but stays untracked.

## Expo

The SDK-facing code is identical under Expo — only the native setup differs. The
`@react-native-firebase/app`, `@react-native-firebase/messaging` and `@notifee/react-native`
modules are wired through config plugins, after which you need `expo prebuild` and a dev
client (push does not work in Expo Go).

## Layout

```
ios/NotificationService/   the extension that attaches images to iOS notifications
src/
├── config.ts              shop_id and stream
├── sdk.ts                 SDK instance
├── backgroundPush.ts      background and killed-state handlers, registered at module scope
├── clickTracking.ts       reports clicks the SDK would otherwise drop
├── pushToken.ts           iOS only: keeps the APNs token registered, not Firebase's
├── pushPresentation.ts    notification rendering, matching the SDK's own
├── lib/eventLog.ts        log for the demo screens, unrelated to the SDK
├── types/sdk.ts           temporary type shim
├── components/ui.tsx      buttons, fields, log panel
└── screens/               demo screens
```
