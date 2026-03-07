import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/auth-context';
import { useAuth } from '@/hooks/use-auth';
import { FamilyProvider, useFamily } from '@/contexts/family-context';
import { TaskProvider } from '@/contexts/task-context';

export const unstable_settings = {
  anchor: '(parent)',
};

function RootLayoutNav() {
  const { user, initializing } = useAuth();
  const { effectiveRole, effectiveUserProfile, hasFamily, loading: familyLoading } = useFamily();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing || familyLoading) return;

    if (!user) {
      if (segments[0] !== '(auth)') {
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    if (!hasFamily) {
      if (segments[0] !== '(setup)') {
        router.replace('/(setup)/family-create');
      }
      return;
    }

    if (effectiveRole === 'child' && effectiveUserProfile) {
      if (segments[0] !== '(child)') {
        router.replace('/(child)');
      }
      return;
    }

    // parent (default)
    if (segments[0] !== '(parent)') {
      router.replace('/(parent)');
    }
  }, [user, initializing, effectiveRole, effectiveUserProfile, hasFamily, familyLoading, segments, router]);

  if (initializing || familyLoading) return null;

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(setup)" options={{ headerShown: false }} />
      <Stack.Screen name="(parent)" options={{ headerShown: false }} />
      <Stack.Screen name="(child)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <FamilyProvider>
          <TaskProvider>
            <RootLayoutNav />
            <StatusBar style="auto" />
          </TaskProvider>
        </FamilyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
