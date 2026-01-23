import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { getAuthToken } from '@/src/services/api';

export default function Index() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        
        // If no token, redirect to login
        if (!token) {
          router.replace('/login');
          return;
        }

        // If has token, redirect to main app
        router.replace('/(tabs)');
      } catch (error) {
        // On error, go to login
        router.replace('/login');
      }
    };

    checkAuth();
  }, []);

  return null;
}
