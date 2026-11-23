'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  Button,
  Select,
  SelectItem,
  Avatar,
} from "@heroui/react";
import Breadcrumb from '../../../../components/Breadcrumb';
import { Upload, Edit2, X } from 'lucide-react';
import { DEFAULT_USER_IMAGE, SUPABASE_BUCKET_URL, USER_IMAGES_BUCKET } from '@/lib/constants';
import ImageGallery from '@/components/ImageGallery';
import { appApiUrl } from '@/lib/journal';
import { heroSelectClassNames, heroSelectPopoverProps, listIanaTimezones } from '@/lib/utils';

interface Timezone {
  value: string;
  label: string;
  utc_offset?: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  subscription_status: string;
  created_at: string;
  image?: string;
  timezone?: string;
  text_message_time?: string;
}

interface UserImage {
  url: string;
  createdAt: string;
}

function readableName(first?: string | null, last?: string | null) {
  const firstName = first && !first.includes('@') ? first.trim() : '';
  const lastName = last && !last.includes('@') ? last.trim() : '';
  return [firstName, lastName].filter(Boolean).join(' ');
}

const quietInputClass =
  'h-12 w-full rounded-lg border-0 bg-gray-100 px-3 text-sm text-black shadow-none outline-none ring-0 ' +
  'placeholder:text-gray-400 focus:border-0 focus:outline-none focus:ring-0 focus:shadow-none ' +
  'focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 ' +
  'dark:bg-dark-7 dark:text-white dark:placeholder:text-gray-500';

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
      {children}
    </label>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [timezones, setTimezones] = useState<Timezone[]>(listIanaTimezones());
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    timezone: 'America/New_York',
    text_message_time: '09:00'
  });

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
      fetchTimezones();
    }
  }, [session]);

  const fetchTimezones = async () => {
    try {
      const response = await fetch(appApiUrl('/api/timezones'));
      const data = await response.json();
      if (response.ok && Array.isArray(data.timezones) && data.timezones.length > 0) {
        setTimezones(data.timezones);
      }
    } catch (error) {
      console.error('Error fetching timezones:', error);
    }
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(appApiUrl('/api/user/profile'));
      const data = await response.json();
      if (response.ok) {
        setProfile(data.user);
        setFormData({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          phone: data.user.phone || '',
          timezone: data.user.timezone || 'America/New_York',
          text_message_time: data.user.text_message_time || '09:00'
        });

        setProfileImage(
          data.user.image
            ? data.user.image.startsWith('http')
              ? data.user.image
              : `${SUPABASE_BUCKET_URL}${USER_IMAGES_BUCKET}/${data.user.image}`
            : DEFAULT_USER_IMAGE
        );

        if (data.user.id) {
          await fetchUserImages(data.user.id);
        }
      } else {
        toast.error(data.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserImages = async (userId: string) => {
    try {
      const response = await fetch(appApiUrl(`/api/user/images?userId=${userId}`));
      const data = await response.json();
      if (response.ok && data.images?.length > 0) {
        setUserImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching user images:', error);
    }
  };

  const handleUpdateProfile = async (imageUrl: string) => {
    try {
      setProfileImage(imageUrl);
      if (profile) {
        setProfile({
          ...profile,
          image: imageUrl
        });
      }
      if (profile?.id) {
        await fetchUserImages(profile.id);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Error updating profile picture');
      if (profile?.image) {
        setProfileImage(
          profile.image.startsWith('http')
            ? profile.image
            : `${SUPABASE_BUCKET_URL}${USER_IMAGES_BUCKET}/${profile.image}`
        );
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('profileImage', file);

      const response = await fetch(appApiUrl('/api/upload'), {
        method: 'POST',
        body: uploadData,
      });

      const data = await response.json();

      if (response.ok) {
        if (data.url) {
          setProfileImage(data.url);
          if (profile) {
            setProfile({
              ...profile,
              image: data.url
            });
          }
          if (profile?.id) {
            await fetchUserImages(profile.id);
          }
        }
        toast.success('Image uploaded successfully');
      } else {
        toast.error(data.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Error uploading image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch(appApiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl text-black dark:text-white">Please log in to view your profile</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl text-black dark:text-white">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <>
        <Breadcrumb pageTitle="Profile" align="left" />
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-xl text-black dark:text-white">Could not load your profile. Try refreshing.</p>
        </div>
      </>
    );
  }

  const resolvedImage = profileImage || DEFAULT_USER_IMAGE;
  const displayName =
    readableName(
      isEditing ? formData.first_name : profile.first_name,
      isEditing ? formData.last_name : profile.last_name
    ) || 'Journal account';

  const timezoneLabel =
    timezones.find((tz) => tz.value === profile.timezone)?.label ||
    profile.timezone ||
    'America/New_York';

  return (
    <>
      <Breadcrumb pageTitle="Profile" align="left" />
      <section className="relative z-10 overflow-x-hidden px-4 pb-12 pt-2 sm:pb-16">
        <div className="container mx-auto max-w-5xl">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-black shadow-lg dark:border-white/10 dark:bg-dark-6 dark:text-white sm:p-8 lg:p-12">
            <div className="mx-auto max-w-[1200px]">
              <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="flex flex-col items-center text-center">
                  <h2 className="mb-1 break-words text-xl font-bold text-black dark:text-white sm:text-2xl">
                    {displayName}
                  </h2>
                  <p className="mb-6 break-words text-sm text-gray-600 dark:text-gray-400 sm:mb-8">
                    {profile.email}
                  </p>
                  <div className="relative mb-4">
                    <Avatar
                      src={resolvedImage}
                      alt={displayName}
                      size="lg"
                      className="h-32 w-32 sm:h-48 sm:w-48"
                    />
                  </div>
                  <label
                    htmlFor="profile-image"
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-white hover:opacity-80 dark:bg-white/15"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Profile Picture
                    <input
                      type="file"
                      id="profile-image"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </div>

                <div className="flex flex-col">
                  <div className="mb-6 flex flex-col items-start gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-bold text-black dark:text-white sm:text-2xl">Profile Information</h2>
                    <Button
                      onPress={() => setIsEditing(!isEditing)}
                      className="bg-gray-900 text-white dark:bg-white/15 dark:text-white"
                      startContent={isEditing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <FieldLabel htmlFor="profile-first-name">First name</FieldLabel>
                          <input
                            id="profile-first-name"
                            value={formData.first_name}
                            onChange={(event) => setFormData({ ...formData, first_name: event.target.value })}
                            className={quietInputClass}
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor="profile-last-name">Last name</FieldLabel>
                          <input
                            id="profile-last-name"
                            value={formData.last_name}
                            onChange={(event) => setFormData({ ...formData, last_name: event.target.value })}
                            className={quietInputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <FieldLabel htmlFor="profile-phone">Phone</FieldLabel>
                        <input
                          id="profile-phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                          placeholder="3475550100"
                          className={quietInputClass}
                        />
                      </div>
                      <div>
                        <FieldLabel htmlFor="profile-timezone">Time zone</FieldLabel>
                        <Select
                          id="profile-timezone"
                          aria-label="Time zone"
                          variant="flat"
                          selectedKeys={[formData.timezone]}
                          onChange={(event) => {
                            if (event.target.value) {
                              setFormData({ ...formData, timezone: event.target.value });
                            }
                          }}
                          classNames={{
                            ...heroSelectClassNames,
                            trigger:
                              `${heroSelectClassNames.trigger} h-12 min-h-12 border-0 shadow-none ring-0 ` +
                              'data-[focus=true]:border-0 data-[focus=true]:shadow-none data-[focus=true]:ring-0 ' +
                              'data-[open=true]:border-0 data-[open=true]:shadow-none data-[open=true]:ring-0',
                          }}
                          popoverProps={heroSelectPopoverProps}
                        >
                          {timezones.map((option) => (
                            <SelectItem key={option.value}>{option.label}</SelectItem>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <FieldLabel htmlFor="profile-reminder-time">Daily reminder time</FieldLabel>
                        <div className="flex items-center gap-2">
                          <input
                            id="profile-reminder-time"
                            type="time"
                            value={formData.text_message_time}
                            onChange={(event) => setFormData({ ...formData, text_message_time: event.target.value })}
                            className={`${quietInputClass} w-[160px]`}
                          />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({formData.timezone})
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          When you want a daily nudge to write in your journal.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        isLoading={isSaving}
                        className="bg-gray-900 text-white dark:bg-white/15 dark:text-white"
                      >
                        Save Changes
                      </Button>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Email</p>
                        <p className="font-medium text-black dark:text-white">{profile.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Phone</p>
                        <p className="font-medium text-black dark:text-white">{profile.phone || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Account type</p>
                        <p className="font-medium capitalize text-black dark:text-white">{profile.role || 'authenticated'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Journal plan</p>
                        <p className="font-medium capitalize text-black dark:text-white">
                          {(profile.subscription_status || 'trial').replaceAll('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Time zone</p>
                        <p className="font-medium text-black dark:text-white">{timezoneLabel}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Daily reminder time</p>
                        <p className="font-medium text-black dark:text-white">
                          {profile.text_message_time || '09:00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Member since</p>
                        <p className="font-medium text-black dark:text-white">
                          {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Not available'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {userImages.length > 0 && (
                <div className="relative mt-12 border-t border-gray-200 pt-8 dark:border-white/10">
                  <h3 className="mb-6 text-center text-xl font-semibold text-black dark:text-white">Your Gallery</h3>
                  <ImageGallery
                    images={userImages.map((img) => ({
                      id: img.url,
                      file_url: img.url,
                      filename: img.url.split('/').pop() || 'image'
                    }))}
                    onUpdateProfile={handleUpdateProfile}
                    currentProfileImage={resolvedImage}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
