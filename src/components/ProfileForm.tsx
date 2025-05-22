// src/components/ProfileForm.tsx

'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { agents_VERSIONS } from '@/app/(site)/account/profile/page';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  agents_version?: string;
}

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    phone: user.phone || '',
    agents_version: user.agents_version || 'DeepSeek-Coding'
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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
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
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    }
  };

  return (
    <div className="backdrop-blur-sm bg-white/10 dark:bg-dark/10 rounded-lg border border-white/20 dark:border-white/10 shadow-lg p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold mb-4">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : 'User Profile'}
          </h2>
          <label 
            htmlFor="profile-image" 
            className="hero-button-gradient rounded-lg px-6 py-3 text-white inline-flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity mt-4"
          >
            <Upload className="w-4 h-4" />
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
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full rounded-lg bg-white/5 dark:bg-dark/5 border border-white/10 dark:border-white/10 p-4 focus:border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/20"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">agents Version</label>
            <select
              value={formData.agents_version}
              onChange={(e) => setFormData({ ...formData, agents_version: e.target.value })}
              className="w-full rounded-lg bg-white/5 dark:bg-dark/5 border border-white/10 dark:border-white/10 p-4 focus:border-primary/20 focus:outline-none focus:ring-1 focus:ring-primary/20"
            >
              {agents_VERSIONS.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="hero-button-gradient px-8 py-4 rounded-lg text-white font-medium hover:opacity-80 transition duration-300"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
} 