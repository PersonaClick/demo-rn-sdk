// Presentational building blocks for the demo screens. Nothing here touches the SDK — the
// interesting parts live in src/sdk.ts, src/backgroundPush.ts and the screens.
import React, { useEffect, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { clearLog, subscribeToLog, type LogEntry } from '../lib/eventLog'

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}>
      {children}
    </ScrollView>
  )
}

export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? (
        <Text style={styles.sectionDescription}>{description}</Text>
      ) : null}
      {children}
    </View>
  )
}

export function Button({
  title,
  onPress,
  disabled,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  )
}

export function Field({
  label,
  value,
  copyable,
}: {
  label: string
  value: string
  copyable?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue} selectable>
        {value}
      </Text>
      {copyable && value ? (
        <TouchableOpacity onPress={() => Clipboard.setString(value)}>
          <Text style={styles.fieldCopy}>Copy</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export function LogPanel() {
  const [entries, setEntries] = useState<LogEntry[]>([])

  useEffect(() => subscribeToLog(setEntries), [])

  return (
    <View style={styles.section}>
      <View style={styles.logHeader}>
        <Text style={styles.sectionTitle}>Log</Text>
        <TouchableOpacity onPress={clearLog}>
          <Text style={styles.fieldCopy}>Clear</Text>
        </TouchableOpacity>
      </View>
      {entries.length === 0 ? (
        <Text style={styles.sectionDescription}>No events yet</Text>
      ) : (
        entries.map(entry => (
          <View key={entry.id} style={styles.logEntry}>
            <Text style={styles.logTitle}>
              {entry.time} · {entry.title}
            </Text>
            {entry.details ? (
              <Text style={styles.logDetails} selectable>
                {entry.details}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  screenContent: {
    padding: 16,
    paddingBottom: 48,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  field: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 13,
    color: '#111827',
    fontFamily: 'Menlo',
  },
  fieldCopy: {
    fontSize: 13,
    color: '#2563eb',
    marginTop: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logEntry: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
  },
  logTitle: {
    fontSize: 13,
    color: '#111827',
  },
  logDetails: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'Menlo',
    marginTop: 4,
  },
})
