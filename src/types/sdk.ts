import type PersonaClick from '@personaclick/rn-sdk'

/** Push payload as delivered by FCM and by the SDK callbacks. */
export type PushPayload = {
  data: Record<string, string>
  messageId?: string
  from?: string
  sentTime?: number
  ttl?: number
}

/**
 * In-app popup data the SDK receives from the backend. A popup arrives either as structured
 * `components` (what the SDK's own UI renders) or as raw `html` — both shapes reach a delegate.
 */
export type PopupComponents = {
  header?: string
  text?: string
  image?: string
  button?: string
}

export type PopupData = {
  id: number
  components?: string | PopupComponents
  html?: string
  position?: string
  delay?: number
}

/**
 * Type shim.
 *
 * The package's public index.d.ts does not describe the whole class: initPush, getToken, isInit
 * and the popup members are all missing, so a TypeScript project cannot call them at all. Until
 * that is fixed in the SDK, the demo widens the type here to what actually exists at runtime.
 * Delete this file once the typings ship with the package.
 */
export type Sdk = PersonaClick & {
  isInit(): boolean
  getToken(): Promise<string | null>
  /**
   * Subscribes to push notifications.
   *
   * All three arguments default to false. In that mode the SDK displays the notification
   * itself and reports delivery and clicks on its own. Pass a function and you take that
   * responsibility over.
   */
  initPush(
    onClick?: false | ((event: PushPayload) => void),
    onReceive?: false | ((message: PushPayload) => void),
    onBackgroundReceive?: false | ((message: PushPayload) => void),
  ): Promise<string | null | false>
  setPushTokenNotification(token: string): void
  notificationClicked(options: { code: string; type: string }): void
  notificationOpened(options: { code: string; type: string }): void
  /** Reports that a popup was shown. Needed in delegate mode only. */
  trackPopupShown(popupId: number): Promise<void>
  /** When set, the SDK stops presenting popups and hands them to your app instead. */
  popupPresentationDelegate: ((popup: PopupData, sdk: Sdk) => void) | null
}
