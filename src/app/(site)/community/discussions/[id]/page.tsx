// /src/app/(site)/community/discussions/[id]/page.tsx

import React from 'react';
import DiscussionClient from './DiscussionClient';

interface PageParams {
  id: string;
}

export default function DiscussionPage({ params }: { params: PageParams }) {
  const resolvedParams = React.use(Promise.resolve(params));
  return <DiscussionClient discussionId={resolvedParams.id} />;
} 