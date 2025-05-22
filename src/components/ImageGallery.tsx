// src/components/ImageGallery.tsx

import React from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_USER_IMAGE } from '@/lib/constants';

interface ImageGalleryProps {
  images: {
    id: string;
    file_url: string;
    filename: string;
  }[];
  onUpdateProfile?: (imageUrl: string) => Promise<void>;
  currentProfileImage?: string;
}

export default function ImageGallery({ images, onUpdateProfile, currentProfileImage }: ImageGalleryProps) {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Include current profile image in the gallery if it's not already there
  const allImages = React.useMemo(() => {
    if (!currentProfileImage || currentProfileImage === DEFAULT_USER_IMAGE || 
        images.some(img => img.file_url === currentProfileImage)) {
      return images;
    }
    return [
      {
        id: 'current-profile',
        file_url: currentProfileImage,
        filename: currentProfileImage.split('/').pop() || 'profile'
      },
      ...images
    ];
  }, [images, currentProfileImage]);

  const handleUpdateProfile = async (imageUrl: string) => {
    if (!session?.user?.email) {
      toast.error('You must be logged in to update your profile picture');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Extract the relative path from the URL
      const relativePath = imageUrl.split('/user_images/')[1];
      
      // Update the user's profile in the database
      const updateResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: relativePath
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update profile picture');
      }

      // Notify the parent component with the full URL
      await onUpdateProfile?.(imageUrl);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setIsUpdating(false);
    }
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length);
  };

  const previousImage = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  // Get the indices for the visible images
  const getVisibleIndices = () => {
    const totalImages = allImages.length;
    if (totalImages <= 5) return Array.from({ length: totalImages }, (_, i) => i);
    
    const indices = [];
    for (let i = 0; i < 5; i++) {
      indices.push((currentIndex + i) % totalImages);
    }
    return indices;
  };

  const visibleIndices = getVisibleIndices();

  if (allImages.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      {/* Main large image */}
      <div className="relative aspect-[16/9] w-full max-w-3xl mx-auto bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden backdrop-blur-sm">
        <Image
          src={allImages[currentIndex].file_url}
          alt={allImages[currentIndex].filename}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <button
          onClick={() => handleUpdateProfile(allImages[currentIndex].file_url)}
          disabled={isUpdating}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-lg text-white border border-white/20 hover:bg-white/20 transition-colors"
        >
          {isUpdating ? 'Updating...' : 'Set as Profile Picture'}
        </button>
        
        {allImages.length > 1 && (
          <>
            <button
              onClick={previousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="flex justify-center gap-4">
          {visibleIndices.map((index) => (
            <button
              key={allImages[index].id}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-20 h-20 rounded-lg overflow-hidden ${
                index === currentIndex ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
              } transition-all`}
            >
              <Image
                src={allImages[index].file_url}
                alt={allImages[index].filename}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 