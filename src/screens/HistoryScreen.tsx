import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIncidents } from '../context/IncidentContext';
import { useUser } from '../context/UserContext';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { format } from 'date-fns';
import { PaywallModal } from './PaywallModal';
import { ExportModal } from '../components/ExportModal';
import { useProfile } from '../context/ProfileContext';
import { ChildDropdown } from '../components/ChildDropdown';

export const HistoryScreen = ({ navigation }: any) => {
    const { incidents, deleteIncident } = useIncidents();
    const { currentProfile } = useProfile();
    const { settings } = useUser();
    const isDark = settings.theme === 'dark';

    const [paywallVisible, setPaywallVisible] = useState(false);
    const [paywallFeature, setPaywallFeature] = useState('');
    const [exportModalVisible, setExportModalVisible] = useState(false);

    const bg = getColor('background', isDark);
    const cardBg = getColor('cardBackground', isDark);
    const textP = getColor('textPrimary', isDark);
    const textS = getColor('textSecondary', isDark);

    const handleScheduleExport = () => {
        if (!settings.isPremium) {
            setPaywallFeature('Automated Export Reminders');
            setPaywallVisible(true);
            return;
        }
        Alert.alert('Reminder Scheduled', `Weekly export reminder set up successfully.`);
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.card, { backgroundColor: cardBg }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.behavior, { color: textP }]}>
                        {item.isSmoothDay ? '🌟 Smooth Day (Zero Incidents)' : item.behaviors?.join(', ') || 'Unknown'}
                    </Text>
                    <Text style={[styles.time, { color: textS }]}>
                        {format(item.timestamp, 'MMM d, yyyy • h:mm a')}
                    </Text>
                </View>
                {!item.isSmoothDay && (
                    <View style={[styles.intensityBadge, { backgroundColor: item.intensity >= 4 ? COLORS.error : COLORS.secondary }]}>
                        <Text style={styles.intensityText}>{item.intensity}</Text>
                    </View>
                )}
            </View>

            {item.triggers && item.triggers.length > 0 && (
                <View style={styles.row}>
                    <MaterialCommunityIcons name="flash" size={16} color={COLORS.error} />
                    <Text style={[styles.rowText, { color: textS }]}>
                        {item.triggers.join(', ')}
                    </Text>
                </View>
            )}

            {item.resolutions && item.resolutions.length > 0 && (
                <View style={styles.row}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={[styles.rowText, { color: textS }]}>
                        {item.resolutions.join(', ')}
                    </Text>
                </View>
            )}

            {item.photoUri && (
                <View style={{ marginTop: 8 }}>
                    <Image source={{ uri: item.photoUri }} style={{ width: '100%', height: 160, borderRadius: 8 }} />
                </View>
            )}

            {item.note && (
                <View style={[styles.noteContainer, { backgroundColor: isDark ? '#333' : '#F7FAFC' }]}>
                    <Text style={[styles.noteText, { color: textP }]}>{item.note}</Text>
                </View>
            )}

            {item.reflectionAnswers && (item.reflectionAnswers.preventNextTime || item.reflectionAnswers.childResponse) && (
                <View style={[styles.reflectionBox, { backgroundColor: isDark ? '#1e2d45' : '#EFF6FF', borderLeftColor: COLORS.primary, borderLeftWidth: 3 }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: 4 }}>💡 Parent Reflection</Text>
                    {item.reflectionAnswers.preventNextTime ? (
                        <Text style={{ fontSize: 13, color: textP, lineHeight: 18 }}>◆ Prevention: {item.reflectionAnswers.preventNextTime}</Text>
                    ) : null}
                    {item.reflectionAnswers.childResponse ? (
                        <Text style={{ fontSize: 13, color: textP, lineHeight: 18, marginTop: 4 }}>◆ Response: {item.reflectionAnswers.childResponse}</Text>
                    ) : null}
                </View>
            )}

            <View style={styles.cardActionsRow}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => navigation.navigate('Log', { incidentToEdit: item })}
                >
                    <MaterialCommunityIcons name="pencil-outline" size={15} color={COLORS.primary} />
                    <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                        Alert.alert(
                            'Delete Log',
                            'Are you sure you want to delete this incident log?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteIncident(item.id) },
                            ]
                        );
                    }}
                >
                    <MaterialCommunityIcons name="trash-can-outline" size={15} color={COLORS.error} />
                    <Text style={{ color: COLORS.error, fontSize: 13, fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <View style={styles.screenHeader}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={[styles.title, { color: textP }]}>History & Reports</Text>
                        <Text style={[styles.subtitle, { color: textS }]}>Export logs & therapist summary reports</Text>
                    </View>
                    <ChildDropdown compact />
                </View>
            </View>

            {/* Export Toolbar */}
            <View style={styles.toolbar}>
                <TouchableOpacity onPress={() => setExportModalVisible(true)} style={[styles.toolBtn, { backgroundColor: cardBg, flex: 1 }]}>
                    <MaterialCommunityIcons name="file-document-outline" size={18} color={COLORS.primary} />
                    <Text style={[styles.toolBtnText, { color: textP, fontWeight: '700' }]}>
                        Clinical Reports & CSV {!settings.isPremium ? '🔒' : ''}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleScheduleExport} style={[styles.toolBtn, { backgroundColor: cardBg }]}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color={COLORS.primary} />
                    <Text style={[styles.toolBtnText, { color: textP }]}>
                        Schedule {!settings.isPremium ? '🔒' : ''}
                    </Text>
                </TouchableOpacity>
            </View>

            {incidents.length === 0 ? (
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="notebook-outline" size={64} color={COLORS.secondary} />
                    <Text style={[styles.emptyText, { color: textS }]}>No incidents logged yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={incidents}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={{ height: SPACING.m }} />}
                />
            )}

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                triggeredFeatureName={paywallFeature}
            />

            <ExportModal
                visible={exportModalVisible}
                onClose={() => setExportModalVisible(false)}
                incidents={incidents}
                childName={currentProfile?.name || 'Child'}
                isPremium={settings.isPremium}
                onUpgradePress={() => {
                    setPaywallFeature('Clinical IEP & Pediatrician Export Suite');
                    setPaywallVisible(true);
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    screenHeader: { padding: SPACING.m, paddingBottom: SPACING.xs },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 13, marginTop: 2 },
    toolbar: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.m,
        paddingVertical: SPACING.s,
        gap: 10,
    },
    toolBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: LAYOUT.borderRadiusSmall,
        elevation: 1,
        gap: 6,
    },
    toolBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    listContent: { padding: SPACING.m },
    card: {
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.s,
    },
    headerLeft: { flex: 1 },
    behavior: { fontSize: 16, fontWeight: 'bold' },
    time: { fontSize: 12, marginTop: 2 },
    intensityBadge: {
        width: 30, height: 30, borderRadius: 15,
        justifyContent: 'center', alignItems: 'center',
    },
    intensityText: { color: '#FFF', fontWeight: 'bold' },
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4,
    },
    rowText: { fontSize: 13, flex: 1 },
    noteContainer: {
        marginTop: 8, padding: 8, borderRadius: 8,
    },
    noteText: { fontSize: 13, fontStyle: 'italic' },
    reflectionBox: {
        marginTop: 8, padding: 10, borderRadius: 8,
    },
    voiceNoteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        padding: 10,
        borderRadius: 8,
    },
    cardActionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 10,
        gap: 16,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { marginTop: 16, fontSize: 16 },
});
