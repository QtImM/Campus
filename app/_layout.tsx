import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-url-polyfill/auto';
import { StartupAnimation } from '../components/common/StartupAnimation';
import '../global.css';
import { getUserProfile, isDemoMode, onAuthChange } from '../services/auth';
import './i18n/i18n'; // Initialize i18n

const DEMO_MODE_KEY = 'hkcampus_demo_mode';

// Helper to set demo mode
export const setDemoMode = async (enabled: boolean) => {
  if (enabled) {
    await AsyncStorage.setItem(DEMO_MODE_KEY, 'true');
  } else {
    await AsyncStorage.removeItem(DEMO_MODE_KEY);
  }
};

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const inAuthGroup = segments[0] === '(auth)';

      // Check for demo mode first
      const demoMode = await isDemoMode();
      if (demoMode) {
        if (inAuthGroup) {
          router.replace('/(tabs)/campus');
        }
        setLoading(false);
        return;
      }

      // Normal auth check
      const unsubscribe = onAuthChange(async (user) => {
        try {
          if (!user) {
            if (!inAuthGroup) {
              router.replace('/(auth)/login');
            }
          } else {
            const profile = await getUserProfile(user.uid);
            const currentSegment = segments.length > 1 ? (segments as string[])[1] : '';

            if (!profile) {
              // Only redirect to setup if we're not currently in verify or forgot-password flow
              // and we're sure the profile really doesn't exist
              if (currentSegment !== 'setup' &&
                currentSegment !== 'verify' &&
                currentSegment !== 'forgot-password') {
                router.replace('/(auth)/setup');
              }
            } else if (inAuthGroup) {
              if (currentSegment !== 'setup') {
                router.replace('/(tabs)/campus');
              }
            }
          }
        } catch (err) {
          console.error('RootLayout Auth Check Error:', err);
          // If profile fetch fails due to network, don't yank the user to setup
          // Just let them stay where they are or handle at component level
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    checkAuth();
  }, [segments]);

  if (loading || !isAnimationFinished) {
    return (
      <StartupAnimation onFinish={() => setIsAnimationFinished(true)} />
    );
  }

  return (
    <>
      <Slot
        screenOptions={{
          animation: 'slide_from_right',
          animationDuration: 400,
          headerShown: false,
        }}
      />
      <StatusBar style="auto" />
    </>
  );
}
