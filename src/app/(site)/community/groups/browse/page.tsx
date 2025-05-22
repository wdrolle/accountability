// /src/app/(site)/community/groups/browse/page.tsx

// Purpose: Client Component that manages the browse groups page
//  Relationships: Receives data from groups/[id]/page.tsx

// Key Functions:
//  Fetches and displays groups
//  Manages modal state and close functionality

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import Breadcrumb from '../../../../../components/Breadcrumb';
import { Users, Calendar, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Group {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  meeting_schedule: string | null;
  location: string | null;
  current_topic: string | null;
  language: string;
  visibility: string;
  created_at: string;
  leader: {
    name: string;
    image: string | null;
  };
  member_count: number;
}

export default function BrowseGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/agents-study-groups');
        const data = await response.json();
        if (response.ok) {
          setGroups(data.groups);
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast.error('Failed to load groups');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchGroups();
    }
  }, [session]);

  const handleJoinGroup = async (groupId: string) => {
    if (!session) {
      toast.error('Please Log In to join groups');
      return;
    }

    try {
      const response = await fetch(`/api/agents-study-groups/${groupId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Successfully joined the group');
        router.push(`/community/groups/${groupId}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Error joining group');
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl text-white">Please Log In to browse agents study groups</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Browse Groups" />
      <section className="relative z-10 overflow-hidden pt-[20px] pb-5 md:pt-[50px] md:pb-[120px] xl:pt-[180px] xl:pb-[160px] 2xl:pt-[50px] 2xl:pb-[50px]">
        <div className="container">
          <div className="wow fadeInUp" data-wow-delay=".1s">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl text-white font-bold mb-2">
                Available agents Study Groups
              </h2>
              <p className="text-lg text-gray-300">
                Find and join a group that matches your interests and schedule.
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : groups.length === 0 ? (
              <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg border border-white/20 dark:border-white/10 p-8 text-center">
                <p className="text-xl text-white">
                  No groups available at the moment. Why not create one?
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="backdrop-blur-sm bg-gradient-to-br from-white/20 via-purple-500/10 to-purple-700/20 dark:from-dark/20 dark:via-purple-500/10 dark:to-purple-800/20 rounded-lg relative z-10 overflow-hidden border-2 border-white/20 dark:border-white/10 shadow-lg hover:shadow-purple-500/20 p-6 hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gradient-to-r from-purple-500/50 to-purple-700/50 ring-2 ring-purple-500/30 ring-offset-2 ring-offset-black/10">
                        <Image
                          src={group.leader.image || '/images/logo/agents.png'}
                          alt={`Profile picture of ${group.leader.name}`}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm">
                          Led by {group.leader.name}
                        </h4>
                        <p className="text-xs text-gray-300">
                          Created {new Date(group.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-3">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                      {group.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      {group.meeting_schedule && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>{group.meeting_schedule}</span>
                        </div>
                      )}
                      {group.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Globe className="w-4 h-4" />
                          <span>{group.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Users className="w-4 h-4" />
                        <span>{group.member_count} members</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                      <span className="text-xs bg-gradient-to-r from-purple-500/20 to-purple-700/20 px-3 py-1.5 rounded-full text-white font-medium border border-purple-500/20">
                        {group.language}
                      </span>
                      <button 
                        onClick={() => handleJoinGroup(group.id)}
                        className="text-xs text-white bg-gradient-to-r from-purple-500 to-purple-700 px-4 py-2 rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all duration-300"
                      >
                        Join Group
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
} 