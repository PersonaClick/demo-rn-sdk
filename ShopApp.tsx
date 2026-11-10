// The demo shop as the whole app: home, categories, products and search, built from the SDK's
// UI kit. The SDK is the one the full demo starts (src/sdk.ts); index.shop.js boots both.
import { StatusBar, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { SdkPopupOverlay } from '@personaclick/rn-sdk'
import { SHOP_ID, STORIES_CODE } from './src/config'
import { sdk } from './src/sdk'
import ShopPane from './src/shop/ShopPane'

export default function ShopApp() {
  const isDarkMode = useColorScheme() === 'dark'
  return (
    <SafeAreaProvider>
      {/* Edge to edge: the screens keep the safe area themselves. */}
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <ShopPane sdk={sdk} shopId={SHOP_ID} storiesCode={STORIES_CODE} />
      {/* Popups of the dashboard, as in the full demo: mounted once, at the root. */}
      <SdkPopupOverlay sdk={sdk} />
    </SafeAreaProvider>
  )
}
