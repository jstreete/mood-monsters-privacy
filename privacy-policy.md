# Mood Monsters Privacy Policy

**Last updated:** November 10, 2026

## What data is stored

Mood Monsters stores the following data **locally on your device** (SQLite database and AsyncStorage):

- Child profile names and theme preference
- Incident logs: behaviors, triggers, interventions, outcomes, intensity, duration, location, present people, notes, timestamps
- Daily check-ins: sleep quality, medication status, notes
- Custom tags created per child
- App settings and preferences (theme, haptics, onboarding status, premium status)

## Where data is stored

All of the above data is stored **on your device only**. There is no remote server, user account, or cloud database operated by Mood Monsters.

## What leaves the device and when

- **Export reports (CSV/PDF):** Only when you tap Export/Share. The file is generated locally and shared via the iOS share sheet. You choose the destination.
- **Google Drive backup:** Only if you use the Backup & Restore feature. A JSON backup is uploaded to **your own** Google Drive `appDataFolder` using OAuth. This requires you to sign in and authorize access. [TODO: verify] Whether this feature is fully wired in the current build.
- **In-App Purchases:** Subscription purchases are processed by Apple and RevenueCat. Mood Monsters does not receive or store payment card details.

## What is never collected

- No analytics or usage tracking
- No advertising identifiers
- No crash reporting SDK is currently integrated
- No location/GPS data (location is a free-text field you type)
- No audio is recorded (voice notes are not implemented; the iOS keyboard dictation mic is handled by the system)

## Third-party SDKs

| SDK | Purpose | Data it may collect |
|---|---|---|
| react-native-purchases (RevenueCat) | Subscription management | Purchase history, anonymous user ID, device info |
| expo-sqlite, expo-file-system, expo-sharing, expo-print | Local storage and file sharing | None transmitted; local only |
| @react-native-async-storage | Local settings storage | None transmitted; local only |
| Google OAuth / Drive API (optional) | User-initiated backup | Google account info, backup file contents (stored in your Drive) |

[TODO: verify] Whether any additional Expo telemetry is enabled in production builds.

## Children's data

Mood Monsters is used by parents to log information about their children. All such data remains on the device unless the parent explicitly exports or backs it up. We do not collect or have access to children's data.

## Contact

Questions about this policy: streetewearz@gmail.com
