import { PersonalizationCategoryScreen } from '@personaclick/rn-sdk/ui'
import {
  ADD_TO_CART,
  RESULTS_SCREEN_STYLE,
  ResultsFrame,
  renderIcon,
  useShop,
} from './shopKit'
import { useShopSort } from './shopSort'

/**
 * Category page: the kit's category screen. It loads `getCategory` page by page with filters
 * and sorting, shows the empty state and the error with "Retry" and tracks the category view
 * once. The shop gives it the title, "back" along its stack, the sort sheet and "Add to cart".
 */
export default function ShopCategory({
  id,
  title,
}: {
  id: string
  title: string
}) {
  const { shopId, open, back, addToCart } = useShop()
  const { sort, pick, picker } = useShopSort()
  return (
    <ResultsFrame>
      <PersonalizationCategoryScreen
        shopId={shopId}
        categoryId={id}
        title={title}
        sortBy={sort.by}
        sortDir={sort.dir}
        productActionText={ADD_TO_CART}
        onBack={back}
        onSortPress={pick}
        onProductPress={product =>
          open({ name: 'product', id: String(product.id) })
        }
        onProductAction={product => addToCart(String(product.id))}
        renderIcon={renderIcon}
        style={RESULTS_SCREEN_STYLE}
      />
      {picker}
    </ResultsFrame>
  )
}
