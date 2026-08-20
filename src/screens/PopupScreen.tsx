import React, { useCallback, useEffect, useState } from 'react'
import { Image, Modal, StyleSheet, Text, View } from 'react-native'
import { sdk } from '../sdk'
import { logEvent } from '../lib/eventLog'
import type { PopupComponents, PopupData } from '../types/sdk'
import { Button, Field, LogPanel, Screen, Section } from '../components/ui'

type Mode = 'auto' | 'delegate'

function parseComponents(popup: PopupData): PopupComponents {
  const raw = popup.components

  if (!raw) {
    return {}
  }
  if (typeof raw === 'object') {
    return raw
  }

  try {
    return JSON.parse(raw) as PopupComponents
  } catch {
    return {}
  }
}

/**
 * In-app popups arrive with the backend responses to init and track.
 * There are two ways to present them — both are on this screen.
 *
 * The auto-mode overlay lives in App.tsx, at the root: the SDK considers a popup consumed as soon
 * as it hands it over, so an overlay mounted inside this tab would lose every popup that arrives
 * while another tab is open.
 */
export function PopupScreen() {
  const [mode, setMode] = useState<Mode>('auto')
  const [popup, setPopup] = useState<PopupData | null>(null)

  useEffect(() => {
    if (mode === 'auto') {
      // No delegate — the SDK presents the popup itself through SdkPopupOverlay.
      sdk.popupPresentationDelegate = null
      return
    }

    // A delegate is set — the SDK no longer presents popups and hands them to the app.
    sdk.popupPresentationDelegate = incoming => {
      logEvent('Popup handed to the app', { id: incoming.id })
      setPopup(incoming)
      // The impression counts from the moment the popup is on screen. Reporting it on close would
      // lose every popup the user leaves open, backgrounds, or dismisses with the system gesture.
      sdk.trackPopupShown(incoming.id).then(() => {
        logEvent('Popup impression sent', { id: incoming.id })
      })
    }

    return () => {
      sdk.popupPresentationDelegate = null
    }
  }, [mode])

  const switchMode = useCallback(() => {
    // Drop anything on screen: the two modes own presentation differently, and a leftover modal
    // would sit on top of the SDK's own overlay.
    setPopup(null)
    setMode(current => (current === 'auto' ? 'delegate' : 'auto'))
  }, [])

  const triggerRequest = useCallback(() => {
    sdk.track('view', 1)
    logEvent('track(view) sent', 'A popup arrives with the response if one is configured')
  }, [])

  const content = popup ? parseComponents(popup) : {}
  const htmlOnly = !!popup && !popup.components && !!popup.html

  return (
    <>
      <Screen>
        <Section
          title="Presentation mode"
          description={
            'Auto — the SDK presents the popup itself, you only render SdkPopupOverlay (App.tsx). ' +
            'Delegate — the SDK hands the data to the app and presents nothing; the app reports the ' +
            'impression with trackPopupShown as soon as the popup is on screen.'
          }>
          <Field label="Current mode" value={mode} />
          <Button
            title={mode === 'auto' ? 'Switch to delegate' : 'Switch to auto'}
            onPress={switchMode}
          />
        </Section>

        <Section
          title="Request a popup"
          description={
            'Popups come along with API responses, so any request will do — ' +
            'a product view, for example.'
          }>
          <Button title="Send track(view)" onPress={triggerRequest} />
        </Section>

        <LogPanel />
      </Screen>

      {/* Delegate mode only: in auto mode the popup belongs to the SDK's own overlay. */}
      <Modal
        visible={mode === 'delegate' && !!popup}
        transparent
        animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.card}>
            {content.image ? (
              <Image
                source={{ uri: content.image }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : null}
            <Text style={styles.title}>{content.header || 'Popup'}</Text>
            {content.text ? <Text style={styles.text}>{content.text}</Text> : null}
            {htmlOnly ? (
              <Text style={styles.text}>
                This popup came as raw html. Render it with a WebView — this demo only lays out the
                structured components.
              </Text>
            ) : null}
            <Button
              title={content.button || 'Close'}
              onPress={() => setPopup(null)}
            />
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  text: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
  },
})
