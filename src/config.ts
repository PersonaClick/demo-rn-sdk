import { Platform } from 'react-native'

/**
 * Shop identifier from your PersonaClick dashboard.
 * This is a demo shop — replace it with your own.
 */
export const SHOP_ID = '42a4cd11ebab3b0454778d18d4f3d5'

/**
 * Analytics stream. Passing the platform is the common choice: it keeps
 * iOS and Android statistics apart.
 */
export const STREAM = Platform.OS

/**
 * Demo shop (index.shop.js): recommender blocks found on the storefront of this shop,
 * demo.personaclick.com. They are set up in the dashboard; replace them with your own.
 */

/**
 * Home: "Popular products". The shop runs an A/B test on it: segment B gets products,
 * segment A an empty block, which the kit's block hides.
 */
export const HOME_POPULAR_CODE = '3ced4017b680fee0d8d153bad996ff55'

/** Product page: "Similar products", driven by the product on screen. */
export const PRODUCT_SIMILAR_CODE = 'aabc899d3db3d71c4032832e4291c16a'

/** Product page: "Recently viewed". */
export const PRODUCT_RECENTLY_VIEWED_CODE = '09db715d69d1284832a0ddeb2cf62ceb'

/**
 * Category page: "Recently viewed". Not shown: the kit's category screen is a whole-screen
 * listing with no place for a block.
 */
export const CATEGORY_RECENTLY_VIEWED_CODE = 'e4fd6e3a19610f7aea5534e96eec69d6'

/**
 * Stories block of the shop's home. The storefront has none, so it is empty and home shows no
 * stories bar; put a block code here to get one.
 */
export const STORIES_CODE = ''
