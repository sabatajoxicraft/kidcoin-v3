import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import * as FirebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const { initializeAuth, getAuth } = FirebaseAuth;
type Auth = FirebaseAuth.Auth;

const getReactNativePersistence = (
  FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => any;
  }
).getReactNativePersistence;

const firebaseConfigExtra = Constants.expoConfig?.extra?.firebase as
  | {
      apiKey?: string;
      authDomain?: string;
      projectId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      appId?: string;
    }
  | undefined;

export const validateFirebaseConfig = (): void => {
  const missingKeys = [
    !firebaseConfigExtra?.apiKey && 'firebase.apiKey',
    !firebaseConfigExtra?.authDomain && 'firebase.authDomain',
    !firebaseConfigExtra?.projectId && 'firebase.projectId',
    !firebaseConfigExtra?.storageBucket && 'firebase.storageBucket',
    !firebaseConfigExtra?.messagingSenderId && 'firebase.messagingSenderId',
    !firebaseConfigExtra?.appId && 'firebase.appId',
  ].filter(Boolean) as string[];

  if (missingKeys.length > 0) {
    throw new Error(`Missing required Expo config keys: ${missingKeys.join(', ')}`);
  }
};

const app = getApps().length === 0
  ? initializeApp({
      apiKey: firebaseConfigExtra?.apiKey ?? 'MISSING_FIREBASE_API_KEY',
      authDomain: firebaseConfigExtra?.authDomain ?? 'MISSING_FIREBASE_AUTH_DOMAIN',
      projectId: firebaseConfigExtra?.projectId ?? 'MISSING_FIREBASE_PROJECT_ID',
      storageBucket: firebaseConfigExtra?.storageBucket ?? 'MISSING_FIREBASE_STORAGE_BUCKET',
      messagingSenderId: firebaseConfigExtra?.messagingSenderId ?? 'MISSING_FIREBASE_MESSAGING_SENDER_ID',
      appId: firebaseConfigExtra?.appId ?? 'MISSING_FIREBASE_APP_ID',
    })
  : getApp();

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: unknown) {
  if (error instanceof Error && 'code' in error && error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to initialize Firebase Auth: ${message}`);
  }
}

export const db = getFirestore(app);
export { auth };
