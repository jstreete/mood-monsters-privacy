import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, CalmToolId } from '../types';

const defaultSettings: UserSettings = {
    userName: '',
    isPremium: false,
    theme: 'system',
    enableSound: true,
    hapticsEnabled: true,
    onboardingCompleted: false,
    customizations: {},
    favoriteCalmTools: ['breathing', 'timer'],
    favoriteTimerLengths: [5, 10, 15],
    timerTheme: 'blue',
    lastBackupTimestamp: undefined,
};

interface UserContextType {
    settings: UserSettings;
    updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
    togglePremium: () => Promise<void>;
    toggleFavoriteTool: (toolId: CalmToolId) => Promise<void>;
    saveTimerLengths: (lengths: number[]) => Promise<void>;
    setTimerTheme: (theme: 'blue' | 'sunset' | 'forest') => Promise<void>;
    recordBackupTimestamp: () => Promise<void>;
    clearSettings: () => Promise<void>;
    loadSettings: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const STORAGE_KEY = '@mood_monsters_settings';

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSettings({ ...defaultSettings, ...JSON.parse(stored) });
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const updateSettings = async (newSettings: Partial<UserSettings>) => {
        try {
            const updated = { ...settings, ...newSettings };
            setSettings(updated);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to update settings', e);
        }
    };

    const togglePremium = async () => {
        await updateSettings({ isPremium: !settings.isPremium });
    };

    const toggleFavoriteTool = async (toolId: CalmToolId) => {
        const current = settings.favoriteCalmTools || [];
        const isFav = current.includes(toolId);
        const updated = isFav ? current.filter(id => id !== toolId) : [...current, toolId];
        await updateSettings({ favoriteCalmTools: updated });
    };

    const saveTimerLengths = async (lengths: number[]) => {
        await updateSettings({ favoriteTimerLengths: lengths });
    };

    const setTimerTheme = async (theme: 'blue' | 'sunset' | 'forest') => {
        await updateSettings({ timerTheme: theme });
    };

    const recordBackupTimestamp = async () => {
        await updateSettings({ lastBackupTimestamp: Date.now() });
    };

    const clearSettings = async () => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setSettings(defaultSettings);
        } catch (e) {
            console.error('Failed to clear settings', e);
        }
    };

    return (
        <UserContext.Provider value={{
            settings,
            updateSettings,
            togglePremium,
            toggleFavoriteTool,
            saveTimerLengths,
            setTimerTheme,
            recordBackupTimestamp,
            clearSettings,
            loadSettings
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
