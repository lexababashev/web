'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VideoEditorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
