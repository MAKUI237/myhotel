import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';

import { SplashView } from '@/components/splash-screen';
import { useAuth } from '@/context/auth-context';

export default function IndexScreen() {
  const { user, ready } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const onFinished = useCallback(() => setSplashDone(true), []);

  if (!ready || !splashDone) {
    return <SplashView onFinished={onFinished} />;
  }

  return <Redirect href={user ? '/home' : '/welcome'} />;
}
