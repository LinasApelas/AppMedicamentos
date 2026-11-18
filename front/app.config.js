// Android standalone uses Google Maps; iOS keeps the default Apple Maps provider.
// Supply a key restricted to the Android package and signing certificate at build time.
module.exports = ({ config }) => {
  const key = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  if (!key) return config;
  return {
    ...config,
    plugins: [...(config.plugins || []), ['react-native-maps', { androidGoogleMapsApiKey: key }]],
  };
};
