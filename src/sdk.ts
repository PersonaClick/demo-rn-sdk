import PersonaClick from '@personaclick/rn-sdk'
import { SHOP_ID, STREAM } from './config'
import type { Sdk } from './types/sdk'

/**
 * A single SDK instance for the whole app.
 *
 * initialize() builds the instance, starts the session and registers it, so it is also
 * reachable anywhere via PersonaClick.getInstance(). Call it once per app launch.
 *
 * send_token: true — the SDK obtains the FCM/APNs token itself and sends it to PersonaClick.
 * This is the parameter behind automatic token creation.
 */
export const sdk = PersonaClick.initialize({
  shopId: SHOP_ID,
  stream: STREAM,
  debug: __DEV__,
  autoSendPushToken: true,
}) as Sdk

/**
 * Readiness has to be polled: initialize() returns the instance as soon as it is built, while the
 * session request runs in the background and exposes no promise. isInit() flips to true once the
 * SDK has received a did from the server.
 *
 * Returns a cancel function alongside the promise so a caller that goes away (an unmounting screen)
 * can stop the interval instead of leaving it running for the whole timeout.
 */
export function waitForInit(timeoutMs = 15000): {
  promise: Promise<boolean>
  cancel: () => void
} {
  if (sdk.isInit()) {
    return { promise: Promise.resolve(true), cancel: () => {} }
  }

  let timer: ReturnType<typeof setInterval>
  const promise = new Promise<boolean>(resolve => {
    const startedAt = Date.now()
    timer = setInterval(() => {
      if (sdk.isInit()) {
        clearInterval(timer)
        resolve(true)
      } else if (Date.now() - startedAt > timeoutMs) {
        clearInterval(timer)
        resolve(false)
      }
    }, 200)
  })

  return { promise, cancel: () => clearInterval(timer) }
}
