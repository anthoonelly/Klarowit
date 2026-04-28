import { Suspense } from 'react';
import { AuthForm } from '@/components/auth-form';

export const metadata = {
  title: 'Zaloguj się · Memoist',
};

export default function SignInPage() {
  return (
    <Suspense>
      <AuthForm mode="signin" />
    </Suspense>
  );
}
