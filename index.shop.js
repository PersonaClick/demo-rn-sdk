/**
 * Entry of the demo shop (ShopApp): the full demo's bootstrap from index.js (SDK, push
 * handlers), then the same app name registered with the shop instead of the tabs; the later
 * registration wins.
 *
 * Debug: `yarn start:shop` instead of `yarn start`, then `yarn android` / `yarn ios` as usual
 * (Metro serves this file for the app's `index` bundle).
 * Release: `yarn android:shop:release` / `yarn ios:shop:release`.
 *
 * @format
 */

import { AppRegistry } from 'react-native'
import './index'
import ShopApp from './ShopApp'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => ShopApp)
