// Shared pieces of the demo shop: its routes, the context its screens read, icons and buttons.
import { createContext, useContext } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { SvgXml } from 'react-native-svg'
import {
  PERSONALIZATION_ICONS,
  PERSONALIZATION_SPACING,
  PersonalizationButton,
  PersonalizationEmptyState,
  usePersonalizationTheme,
} from '@personaclick/rn-sdk/ui'
import type { StyleProp, ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import type { Sdk } from '../types/sdk'

export const ADD_TO_CART = 'Add to cart'
export const ERROR_TEXT =
  'Something went wrong. Check your connection and try again.'
export const RETRY_TEXT = 'Retry'

/** Screens of the shop's own stack. */
export type ShopRoute =
  | { name: 'home' }
  | { name: 'search'; query: string }
  | { name: 'category'; id: string; title: string }
  | { name: 'product'; id: string }

/** Safe area the shop's screens keep clear: the status bar and the system bar at the bottom. */
export type ShopInsets = { top: number; bottom: number }

/** What every shop screen takes from the pane: the SDK, the stack and the cart. */
export type Shop = {
  sdk: Sdk
  /** Shop the kit's data widgets resolve their SDK instance by. */
  shopId: string
  storiesCode: string
  insets: ShopInsets
  open: (route: ShopRoute) => void
  back: () => void
  /** Tracks the cart event and shows the kit's toast; there is no cart screen. */
  addToCart: (productId: string) => void
  /** The product page's pinned bar reports its height, so the toast comes up above it. */
  setBottomBar: (height: number) => void
}

export const ShopContext = createContext<Shop | null>(null)

export function useShop(): Shop {
  const shop = useContext(ShopContext)
  if (!shop) {
    throw new Error('Shop screens render inside ShopPane')
  }
  return shop
}

/** The kit hands over the SVG source and the color it wants; the app picks the renderer. */
export function renderIcon(svg: string, color: string, size: number) {
  return (
    <SvgXml
      xml={svg.replace(/fill="black"/g, `fill="${color}"`)}
      width={size}
      height={size}
    />
  )
}

/**
 * A round navigation button: a kit icon in a circle the size of a touch target, on the surface
 * it sits on. `mirrored` turns the icon around.
 */
export function RoundButton({
  icon,
  label,
  surface,
  mirrored = false,
  onPress,
  style,
}: {
  icon: string
  label: string
  surface: string
  mirrored?: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  const { colors, radius } = usePersonalizationTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.round,
        {
          borderRadius: radius.rounded,
          backgroundColor: pressed ? colors.buttonSecondaryFocus : surface,
        },
        style,
      ]}>
      <View style={mirrored ? styles.mirrored : null}>
        {renderIcon(icon, colors.textPrimary, ICON_SIZE)}
      </View>
    </Pressable>
  )
}

/** "Back" over the top left of a page, `top` from the screen's top. */
export function BackButton({ top }: { top: number }) {
  const { back } = useShop()
  const { colors } = usePersonalizationTheme()
  return (
    // The kit has only the right chevron: mirrored, it points back.
    <RoundButton
      icon={PERSONALIZATION_ICONS.angleLargeRight}
      mirrored
      label="Back"
      surface={colors.backgroundGeneric}
      onPress={back}
      style={[styles.back, { top }]}
    />
  )
}

/**
 * The kit's result screens (category, search) under the status bar. The kit pads its content by
 * Padding Y and the shop starts its pages at the safe area + MD, so the screen moves up by the
 * difference (`RESULTS_SCREEN_STYLE`) and the frame clips it at the status bar.
 */
export function ResultsFrame({ children }: { children: ReactNode }) {
  const { insets } = useShop()
  return (
    <View
      style={[
        styles.fill,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}>
      <View style={styles.clip}>{children}</View>
    </View>
  )
}

export const RESULTS_SCREEN_STYLE = {
  marginTop: PERSONALIZATION_SPACING.md - PERSONALIZATION_SPACING.paddingY,
}

/** Something that did not load: the kit's empty state with the error text and "Retry". */
export function ScreenError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.error}>
      <PersonalizationEmptyState
        message={ERROR_TEXT}
        style={styles.errorMessage}
      />
      <PersonalizationButton
        label={RETRY_TEXT}
        size="md"
        view="secondary"
        iconStart={PERSONALIZATION_ICONS.arrowRotateCw}
        onPress={onRetry}
        renderIcon={renderIcon}
      />
    </View>
  )
}

/** Icons of the shop's own controls, the kit's MD icon size. */
const ICON_SIZE = 24
/** A navigation button: the touch target around the icon. */
const ROUND_SIZE = 44

const styles = StyleSheet.create({
  round: {
    width: ROUND_SIZE,
    height: ROUND_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { position: 'absolute', left: PERSONALIZATION_SPACING.paddingX },
  mirrored: { transform: [{ scaleX: -1 }] },
  fill: { flex: 1 },
  clip: { flex: 1, overflow: 'hidden' },
  error: {
    alignItems: 'center',
    gap: PERSONALIZATION_SPACING.xl,
    paddingVertical: PERSONALIZATION_SPACING.xl4,
  },
  errorMessage: { paddingVertical: 0, alignSelf: 'stretch' },
})
