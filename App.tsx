// Three tabs, one per topic: push notifications, in-app popups and plain event tracking.
// The SDK itself is started in index.js, before this component is ever rendered.
import React, { useState } from 'react'
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { SdkPopupOverlay } from '@personaclick/rn-sdk'
import { sdk } from './src/sdk'
import { EventsScreen } from './src/screens/EventsScreen'
import { PushScreen } from './src/screens/PushScreen'
import { PopupScreen } from './src/screens/PopupScreen'

const TABS = [
  { key: 'push', title: 'Push' },
  { key: 'popups', title: 'Popups' },
  { key: 'events', title: 'Events' },
] as const

type TabKey = (typeof TABS)[number]['key']

function App() {
  const [tab, setTab] = useState<TabKey>('push')

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.tabs}>
          {TABS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, tab === item.key && styles.tabActive]}
              onPress={() => setTab(item.key)}>
              <Text
                style={[
                  styles.tabText,
                  tab === item.key && styles.tabTextActive,
                ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'push' ? <PushScreen /> : null}
        {tab === 'popups' ? <PopupScreen /> : null}
        {tab === 'events' ? <EventsScreen /> : null}

        {/*
          Mounted once at the root, not inside a tab. A popup can arrive with the response to init
          or to any event, and in auto mode the SDK marks it as shown the moment it hands it over —
          so an overlay that is not mounted right then loses the popup permanently.
        */}
        <SdkPopupOverlay sdk={sdk} />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#e0e7ff',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
})

export default App
