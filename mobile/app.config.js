const { withAndroidManifest } = require('@expo/config-plugins');

// Plugin forzado para inyectar la API Key en el AndroidManifest de la nube
function withGoogleMapsApiKey(config, apiKey) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    if (!mainApplication['meta-data']) {
      mainApplication['meta-data'] = [];
    }

    const existingMeta = mainApplication['meta-data'].find(
      (item) => item.$ && item.$['android:name'] === 'com.google.android.geo.API_KEY'
    );

    if (!existingMeta) {
      mainApplication['meta-data'].push({
        $: {
          'android:name': 'com.google.android.geo.API_KEY',
          'android:value': apiKey,
        },
      });
    }
    return config;
  });
}

const apiKey = "AIzaSyAO6cFGOFWi7DUFPxaDboQFPJlmmrzaYIA";

module.exports = ({ config }) => {
  // Mantenemos estrictamente la configuración original intacta
  const baseConfig = {
    name: "Ronda App",
    slug: "ronda-app",
    version: "2.0.0",
    scheme: "rondaapp",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#7C3AED"
    },
    ios: {
      supportsTablet: false
    },
    android: {
      package: "com.rondaapp.mobile",
      versionCode: 2,
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#7C3AED",
        foregroundImage: "./assets/android-icon-foreground.png"
      },
      predictiveBackGestureEnabled: false,
      permissions: ["NOTIFICATIONS", "VIBRATE", "RECEIVE_BOOT_COMPLETED"],
      config: {
        googleMaps: { apiKey: apiKey }
      },
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [{ scheme: "rondaapp", host: "reset-password" }],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: { favicon: "./assets/favicon.png" },
    plugins: [
      "expo-secure-store",
      "@react-native-community/datetimepicker",
      "expo-font",
      ["expo-notifications", { icon: "./assets/icon.png", color: "#7C3AED", sounds: [] }],
      ["react-native-maps", { androidApiKey: apiKey }]
    ],
    extra: { eas: { projectId: "4e795c92-2a3e-4984-939e-168bca1db737" } },
    owner: "nicoperez04"
  };

  // Aplicamos el mod al final para inyectar la clave en el Manifest
  return withGoogleMapsApiKey(baseConfig, apiKey);
};
