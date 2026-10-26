import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, useColorScheme, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIncidents } from '../context/IncidentContext';
import { useUser } from '../context/UserContext';
import { useProfile } from '../context/ProfileContext';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { PieChart } from 'react-native-gifted-charts';
import { subDays, startOfDay, isToday, getHours, format } from 'date-fns';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useIsFocused } from '@react-navigation/native';
import { PaywallModal } from './PaywallModal';
import { TriggerResolutionMatrix } from '../components/TriggerResolutionMatrix';
import { YearlyReportModal } from '../components/YearlyReportModal';
import { ChildDropdown } from '../components/ChildDropdown';
import { detectPredictiveAlerts } from '../utils/predictiveAlerts';
import { Incident } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const InsightsScreen = ({ navigation }: any) => {
    const { incidents, addIncident } = useIncidents();
    const { settings } = useUser();
    const { currentProfile } = useProfile();
    const systemColorScheme = useColorScheme();
    const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';
    const isFocused = useIsFocused();

    const [filter, setFilter] = useState<'today' | '7d' | '30d' | 'all'>('7d');
    const [paywallVisible, setPaywallVisible] = useState(false);
    const [paywallFeature, setPaywallFeature] = useState('');
    const [yearlyReportVisible, setYearlyReportVisible] = useState(false);

    const bg = getColor('background', isDark);
    const cardBg = getColor('cardBackground', isDark);
    const textP = getColor('textPrimary', isDark);
    const textS = getColor('textSecondary', isDark);

    // Predictive pattern alert
    const patternAlert = settings.isPremium ? detectPredictiveAlerts(incidents) : null;

    // Check if 1 or more incidents logged today
    const hasIncidentToday = incidents.some(i => isToday(new Date(i.timestamp)) && !i.isSmoothDay);

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

    const handleFilterSelect = (selectedFilter: 'today' | '7d' | '30d' | 'all') => {
        if (!settings.isPremium && (selectedFilter === '30d' || selectedFilter === 'all')) {
            setPaywallFeature(selectedFilter === '30d' ? 'Monthly Chart Views' : 'Yearly & Lifetime Analytics');
            setPaywallVisible(true);
            return;
        }
        setFilter(selectedFilter);
    };

    const handleOpenYearlyReport = () => {
        if (!settings.isPremium) {
            setPaywallFeature('12-Month Yearly Summary Report');
            setPaywallVisible(true);
            return;
        }
        setYearlyReportVisible(true);
    };

    const filteredLogs = useMemo(() => {
        const today = startOfDay(new Date());
        switch (filter) {
            case 'today':
                return incidents.filter(log => isToday(new Date(log.timestamp)));
            case '7d':
                const weekAgo = subDays(today, 7);
                return incidents.filter(log => new Date(log.timestamp) >= weekAgo);
            case '30d':
                const monthAgo = subDays(today, 30);
                return incidents.filter(log => new Date(log.timestamp) >= monthAgo);
            default:
                return incidents;
        }
    }, [incidents, filter, isFocused]);

    const hasData = filteredLogs.length > 0;

    const behaviorData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredLogs.forEach(i => {
            const behaviors = (i.behaviors || []).filter((b): b is string => typeof b === 'string' && b.trim().length > 0);
            if (behaviors.length > 0) {
                behaviors.forEach(b => {
                    counts[b] = (counts[b] || 0) + 1;
                });
            } else {
                counts['Unknown'] = (counts['Unknown'] || 0) + 1;
            }
        });
        const colors = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.danger, '#805AD5'];

        return Object.entries(counts).map(([label, value], i) => ({
            label, value, color: colors[i % colors.length]
        }));
    }, [filteredLogs]);

    const triggerData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredLogs.forEach(i => {
            (i.triggers || []).filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
                .forEach(t => counts[t] = (counts[t] || 0) + 1);
        });
        const colors = [COLORS.primary, '#8B5CF6', COLORS.accent, '#F59E0B', '#EC4899', '#3B82F6'];
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([label, value], i) => ({
                label,
                value,
                color: colors[i % colors.length],
            }));
    }, [filteredLogs]);

    const resolutionData = useMemo(() => {
        const counts: Record<string, number> = {};
        filteredLogs.forEach(i => {
            (i.resolutions || []).filter((r): r is string => typeof r === 'string' && r.trim().length > 0)
                .forEach(r => counts[r] = (counts[r] || 0) + 1);
        });
        const colors = [COLORS.accent, COLORS.primary, '#F59E0B', '#8B5CF6', '#10B981', '#EC4899'];
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([label, value], i) => ({
                label,
                value,
                color: colors[i % colors.length],
            }));
    }, [filteredLogs]);

    const timeOfDayData = useMemo(() => {
        const counts = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
        filteredLogs.forEach(i => {
            const h = getHours(new Date(i.timestamp));
            if (h >= 5 && h < 12) counts.Morning++;
            else if (h >= 12 && h < 17) counts.Afternoon++;
            else if (h >= 17 && h < 21) counts.Evening++;
            else counts.Night++;
        });
        const timeColors: Record<string, string> = {
            Morning: '#F59E0B',
            Afternoon: COLORS.primary,
            Evening: '#8B5CF6',
            Night: COLORS.secondary,
        };
        return Object.entries(counts)
            .filter(([_, value]) => value > 0)
            .map(([label, value]) => ({
                label,
                value,
                color: timeColors[label] || COLORS.primary,
            }));
    }, [filteredLogs]);

    const renderPremiumLock = (title: string) => (
        <View style={[styles.card, { backgroundColor: cardBg, overflow: 'hidden', height: 200 }]}>
            <Text style={[styles.cardTitle, { color: textP }]}>{title}</Text>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="lock-outline" size={36} color={COLORS.primary} />
                <Text style={{ color: textS, marginTop: 8, marginBottom: 12, textAlign: 'center', fontSize: 13 }}>
                  Unlock Deep Correlations & Yearly Reports
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16 }}
                    onPress={() => {
                      setPaywallFeature(title);
                      setPaywallVisible(true);
                    }}
                >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Upgrade to Unlock</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            {/* Header: Date, Greeting & Profile */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View>
                        <Text style={[styles.dateText, { color: textS }]}>
                            {format(new Date(), 'EEEE, MMM do').toUpperCase()}
                        </Text>
                        <Text style={[styles.title, { color: textP }]}>
                            Hello, {settings.userName || 'Parent'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 6 }}>
                            <Text style={[styles.profileSubtitle, { color: textS }]}>
                                Tracking:
                            </Text>
                            <ChildDropdown compact />
                        </View>
                    </View>

                    {/* 12-Month Yearly Summary Action */}
                    <TouchableOpacity
                        onPress={handleOpenYearlyReport}
                        style={[
                            styles.yearlyBtn,
                            {
                                backgroundColor: isDark ? '#1a2744' : '#EFF6FF',
                                borderColor: isDark ? '#2563EB40' : '#DBEAFE',
                                borderWidth: 1,
                            }
                        ]}
                    >
                        <MaterialCommunityIcons name="calendar-multiselect" size={16} color={isDark ? '#93C5FD' : COLORS.primary} />
                        <Text style={[styles.yearlyBtnText, { color: isDark ? '#93C5FD' : COLORS.primary }]}>
                            12-Mo Summary {!settings.isPremium ? '🔒' : ''}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Timeframe Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                    {(['today', '7d', '30d', 'all'] as const).map((f) => {
                        const isLocked = !settings.isPremium && (f === '30d' || f === 'all');
                        const isSelected = filter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                style={[
                                    styles.filterPill,
                                    { backgroundColor: isSelected ? COLORS.primary : isDark ? '#1e293b' : 'rgba(0,0,0,0.05)' }
                                ]}
                                onPress={() => handleFilterSelect(f)}
                            >
                                <Text style={[styles.filterText, { color: isSelected ? '#FFF' : textS }]}>
                                    {f === '7d' ? 'WEEKLY' : f === '30d' ? 'MONTHLY' : f === 'all' ? 'YEARLY' : 'TODAY'}
                                    {isLocked ? ' 🔒' : ''}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Predictive Alert Banner (Premium Only) */}
                {patternAlert && (
                    <View
                        style={[
                            styles.patternAlertCard,
                            {
                                backgroundColor: isDark ? '#1a2744' : '#EFF6FF',
                                borderColor: isDark ? '#2563EB40' : '#BFDBFE',
                                borderWidth: 1,
                            }
                        ]}
                    >
                        <MaterialCommunityIcons name={patternAlert.icon as any} size={24} color={isDark ? '#93C5FD' : COLORS.primary} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.patternAlertTitle, { color: isDark ? '#93C5FD' : COLORS.primary }]}>
                                {patternAlert.title}
                            </Text>
                            <Text style={[styles.patternAlertSub, { color: textP }]}>
                                {patternAlert.message}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Quick Action: Log Smooth Day (Hidden if 1 or more incidents logged today) */}
                {!hasIncidentToday && (
                    <TouchableOpacity
                        style={[
                            styles.smoothButton,
                            {
                                backgroundColor: cardBg,
                                borderColor: isDark ? '#059669' : COLORS.accent,
                                borderWidth: 1.5,
                            }
                        ]}
                        onPress={handleLogSmoothDay}
                    >
                        <MaterialCommunityIcons name="star-face" size={26} color={COLORS.accent} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.smoothTitle, { color: textP }]}>Log Smooth Day 🌟</Text>
                            <Text style={[styles.smoothSub, { color: textS }]}>1-tap positive milestone celebration</Text>
                        </View>
                        <MaterialCommunityIcons name="plus-circle" size={22} color={COLORS.accent} />
                    </TouchableOpacity>
                )}

                {!hasData ? (
                    <View style={[styles.emptyContainer, { backgroundColor: cardBg }]}>
                        <MaterialCommunityIcons name="chart-bell-curve" size={48} color={textS} />
                        <Text style={[styles.emptyText, { color: textP }]}>No incidents logged for this period.</Text>
                        <Text style={[styles.emptySubtext, { color: textS }]}>Log incidents to see patterns here.</Text>
                    </View>
                ) : (
                    <>
                        {/* What Works Best by Trigger Matrix */}
                        <TriggerResolutionMatrix incidents={incidents} />

                        {/* Behavior Distribution (Pie) */}
                        <View style={[styles.card, { backgroundColor: cardBg }]}>
                            <Text style={[styles.cardTitle, { color: textP }]}>Behavior Breakdown</Text>
                            <View style={{ alignItems: 'center', marginVertical: 10 }}>
                                <PieChart
                                    data={behaviorData}
                                    donut
                                    radius={80}
                                    innerRadius={50}
                                    innerCircleColor={cardBg}
                                    centerLabelComponent={() => (
                                        <View style={{ alignItems: 'center' }}>
                                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: textP }}>{filteredLogs.length}</Text>
                                            <Text style={{ fontSize: 10, color: textS }}>Total</Text>
                                        </View>
                                    )}
                                />
                            </View>
                            <View style={styles.legendContainer}>
                                {behaviorData.map((item) => (
                                    <View key={item.label} style={styles.legendItem}>
                                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                        <Text style={[styles.legendText, { color: textS }]}>{item.label}: {item.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Top Triggers */}
                        <View style={[styles.card, { backgroundColor: cardBg }]}>
                            <Text style={[styles.cardTitle, { color: textP }]}>Top Triggers</Text>
                            {triggerData.length > 0 ? (
                                <>
                                    <View style={{ alignItems: 'center', marginVertical: 10 }}>
                                        <PieChart
                                            data={triggerData}
                                            donut
                                            radius={80}
                                            innerRadius={50}
                                            innerCircleColor={cardBg}
                                            centerLabelComponent={() => (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: textP }}>
                                                        {triggerData.reduce((acc, cur) => acc + cur.value, 0)}
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: textS }}>Total</Text>
                                                </View>
                                            )}
                                        />
                                    </View>
                                    <View style={styles.legendContainer}>
                                        {triggerData.map((item) => (
                                            <View key={item.label} style={styles.legendItem}>
                                                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                                <Text style={[styles.legendText, { color: textS }]}>
                                                    {item.label}: <Text style={{ fontWeight: '700', color: textP }}>{item.value}</Text>
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <Text style={{ color: textS }}>No trigger data recorded.</Text>
                            )}
                        </View>

                        {/* Most Used Resolutions */}
                        <View style={[styles.card, { backgroundColor: cardBg }]}>
                            <Text style={[styles.cardTitle, { color: textP }]}>Most Used Resolutions</Text>
                            {resolutionData.length > 0 ? (
                                <>
                                    <View style={{ alignItems: 'center', marginVertical: 10 }}>
                                        <PieChart
                                            data={resolutionData}
                                            donut
                                            radius={80}
                                            innerRadius={50}
                                            innerCircleColor={cardBg}
                                            centerLabelComponent={() => (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: textP }}>
                                                        {resolutionData.reduce((acc, cur) => acc + cur.value, 0)}
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: textS }}>Total</Text>
                                                </View>
                                            )}
                                        />
                                    </View>
                                    <View style={styles.legendContainer}>
                                        {resolutionData.map((item) => (
                                            <View key={item.label} style={styles.legendItem}>
                                                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                                <Text style={[styles.legendText, { color: textS }]}>
                                                    {item.label}: <Text style={{ fontWeight: '700', color: textP }}>{item.value}</Text>
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <Text style={{ color: textS }}>No resolution data recorded.</Text>
                            )}
                        </View>

                        {/* Incident Timing */}
                        <View style={[styles.card, { backgroundColor: cardBg }]}>
                            <Text style={[styles.cardTitle, { color: textP }]}>Incident Timing</Text>
                            {timeOfDayData.length > 0 ? (
                                <>
                                    <View style={{ alignItems: 'center', marginVertical: 10 }}>
                                        <PieChart
                                            data={timeOfDayData}
                                            donut
                                            radius={80}
                                            innerRadius={50}
                                            innerCircleColor={cardBg}
                                            centerLabelComponent={() => (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: textP }}>
                                                        {timeOfDayData.reduce((acc, cur) => acc + cur.value, 0)}
                                                    </Text>
                                                    <Text style={{ fontSize: 10, color: textS }}>Logs</Text>
                                                </View>
                                            )}
                                        />
                                    </View>
                                    <View style={styles.legendContainer}>
                                        {timeOfDayData.map((item) => (
                                            <View key={item.label} style={styles.legendItem}>
                                                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                                <Text style={[styles.legendText, { color: textS }]}>
                                                    {item.label}: <Text style={{ fontWeight: '700', color: textP }}>{item.value}</Text>
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </>
                            ) : (
                                <Text style={{ color: textS }}>No timing data recorded.</Text>
                            )}
                        </View>

                        {/* Deep Correlations (Locked for Free Users) */}
                        {!settings.isPremium ? (
                            renderPremiumLock('Correlations & Advanced Patterns')
                        ) : (
                            <View style={[styles.card, { backgroundColor: cardBg }]}>
                                <Text style={[styles.cardTitle, { color: textP }]}>Deep Correlations</Text>
                                <Text style={{ color: textS, lineHeight: 20 }}>
                                    ✨ High intensity incidents frequently correspond with Routine Changes after 5:00 PM. Deep Breathing resulted in a 40% faster calm down time.
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                triggeredFeatureName={paywallFeature}
            />

            <YearlyReportModal
                visible={yearlyReportVisible}
                onClose={() => setYearlyReportVisible(false)}
                incidents={incidents}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: SPACING.m, paddingBottom: SPACING.s, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    dateText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    title: { fontSize: 24, fontWeight: 'bold', marginTop: 2 },
    profileSubtitle: { fontSize: 13, fontWeight: '700', marginTop: 2 },
    yearlyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        gap: 4,
    },
    yearlyBtnText: { fontSize: 12, fontWeight: '700' },
    filterContainer: { flexDirection: 'row', marginTop: SPACING.s },
    filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
    filterText: { fontSize: 12, fontWeight: 'bold' },
    content: { padding: SPACING.m },
    patternAlertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        marginBottom: SPACING.m,
    },
    patternAlertTitle: { fontWeight: '800', fontSize: 14 },
    patternAlertSub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
    smoothButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        marginBottom: SPACING.m,
    },
    smoothTitle: { fontSize: 15, fontWeight: 'bold' },
    smoothSub: { fontSize: 12 },
    card: { padding: SPACING.m, borderRadius: LAYOUT.borderRadius, marginBottom: SPACING.m },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: SPACING.m },
    legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center' },
    legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
    legendText: { fontSize: 12 },
    emptyContainer: { padding: SPACING.xl, alignItems: 'center', borderRadius: LAYOUT.borderRadius, marginTop: SPACING.xl },
    emptyText: { fontSize: 16, fontWeight: 'bold', marginTop: SPACING.m },
    emptySubtext: { fontSize: 14, marginTop: 4 },
});
