module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Ensure proper plugin ordering for new architecture
      'react-native-reanimated/plugin',
    ],
  };
};