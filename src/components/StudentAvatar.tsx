import React, { useState, useEffect } from 'react';
import {
  getStudentPhotoUrl,
  getStudentDirectPhotoUrl,
  getStudentInitials,
  getAvatarGradient
} from '../utils/studentPhotoUtils';

export interface StudentAvatarProps {
  rollNo?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  rounded?: string;
  border?: boolean;
  borderColor?: string;
  showBadge?: boolean;
  badgeContent?: React.ReactNode;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-xs font-semibold',
  lg: 'w-14 h-14 text-base font-bold',
  xl: 'w-20 h-20 text-xl font-bold',
  '2xl': 'w-28 h-28 text-3xl font-extrabold'
};

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  rollNo,
  name,
  avatarUrl,
  size = 'md',
  className = '',
  rounded = 'rounded-full',
  border = true,
  borderColor = 'border-slate-800',
  showBadge = false,
  badgeContent = null
}) => {
  const initialUrl = avatarUrl || getStudentPhotoUrl(rollNo);
  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [attemptIndex, setAttemptIndex] = useState<number>(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset state when rollNo or avatarUrl prop changes
  useEffect(() => {
    const freshUrl = avatarUrl || getStudentPhotoUrl(rollNo);
    setCurrentSrc(freshUrl);
    setAttemptIndex(0);
    setHasError(!freshUrl);
    setIsLoaded(false);
  }, [avatarUrl, rollNo]);

  const handleImageError = () => {
    if (attemptIndex === 0) {
      // First attempt (local proxy) failed, switch to direct university URL
      const directUrl = getStudentDirectPhotoUrl(rollNo);
      if (directUrl && directUrl !== currentSrc) {
        setAttemptIndex(1);
        setCurrentSrc(directUrl);
        return;
      }
    }
    // All photo attempts failed or candidate has no picture on university portal
    setHasError(true);
  };

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const initials = getStudentInitials(name, rollNo);
  const gradient = getAvatarGradient(rollNo || name || '');
  const borderClass = border ? `border ${borderColor}` : '';

  return (
    <div className={`relative inline-flex shrink-0 ${sizeClass} ${className}`}>
      {currentSrc && !hasError ? (
        <>
          {/* Fallback visible while loading */}
          {!isLoaded && (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${gradient} ${rounded} ${borderClass} flex items-center justify-center font-mono select-none`}
            >
              <span>{initials}</span>
            </div>
          )}
          <img
            src={currentSrc}
            alt={name ? `${name}'s photo` : (rollNo || 'Student')}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover object-top ${rounded} ${borderClass} transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </>
      ) : (
        /* Fallback Initials Card */
        <div
          className={`w-full h-full bg-gradient-to-br ${gradient} ${rounded} ${borderClass} flex items-center justify-center font-mono select-none shadow-inner`}
          title={name ? `${name} (${rollNo || ''})` : (rollNo || 'Student')}
        >
          <span>{initials}</span>
        </div>
      )}

      {showBadge && (
        <div className="absolute -bottom-0.5 -right-0.5">
          {badgeContent || (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 block" />
          )}
        </div>
      )}
    </div>
  );
};
