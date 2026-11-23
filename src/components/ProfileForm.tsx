'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { appApiUrl } from '@/lib/journal';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(appApiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-black shadow-lg dark:border-white/10 dark:bg-dark-6 dark:text-white">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="flex flex-col items-center text-center">
          <h2 className="mb-4 text-2xl font-bold">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : 'Journal account'}
          </h2>
          <label
            htmlFor="profile-image"
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-white hover:opacity-80 dark:bg-white/15"
          >
            <Upload className="h-4 w-4" />
            Upload New Image
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">First name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white/70 p-4 text-black focus:outline-none dark:border-white/10 dark:bg-dark-7/70 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Last name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white/70 p-4 text-black focus:outline-none dark:border-white/10 dark:bg-dark-7/70 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white/70 p-4 text-black focus:outline-none dark:border-white/10 dark:bg-dark-7/70 dark:text-white"
              placeholder="3475550100"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-gray-900 px-8 py-4 font-medium text-white transition duration-300 hover:opacity-80 dark:bg-white/15"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
