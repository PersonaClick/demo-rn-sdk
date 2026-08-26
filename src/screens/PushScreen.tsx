import React, { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { getRegisteredPushToken } from '../pushToken'
import { sdk } from '../sdk'
import { logEvent } from '../lib/eventLog'
import { Button, Field, LogPanel, Screen, Section } from '../components/ui'

/**
 * This screen covers the three scenarios that raise the most questions:
 *   1. the token is created and sent automatically;
 *   2. push opens and clicks are tracked by the SDK itself;
 *   3. a push with an image is rendered by the SDK as well.
 */
export function PushScreen() {
  const [token, setToken] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  /**
   * The token is fetched on mount, not only on a button press: with autoSendPushToken the SDK
   * already has it by then, and the whole point of this screen is that nothing has to be called
   * by hand. The button below stays for a repeat lookup after permission changes.
   */
  useEffect(() => {
    let cancelled = false

    getRegisteredPushToken()
      .then((value) => {
        if (cancelled) return
        setToken(value ?? '')
        logEvent(
          value ? 'Token received automatically' : 'Token unavailable',
          value ?? 'Check the notification permission and your Firebase configuration',
        )
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  const showToken = useCallback(async () => {
    setBusy(true)
    try {
      const value = await getRegisteredPushToken()
      setToken(value ?? '')
      logEvent(
        value ? 'Token received' : 'Token unavailable',
        value ?? 'Check the notification permission and your Firebase configuration',
      )
    } finally {
      setBusy(false)
    }
  }, [])

  /**
   * The default mode: no callbacks at all.
   *
   * From here the SDK does everything itself — it displays the notification
   * (including the image) and reports delivery, display and clicks.
   */
  const subscribeWithSdkTracking = useCallback(async () => {
    setBusy(true)
    try {
      const result = await sdk.initPush()

      if (typeof result === 'string') {
        setToken(result)
        setSubscribed(true)
        logEvent('Push subscription enabled', `Token: ${result}`)
      } else if (result === false) {
        // Already subscribed earlier in this install — initPush() short-circuits on its lock.
        setSubscribed(true)
        logEvent('Push subscription was already enabled')
      } else {
        setSubscribed(false)
        logEvent(
          'Push subscription not enabled',
          'Permission was denied or the token is unavailable',
        )
      }
    } finally {
      setBusy(false)
    }
  }, [])

  return (
    <Screen>
      <Section
        title="1. The token is created automatically"
        description={
          'autoSendPushToken (send_token) is true in the initialize call, so the SDK requests ' +
          'the permission, obtains the FCM or APNs token and sends it to PersonaClick on its ' +
          'own. There is no need to call setPushTokenNotification manually.'
        }>
        <Field label="Platform" value={Platform.OS} />
        <Field label="Push token" value={token || '—'} copyable />
        <Button title="Show token" onPress={showToken} disabled={busy} />
      </Section>

      <Section
        title="2. Opens and clicks are tracked automatically"
        description={
          'receive and background_receive stay false, so the SDK presents every notification and ' +
          'reports delivery and impressions on its own. Clicks are reported by the listener in ' +
          'clickTracking.ts, because the SDK only tracks a click for a push it stored while ' +
          'receiving it — which never happens while the app is not running.'
        }>
        <Field
          label="Push subscription"
          value={subscribed ? 'active' : 'not subscribed'}
        />
        <Button
          title="Subscribe to push"
          onPress={subscribeWithSdkTracking}
          disabled={busy}
        />
      </Section>

      <Section
        title="3. Push with an image"
        description={
          'The picture comes from the payload image field. On Android the SDK renders it with the ' +
          'BigPicture style. On iOS it is attached by the NotificationService extension in the ios ' +
          'folder, which only runs for payloads marked mutable-content. Send a push with an image ' +
          'from the dashboard and background the app to see the result.'
        }
      />

      <LogPanel />
    </Screen>
  )
}
