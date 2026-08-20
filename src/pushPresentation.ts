import { Platform } from 'react-native'
import notifee, { AndroidImportance, AndroidStyle } from '@notifee/react-native'
import { SDK_PUSH_CHANNEL } from '@personaclick/rn-sdk'
import type { PushPayload } from './types/sdk'

// The SDK creates this channel under this exact name. Android freezes a channel's settings when it
// is first created, so the name has to match or the entry in system settings depends on which code
// path happened to run first on a fresh install.
const CHANNEL_NAME = 'RNSDK channel'

/**
 * Renders a push the way the SDK renders it — same channel, same BigPicture style — so a
 * notification shown by the app is indistinguishable from one shown by the SDK.
 */
export async function displayPush(message: PushPayload) {
  const data = message.data ?? {}
  // The backend sends either image or image_url — accept both, or the picture is dropped.
  const picture = data.image || data.image_url

  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: SDK_PUSH_CHANNEL,
      name: CHANNEL_NAME,
      importance: AndroidImportance.HIGH,
      // A channel created without an explicit sound is silent, and the push only vibrates.
      sound: 'default',
      vibration: true,
    })
  }

  await notifee.displayNotification({
    title: data.title,
    body: data.body,
    // message_id is what the SDK looks the push up by when the notification is tapped, so it has to
    // travel with the notification exactly as the SDK's own renderer sends it.
    data: {
      ...data,
      ...(message.messageId ? { message_id: message.messageId } : {}),
    },
    android: {
      channelId: SDK_PUSH_CHANNEL,
      pressAction: { id: 'default' },
      ...(data.icon ? { largeIcon: data.icon } : {}),
      // BigPicture belongs under style — placed anywhere else it is ignored and no image shows.
      ...(picture
        ? { style: { type: AndroidStyle.BIGPICTURE as const, picture } }
        : {}),
    },
  })
}
