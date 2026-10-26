import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../types';
import { getProfiles, createProfile as dbCreateProfile, initDatabase } from '../services/DatabaseService';

interface ProfileContextType {
    currentProfile: Profile | null;
    profiles: Profile[];
    isLoading: boolean;
    switchProfile: (profileId: string) => void;
    addProfile: (name: string, theme?: 'light' | 'dark' | 'system') => Promise<void>;
    updateProfileName: (id: string, name: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const LAST_PROFILE_KEY = '@mood_monsters_last_profile_id';

    useEffect(() => {
        const init = async () => {
            await initDatabase(); // Ensure DB is ready including default profile
            await loadProfiles();
        };
        init();
    }, []);

    const loadProfiles = async () => {
        try {
            const loadedProfiles = await getProfiles();
            setProfiles(loadedProfiles);

            // Determine current profile
            const lastProfileId = await AsyncStorage.getItem(LAST_PROFILE_KEY);
            let active = loadedProfiles.find(p => p.id === lastProfileId);

            if (!active && loadedProfiles.length > 0) {
                active = loadedProfiles[0];
            }

            if (active) {
                setCurrentProfile(active);
                if (active.id !== lastProfileId) {
                    await AsyncStorage.setItem(LAST_PROFILE_KEY, active.id);
                }
            }
        } catch (e) {
            console.error('Failed to load profiles', e);
        } finally {
            setIsLoading(false);
        }
    };

    const switchProfile = async (profileId: string) => {
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
            setCurrentProfile(profile);
            await AsyncStorage.setItem(LAST_PROFILE_KEY, profile.id);
        }
    };

    const addProfile = async (name: string, theme: 'light' | 'dark' | 'system' = 'system') => {
        const newProfile = await dbCreateProfile(name, theme);
        await loadProfiles(); // Reload to update list
        // Optional: switch to new profile immediately?
        switchProfile(newProfile.id);
    };

    const updateProfileName = async (id: string, name: string) => {
        const { updateProfile: dbUpdateProfile } = require('../services/DatabaseService'); // Late import if needed or just use import
        // Actually imports are already there at top, just need to import the new function
        await require('../services/DatabaseService').updateProfile(id, name);
        await loadProfiles();
    };

    return (
        <ProfileContext.Provider value={{ currentProfile, profiles, isLoading, switchProfile, addProfile, updateProfileName }}>
            {children}
        </ProfileContext.Provider>
    );


};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
