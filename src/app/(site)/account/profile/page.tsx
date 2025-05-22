// src/app/(site)/account/profile/page.tsx

'use client';

import React, { useState, useEffect, Suspense, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import {
  Button,
  Select,
  Input,
  Avatar,
  TimeInput,
  type DateValue,
  type DatePickerProps,
  type CalendarDate
} from "@heroui/react";
import Breadcrumb from '../../../../components/Breadcrumb';
import { Upload, Edit2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUserImageUrl, DEFAULT_USER_IMAGE, SUPABASE_BUCKET_URL, USER_IMAGES_BUCKET } from '@/lib/constants';
import Link from 'next/link';
import ImageGallery from '@/components/ImageGallery';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import type { Selection } from "@heroui/react";
import { today, parseDate, getLocalTimeZone, Time } from '@internationalized/date';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

export const agents_VERSIONS = [
  { id: 'DeepSeek-Coding', name: 'DeepSeek-Coding' },
  { id: 'DeepSeek-Chat', name: 'DeepSeek-Chat' },
  { id: 'DeepSeek-Code', name: 'DeepSeek-Code' },
  { id: 'DeepSeek-Code-Pro', name: 'DeepSeek-Code-Pro' },
  { id: 'DeepSeek-Code-Pro-Plus', name: 'DeepSeek-Code-Pro-Plus' },
  { id: 'Llama-3.1-70B-Instruct', name: 'Llama-3.1-70B-Instruct' },
  { id: 'Llama-3.1-8B-Instruct', name: 'Llama-3.1-8B-Instruct' },
  { id: 'Llama-3.1-405B-Instruct', name: 'Llama-3.1-405B-Instruct' },
  { id: 'Llama-3.1-70B-Instruct', name: 'Llama-3.1-70B-Instruct' },
  { id: 'Llama-3.1-8B-Instruct', name: 'Llama-3.1-8B-Instruct' },
  { id: 'Llama-3.1-405B-Instruct', name: 'Llama-3.1-405B-Instruct' },
];


interface Timezone {
  value: string;
  label: string;
  utc_offset: string;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  subscription_status: string;
  subscription_plan: 'STARTER' | 'PREMIUM' | 'FAMILY';
  created_at: string;
  agents_version?: string;
  image?: string;
  timezone?: string;
  text_message_time?: string;
}

interface UserImage {
  url: string;
  createdAt: string;
}

interface TimezoneOption {
  readonly value: string;
  readonly label: string;
}

const customStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: 'rgb(255 255 255 / 0.85)',
    borderColor: state.isFocused ? 'rgb(59 130 246 / 0.2)' : 'rgb(255 255 255 / 0.85)',
    boxShadow: state.isFocused ? '0 0 0 1px rgb(59 130 246 / 0.2)' : 'none',
    padding: '0.75rem',
    '&:hover': {
      borderColor: 'rgb(59 130 246 / 0.2)'
    },
    '.dark &': {
      backgroundColor: 'rgb(0 0 0 / 0.05)',
      borderColor: state.isFocused ? 'rgb(59 130 246 / 0.2)' : 'rgb(255 255 255 / 0.1)'
    }
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: 'rgb(255 255 255 / 0.85)',
    border: '1px solid rgb(255 255 255 / 0.85)',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    '.dark &': {
      backgroundColor: 'rgb(0 0 0 / 0.05)',
      border: '1px solid rgb(255 255 255 / 0.1)'
    }
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? 'rgb(59 130 246 / 0.85)' : 'rgb(255 255 255 / 0.85)',
    color: '#1e293b',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgb(59 130 246 / 0.85)',
    },
    '.dark &': {
      backgroundColor: state.isFocused ? 'rgb(59 130 246 / 0.85)' : 'rgb(0 0 0 / 0.85)',
      color: '#f8fafc'
    }
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#1e293b',
    '.dark &': {
      color: '#f8fafc'
    }
  }),
  input: (base: any) => ({
    ...base,
    color: '#1e293b',
    '.dark &': {
      color: '#f8fafc'
    }
  })
};

// Add type for select change event
type SelectChangeEvent = {
  target: {
    value: string;
  };
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [formData, setFormData] = useState({
    phone: '',
    agents_version: 'DeepSeek-Coding',
    timezone: 'America/New_York',
    text_message_time: '09:00'
  });
  const [timeValue, setTimeValue] = useState<DateValue | null>(() => {
    try {
      return today(getLocalTimeZone());
    } catch {
      return null;
    }
  });
  const [timezoneOptions, setTimezoneOptions] = useState<TimezoneOption[]>([]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
      fetchTimezones();
    }
  }, [session]);

  useEffect(() => {
    if (profile?.text_message_time) {
      try {
        setTimeValue(today(getLocalTimeZone()));
      } catch {
        setTimeValue(null);
      }
    }
  }, [profile]);

  const fetchTimezones = async () => {
    try {
      const response = await fetch('/api/timezones');
      const data = await response.json();
      if (response.ok) {
        setTimezones(data.timezones);
        // Create options for react-select with timezone names only
        const options = data.timezones.map((tz: Timezone) => ({
          value: tz.value,
          label: tz.label.split(' (')[0]  // Remove UTC offset from label
        }));
        setTimezoneOptions(options);
      }
    } catch (error) {
      console.error('Error fetching timezones:', error);
      toast.error('Failed to load timezones');
    }
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();
      if (response.ok) {
        setProfile(data.user);
        setFormData({
          phone: data.user.phone || '',
          agents_version: data.user.agents_version || 'DeepSeek-Coding',
          timezone: data.user.timezone || 'America/New_York',
          text_message_time: data.user.text_message_time || '09:00'
        });

        
        // Set the profile image directly from the user table
        setProfileImage(
          data.user.image
            ? `${SUPABASE_BUCKET_URL}${USER_IMAGES_BUCKET}/${data.user.image}`
            : DEFAULT_USER_IMAGE
        );

        // Fetch user images
        if (data.user.id) {
          await fetchUserImages(data.user.id);
        }
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
      const response = await fetch(`/api/user/images?userId=${userId}`);
      const data = await response.json();
      if (response.ok && data.images.length > 0) {
        setUserImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching user images:', error);
    }
  };

  const handleUpdateProfile = async (imageUrl: string) => {
    try {
      // Update local state immediately
      setProfileImage(imageUrl);
      
      // Update profile state with the new image
      if (profile) {
        setProfile({
          ...profile,
          image: imageUrl.split('/user_images/')[1]
        });
      }
      
      // No need to fetch the entire profile again
      // Just update the user images list if needed
      if (profile?.id) {
        await fetchUserImages(profile.id);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Error updating profile picture');
      // Revert profile image if there was an error
      if (profile?.image) {
        const currentImageUrl = `${SUPABASE_BUCKET_URL}${USER_IMAGES_BUCKET}/${profile.image}`;
        setProfileImage(currentImageUrl);
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
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state immediately
        if (data.url) {
          setProfileImage(data.url);
          if (profile) {
            setProfile({
              ...profile,
              image: data.url.split('/user_images/')[1]
            });
          }
          // Update user images list
          if (profile?.id) {
            await fetchUserImages(profile.id);
          }
        }
        toast.success('Image uploaded successfully');
      } else {
        toast.error(data.error || 'Failed to upload image');
        if (data.details) {
          console.error('Upload error details:', data.details);
        }
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
    try {
      // Default time if timeValue is null
      const timeString = timeValue 
        ? dayjs(new Date(timeValue.toString())).format('HH:mm')
        : formData.text_message_time;
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          text_message_time: timeString
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast.success('Profile updated successfully');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleTimezoneChange = (option: TimezoneOption | null) => {
    if (option) {
      setFormData({ ...formData, timezone: option.value });
    }
  };

  const onTimeChange = (newTime: dayjs.Dayjs | null) => {
    if (!newTime) return;
    
    const timeString = newTime.format('HH:mm');
    try {
      setTimeValue(today(getLocalTimeZone()));
    } catch {
      setTimeValue(null);
    }
    setFormData(prev => ({
      ...prev,
      text_message_time: timeString
    }));
  };

  if (!session) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl">Please Log In to view your profile</p>
      </div>
    );
  }

  if (isLoading || !profile || profileImage === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb pageTitle="Profile" />
      <section className="relative z-10 overflow-hidden pt-[80px] pb-16 md:pt-[100px] md:pb-[120px] xl:pt-[120px] xl:pb-[160px] 2xl:pt-[50px] 2xl:pb-[200px]">
        <div className="container">
          <div className="wow fadeInUp" data-wow-delay=".1s">
            <div className="backdrop-blur-sm bg-[url(/images/cta/grid.svg)] rounded-lg relative z-10 overflow-hidden border-2 border-gray-300/20 dark:border-gray-600/20 shadow-lg p-8 sm:p-12 lg:px-8 xl:p-12"
              style={{
                transform: 'perspective(1000px) rotateX(2deg)',
                boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.1), inset 8px 8px 16px rgba(255,255,255,0.1), 0 4px 24px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="flex flex-col items-center text-center">
                    <h1 className="text-4xl font-bold text-black dark:text-white mb-8">
                      {profile.first_name && profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : 'User'}
                    </h1>
                    <div className="relative mb-4">
                      <Avatar
                        src={profileImage}
                        alt={profile.first_name || 'User'}
                        size="lg"
                        className="h-48 w-48"
                      />
                    </div>
                    <label 
                      htmlFor="profile-image" 
                      className="hero-button-gradient rounded-lg px-6 py-3 light:text-white dark:text-white inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity mt-4"
                    >
                      <Upload className="w-4 h-4" />
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
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-bold text-black dark:text-white">Profile Information</h2>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="hero-button-gradient rounded-lg px-4 py-2 text-white inline-flex items-center gap-2 hover:opacity-80"
                      >
                        {isEditing ? (
                          <>
                            <X className="w-4 h-4 text-white" />
                            <span className="light:text-white dark:text-white">Cancel</span>
                          </>
                        ) : (
                          <>
                            <Edit2 className="w-4 h-4 text-white" />
                            <span className="light:text-white dark:text-white">Edit Profile</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isEditing ? (
                      <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                          <div className="space-y-6">
                            <Input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              label="Phone"
                              placeholder="+1234567890"
                              className="w-full"
                            />
                          </div>

                          <div className="space-y-6">
                            <Select
                              value={formData.agents_version}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                                setFormData({ ...formData, agents_version: e.target.value })}
                              label="agents Version"
                            >
                              {agents_VERSIONS.map((version) => (
                                <option key={version.id} value={version.id}>
                                  {version.name}
                                </option>
                              ))}
                            </Select>
                            <Select
                              value={formData.timezone}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                                setFormData({ ...formData, timezone: e.target.value })}
                              label="Timezone"
                            >
                              {timezoneOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                            <div className="mb-4.5">
                              <label className="mb-2.5 block text-black dark:text-white">
                                Daily Text Message Time <span className="text-meta-1">*</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="w-[150px]">
                                  <TimeInput
                                    value={new Time(
                                      parseInt(formData.text_message_time.split(':')[0]),
                                      parseInt(formData.text_message_time.split(':')[1])
                                    )}
                                    variant="bordered"
                                    size="md"
                                    radius="md"
                                    hourCycle={24}
                                    granularity="minute"
                                    labelPlacement="outside"
                                    onChange={(value: Time | null) => {
                                      if (value) {
                                        const timeString = `${value.hour.toString().padStart(2, '0')}:${value.minute.toString().padStart(2, '0')}`;
                                        setFormData(prev => ({
                                          ...prev,
                                          text_message_time: timeString
                                        }));
                                      }
                                    }}
                                    classNames={{
                                      base: "w-full",
                                      input: "bg-transparent backdrop-blur-sm bg-[url(/images/cta/grid.svg)] border-2 border-gray-300/20 dark:border-gray-600/20 rounded-lg p-4",
                                      innerWrapper: "shadow-inner"
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  ({formData.timezone})
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Choose when you'd like to receive your daily text messages.
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="mt-6"
                          color="primary"
                        >
                          Save Changes
                        </Button>
                      </form>
                    ) : (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div className="space-y-6">
                          <div>
                            <p className="text-body-color dark:text-gray-400">Email</p>
                            <p className="text-black dark:text-white font-medium">{profile?.email}</p>
                          </div>
                          <div>
                            <p className="text-body-color dark:text-gray-400">Phone</p>
                            <p className="text-black dark:text-white font-medium">{profile?.phone || 'Not set'}</p>
                          </div>
                          <div>
                            <p className="text-body-color dark:text-gray-400">Account Type</p>
                            <p className="text-black dark:text-white font-medium">{profile?.role}</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div>
                            <p className="text-body-color dark:text-gray-400">agents Version</p>
                            <p className="text-black dark:text-white font-medium">
                              {agents_VERSIONS.find(v => v.id === profile?.agents_version)?.name || 'King James Version'}
                            </p>
                          </div>
                          <div>
                            <p className="text-body-color dark:text-gray-400">Time Zone</p>
                            <p className="text-black dark:text-white font-medium">
                              {timezones.find(tz => tz.value === profile?.timezone)?.label.split(' (')[0] || 'America/New_York'}
                            </p>
                          </div>
                          <div>
                            <p className="text-body-color dark:text-gray-400">Daily Message Time</p>
                            <p className="text-black dark:text-white font-medium">
                              {profile?.text_message_time || '09:00'}
                            </p>
                          </div>
                          <div>
                            <p className="text-body-color dark:text-gray-400">Member Since</p>
                            <p className="text-black dark:text-white font-medium">
                              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Not available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {userImages.length > 0 && (
                  <div className="relative mt-12 pt-8 border-t border-gray-300/20 dark:border-gray-600/20">
                    <h3 className="text-xl font-semibold text-black dark:text-white mb-6 text-center">Your Gallery</h3>
                    <ImageGallery 
                      images={userImages.map(img => ({
                        id: img.url,
                        file_url: img.url,
                        filename: img.url.split('/').pop() || 'image'
                      }))}
                      onUpdateProfile={handleUpdateProfile}
                      currentProfileImage={profileImage}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
} 

function fetchUserData() {
  throw new Error('Function not implemented.');
}