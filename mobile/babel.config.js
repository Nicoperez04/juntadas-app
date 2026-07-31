/**
 * Configuración de Babel para Expo.
 *
 * Con Reanimated 4, babel-preset-expo detecta react-native-worklets y agrega
 * automáticamente su plugin (react-native-worklets/plugin) como último plugin.
 * No hace falta declarar plugins manualmente: duplicarlos rompe el runtime nativo.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
