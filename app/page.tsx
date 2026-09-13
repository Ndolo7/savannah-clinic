import { Suspense } from 'react';
import ClinicConsole from '@/components/clinic-console';

export default function Page() {
  return (
    <Suspense fallback={<div className="loading-screen" suppressHydrationWarning>Loading console…</div>}>
      <ClinicConsole />
    </Suspense>
  );
}
