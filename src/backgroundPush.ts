import notifee, { EventType } from '@notifee/react-native'
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging'
import PersonaClick, { PushEvent } from '@personaclick/rn-sdk'
import { displayPush } from './pushPresentation'
import type { PushPayload } from './types/sdk'

/**
 * Background and killed-state pushes.
 *
 * When the app is not running, FCM starts a headless JS task the moment a message arrives. React
 * Native Firebase requires the background handler to be registered synchronously while the bundle
 * evaluates — anything registered later never sees the message, and the log shows
 * "No task registered for key ReactNativeFirebaseMessagingHeadlessTask".
 *
 * The SDK installs its own handler at the end of an async chain (init → permission → token), which
 * lands seconds after the task is gone, so a killed app shows nothing. Registering here closes that
 * gap. Once the SDK is up it replaces these handlers with its own, so a running app keeps the
 * SDK-managed behaviour and no notification is shown twice.
 */

// PersonaClick.handlePush returns nothing, so the tracking requests it starts cannot be awaited.
// The headless task ends as soon as this handler resolves, and anything still in flight dies with
// it — hence a short grace period before returning.
const TRACKING_GRACE_MS = 2000

const wait = (ms: number) =>
  new Promise<void>(resolve => setTimeout(() => resolve(), ms))

export function registerBackgroundPushHandlers() {
  setBackgroundMessageHandler(getMessaging(), async remoteMessage => {
    const message = remoteMessage as unknown as PushPayload
    if (!message?.data) return

    // handlePush accepts either a full FCM message or a plain data bag; the data bag keeps the call
    // typed without casting the library's RemoteMessage.
    const payload = { data: message.data }

    // A push carrying an FCM `notification` block is rendered by the system itself. It still has to
    // be reported, or every hybrid notification+data push goes missing from the statistics.
    if (remoteMessage?.notification) {
      PersonaClick.handlePush(payload, PushEvent.DELIVERED)
      PersonaClick.handlePush(payload, PushEvent.OPENED)
      await wait(TRACKING_GRACE_MS)
      return
    }

    PersonaClick.handlePush(payload, PushEvent.DELIVERED)

    try {
      await displayPush(message)
      // OPENED means "the notification was shown", so it is only true once the display succeeded.
      PersonaClick.handlePush(payload, PushEvent.OPENED)
    } catch (error) {
      console.warn('[DEMO] failed to display a background push', error)
    }

    await wait(TRACKING_GRACE_MS)
  })

  // Notifee requires a background event handler registered at module scope, otherwise a press on a
  // notification shown while the app was dead is dropped.
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type !== EventType.PRESS || !detail.notification) return

    const data = detail.notification.data || {}
    PersonaClick.handlePush({ data }, PushEvent.CLICKED)
    await wait(TRACKING_GRACE_MS)
  })
}
