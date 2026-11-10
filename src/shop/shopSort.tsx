import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  PERSONALIZATION_SPACING,
  usePersonalizationTheme,
} from '@personaclick/rn-sdk/ui'
import { renderIcon } from './shopKit'

/** Sorting of the shop's result screens: what the kit's `sortBy` / `sortDir` get. */
export type ShopSort = {
  label: string
  by: string | null
  dir: 'asc' | 'desc' | null
}

export const SORTS: ShopSort[] = [
  { label: 'Relevance', by: null, dir: null },
  { label: 'Price: low to high', by: 'price', dir: 'asc' },
  { label: 'Price: high to low', by: 'price', dir: 'desc' },
  { label: 'Discount', by: 'discount', dir: 'desc' },
]

const TITLE = 'Sort by'

/** The kit has no plain check mark among its icons: the shop draws its own. */
const CHECK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="black"/></svg>'
const ICON_SIZE = 24

const SPACING = PERSONALIZATION_SPACING

/**
 * The sort of a result screen and its picker: the kit's sort button only asks the app. The shop
 * answers with a bottom sheet on the kit's tokens: "Sort by", the options with a check mark at
 * the current one; a tap picks and closes. Render `picker` next to the screen.
 */
export function useShopSort() {
  const [sort, setSort] = useState<ShopSort>(SORTS[0])
  const [sheet, setSheet] = useState(false)

  const pick = useCallback(() => setSheet(true), [])

  const picker = (
    <SortSheet
      visible={sheet}
      selected={sort}
      onSelect={item => {
        setSheet(false)
        setSort(item)
      }}
      onClose={() => setSheet(false)}
    />
  )
  return { sort, pick, picker }
}

/** Time the sheet takes to come up, ms; it leaves with the modal's fade. */
const SLIDE_IN = 250

function SortSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean
  selected: ShopSort
  onSelect: (sort: ShopSort) => void
  onClose: () => void
}) {
  const { colors, typography, radius } = usePersonalizationTheme()
  const insets = useSafeAreaInsets()
  // 0: the sheet below the screen's edge, 1: in place; the shift is the sheet's own height.
  const shown = useRef(new Animated.Value(0)).current
  const [height, setHeight] = useState(0)
  useEffect(() => {
    if (!visible) {
      shown.setValue(0)
      return
    }
    if (height > 0) {
      Animated.timing(shown, {
        toValue: 1,
        duration: SLIDE_IN,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, height, shown])
  const translateY = shown.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      {/* The kit has no scrim token: Text/Dark/Hint is black at 40 % in both schemes. */}
      <Pressable
        style={[styles.scrim, { backgroundColor: colors.textDarkHint }]}
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <Animated.View
        onLayout={event => setHeight(event.nativeEvent.layout.height)}
        style={[
          styles.sheet,
          // Unseen until measured: the first frame has no height to slide from.
          height > 0 ? null : styles.unmeasured,
          {
            backgroundColor: colors.backgroundModal,
            borderTopLeftRadius: radius.modal,
            borderTopRightRadius: radius.modal,
            paddingBottom: SPACING.md + insets.bottom,
            transform: [{ translateY }],
          },
        ]}>
        <Text
          style={[
            typography.lgEmphasized,
            styles.title,
            { color: colors.textPrimary },
          ]}
          accessibilityRole="header">
          {TITLE}
        </Text>
        {SORTS.map(item => {
          const checked = item.label === selected.label
          return (
            <Pressable
              key={item.label}
              onPress={() => onSelect(item)}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.buttonSecondaryFocus },
              ]}>
              <Text
                style={[
                  typography.baseDefault,
                  styles.label,
                  { color: colors.textPrimary },
                ]}>
                {item.label}
              </Text>
              <View style={styles.check}>
                {checked
                  ? renderIcon(CHECK_ICON, colors.brandPrimary, ICON_SIZE)
                  : null}
              </View>
            </Pressable>
          )
        })}
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: SPACING.paddingModal,
  },
  unmeasured: { opacity: 0 },
  title: {
    paddingHorizontal: SPACING.paddingModal,
    paddingBottom: SPACING.md,
  },
  // A row of base text between XL paddings: 56, over the 52 a list row needs.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    paddingHorizontal: SPACING.paddingModal,
    paddingVertical: SPACING.xl,
  },
  label: { flex: 1 },
  check: { width: ICON_SIZE, height: ICON_SIZE },
})
