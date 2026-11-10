import { useCallback, useEffect, useRef, useState } from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { TextStyle } from 'react-native'
import {
  PERSONALIZATION_SPACING,
  PersonalizationBadge,
  PersonalizationButton,
  PersonalizationLoader,
  PersonalizationRecommenderBlock,
  usePersonalizationTheme,
} from '@personaclick/rn-sdk/ui'
import type { ProductInfo } from '@personaclick/rn-sdk'
import { PRODUCT_RECENTLY_VIEWED_CODE, PRODUCT_SIMILAR_CODE } from '../config'
import {
  ADD_TO_CART,
  BackButton,
  ScreenError,
  renderIcon,
  useShop,
} from './shopKit'
import { productInfoLabels, productInfoPicture } from './shopProducts'

const SPACING = PERSONALIZATION_SPACING

const PRODUCT_BLOCKS = [PRODUCT_SIMILAR_CODE, PRODUCT_RECENTLY_VIEWED_CODE]

type ProductState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'shown'; info: ProductInfo }

/**
 * Product page: `getProductInfo(id)`. The hero on the card surface (the picture fitted into a
 * square, brand, name, price with the old price and the discount badge) with "back" over it,
 * then the recommender blocks for this product: similar and recently viewed, each titled by the
 * server and not rendered while it has no products. A block sets its own `dynamic` source
 * before a tap or its card button. The price and "Add to cart" stay pinned at the bottom. The
 * product view is tracked once, when the product is first shown.
 */
export default function ShopProduct({ id }: { id: string }) {
  const { sdk, shopId, insets, open, addToCart, setBottomBar } = useShop()
  const { colors, typography, radius } = usePersonalizationTheme()
  const [state, setState] = useState<ProductState>({ status: 'loading' })
  const viewTracked = useRef(false)

  const load = useCallback(() => {
    let alive = true
    setState({ status: 'loading' })
    sdk
      .getProductInfo(id)
      .then(info => {
        // An unknown id answers `{}`; an error body parses into a product without a name.
        if (!info || !info.id || !info.name) {
          throw new Error('Product not found')
        }
        if (!alive) {
          return
        }
        setState({ status: 'shown', info })
        if (!viewTracked.current) {
          viewTracked.current = true
          sdk.track('view', { id: info.id })
        }
      })
      .catch(() => {
        if (alive) {
          setState({ status: 'failed' })
        }
      })
    return () => {
      alive = false
    }
  }, [sdk, id])
  useEffect(load, [load])

  if (state.status !== 'shown') {
    return (
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}>
        <View style={styles.center}>
          {state.status === 'loading' ? (
            <PersonalizationLoader />
          ) : (
            <ScreenError onRetry={load} />
          )}
        </View>
        <BackButton top={insets.top} />
      </View>
    )
  }

  const { info } = state
  const labels = productInfoLabels(info)
  const picture = productInfoPicture(info)
  const oldPrice = (style: TextStyle) =>
    labels.oldPrice ? (
      <Text style={[style, styles.oldPrice, { color: colors.textSecondary }]}>
        {labels.oldPrice}
      </Text>
    ) : null
  return (
    // The status bar sits on the hero's surface; the page scrolls under it, not behind it.
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top, backgroundColor: colors.backgroundCard },
      ]}>
      <ScrollView
        style={{ backgroundColor: colors.backgroundGeneric }}
        contentContainerStyle={styles.content}>
        <View
          style={[
            styles.hero,
            {
              backgroundColor: colors.backgroundCard,
              borderBottomLeftRadius: radius.modal,
              borderBottomRightRadius: radius.modal,
            },
          ]}>
          <View style={styles.picture}>
            {picture ? (
              <Image
                source={{ uri: picture }}
                style={styles.pictureImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
          <View style={styles.texts}>
            {info.brand ? (
              <Text
                style={[typography.smDefault, { color: colors.textSecondary }]}>
                {info.brand}
              </Text>
            ) : null}
            <Text
              style={[
                typography.xlEmphasized,
                info.brand ? styles.name : null,
                { color: colors.textPrimary },
              ]}>
              {info.name}
            </Text>
            <View style={styles.priceRow}>
              <Text
                style={[
                  typography.xl2Emphasized,
                  { color: colors.textPrimary },
                ]}>
                {labels.price}
              </Text>
              {oldPrice(typography.baseDefault)}
              {labels.discount ? (
                <PersonalizationBadge
                  label={labels.discount}
                  size="md"
                  view="danger"
                />
              ) : null}
            </View>
          </View>
        </View>
        {PRODUCT_BLOCKS.map(code => (
          <PersonalizationRecommenderBlock
            key={code}
            code={code}
            itemId={info.id}
            shopId={shopId}
            layout="carousel"
            actionText={ADD_TO_CART}
            onProductPress={product =>
              open({ name: 'product', id: product.id })
            }
            onProductAction={product => addToCart(product.id)}
            renderIcon={renderIcon}
            style={styles.block}
          />
        ))}
      </ScrollView>
      <View
        onLayout={event => setBottomBar(event.nativeEvent.layout.height)}
        style={[
          styles.bar,
          {
            backgroundColor: colors.backgroundCard,
            borderTopColor: colors.lineGenericSubtle,
            paddingBottom: SPACING.lg + insets.bottom,
          },
        ]}>
        <View>
          <Text
            style={[typography.lgEmphasized, { color: colors.textPrimary }]}>
            {labels.price}
          </Text>
          {oldPrice(typography.smDefault)}
        </View>
        <PersonalizationButton
          label={ADD_TO_CART}
          size="lg"
          onPress={() => addToCart(info.id)}
          style={styles.barButton}
        />
      </View>
      <BackButton top={insets.top} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // The bar is outside the scroll, so the content only keeps the blocks' step from it.
  content: { paddingBottom: SPACING.xl3 },
  hero: { paddingTop: SPACING.md, paddingBottom: SPACING.xl2 },
  // A square the screen's width less two 4XL margins, centered; the picture fits in whole.
  picture: {
    marginHorizontal: SPACING.xl4,
    marginBottom: SPACING.md,
    aspectRatio: 1,
  },
  pictureImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  texts: { paddingHorizontal: SPACING.xl2 },
  name: { marginTop: SPACING.sm },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  oldPrice: { textDecorationLine: 'line-through' },
  block: { marginTop: SPACING.xl3, marginHorizontal: SPACING.paddingX },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.paddingX,
    borderTopWidth: 1,
  },
  barButton: { flex: 1 },
})
