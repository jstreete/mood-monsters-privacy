import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useIncidents } from '../context/IncidentContext';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { useProfile } from '../context/ProfileContext';
import { PaywallModal } from './PaywallModal';
import { BackupImportModal } from '../components/BackupImportModal';
import { ExportModal } from '../components/ExportModal';
import { ChildDropdown } from '../components/ChildDropdown';

export const SettingsScreen = ({ navigation }: any) => {
    const { settings, updateSettings, togglePremium, clearSettings } = useUser();
    const { incidents } = useIncidents();
    const { currentProfile } = useProfile();
    const isDark = settings.theme === 'dark';

    const [paywallVisible, setPaywallVisible] = useState(false);
    const [backupVisible, setBackupVisible] = useState(false);
    const [exportModalVisible, setExportModalVisible] = useState(false);

    const bg = getColor('background', isDark);
    const cardBg = getColor('cardBackground', isDark);
    const textP = getColor('textPrimary', isDark);
    const textS = getColor('textSecondary', isDark);

    const isBackupOverdue =
        !settings.lastBackupTimestamp ||
        new Date(settings.lastBackupTimestamp) < subDays(new Date(), 30);

    const handleExport = async () => {
        const header = 'Timestamp,Behavior,Intensity,Triggers,Resolutions,Note\n';
        const rows = incidents.map(i => {
            return `${format(i.timestamp, 'yyyy-MM-dd HH:mm')},"${i.behaviors?.join('|') || ''}",${i.intensity},"${i.triggers.join('|')}","${i.resolutions.join('|')}","${i.note || ''}"`;
        }).join('\n');

        const csv = header + rows;

        try {
            await Share.share({
                message: csv,
                title: 'Pattern Tracker Export.csv'
            });
        } catch (error) {
            Alert.alert('Error', 'Could not share file.');
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear Data',
            'Are you sure? This will reset all app settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: clearSettings }
            ]
        );
    };

    const handleReplayOnboarding = async () => {
        await updateSettings({ onboardingCompleted: false });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.title, { color: textP }]}>Settings</Text>
                    <ChildDropdown compact />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Switcher */}
                <TouchableOpacity
                    style={[styles.profileCard, { backgroundColor: cardBg }]}
                    onPress={() => navigation.navigate('ProfileSelection')}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 18 }}>
                                {currentProfile?.name?.charAt(0).toUpperCase() || '?'}
                            </Text>
                        </View>
                        <View>
                            <Text style={[styles.profileName, { color: textP, fontSize: 16, fontWeight: 'bold' }]}>
                                {currentProfile?.name || 'No Profile'}
                            </Text>
                            <Text style={{ color: textS, fontSize: 12 }}>Switch Profile</Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={textS} />
                </TouchableOpacity>

                {/* Subscription Card */}
                <TouchableOpacity
                    onPress={() => setPaywallVisible(true)}
                    style={[styles.premiumCard, { backgroundColor: settings.isPremium ? COLORS.accent : COLORS.primary }]}
                    activeOpacity={0.85}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={styles.premiumTitle}>{settings.isPremium ? '✨ Mood Monsters Pro Active' : '👑 Upgrade to Mood Monsters Pro'}</Text>
                        <Text style={styles.premiumSub}>{settings.isPremium ? '7-Day Trial / Pro Access' : 'Unlimited tags, PDF reports, monthly & yearly views.'}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {/* Backup & Resource Library */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textS }]}>Data & Backups</Text>

                    <TouchableOpacity style={[styles.row, { backgroundColor: cardBg }]} onPress={() => setBackupVisible(true)}>
                        <View style={styles.rowLeft}>
                            <MaterialCommunityIcons name="cloud-upload-outline" size={24} color={COLORS.primary} />
                            <View>
                                <Text style={[styles.rowLabel, { color: textP }]}>Backup & Restore Wizard</Text>
                                {isBackupOverdue && (
                                    <Text style={{ color: COLORS.warning, fontSize: 11, fontWeight: '700' }}>
                                        ⚠️ Backup recommended (over 30 days)
                                    </Text>
                                )}
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={textS} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.row, { backgroundColor: cardBg }]} onPress={() => setExportModalVisible(true)}>
                        <View style={styles.rowLeft}>
                            <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.primary} />
                            <View>
                                <Text style={[styles.rowLabel, { color: textP }]}>Clinical & Data Reports</Text>
                                <Text style={{ color: textS, fontSize: 11, marginTop: 1 }}>
                                    IEP/Therapist PDF & Full CSV Export
                                </Text>
                            </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={textS} />
                    </TouchableOpacity>
                </View>

                {/* Resource Library & Preferences */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textS }]}>Parent Support & Help</Text>

                    <TouchableOpacity style={[styles.row, { backgroundColor: cardBg }]} onPress={() => navigation.navigate('ResourceLibrary')}>
                        <View style={styles.rowLeft}>
                            <MaterialCommunityIcons name="book-open-outline" size={24} color={COLORS.primary} />
                            <Text style={[styles.rowLabel, { color: textP }]}>Parent Resource Library</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={textS} />
                    </TouchableOpacity>

                    <View style={[styles.row, { backgroundColor: cardBg }]}>
                        <View style={styles.rowLeft}>
                            <MaterialCommunityIcons name="theme-light-dark" size={24} color={COLORS.primary} />
                            <Text style={[styles.rowLabel, { color: textP }]}>Dark Mode</Text>
                        </View>
                        <Switch
                            value={settings.theme === 'dark'}
                            onValueChange={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                        />
                    </View>

                    <TouchableOpacity style={[styles.row, { backgroundColor: cardBg }]} onPress={handleReplayOnboarding}>
                        <View style={styles.rowLeft}>
                            <MaterialCommunityIcons name="book-open-page-variant" size={24} color={COLORS.primary} />
                            <Text style={[styles.rowLabel, { color: textP }]}>Replay Parent Onboarding</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={textS} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity onPress={handleClearData} style={[styles.row, { backgroundColor: cardBg, justifyContent: 'center' }]}>
                        <Text style={{ color: COLORS.error, fontWeight: 'bold' }}>Reset App Settings</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.version, { color: textS }]}>Version 1.0.0 • Pattern Tracker</Text>
            </ScrollView>

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
            />

            <BackupImportModal
                visible={backupVisible}
                onClose={() => setBackupVisible(false)}
            />

            <ExportModal
                visible={exportModalVisible}
                onClose={() => setExportModalVisible(false)}
                incidents={incidents}
                childName={currentProfile?.name || 'Child'}
                isPremium={settings.isPremium}
                onUpgradePress={() => setPaywallVisible(true)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: SPACING.m, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    title: { fontSize: 24, fontWeight: 'bold' },
    content: { padding: SPACING.m },
    profileCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: SPACING.m, borderRadius: LAYOUT.borderRadius, marginBottom: SPACING.m,
    },
    profileName: { fontSize: 16 },
    premiumCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: SPACING.m, borderRadius: LAYOUT.borderRadius, marginBottom: SPACING.m,
    },
    premiumTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
    premiumSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
    section: { marginBottom: SPACING.m },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: SPACING.s, marginLeft: 4 },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: SPACING.m, borderRadius: LAYOUT.borderRadiusSmall, marginBottom: 8,
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowLabel: { fontSize: 16 },
    version: { textAlign: 'center', fontSize: 12, marginTop: SPACING.l, marginBottom: SPACING.xl },
});
