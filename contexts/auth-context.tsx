import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, validateFirebaseConfig } from '@/lib/firebase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  initializing: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const googleConfigExtra = Constants.expoConfig?.extra?.google as
    | {
        iosClientId?: string;
        androidClientId?: string;
        webClientId?: string;
      }
    | undefined;
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: googleConfigExtra?.iosClientId ?? 'MISSING_GOOGLE_IOS_CLIENT_ID',
    androidClientId: googleConfigExtra?.androidClientId ?? 'MISSING_GOOGLE_ANDROID_CLIENT_ID',
    webClientId: googleConfigExtra?.webClientId ?? 'MISSING_GOOGLE_WEB_CLIENT_ID',
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    validateFirebaseConfig();
    const missingGoogleKeys = [
      !googleConfigExtra?.iosClientId && 'google.iosClientId',
      !googleConfigExtra?.androidClientId && 'google.androidClientId',
      !googleConfigExtra?.webClientId && 'google.webClientId',
    ].filter(Boolean) as string[];
    if (missingGoogleKeys.length > 0) {
      throw new Error(`Missing required Expo config keys: ${missingGoogleKeys.join(', ')}`);
    }

    if (!request) {
      throw new Error('Google Auth request is not ready');
    }
    const result = await promptAsync();

    if (result.type === 'cancel') {
      throw new Error('Sign-in cancelled');
    }

    if (result.type === 'error') {
      throw new Error(result.error?.message || 'Sign-in failed');
    }

    if (result.type === 'success') {
      const idToken = result.params.id_token;
      const accessToken = result.params.access_token;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      const credential = GoogleAuthProvider.credential(idToken, accessToken);
      const userCredential = await signInWithCredential(auth, credential);

      const { uid, email, displayName, photoURL } = userCredential.user;
      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email,
          displayName,
          photoURL,
          role: 'parent',
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
