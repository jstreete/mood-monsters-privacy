import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, MoodLog } from '../types';

WebBrowser.maybeCompleteAuthSession();

const SETTINGS_KEY = '@mood_monsters_settings';
const LOGS_KEY = '@mood_monsters_logs';
const BACKUP_FILE_NAME = 'mood_monsters_backup.json';

// PLACEHOLDERS for User to fill in
const GOOGLE_CLIENT_ID_IOS = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_ANDROID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_WEB = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

export interface BackupData {
    settings: UserSettings;
    logs: MoodLog[];
    timestamp: string;
}

export const useGoogleBackup = () => {
    /*
     * IMPORTANT: Google OAuth will NOT work in Expo Go!
     * 
     * Expo Go has limitations with custom URI schemes, which causes a 400 error
     * from Google because it cannot redirect back to the app properly.
     * 
     * To make this work, you MUST:
     * 1. Create a "Development Build" using: npx expo run:ios (or :android)
     * 2. Set up OAuth credentials in Google Cloud Console:
     *    - Create an iOS OAuth client with your Bundle ID
     *    - Create an Android OAuth client with your Package Name + SHA-1
     * 3. Replace the placeholder Client IDs below with your real ones.
     * 4. Enable the Google Drive API in your Google Cloud project.
     */

    const redirectUri = AuthSession.makeRedirectUri({
        native: 'moodmonsters://oauth',
    });

    // Log this URI - you'll need to add it to Google Cloud Console
    console.log('[Backup] Redirect URI for Google Cloud Console:', redirectUri);

    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId: GOOGLE_CLIENT_ID_IOS,
        androidClientId: GOOGLE_CLIENT_ID_ANDROID,
        webClientId: GOOGLE_CLIENT_ID_WEB,
        scopes: ['https://www.googleapis.com/auth/drive.appdata'],
        redirectUri: redirectUri,
    });

    const getAccessToken = async () => {
        // If we already have a successful response, use it
        if (response?.type === 'success') {
            return response.authentication?.accessToken;
        }

        // Otherwise, prompt
        const result = await promptAsync();
        if (result.type === 'success') {
            return result.authentication?.accessToken;
        }

        if (result.type === 'error' || result.type === 'cancel') {
            throw new Error('Authentication was cancelled or failed.');
        }

        throw new Error('Authentication failed');
    };

    const performBackup = async () => {
        try {
            const token = await getAccessToken();
            if (!token) return;

            // 1. Collect Data
            const settingsStr = await AsyncStorage.getItem(SETTINGS_KEY);
            const logsStr = await AsyncStorage.getItem(LOGS_KEY);

            const backupData: BackupData = {
                settings: settingsStr ? JSON.parse(settingsStr) : {},
                logs: logsStr ? JSON.parse(logsStr) : [],
                timestamp: new Date().toISOString(),
            };

            // 2. Find existing backup file
            const listResponse = await fetch(
                'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + encodeURIComponent(`name = '${BACKUP_FILE_NAME}'`),
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const listData = await listResponse.json();
            const existingFile = listData.files?.[0];

            // 3. Upload/Update
            const metadata = {
                name: BACKUP_FILE_NAME,
                parents: ['appDataFolder'],
            };

            if (existingFile) {
                // Update existing simple media upload
                await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(backupData),
                });
            } else {
                // Create new via multipart upload (RN-compatible string body)
                const boundary = 'mood_monsters_boundary';
                const delimiter = `\r\n--${boundary}\r\n`;
                const close_delim = `\r\n--${boundary}--`;

                const body =
                    delimiter +
                    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(backupData) +
                    close_delim;

                const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': `multipart/related; boundary=${boundary}`,
                        'Content-Length': body.length.toString(),
                    },
                    body: body,
                });

                if (!uploadResponse.ok) {
                    const errorMsg = await uploadResponse.text();
                    throw new Error(`Upload failed: ${errorMsg}`);
                }
            }

            return true;
        } catch (error) {
            console.error('Backup Error:', error);
            throw error;
        }
    };

    const performRestore = async () => {
        try {
            const token = await getAccessToken();
            if (!token) return;

            // 1. Find the backup file
            const listResponse = await fetch(
                'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + encodeURIComponent(`name = '${BACKUP_FILE_NAME}'`),
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const listData = await listResponse.json();
            const file = listData.files?.[0];

            if (!file) {
                throw new Error('No backup found on Google Drive');
            }

            // 2. Download the file
            const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const backupData: BackupData = await downloadResponse.json();

            // 3. Update AsyncStorage
            if (backupData.settings) {
                await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(backupData.settings));
            }
            if (backupData.logs) {
                await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(backupData.logs));
            }

            return true;
        } catch (error) {
            console.error('Restore Error:', error);
            throw error;
        }
    };

    return {
        performBackup,
        performRestore,
        isReady: !!request,
    };
};
