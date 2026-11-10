const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    // `yarn start:shop` (DEMO_ENTRY=shop): the app asks for the `index` bundle as always, Metro
    // serves the demo shop's entry (index.shop.js) instead. Release builds pick the entry
    // themselves.
    rewriteRequestUrl: url =>
      process.env.DEMO_ENTRY === 'shop'
        ? url.replace(/\/index\.(bundle|map)/, '/index.shop.$1')
        : url,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
