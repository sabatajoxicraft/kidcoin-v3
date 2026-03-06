# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## APK Automation

Automated workflows for managing APK builds in development.

### APK Watcher

Copies `app-release.apk` to Termux downloads directory when changed:

```bash
npm run apk:watch        # Continuous watch mode
npm run apk:watch:once   # Single copy
```

**Environment variables:**
- `TERMUX_DOWNLOAD_DIR` - Target directory (auto-detects if not set)
- `APK_OUTPUT_FILENAME` - Output filename (default: `kidcoin-latest.apk`)
- `APK_WATCH_INTERVAL` - Watch interval in seconds (default: `5`)

### APK Sync

Downloads latest APK from GitHub releases when updated:

```bash
npm run apk:sync        # Continuous sync mode
npm run apk:sync:once   # Single check
```

**Environment variables:**
- `GITHUB_RELEASE_TAG` - Release tag to track (default: `latest-dev-apk`)
- `APK_POLL_INTERVAL` - Poll interval in seconds (default: `60`)

State persisted in `.copilot/.apk-sync-state`. Automatically triggers watcher after download.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
