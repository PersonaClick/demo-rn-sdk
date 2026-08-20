import { sdk } from './sdk'
import type { PushPayload } from './types/sdk'

/**
 * Click tracking for notifications the app rendered itself.
 *
 * The SDK's own click handler looks the push up in its storage by message_id and gives up when
 * nothing is found:
 *
 *     let pushData = await getPushData(messageId, this.shop_id)
 *     if (pushData.length === 0) return false     // notificationClicked is never sent
 *
 * Only the SDK's own receive path writes that record, and in killed state there is no such path —
 * the app renders the notification (see backgroundPush.ts) and the SDK has nothing stored. Tapping
 * it then reports nothing at all.
 *
 * Passing our own click listener side-steps the lookup: the payload already carries everything the
 * tracking call needs. The trade-off is that the SDK's built-in deep-link resolution no longer
 * runs, so an app that needs it has to route the push itself here.
 */
export function registerClickTracking() {
  sdk.initPush((event: PushPayload) => {
    const data = event?.data ?? {}
    sdk.notificationClicked({ code: data.id, type: data.type })
  })
}
