import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Incident } from '../types';
import {
    getIncidents as dbGetIncidents,
    addIncident as dbAddIncident,
    updateIncident as dbUpdateIncident,
    deleteIncident as dbDeleteIncident,
    getProfiles // check default profile
} from '../services/DatabaseService';
import { useProfile } from './ProfileContext';

interface IncidentContextType {
    incidents: Incident[];
    addIncident: (incident: Incident) => Promise<void>;
    deleteIncident: (id: string) => Promise<void>;
    updateIncident: (incident: Incident) => Promise<void>;
    loading: boolean;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentProfile, isLoading: isProfileLoading } = useProfile();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isProfileLoading && currentProfile) {
            loadIncidents();
        }
    }, [currentProfile, isProfileLoading]);

    const loadIncidents = async () => {
        if (!currentProfile) return;
        setLoading(true);
        try {
            // Check for legacy migration
            // We only migrate if:
            // 1. We have a valid profile (currentProfile)
            // 2. The DB for this profile is empty (to avoid dupes or accidental overwrites)
            // 3. We find legacy data in AsyncStorage

            const dbIncidents = await dbGetIncidents(currentProfile.id);

            if (dbIncidents.length === 0) {
                const legacy = await AsyncStorage.getItem('incidents');
                if (legacy) {
                    const parsed = JSON.parse(legacy);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log('Migrating legacy incidents for profile:', currentProfile.name);
                        const migrated: Incident[] = [];

                        for (const inc of parsed) {
                            const newInc: Incident = {
                                id: inc.id,
                                profileId: currentProfile.id,
                                timestamp: inc.timestamp,
                                intensity: inc.intensity || 3,
                                behaviors: typeof inc.behavior === 'string' ? [inc.behavior] : [],
                                triggers: Array.isArray(inc.triggers) ? inc.triggers : [],
                                resolutions: Array.isArray(inc.resolutions) ? inc.resolutions : [],
                                note: inc.note,
                                // Defaults for new fields
                                duration: undefined,
                                location: undefined,
                                hunger: undefined,
                                screenTimeBefore: undefined,
                                sleepQuality: undefined
                            };
                            await dbAddIncident(newInc);
                            migrated.unshift(newInc); // Add to local state (newest first)
                        }
                        // Clear legacy data after successful migration
                        await AsyncStorage.removeItem('incidents');
                        setIncidents(migrated);
                        console.log('Migration complete');
                        setLoading(false);
                        return;
                    }
                }
            }

            setIncidents(dbIncidents);

        } catch (e) {
            console.error('Failed to load incidents', e);
        } finally {
            setLoading(false);
        }
    };

    const addIncident = async (incident: Incident) => {
        if (!currentProfile) return;

        // Ensure profileId matches current profile
        const incidentWithProfile = { ...incident, profileId: currentProfile.id };

        // Optimistic update
        setIncidents(prev => [incidentWithProfile, ...prev].sort((a, b) => b.timestamp - a.timestamp));

        try {
            await dbAddIncident(incidentWithProfile);
            // Reload to ensure consistency? Not strictly necessary if optimistic update is correct
        } catch (e) {
            console.error('Failed to save incident', e);
            // Revert on failure?
            loadIncidents();
        }
    };

    const deleteIncident = async (id: string) => {
        setIncidents(prev => prev.filter(i => i.id !== id));
        try {
            await dbDeleteIncident(id);
        } catch (e) {
            console.error('Failed to delete incident', e);
            loadIncidents();
        }
    };

    const updateIncident = async (updated: Incident) => {
        setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i).sort((a, b) => b.timestamp - a.timestamp));
        try {
            await dbUpdateIncident(updated);
        } catch (e) {
            console.error('Failed to update incident', e);
            loadIncidents();
        }
    };

    return (
        <IncidentContext.Provider value={{ incidents, addIncident, deleteIncident, updateIncident, loading: loading || isProfileLoading }}>
            {children}
        </IncidentContext.Provider>
    );
};

export const useIncidents = () => {
    const context = useContext(IncidentContext);
    if (!context) {
        throw new Error('useIncidents must be used within an IncidentProvider');
    }
    return context;
};
