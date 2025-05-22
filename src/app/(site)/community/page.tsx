import React from 'react';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import Link from 'next/link';
import { MessageCircle, Users } from 'lucide-react';
import prisma from '@/lib/prisma';

type FamilyMember = {
  family_id: string;
  member_id: string;
  added_at: Date | null;
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    image: string | null;
  };
};

export const metadata: Metadata = {
  title: 'Community | CStudios',
  description: 'Connect with friends and family in our faith community.',
};

const communityFeatures = [
  {
    title: "Community Discussions",
    description: "Engage in meaningful conversations about faith, share testimonies, and discuss scripture.",
    icon: MessageCircle,
    href: "/community/discussions",
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "agents Study Groups",
    description: "Join or create study groups to grow together in faith and understanding.",
    icon: Users,
    href: "/community/groups",
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
  {
    title: "Prayer Requests",
    description: "Share prayer needs and support others through prayer in our community.",
    icon: Users,
    href: "/community/prayers",
    color: "text-gray-300",
    bgColor: "bg-gray-900",
  },
];

async function getFamilyMembers(user_id: string): Promise<FamilyMember[]> {
  const familyMembers = await prisma.family_members.findMany({
    where: {
      OR: [
        { family_id: user_id },
        { user_id: user_id }
      ]
    },
    include: {
      user: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          image: true
        }
      }
    }
  });
  return familyMembers as unknown as FamilyMember[];
}

export default async function CommunityPage() {
  const session = await getServerSession(authOptions);
  let familyMembers: FamilyMember[] = [];

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (user) {
      familyMembers = await getFamilyMembers(user.id);
    }
  }

  return (
    <>
      <Breadcrumb pageTitle="Community" />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <p className="text-center text-gray-300 max-w-2xl mx-auto">
            Connect with friends and family, join discussions, participate in agents study groups,
            and support each other through prayer.
          </p>
        </div>

        {session ? (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Family Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {familyMembers.length > 0 ? (
                familyMembers.map((member) => (
                  <div 
                    key={member.member_id} 
                    className="bg-white/5 rounded-lg p-4 flex items-center space-x-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      {member.user.image ? (
                        <img 
                          src={member.user.image} 
                          alt={`${member.user.first_name}'s profile`}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <span className="text-xl text-purple-500">
                          {member.user.first_name?.[0] || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        {member.user.first_name} {member.user.last_name}
                      </h3>
                      <p className="text-gray-400 text-sm">{member.user.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400 mb-4">No family members yet</p>
                  <Link
                    href="/community/add-family"
                    className="text-purple-500 hover:text-purple-400"
                  >
                    Add Family Members
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center mb-12">
            <Link
              href="/auth/login"
              className="button-border-gradient hover:button-gradient-hover relative inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-white shadow-button hover:shadow-none"
            >
              Log In to Connect to the Community
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.4002 7.60002L9.2252 2.35002C9.0002 2.12502 8.6502 2.12502 8.4252 2.35002C8.2002 2.57502 8.2002 2.92502 8.4252 3.15002L12.6252 7.42502H2.0002C1.7002 7.42502 1.4502 7.67502 1.4502 7.97502C1.4502 8.27502 1.7002 8.55003 2.0002 8.55003H12.6752L8.4252 12.875C8.2002 13.1 8.2002 13.45 8.4252 13.675C8.5252 13.775 8.6752 13.825 8.8252 13.825C8.9752 13.825 9.1252 13.775 9.2252 13.65L14.4002 8.40002C14.6252 8.17502 14.6252 7.82503 14.4002 7.60002Z"
                  fill="white"
                />
              </svg>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {communityFeatures.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group block"
            >
              <div className="rounded-xl bg-white/[0.05] p-8 h-full hover:bg-white/[0.08] transition-all">
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-full ${feature.bgColor} mb-6`}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/50 via-transparent to-white/20" />
                  <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-white/10 via-transparent to-black/30" />
                  <div className="absolute inset-[1px] rounded-full ring-1 ring-white/10 shadow-inner" />
                  <div className="absolute inset-0 rounded-full shadow-lg" />
                  <feature.icon className={`h-8 w-8 ${feature.color} relative z-10 drop-shadow-lg`} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-purple-400">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
} 