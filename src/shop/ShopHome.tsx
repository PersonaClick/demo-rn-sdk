import { Fragment, useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import {
  PERSONALIZATION_ICONS,
  PERSONALIZATION_SPACING,
  PersonalizationLoader,
  PersonalizationRecommenderBlock,
  PersonalizationStories,
  PersonalizationSuggestionRow,
  PersonalizationTitle,
  usePersonalizationTheme,
} from '@personaclick/rn-sdk/ui'
import type { ProductCategory } from '@personaclick/rn-sdk'
import { HOME_POPULAR_CODE } from '../config'
import {
  ADD_TO_CART,
  RoundButton,
  ScreenError,
  renderIcon,
  useShop,
} from './shopKit'
import { useShopSearch } from './shopSearch'

const SPACING = PERSONALIZATION_SPACING

/**
 * Shop home: the kit's data widgets wired to the shop's screens, under the status bar.
 *
 * - The header: "Shop" and the search button. Search puts the kit's instant search in place of
 *   the header, its panel open with "Cancel", the rest of home out of the way. Submitting a
 *   phrase opens the search results, a product opens the product page, a category from the
 *   suggestions opens the category page.
 * - The stories bar, only when a stories block is set: a product in a story opens the product
 *   page (the viewer closes before the callback).
 * - The recommender block as a carousel, the title from the answer: a tap opens the product,
 *   the card button adds it to the cart.
 * - Categories: the top-level categories of the products list, a tap opens the category page.
 */
export default function ShopHome() {
  const { shopId, storiesCode, insets, open, addToCart } = useShop()
  const { colors, typography } = usePersonalizationTheme()
  const { searching, start, field } = useShopSearch()
  return (
    <ScrollView
      style={{ marginTop: insets.top }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: SPACING.xl4 + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled">
      {searching ? (
        field
      ) : (
        <View style={styles.header}>
          <Text
            style={[typography.xl3Emphasized, { color: colors.textPrimary }]}
            accessibilityRole="header">
            Shop
          </Text>
          <RoundButton
            icon={PERSONALIZATION_ICONS.magnifier}
            label="Search"
            surface={colors.backgroundCard}
            onPress={start}
          />
        </View>
      )}
      {/* Hidden, not unmounted, while the search is open: the sections keep what they loaded. */}
      <View style={searching && styles.hidden}>
        {storiesCode ? (
          <PersonalizationStories
            code={storiesCode}
            shopId={shopId}
            promoCopiedText="Code copied"
            onProductClick={product => {
              const productId = product.id ?? product.uniqid
              if (
                productId !== undefined &&
                productId !== null &&
                productId !== ''
              ) {
                open({ name: 'product', id: String(productId) })
              }
            }}
            contentContainerStyle={styles.storiesContent}
            style={styles.stories}
          />
        ) : null}
        <PersonalizationRecommenderBlock
          code={HOME_POPULAR_CODE}
          shopId={shopId}
          layout="carousel"
          actionText={ADD_TO_CART}
          onProductPress={product => open({ name: 'product', id: product.id })}
          onProductAction={product => addToCart(product.id)}
          renderIcon={renderIcon}
          style={styles.section}
        />
        <HomeCategories />
      </View>
    </ScrollView>
  )
}

type CategoriesState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'shown'; categories: ProductCategory[] }

/**
 * Top-level categories (no parent) from the `categories` of `getProductsList` as the kit's
 * category rows in a group card, under the kit's title. One product is enough: the categories
 * come with any page. Loading shows the kit's loader, a failed request the error with "Retry";
 * no categories, no section.
 */
function HomeCategories() {
  const { sdk, open } = useShop()
  const { colors, radius } = usePersonalizationTheme()
  const [state, setState] = useState<CategoriesState>({ status: 'loading' })

  const load = useCallback(() => {
    let alive = true
    setState({ status: 'loading' })
    sdk
      .getProductsList({ limit: 1 })
      .then(answer => {
        const categories = (answer?.categories ?? []).filter(
          category => !category.parentId && category.id && category.name,
        )
        if (alive) {
          setState({ status: 'shown', categories })
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
  }, [sdk])
  useEffect(load, [load])

  if (state.status === 'shown' && state.categories.length === 0) {
    return null
  }
  return (
    <View style={styles.section}>
      <PersonalizationTitle title="Categories" />
      {state.status === 'loading' ? (
        <PersonalizationLoader style={styles.loader} />
      ) : state.status === 'failed' ? (
        <ScreenError onRetry={load} />
      ) : (
        <View
          style={[
            styles.group,
            {
              backgroundColor: colors.backgroundCard,
              borderRadius: radius.card,
            },
          ]}>
          {state.categories.map((category, index) => (
            <Fragment key={category.id}>
              {index > 0 ? (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.lineGenericSubtle },
                  ]}
                />
              ) : null}
              <PersonalizationSuggestionRow
                kind="category"
                title={category.name}
                onPress={() =>
                  open({
                    name: 'category',
                    id: category.id,
                    title: category.name,
                  })
                }
                renderIcon={renderIcon}
                style={styles.row}
              />
            </Fragment>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: SPACING.md, paddingHorizontal: SPACING.paddingX },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hidden: { display: 'none' },
  // The bar runs edge to edge and keeps the page's margin inside, so the covers start where
  // the page does and scroll off the screen's edge.
  stories: { marginTop: SPACING.lg, marginHorizontal: -SPACING.paddingX },
  storiesContent: { paddingHorizontal: SPACING.paddingX, paddingVertical: 0 },
  section: { marginTop: SPACING.xl3 },
  loader: { paddingVertical: SPACING.xl3 },
  group: { marginTop: SPACING.lg, overflow: 'hidden' },
  row: {
    paddingHorizontal: SPACING.paddingX,
    paddingVertical: SPACING.paddingY,
  },
  divider: { height: 1 },
})
