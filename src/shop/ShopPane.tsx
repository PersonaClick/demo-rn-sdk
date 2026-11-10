import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler, StyleSheet, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  PersonalizationSearchResultsScreen,
  PersonalizationToastPresenter,
  usePersonalizationTheme,
} from '@personaclick/rn-sdk/ui'
import type { PersonalizationToastHandle } from '@personaclick/rn-sdk/ui'
import type { Sdk } from '../types/sdk'
import ShopCategory from './ShopCategory'
import ShopHome from './ShopHome'
import ShopProduct from './ShopProduct'
import {
  ADD_TO_CART,
  RESULTS_SCREEN_STYLE,
  ResultsFrame,
  ShopContext,
  renderIcon,
  useShop,
} from './shopKit'
import type { Shop, ShopRoute } from './shopKit'
import { useShopSort } from './shopSort'

/**
 * The demo shop, built from the UI kit and the public SDK methods: home (instant search, stories,
 * recommender block, categories), search results, category and product pages on a stack of its
 * own with "back". There is no cart screen: "Add to cart" tracks the cart event and shows the
 * kit's toast.
 *
 * No header over the stack: each screen starts under the status bar itself (the product page puts
 * its hero under it), so the pane hands the screens the safe area instead of keeping it.
 *
 * The stack keeps every opened screen mounted and shows only the top one, so going back returns
 * to the same scroll position and the same loaded pages. The Android back button walks the stack
 * while it is deeper than home; on home it does what it does in any app.
 */

type ShopPaneProps = {
  /** Product, category and tracking calls. */
  sdk: Sdk
  /** The same shop for the kit's data widgets, which resolve their SDK instance by it. */
  shopId: string
  /** Stories block of home; empty, no stories bar. */
  storiesCode: string
}

type Entry = { key: number; route: ShopRoute }

const HOME: Entry = { key: 0, route: { name: 'home' } }

export default function ShopPane({ sdk, shopId, storiesCode }: ShopPaneProps) {
  const [stack, setStack] = useState<Entry[]>([HOME])
  const nextKey = useRef(1)
  const toast = useRef<PersonalizationToastHandle>(null)
  const { colors } = usePersonalizationTheme()
  const safeArea = useSafeAreaInsets()
  const top = safeArea.top
  const bottom = safeArea.bottom
  const insets = useMemo(() => ({ top, bottom }), [top, bottom])
  const [bottomBar, setBottomBar] = useState(0)

  const open = useCallback((route: ShopRoute) => {
    const key = nextKey.current++
    setStack(current => [...current, { key, route }])
  }, [])
  const back = useCallback(
    () =>
      setStack(current =>
        current.length > 1 ? current.slice(0, -1) : current,
      ),
    [],
  )
  const addToCart = useCallback(
    (productId: string) => {
      if (!productId) {
        return
      }
      sdk.track('cart', { id: productId, quantity: 1 })
      toast.current?.show('Added to cart')
    },
    [sdk],
  )
  const shop = useMemo<Shop>(
    () => ({
      sdk,
      shopId,
      storiesCode,
      insets,
      open,
      back,
      addToCart,
      setBottomBar,
    }),
    [sdk, shopId, storiesCode, insets, open, back, addToCart],
  )

  // Android back: a step back through the stack, only above home. Otherwise no listener at all,
  // so the button does what it does by default.
  const canGoBack = stack.length > 1
  useEffect(() => {
    if (!canGoBack) {
      return
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        back()
        return true
      },
    )
    return () => subscription.remove()
  }, [canGoBack, back])

  const shown = stack[stack.length - 1]
  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, { backgroundColor: colors.backgroundGeneric }]}>
      <ShopContext.Provider value={shop}>
        <View style={styles.stack}>
          {stack.map((entry, index) => (
            <View
              key={entry.key}
              style={[
                StyleSheet.absoluteFill,
                index < stack.length - 1 && styles.hidden,
              ]}>
              <Screen route={entry.route} />
            </View>
          ))}
        </View>
      </ShopContext.Provider>
      {/* Last in the pane's root, so the toast floats over the screens; it lets touches through.
          It keeps the screens' safe area and, on a product page, comes up above the pinned bar. */}
      <PersonalizationToastPresenter
        ref={toast}
        insets={{
          top: insets.top,
          bottom: shown.route.name === 'product' ? bottomBar : insets.bottom,
        }}
      />
    </SafeAreaView>
  )
}

function Screen({ route }: { route: ShopRoute }) {
  switch (route.name) {
    case 'home':
      return <ShopHome />
    case 'search':
      return <ShopSearch query={route.query} />
    case 'category':
      return <ShopCategory id={route.id} title={route.title} />
    case 'product':
      return <ShopProduct id={route.id} />
  }
}

/**
 * Search results for the submitted phrase; its own back arrow returns home. The screen loads,
 * pages and filters by itself; the sort button opens the shop's sort sheet.
 */
function ShopSearch({ query }: { query: string }) {
  const { shopId, open, back, addToCart } = useShop()
  const { sort, pick, picker } = useShopSort()
  return (
    <ResultsFrame>
      <PersonalizationSearchResultsScreen
        shopId={shopId}
        query={query}
        sortBy={sort.by}
        sortDir={sort.dir}
        productActionText={ADD_TO_CART}
        onBack={back}
        onProductPress={product =>
          open({ name: 'product', id: String(product.id) })
        }
        onProductAction={product => addToCart(String(product.id))}
        onSortPress={pick}
        renderIcon={renderIcon}
        style={RESULTS_SCREEN_STYLE}
      />
      {picker}
    </ResultsFrame>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stack: { flex: 1 },
  hidden: { display: 'none' },
})
