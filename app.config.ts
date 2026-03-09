import type { ExpoConfig, ConfigContext } from 'expo/config';

const IS_CLONE = process.env.KIDCOIN_APP_VARIANT === 'clone';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_CLONE ? 'KidCoin Clone' : (config.name ?? 'kidcoin-v3'),
  slug: config.slug ?? 'kidcoin-v3',
  scheme: IS_CLONE ? 'kidcoinv3clone' : (config.scheme ?? 'kidcoinv3'),
  android: {
    ...config.android,
    package: IS_CLONE ? 'com.kidcoin.v3.clone' : (config.android?.package ?? 'com.kidcoin.v3'),
    googleServicesFile: IS_CLONE
      ? './google-services-clone.json'
      : './google-services.json',
  },
});
