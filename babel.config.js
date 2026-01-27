module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';

  const plugins = [
    // Ensure proper plugin ordering for new architecture
    'react-native-reanimated/plugin',
  ];

  // Remove console.* statements in production builds only
  if (isProduction) {
    plugins.unshift(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
