import React, { useCallback, useEffect, useState } from 'react'
import { sdk, waitForInit } from '../sdk'
import { SHOP_ID, STREAM } from '../config'
import { logEvent } from '../lib/eventLog'
import { Button, Field, LogPanel, Screen, Section } from '../components/ui'

const DEMO_PRODUCT_ID = 1

/**
 * Minimal tracking — it gives pushes and popups their context:
 * a session, products, a cart.
 */
export function EventsScreen() {
  const [initialized, setInitialized] = useState(sdk.isInit())

  useEffect(() => {
    let active = true
    const { promise, cancel } = waitForInit()

    promise.then(ready => {
      if (active) {
        setInitialized(ready)
        logEvent(ready ? 'SDK initialized' : 'SDK did not initialize in time')
      }
    })

    return () => {
      active = false
      cancel()
    }
  }, [])

  const trackView = useCallback(() => {
    sdk.track('view', DEMO_PRODUCT_ID)
    logEvent('track(view)', { id: DEMO_PRODUCT_ID })
  }, [])

  const trackCart = useCallback(() => {
    sdk.track('cart', DEMO_PRODUCT_ID)
    logEvent('track(cart)', { id: DEMO_PRODUCT_ID })
  }, [])

  const loadProfile = useCallback(async () => {
    try {
      const profile = await sdk.getProfile()
      logEvent('Profile loaded', profile)
    } catch (error) {
      logEvent('Profile request failed', String(error))
    }
  }, [])

  return (
    <Screen>
      <Section
        title="SDK state"
        description="init() runs once when the app starts.">
        <Field label="shop_id" value={SHOP_ID} copyable />
        <Field label="stream" value={STREAM} />
        <Field label="Initialized" value={initialized ? 'yes' : 'no'} />
      </Section>

      <Section
        title="Events"
        description="Basic events — this is how the backend collects user data.">
        <Button title="View product" onPress={trackView} />
        <Button title="Add to cart" onPress={trackCart} />
        <Button title="Load profile" onPress={loadProfile} />
      </Section>

      <LogPanel />
    </Screen>
  )
}
