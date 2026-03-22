import { Suspense } from 'react';
import CompleteEmailClient from './CompleteEmailClient';

export default function CompleteEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>
      }
    >
      <CompleteEmailClient />
    </Suspense>
  );
}
