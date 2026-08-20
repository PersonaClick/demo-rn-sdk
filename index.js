/**
 * @format
 */

import { AppRegistry } from 'react-native'
import App from './App'
import { name as appName } from './app.json'
import { registerBackgroundPushHandlers } from './src/backgroundPush'
import { registerClickTracking } from './src/clickTracking'
import { sdk } from './src/sdk'

// Start the SDK session here, at launch.
//
// Metro compiles imports into lazy requires: a module is only evaluated when one of its bindings is
// actually used. src/sdk.ts calls initialize() at module scope, so without this line the SDK would
// not start until some screen first touched it — and until then no push handlers are installed and
// incoming notifications are dropped.
sdk.isInit()

// Push handlers have to be registered at module scope, not inside a screen: in background and
// killed state a push is delivered before any component is mounted.
//
// Registered synchronously: this is what makes a push arrive when the app is not running. See
// src/backgroundPush.ts for why it cannot live inside a component or behind an await.
registerBackgroundPushHandlers()

// Clicks on notifications the app rendered itself would otherwise go unreported — see
// src/clickTracking.ts.
registerClickTracking()

AppRegistry.registerComponent(appName, () => App)
