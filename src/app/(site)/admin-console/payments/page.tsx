import { Suspense } from 'react';
import PaymentsClient from './PaymentsClient';

export const metadata = {
  title: 'Payments Management - Admin Console',
};

export default function PaymentsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payments Management</h1>
      <Suspense fallback={<div>Loading payments data...</div>}>
        <PaymentsClient />
      </Suspense>
    </div>
  );
}