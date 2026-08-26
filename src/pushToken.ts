import { Platform } from 'react-native'
import {
  getAPNSToken,
  getMessaging,
  onTokenRefresh,
} from '@react-native-firebase/messaging'
import { sdk } from './sdk'

/**
 * Keeps the APNs token registered with PersonaClick on iOS.
 *
 * PersonaClick delivers to iOS over APNs directly, so the token it stores has to be the APNs one
 * and it is sent as `platform: 'ios'`. The SDK asks for exactly that token — but Firebase mints an
 * FCM token of its own as soon as it sees the APNs token, and the SDK's token-refresh listener
 * forwards every refreshed token to the backend without looking at the platform:
 *
 *     _handleTokenRefresh(token) { ... this._deps.onNewToken(token) }   // always the FCM token
 *
 * The FCM token therefore replaces the APNs one within a second of launch, and APNs cannot deliver
 * to it. Until the SDK distinguishes the two (the native iOS SDK already does — it sends
 * `ios_firebase` for Firebase tokens), the app has to put the APNs token back.
 *
 * Nothing here runs on Android, where the FCM token is the correct one.
 */

const APNS_TOKEN_TIMEOUT_MS = 15000
const APNS_TOKEN_POLL_MS = 500

let apnsToken: string | null = null

/**
 * iOS hands the APNs token over asynchronously, a moment after the app registers for remote
 * notifications, so the first read usually comes back empty. Polling is the only option: RNFB
 * exposes no event for it.
 */
async function waitForApnsToken(): Promise<string | null> {
  const messaging = getMessaging()
  const startedAt = Date.now()

  while (Date.now() - startedAt < APNS_TOKEN_TIMEOUT_MS) {
    const token = await getAPNSToken(messaging).catch(() => null)
    if (token) return token
    await new Promise<void>(resolve => setTimeout(() => resolve(), APNS_TOKEN_POLL_MS))
  }

  return null
}

function sendApnsToken(token: string) {
  apnsToken = token
  sdk.setPushTokenNotification(token)
}

export function registerPushToken() {
  if (Platform.OS !== 'ios') return

  waitForApnsToken().then(token => {
    if (!token) return
    sendApnsToken(token)

    // Every FCM refresh overwrites what the backend has, so the APNs token is put back after it.
    // The call is deferred by a tick to land after the SDK's own listener for the same event —
    // both go through the SDK's request queue, and the later call is the one that sticks.
    onTokenRefresh(getMessaging(), () => {
      setTimeout(() => sendApnsToken(token), 0)
    })
  })
}

/**
 * The token this app registered with PersonaClick.
 *
 * On iOS that is the APNs token, which is not what `sdk.getToken()` returns: the SDK caches
 * whatever it last saw, and by then that is Firebase's token.
 */
export async function getRegisteredPushToken(): Promise<string | null> {
  if (Platform.OS !== 'ios') return sdk.getToken()
  return apnsToken ?? (await waitForApnsToken())
}
