/**
 * Client-side API functions for settings and profile
 * Preferences are stored in localStorage
 * Profile is managed through the backend API
 */

import { auth } from './auth';
import { fetchFromBackend } from './api-client';

interface UserPreferences {
  theme: string;
  primaryColor: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

interface UpdatePreferencesData {
  theme?: string;
  primaryColor?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

interface Profile {
  id: number;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
}

interface UpdateProfileData {
  name?: string;
  lastName?: string;
  avatar?: string;
}

const PREFERENCES_STORAGE_KEY = 'user_preferences';
const PROFILE_STORAGE_KEY = 'user_profile';

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  primaryColor: 'blue',
  emailNotifications: true,
  pushNotifications: false,
};

/**
 * Get user preferences from localStorage
 */
function getPreferencesFromStorage(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.error('Error reading preferences from storage:', error);
  }

  return DEFAULT_PREFERENCES;
}

/**
 * Save user preferences to localStorage
 */
function savePreferencesToStorage(preferences: UserPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences to storage:', error);
    throw new Error('Failed to save preferences');
  }
}

/**
 * Get user profile from localStorage (user_data from auth)
 */
function getProfileFromStorage(): Profile | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const user = auth.getUser();
    if (!user) {
      return null;
    }

    // Check if there's a stored profile with additional fields
    const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    let profileData: Partial<Profile> = {};
    
    if (storedProfile) {
      try {
        profileData = JSON.parse(storedProfile);
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Merge auth user data with stored profile data
    return {
      id: user.id,
      name: profileData.name ?? user.name ?? '',
      lastName: profileData.lastName ?? user.lastName ?? '',
      email: user.email ?? '',
      phone: profileData.phone,
      avatar: profileData.avatar,
      role: (user as any).role || 'USER',
    } as Profile;
  } catch (error) {
    console.error('Error reading profile from storage:', error);
    return null;
  }
}


export const settingsApi = {
  // Preferences
  async getPreferences(): Promise<UserPreferences> {
    return getPreferencesFromStorage();
  },

  async updatePreferences(data: UpdatePreferencesData): Promise<UserPreferences> {
    const current = getPreferencesFromStorage();
    const updated: UserPreferences = {
      ...current,
      ...data,
    };
    savePreferencesToStorage(updated);
    return updated;
  },

  // Profile - get from localStorage, update to backend
  async getProfile(): Promise<Profile> {
    const localProfile = getProfileFromStorage();
    const profile = await fetchFromBackend('/auth/profile').catch(() => null);
    if (profile) {
      // keep storage in sync for faster subsequent loads
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          PROFILE_STORAGE_KEY,
          JSON.stringify({
            name: profile.name,
            lastName: profile.lastName,
            avatar: profile.avatar,
            phone: profile.phone,
          }),
        );
        const currentUser = auth.getUser();
        if (currentUser) {
          localStorage.setItem(
            'user_data',
            JSON.stringify({
              ...currentUser,
              name: profile.name,
              lastName: profile.lastName,
              avatar: profile.avatar,
            }),
          );
        }
      }
      return profile as Profile;
    }
    if (!localProfile) {
      throw new Error('User not authenticated');
    }
    return localProfile;
  },

  async updateProfile(data: UpdateProfileData): Promise<Profile> {
    try {
      // Get current profile
      const currentProfile = getProfileFromStorage();
      if (!currentProfile) {
        throw new Error('User not authenticated');
      }

      // Send update to backend - only send fields that can be updated
      const updatePayload: any = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
      if (data.avatar !== undefined) updatePayload.avatar = data.avatar;
      
      // Update in backend
      const updatedProfile = await fetchFromBackend('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updatePayload),
      }) as Profile;

      // Save to profile storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({
          name: updatedProfile.name ?? data.name,
          lastName: updatedProfile.lastName ?? data.lastName,
          avatar: updatedProfile.avatar ?? data.avatar,
          phone: updatedProfile.phone,
        }));

        // Also update user_data to keep it in sync
        const currentUser = auth.getUser();
        if (currentUser) {
          const updatedUserData = {
            ...currentUser,
            name: updatedProfile.name ?? data.name,
            lastName: updatedProfile.lastName ?? data.lastName,
            avatar: updatedProfile.avatar ?? data.avatar,
          };
          localStorage.setItem('user_data', JSON.stringify(updatedUserData));
        }
        window.dispatchEvent(new Event('user-profile-updated'));
      }

      return updatedProfile;
    } catch (error: any) {
      console.error('Error updating profile in backend:', error);
      throw error;
    }
  },

  // Security - verify the current password (step gate, does not change anything)
  async verifyCurrentPassword(data: {
    password: string;
  }): Promise<{ valid: boolean }> {
    return fetchFromBackend('/auth/verify-password', {
      method: 'PATCH',
      body: JSON.stringify({ password: data.password }),
    }) as Promise<{ valid: boolean }>;
  },

  // Security - change the authenticated user's password
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return fetchFromBackend('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    }) as Promise<{ message: string }>;
  },

};
