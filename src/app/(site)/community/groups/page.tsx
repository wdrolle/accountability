// /src/app/(site)/community/groups/page.tsx

// Purpose: Client Component that manages the groups page
//  Relationships: Receives data from groups/[id]/page.tsx
//    Used by groups/[id]/page.tsx and groups/page.tsx

// Key Functions:
//  Fetches and displays groups
//  Manages modal state and close functionality

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Dialog } from '@headlessui/react';
import { X, Users, Calendar, Globe, Book, MessageSquare, Link } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "@/styles/datepicker.css";
import Breadcrumb from '../../../../components/Breadcrumb';

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
  is_member?: boolean;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const groupFeatures = [
  {
    title: "Join Study Groups",
    description: "Connect with others in small groups to study scripture and grow in faith together.",
    icon: Users,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Scripture Focus",
    description: "Dive deep into God's Word with structured agents study materials and discussions.",
    icon: Book,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Regular Meetings",
    description: "Participate in scheduled meetings with your group for consistent spiritual growth.",
    icon: Calendar,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Group Discussions",
    description: "Engage in meaningful conversations about scripture and share insights with your group.",
    icon: MessageSquare,
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  }
];

function CreateGroupModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meeting_schedule: '',
    meeting_date: null as Date | null,
    location: '',
    current_topic: '',
    language: 'English',
    visibility: 'public',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const timeString = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const dateString = date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric' 
      });
      setFormData(prev => ({
        ...prev,
        meeting_date: date,
        meeting_schedule: `Every ${dateString.split(',')[0]} at ${timeString}`
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          meeting_date: undefined // Don't send this to the API
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Group created successfully!');
        onClose();
      } else {
        throw new Error(data.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

        <Dialog.Panel className="relative w-full max-w-2xl rounded-xl bg-[#1a1a1a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-purple-500/[0.07] to-purple-700/10 p-6 shadow-xl">
          <div className="absolute right-4 top-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 p-2 text-white hover:from-purple-600 hover:to-purple-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Dialog.Title as="h2" className="text-xl font-semibold text-white mb-4">
            Create New agents Study Group
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white mb-1">
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="Enter group name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                placeholder="Describe your group's purpose and goals"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="meeting_schedule" className="block text-sm font-medium text-white mb-1">
                  Meeting Schedule
                </label>
                <div className="relative">
                  <DatePicker
                    selected={formData.meeting_date}
                    onChange={handleDateChange}
                    showTimeSelect
                    dateFormat="MMMM d, yyyy h:mm aa"
                    className="w-full rounded-lg border border-white/20 bg-[#2a2a2a] px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    placeholderText="Select date and time"
                    calendarClassName="!bg-[#2a2a2a] !border !border-purple-500/20 !text-white !rounded-lg !shadow-xl"
                    popperClassName="!z-[100]"
                    wrapperClassName="w-full"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-white mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="e.g., Online via Zoom"
                />
              </div>

              <div>
                <label htmlFor="current_topic" className="block text-sm font-medium text-white mb-1">
                  Current Topic
                </label>
                <input
                  type="text"
                  id="current_topic"
                  name="current_topic"
                  value={formData.current_topic}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  placeholder="e.g., Book of Romans"
                />
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-white mb-1">
                  Language *
                </label>
                <div className="relative">
                  <select
                    id="language"
                    name="language"
                    required
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/20 bg-[#2a2a2a] px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-white/60 h-0 w-0" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="visibility" className="block text-sm font-medium text-white mb-1">
                Visibility *
              </label>
              <div className="relative">
                <select
                  id="visibility"
                  name="visibility"
                  required
                  value={formData.visibility}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/20 bg-[#2a2a2a] px-4 py-2 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="private">Private - Approval required to join</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-white/60 h-0 w-0" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 px-6 py-2 text-white hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function GroupsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups');
        const data = await response.json();
        if (response.ok) {
          // Fetch membership status for each group
          const groupsWithMembership = await Promise.all(
            data.groups.map(async (group: Group) => {
              try {
                const membershipResponse = await fetch(`/api/agents-study-groups/${group.id}/membership`, {
                  headers: {
                    'Content-Type': 'application/json',
                  }
                });
                const membershipData = await membershipResponse.json();
                
                // User is a member if they are either:
                // 1. The group leader
                // 2. Listed as a member in membershipData
                // 3. Have an ACCEPTED status in membershipData
                const isMember = 
                  group.leader_id === session?.user?.id || 
                  membershipData.isMember || 
                  (membershipData.status === 'ACCEPTED');
                
                return { 
                  ...group, 
                  is_member: isMember
                };
              } catch (error) {
                console.error(`Error fetching membership for group ${group.id}:`, error);
                // If membership check fails, only consider them a member if they're the leader
                return { ...group, is_member: group.leader_id === session?.user?.id };
              }
            })
          );
          setGroups(groupsWithMembership);
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

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl text-white">Please Log In to access agents study groups</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="agents Study Groups" />
      <section className="relative z-10 overflow-hidden pt-[20px] pb-5 md:pt-[50px] md:pb-[20px] xl:pt-[40px] xl:pb-[20px] 2xl:pt-[50px] 2xl:pb-[50px]">
        <div className="container">
          <div className="wow fadeInUp" data-wow-delay=".1s">
            <div className="mb-8">
              <p className="text-lg text-gray-300 text-center">
                Join or create a agents study group to connect with others and grow in your faith.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div
                onClick={() => setIsModalOpen(true)}
                className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 shadow-lg hover:shadow-purple-500/20 p-6 hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                style={{
                  transform: 'perspective(1000px) rotateX(2deg)',
                  boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                }}
              >
                <h3 className="text-xl font-semibold text-white mb-3">
                  Create New Group
                </h3>
                <p className="text-gray-300 mb-4">
                  Start your own agents study group and invite others to join. Set your own schedule,
                  topics, and guidelines.
                </p>
                <div className="text-purple-400 hover:text-purple-300">
                  Click to get started →
                </div>
              </div>

              <div
                onClick={() => router.push('/community/groups/study-groups')}
                className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 shadow-lg hover:shadow-purple-500/20 p-6 hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                style={{
                  transform: 'perspective(1000px) rotateX(2deg)',
                  boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                }}
              >
                <h3 className="text-xl font-semibold text-white mb-3">
                  Browse Available Groups
                </h3>
                <p className="text-gray-300 mb-4">
                  Find and join existing agents study groups. Connect with others who share your
                  interests and schedule.
                </p>
                <div className="text-purple-400 hover:text-purple-300">
                  Browse groups →
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl md:text-2xl text-white font-bold mb-2">
                Your Groups
              </h3>
              <p className="text-lg text-gray-300">
                Groups you've created or joined
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : groups.length === 0 ? (
              <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg border border-white/20 dark:border-white/10 p-8 text-center">
                <p className="text-xl text-white">
                  You haven't joined any groups yet. Why not browse available groups or create one?
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 shadow-lg hover:shadow-purple-500/20 p-6 hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1"
                    style={{
                      transform: 'perspective(1000px) rotateX(2deg)',
                      boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-purple-500/50 ring-2 ring-purple-500/30 ring-offset-2 ring-offset-black/10">
                        <Image
                          src={group.leader.image || '/images/logo/agents.png'}
                          alt={`Profile picture of ${group.leader.name}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 48px, 48px"
                          priority
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
                      <span className="text-md light:text-black dark:text-white bg-purple-500/20 px-3 py-1.5 rounded-full text-white font-medium border border-purple-500/20">
                        {group.language}
                      </span>
                      <button 
                        onClick={() => {
                          if (group.is_member) {
                            router.push(`/community/groups/${group.id}`);
                          } else {
                            router.push(`/community/groups/${group.id}?join=true`);
                          }
                        }}
                        className="text-md light:text-white dark:text-white bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition-all duration-300"
                      >
                        {group.is_member ? 'View Group' : 'Join Group'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-5">
          {groupFeatures.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl bg-[url(/images/cta/grid.svg)] relative z-10 overflow-hidden border border-gray-300/20 dark:border-gray-600/20 shadow-lg p-8 h-full"
              style={{
                transform: 'perspective(1000px) rotateX(2deg)',
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className={`relative flex h-16 w-16 items-center justify-center rounded-full ${feature.bgColor} mb-6`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/50 via-transparent to-white/20" />
                <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/10 via-transparent to-black/30" />
                <div className="absolute inset-[1px] rounded-full ring-1 ring-white/10 shadow-inner" />
                <div className="absolute inset-0 rounded-full shadow-lg" />
                <feature.icon className={`h-8 w-8 ${feature.color} relative z-10 drop-shadow-lg`} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        </div>
      </section>

      <CreateGroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
} 