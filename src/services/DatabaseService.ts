import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { Incident, BehaviorType, Trigger, Resolution, Profile } from '../types';

const db = SQLite.openDatabaseSync('moodmonsters.db');

export const initDatabase = async () => {
    try {
        await db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        theme TEXT DEFAULT 'system',
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        intensity INTEGER,
        duration INTEGER,
        note TEXT,
        location TEXT,
        hunger INTEGER,
        screen_time_before TEXT,
        sleep_quality INTEGER,
        FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS incident_behaviors (
        incident_id TEXT NOT NULL,
        behavior TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS incident_triggers (
        incident_id TEXT NOT NULL,
        trigger TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS incident_resolutions (
        incident_id TEXT NOT NULL,
        resolution TEXT NOT NULL,
        FOREIGN KEY (incident_id) REFERENCES incidents (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS warnings (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        did_escalate INTEGER,
        note TEXT,
        FOREIGN KEY (profile_id) REFERENCES profiles (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS warning_tags (
        warning_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        FOREIGN KEY (warning_id) REFERENCES warnings (id) ON DELETE CASCADE
      );
    `);

        // Create default profile if none exists
        const result = await db.getAllAsync('SELECT * FROM profiles');
        if (result.length === 0) {
            const defaultId = uuidv4();
            await db.runAsync(
                'INSERT INTO profiles (id, name, created_at) VALUES (?, ?, ?)',
                [defaultId, 'Child 1', Date.now()]
            );
            console.log('Default profile created:', defaultId);
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
};

export const getDB = () => db;

// --- PROFILES ---

export const getProfiles = async (): Promise<Profile[]> => {
    try {
        const result = await db.getAllAsync('SELECT * FROM profiles ORDER BY created_at ASC');
        return result as Profile[];
    } catch (e) {
        console.error('Error fetching profiles:', e);
        return [];
    }
};

export const createProfile = async (name: string, theme: 'light' | 'dark' | 'system' = 'system'): Promise<Profile> => {
    const newProfile: Profile = {
        id: uuidv4(),
        name,
        theme,
        createdAt: Date.now(),
    };
    await db.runAsync(
        'INSERT INTO profiles (id, name, theme, created_at) VALUES (?, ?, ?, ?)',
        [newProfile.id, newProfile.name, newProfile.theme, newProfile.createdAt]
    );
    return newProfile;
};

export const updateProfile = async (id: string, name: string): Promise<void> => {
    try {
        await db.runAsync('UPDATE profiles SET name = ? WHERE id = ?', [name, id]);
    } catch (e) {
        console.error('Error updating profile:', e);
        throw e;
    }
};

// --- INCIDENTS ---

export const getIncidents = async (profileId: string): Promise<Incident[]> => {
    try {
        const incidents = await db.getAllAsync('SELECT * FROM incidents WHERE profile_id = ? ORDER BY timestamp DESC', [profileId]) as any[];

        // Fetch related data for each incident
        // Note: For large datasets, a JOIN might be better, but loop is simpler for now given SQLite concurrency limits in Expo
        const fullIncidents: Incident[] = [];

        for (const inc of incidents) {
            const behaviors = await db.getAllAsync('SELECT behavior FROM incident_behaviors WHERE incident_id = ?', [inc.id]);
            const triggers = await db.getAllAsync('SELECT trigger FROM incident_triggers WHERE incident_id = ?', [inc.id]);
            const resolutions = await db.getAllAsync('SELECT resolution FROM incident_resolutions WHERE incident_id = ?', [inc.id]);

            fullIncidents.push({
                ...inc,
                behaviors: behaviors.map((b: any) => b.behavior),
                triggers: triggers.map((t: any) => t.trigger),
                resolutions: resolutions.map((r: any) => r.resolution),
            });
        }
        return fullIncidents;
    } catch (e) {
        console.error('Error fetching incidents:', e);
        return [];
    }
};

export const addIncident = async (incident: Incident) => {
    try {
        await db.withTransactionAsync(async () => {
            await db.runAsync(
                `INSERT INTO incidents (id, profile_id, timestamp, intensity, duration, note, location, hunger, screen_time_before, sleep_quality)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    incident.id,
                    incident.profileId,
                    incident.timestamp,
                    incident.intensity,
                    incident.duration || null,
                    incident.note || null,
                    incident.location || null,
                    incident.hunger ? 1 : 0,
                    incident.screenTimeBefore || null,
                    incident.sleepQuality || null
                ]
            );

            for (const b of incident.behaviors) {
                await db.runAsync('INSERT INTO incident_behaviors (incident_id, behavior) VALUES (?, ?)', [incident.id, b]);
            }
            for (const t of incident.triggers) {
                await db.runAsync('INSERT INTO incident_triggers (incident_id, trigger) VALUES (?, ?)', [incident.id, t]);
            }
            for (const r of incident.resolutions) {
                await db.runAsync('INSERT INTO incident_resolutions (incident_id, resolution) VALUES (?, ?)', [incident.id, r]);
            }
        });
    } catch (e) {
        console.error('Error adding incident:', e);
        throw e;
    }
};

export const updateIncident = async (incident: Incident) => {
    try {
        await db.withTransactionAsync(async () => {
            await db.runAsync(
                `UPDATE incidents
                 SET profile_id = ?, timestamp = ?, intensity = ?, duration = ?, note = ?, location = ?, hunger = ?, screen_time_before = ?, sleep_quality = ?
                 WHERE id = ?`,
                [
                    incident.profileId,
                    incident.timestamp,
                    incident.intensity,
                    incident.duration || null,
                    incident.note || null,
                    incident.location || null,
                    incident.hunger ? 1 : 0,
                    incident.screenTimeBefore || null,
                    incident.sleepQuality || null,
                    incident.id
                ]
            );

            await db.runAsync('DELETE FROM incident_behaviors WHERE incident_id = ?', [incident.id]);
            for (const b of incident.behaviors) {
                await db.runAsync('INSERT INTO incident_behaviors (incident_id, behavior) VALUES (?, ?)', [incident.id, b]);
            }

            await db.runAsync('DELETE FROM incident_triggers WHERE incident_id = ?', [incident.id]);
            for (const t of incident.triggers) {
                await db.runAsync('INSERT INTO incident_triggers (incident_id, trigger) VALUES (?, ?)', [incident.id, t]);
            }

            await db.runAsync('DELETE FROM incident_resolutions WHERE incident_id = ?', [incident.id]);
            for (const r of incident.resolutions) {
                await db.runAsync('INSERT INTO incident_resolutions (incident_id, resolution) VALUES (?, ?)', [incident.id, r]);
            }
        });
    } catch (e) {
        console.error('Error updating incident:', e);
        throw e;
    }
};

export const deleteIncident = async (id: string) => {
    try {
        await db.runAsync('DELETE FROM incidents WHERE id = ?', [id]);
    } catch (e) {
        console.error('Error deleting incident:', e);
        throw e;
    }
};

// Helper to run migrations or reset DB
export const resetDatabase = async () => {
    await db.execAsync(`
        DROP TABLE IF EXISTS warning_tags;
        DROP TABLE IF EXISTS warnings;
        DROP TABLE IF EXISTS incident_resolutions;
        DROP TABLE IF EXISTS incident_triggers;
        DROP TABLE IF EXISTS incident_behaviors;
        DROP TABLE IF EXISTS incidents;
        DROP TABLE IF EXISTS profiles;
    `);
    await initDatabase();
};
