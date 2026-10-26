import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIncidents } from '../context/IncidentContext';
import { useUser } from '../context/UserContext';
import { useProfile } from '../context/ProfileContext';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { format, startOfWeek, endOfWeek, isWithinInterval, isToday } from 'date-fns';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { detectPredictiveAlerts } from '../utils/predictiveAlerts';
import { Incident } from '../types';

export const HomeScreen = ({ navigation }: any) => {
    const { incidents, addIncident } = useIncidents();
    const { currentProfile } = useProfile();
    const { settings, updateSettings } = useUser();
    const systemColorScheme = useColorScheme();
    const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

    const [tempName, setTempName] = useState('');
    const [showNameModal, setShowNameModal] = useState(!settings.userName);

    const bg = getColor('background', isDark);
    const cardBg = getColor('cardBackground', isDark);
    const textP = getColor('textPrimary', isDark);
    const textS = getColor('textSecondary', isDark);

    const today = new Date();
    const start = startOfWeek(today);
    const end = endOfWeek(today);

    // Stats
    const weeklyIncidents = incidents.filter(i => isWithinInterval(i.timestamp, { start, end })).length;
    const lastIncident = incidents.length > 0 ? incidents[0] : null;

    // Check if 1 or more incidents are already logged today (excluding smooth day logs if needed)
    const hasIncidentToday = incidents.some(i => isToday(new Date(i.timestamp)) && !i.isSmoothDay);

    // Predictive Pattern Alert
    const patternAlert = settings.isPremium ? detectPredictiveAlerts(incidents) : null;

    const triggerCounts: Record<string, number> = {};
    incidents.forEach(i => i.triggers.forEach(t => triggerCounts[t] = (triggerCounts[t] || 0) + 1));
    const commonTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    const handleSaveName = () => {
        if (tempName.trim()) {
            updateSettings({ userName: tempName.trim() });
            setShowNameModal(false);
        }
    };

    const handleLogSmoothDay = async () => {
        const smoothLog: Incident = {
            id: Date.now().toString(),
            profileId: currentProfile?.id || 'default',
            timestamp: Date.now(),
            intensity: 1,
            behaviors: ['Smooth Day'],
            triggers: [],
            resolutions: ['Positive Co-regulation'],
            isSmoothDay: true,
            note: 'Zero meltdowns logged for today! Smooth transition day.',
        };
        await addIncident(smoothLog);
        Alert.alert('Smooth Day Recorded! 🌟', 'Great job celebrating a calm day with your child.');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.date, { color: textS }]}>
                            {format(new Date(), 'EEEE, MMM do')}
                        </Text>
                        <Text style={[styles.title, { color: textP }]}>
                            Hello, {settings.userName || 'Parent'}
                        </Text>
                        <Text style={{ color: COLORS.primary, fontWeight: '600', marginTop: 4 }}>
                            Tracking: {currentProfile?.name || 'Child'}
                        </Text>
                    </View>
                </View>

                {/* Predictive Alert Banner (Premium Only) */}
                {patternAlert && (
                <View style={[styles.patternAlertCard, { backgroundColor: isDark ? '#1a2744' : '#EFF6FF' }]}>
                        <MaterialCommunityIcons name={patternAlert.icon as any} size={24} color={COLORS.primary} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.patternAlertTitle, { color: isDark ? '#93C5FD' : COLORS.primary }]}>{patternAlert.title}</Text>
                            <Text style={[styles.patternAlertSub, { color: textP }]}>{patternAlert.message}</Text>
                        </View>
                    </View>
                )}

                {/* Motivational Banner */}
                <View style={[styles.banner, { backgroundColor: COLORS.primary }]}>
                    <MaterialCommunityIcons name="shield-check" size={36} color="#FFF" style={{ opacity: 0.9 }} />
                    <View style={styles.bannerText}>
                        <Text style={styles.bannerTitle}>Building Insights</Text>
                        <Text style={styles.bannerSub}>Every log helps you understand and support your child better.</Text>
                    </View>
                </View>

                {/* Main Action: Log Incident */}
                <TouchableOpacity
                    style={[styles.logButton, { backgroundColor: cardBg, borderColor: COLORS.primary, borderWidth: 1 }]}
                    onPress={() => navigation.navigate('Log')}
                >
                    <View style={[styles.logIconContainer, { backgroundColor: COLORS.primary }]}>
                        <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
                    </View>
                    <View style={styles.logTextContainer}>
                        <Text style={[styles.logTitle, { color: textP }]}>Log Incident Now</Text>
                        <Text style={[styles.logSub, { color: textS }]}>Quickly record behavior & triggers</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={textS} />
                </TouchableOpacity>

                {/* Quick Action: Log Smooth Day (Hidden if 1 or more incidents logged today) */}
                {!hasIncidentToday && (
                    <TouchableOpacity
                        style={[styles.smoothButton, { backgroundColor: cardBg, borderColor: COLORS.accent, borderWidth: 1 }]}
                        onPress={handleLogSmoothDay}
                    >
                        <MaterialCommunityIcons name="star-face" size={28} color={COLORS.accent} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.smoothTitle, { color: textP }]}>Log Smooth Day 🌟</Text>
                            <Text style={[styles.smoothSub, { color: textS }]}>1-tap positive milestone log</Text>
                        </View>
                        <MaterialCommunityIcons name="plus-circle" size={24} color={COLORS.accent} />
                    </TouchableOpacity>
                )}

                {/* Quick Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.statValue, { color: COLORS.primary }]}>{weeklyIncidents}</Text>
                        <Text style={[styles.statLabel, { color: textS }]}>Incidents this week</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.statValue, { color: COLORS.secondary }]}>
                            {commonTrigger || '-'}
                        </Text>
                        <Text style={[styles.statLabel, { color: textS }]}>Top Trigger</Text>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textP }]}>Recent Activity</Text>
                    {lastIncident ? (
                        <View style={[styles.incidentCard, { backgroundColor: cardBg }]}>
                            <View style={styles.incidentHeader}>
                                <Text style={[styles.incidentType, { color: textP }]}>
                                    {lastIncident.isSmoothDay ? '🌟 Smooth Day (Zero Incidents)' : lastIncident.behaviors?.join(', ') || 'Unknown'}
                                </Text>
                                <Text style={[styles.incidentTime, { color: textS }]}>
                                    {format(lastIncident.timestamp, 'h:mm a')}
                                </Text>
                            </View>
                            {!lastIncident.isSmoothDay && (
                                <Text style={[styles.incidentTrigger, { color: textS }]}>
                                    Triggered by: {lastIncident.triggers.join(', ') || 'N/A'}
                                </Text>
                            )}
                            {lastIncident.resolutions.length > 0 && (
                                <View style={styles.resolutionBadge}>
                                    <MaterialCommunityIcons name="check-circle-outline" size={14} color={COLORS.success} />
                                    <Text style={[styles.resolutionText, { color: COLORS.success }]}>
                                        Helped by {lastIncident.resolutions[0]}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <View style={[styles.emptyState, { backgroundColor: cardBg }]}>
                            <Text style={[styles.emptyText, { color: textS }]}>No incidents logged yet.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Onboarding Name Modal */}
            <Modal visible={showNameModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <Text style={[styles.modalTitle, { color: textP }]}>Welcome to Pattern Tracker</Text>
                        <Text style={[styles.modalSub, { color: textS }]}>What should we call you?</Text>
                        <TextInput
                            style={[styles.input, { color: textP, borderColor: COLORS.primary }]}
                            placeholder="e.g. Mom, Dad"
                            placeholderTextColor={textS}
                            value={tempName}
                            onChangeText={setTempName}
                        />
                        <TouchableOpacity onPress={handleSaveName} style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}>
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Get Started</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: SPACING.m },
    header: { marginBottom: SPACING.m },
    date: { fontSize: 13, textTransform: 'uppercase', fontWeight: '600' },
    title: { fontSize: 24, fontWeight: 'bold', marginTop: 2 },
    patternAlertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        marginBottom: SPACING.m,
    },
    patternAlertTitle: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
    patternAlertSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        marginBottom: SPACING.m,
    },
    bannerText: { flex: 1, marginLeft: 12 },
    bannerTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    bannerSub: { color: '#E0F2FE', fontSize: 12, marginTop: 2 },
    logButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        marginBottom: SPACING.m,
    },
    logIconContainer: {
        width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
    },
    logTextContainer: { flex: 1, marginLeft: 12 },
    logTitle: { fontSize: 16, fontWeight: 'bold' },
    logSub: { fontSize: 12 },
    smoothButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        marginBottom: SPACING.m,
    },
    smoothTitle: { fontSize: 15, fontWeight: 'bold' },
    smoothSub: { fontSize: 12 },
    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: SPACING.m },
    statCard: { flex: 1, padding: SPACING.m, borderRadius: LAYOUT.borderRadius, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: 'bold' },
    statLabel: { fontSize: 12, marginTop: 2, textAlign: 'center' },
    section: { marginBottom: SPACING.m },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: SPACING.s },
    incidentCard: { padding: SPACING.m, borderRadius: LAYOUT.borderRadius },
    incidentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    incidentType: { fontSize: 16, fontWeight: 'bold' },
    incidentTime: { fontSize: 12 },
    incidentTrigger: { fontSize: 13, marginTop: 4 },
    resolutionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    resolutionText: { fontSize: 12, fontWeight: 'bold' },
    emptyState: { padding: SPACING.l, borderRadius: LAYOUT.borderRadius, alignItems: 'center' },
    emptyText: { fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.m },
    modalContent: { padding: SPACING.l, borderRadius: LAYOUT.borderRadiusLarge, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    modalSub: { fontSize: 14, marginTop: 4, marginBottom: SPACING.m },
    input: { borderWidth: 1, width: '100%', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: SPACING.m },
    saveBtn: { width: '100%', padding: 14, borderRadius: 8, alignItems: 'center' },
});
