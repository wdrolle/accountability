import { Suspense } from 'react';
import UpdateUsersClient from './UpdateUsersClient';
import Breadcrumb from '@/components/Breadcrumb';

export const metadata = {
  title: 'Update Users - Admin Console',
};

export default function UpdateUsersPage() {
  return (
    <>
      <Breadcrumb pageTitle="Update Users" />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Update Users</h1>
        <Suspense fallback={<div>Loading users data...</div>}>
          <UpdateUsersClient />
        </Suspense>
      </div>
    </>
  );
}
