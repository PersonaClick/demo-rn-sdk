import { useCallback, useEffect, useState } from 'react'
import { BackHandler, Keyboard } from 'react-native'
import { PersonalizationInstantSearchField } from '@personaclick/rn-sdk/ui'
import type { PersonalizationInstantSearchFieldProps } from '@personaclick/rn-sdk/ui'
import type { ReactNode } from 'react'
import { renderIcon, useShop } from './shopKit'
import type { ShopRoute } from './shopKit'

type FieldProps = Pick<
  PersonalizationInstantSearchFieldProps,
  'cancelText' | 'onCancel' | 'style'
> & {
  /** Called before the shop opens a screen from the search. */
  onLeave?: () => void
}

/**
 * The shop's instant search: submitting a phrase opens the search results, a product opens the
 * product page, a category from the suggestions opens the category page.
 */
function ShopSearchField({ onLeave, ...props }: FieldProps) {
  const { shopId, open } = useShop()
  const go = (route: ShopRoute) => {
    onLeave?.()
    open(route)
  }
  return (
    <PersonalizationInstantSearchField
      shopId={shopId}
      placeholder="Search"
      recentLabel="Recent searches"
      clearText="Clear"
      moreText="more"
      categoriesLabel="Categories"
      productsLabel="Products"
      onSubmit={query => go({ name: 'search', query })}
      onProductPress={product =>
        go({ name: 'product', id: String(product.id) })
      }
      // Popular categories of the empty query come without an id: there is no page to open.
      onCategoryPress={category => {
        if (category.id) {
          go({ name: 'category', id: category.id, title: category.name })
        }
      }}
      renderIcon={renderIcon}
      {...props}
    />
  )
}

/**
 * The shop's search on home, behind the search button of its header: `start` puts the kit's
 * field in place of the header, with its panel (recent searches, suggestions, categories,
 * products) open under it and "Cancel", and `searching` tells home to hide its other sections.
 * "Cancel", the back button or a screen opened from the search bring home back; the next search
 * starts from an empty field.
 */
export function useShopSearch(): {
  searching: boolean
  start: () => void
  field: ReactNode
} {
  const [searching, setSearching] = useState(false)
  const start = useCallback(() => setSearching(true), [])
  const leave = useCallback(() => {
    Keyboard.dismiss()
    setSearching(false)
  }, [])

  // Android back closes the search first.
  useEffect(() => {
    if (!searching) {
      return
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        leave()
        return true
      },
    )
    return () => subscription.remove()
  }, [searching, leave])

  // Mounted only while searching, so every search starts from an empty field.
  const field = searching ? (
    <ShopSearchField cancelText="Cancel" onCancel={leave} onLeave={leave} />
  ) : null
  return { searching, start, field }
}
