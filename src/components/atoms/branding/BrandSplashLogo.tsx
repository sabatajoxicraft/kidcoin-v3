import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

export default function BrandSplashLogo() {
  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/branding/splash-logo.png')} style={styles.logo} />
    </View>
  );
}
