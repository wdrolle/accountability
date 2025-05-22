// /src/app/(site)/community/groups/[id]/page.tsx

import { Suspense } from 'react';
import GroupDetailWrapper from './GroupDetailWrapper';
import {Spinner} from "@nextui-org/spinner";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function GroupDetailPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    }>
      <GroupDetailWrapper id={resolvedParams.id} />
    </Suspense>
  );
} 