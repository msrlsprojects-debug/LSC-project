//C:\Users\91700\Documents\LSC-project\frontend\app\dashboard\page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth';

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectByRole = async () => {
      const profile = await getCurrentUserProfile();

      if (!profile) {
        router.push('/login');
        return;
      }

      switch (profile.role) {
        case 'ADMIN':
          router.push('/dashboard/admin');
          break;
        case 'DISTRICT':
          router.push('/dashboard/district');
          break;
        case 'BLOCK':
          router.push('/dashboard/block');
          break;
        case 'LSC':
          router.push('/dashboard/lsc');
          break;
        default:
          router.push('/login');
      }
    };

    redirectByRole();
  }, [router]);

  return <p className="p-6">Redirecting...</p>;
}
