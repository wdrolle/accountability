// /src/app/(site)/community/groups/study-groups/page.tsx

// Purpose: Client Component that manages the study groups page
//  Relationships: Receives data from groups/[id]/page.tsx
//    Used by groups/[id]/page.tsx and groups/page.tsx

// Key Functions:
//  Fetches and displays groups
//  Manages modal state and close functionality

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Breadcrumb from '@/components/Breadcrumb';

interface Group {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  meeting_schedule: string;
  location: string;
  current_topic: string;
  language: string;
  visibility: string;
  created_at: string;
  leader: {
    name: string;
    image: string;
  };
  member_count: number;
}

export default function StudyGroupsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups/available');
        if (!response.ok) throw new Error('Failed to fetch groups');
        const data = await response.json();
        setGroups(data.groups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast.error('Failed to fetch groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Study Groups" />

      <section className="relative z-10 overflow-hidden pt-[20px] pb-5 md:pt-[50px] md:pb-[20px] xl:pt-[40px] xl:pb-[20px] 2xl:pt-[50px] 2xl:pb-[50px]">
        <div className="container">
          <div className="wow fadeInUp" data-wow-delay=".1s">
            <div className="mb-1">
              <p className="text-lg text-gray-300">
                Join a study group to connect with others and grow in your faith.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => router.push(`/community/groups/${group.id}`)}
                className="relative overflow-hidden rounded-lg bg-gradient-to-b from-purple-900/50 to-purple-800/50 p-6 cursor-pointer group hover:shadow-[0_0_30px_rgba(0,0,0,0.15)] transition duration-300"
              >
                {/* Bevel effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none" />
                
                {/* Content */}
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 mr-3">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-purple-300 transition-colors">
                        {group.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{group.member_count} members</p>
                    </div>
                    <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-purple-500/30 flex-shrink-0">
                      <Image
                        src={group.leader.image}
                        alt={group.leader.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm line-clamp-2 mb-4 min-h-[40px]">{group.description}</p>

                  <div className="space-y-2 mb-4">
                    {group.meeting_schedule && (
                      <div className="flex items-center text-gray-400 text-sm">
                        <span className="mr-2">📅</span>
                        <span className="truncate">{group.meeting_schedule}</span>
                      </div>
                    )}
                    {group.location && (
                      <div className="flex items-center text-gray-400 text-sm">
                        <span className="mr-2">📍</span>
                        <span className="truncate">{group.location}</span>
                      </div>
                    )}
                    {group.current_topic && (
                      <div className="flex items-center text-gray-400 text-sm">
                        <span className="mr-2">📚</span>
                        <span className="truncate">{group.current_topic}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm pt-4 border-t border-purple-500/20">
                    <span className="text-purple-400">{group.language}</span>
                    <span className="text-gray-400 bg-purple-500/10 px-2 py-0.5 rounded-full text-xs">
                      {group.visibility.toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {groups.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">No study groups available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
} 