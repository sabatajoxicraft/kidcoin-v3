/**
 * Expo config plugin — opt the image-picker crop activity out of Android 15
 * edge-to-edge enforcement.
 *
 * Android 15 (API 35) forces every Activity into edge-to-edge mode.  The
 * `ExpoCropImageActivity` shipped by expo-image-picker does not handle window
 * insets, so the top and bottom system bars visually overlap its UI.
 *
 * Fix: declare a custom theme that extends the activity's existing AppCompat
 * base and sets `android:windowOptOutEdgeToEdgeEnforcement=true`, then point
 * the activity at that theme in the merged AndroidManifest.xml.
 *
 * Scope: ONLY `expo.modules.imagepicker.ExpoCropImageActivity`.
 * Everything else in the app stays fully edge-to-edge.
 */

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const THEME_NAME = 'Theme.KidCoin.CropActivity';
const CROP_ACTIVITY = 'expo.modules.imagepicker.ExpoCropImageActivity';

// Base style (all API levels): same parent as the library's original theme.
const BASE_THEME_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="${THEME_NAME}" parent="Base.Theme.AppCompat" />
</resources>
`;

// API-35+ override: opt out of the mandatory edge-to-edge enforcement.
const V35_THEME_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="${THEME_NAME}" parent="Base.Theme.AppCompat">
        <item name="android:windowOptOutEdgeToEdgeEnforcement">true</item>
    </style>
</resources>
`;

/**
 * Write a file, creating parent directories as needed.
 * @param {string} filePath
 * @param {string} content
 */
function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

/** @param {import('@expo/config-plugins').ConfigPlugin} config */
function withCropActivityTheme(config) {
  // 1. Write the theme resource files during the Android prebuild phase.
  config = withDangerousMod(config, [
    'android',
    async (cfg) => {
      const resRoot = path.join(
        cfg.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res'
      );

      writeFile(
        path.join(resRoot, 'values', 'kidcoin_crop_theme.xml'),
        BASE_THEME_XML
      );

      writeFile(
        path.join(resRoot, 'values-v35', 'kidcoin_crop_theme.xml'),
        V35_THEME_XML
      );

      return cfg;
    },
  ]);

  // 2. Patch the app's AndroidManifest.xml so the crop activity uses our theme.
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    const application = manifest.manifest.application?.[0];
    if (!application) return cfg;

    // Ensure the tools namespace is declared on the root element.
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] =
        'http://schemas.android.com/tools';
    }

    const activities = application.activity ?? [];
    let cropActivity = activities.find(
      (a) => a.$?.['android:name'] === CROP_ACTIVITY
    );

    if (!cropActivity) {
      cropActivity = { $: { 'android:name': CROP_ACTIVITY, 'android:exported': 'false' } };
      application.activity = [...activities, cropActivity];
    }

    // Override the theme.
    cropActivity.$['android:theme'] = `@style/${THEME_NAME}`;

    // tools:replace tells the manifest merger to prefer our values over the
    // library's AndroidManifest.xml entries for these attributes.
    const existing = cropActivity.$['tools:replace'] ?? '';
    const parts = existing
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.includes('android:theme')) parts.push('android:theme');
    if (!parts.includes('android:exported')) parts.push('android:exported');
    cropActivity.$['tools:replace'] = parts.join(',');

    return cfg;
  });

  return config;
}

module.exports = withCropActivityTheme;
