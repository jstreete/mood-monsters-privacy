import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useIncidents } from '../context/IncidentContext';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { CalmToolId, Incident } from '../types';
import { PaywallModal } from './PaywallModal';
import { ChildDropdown } from '../components/ChildDropdown';

interface ToolDef {
    id: CalmToolId;
    routeName: string;
    name: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    desc: string;
    color: string;
    locked: boolean;
}

interface SmartRecommendation {
    title: string;
    message: string;
    targetRoute: string;
    toolName: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const CalmToolsScreen = ({ navigation }: any) => {
    const { settings, toggleFavoriteTool } = useUser();
    const { incidents } = useIncidents();
    const systemColorScheme = useColorScheme();
    const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

    const [paywallVisible, setPaywallVisible] = useState(false);
    const [paywallFeature, setPaywallFeature] = useState('');

    const bg = getColor('background', isDark);
    const cardBg = getColor('cardBackground', isDark);
    const textP = getColor('textPrimary', isDark);
    const textS = getColor('textSecondary', isDark);

    const favorites = settings.favoriteCalmTools || ['breathing', 'timer'];

    const tools: ToolDef[] = [
        { id: 'breathing', routeName: 'Breathing', name: 'Deep Breathing', icon: 'weather-windy', desc: '4-4-4 rhythm to center yourself.', color: '#4FD1C5', locked: false },
        { id: 'candles', routeName: 'Candles', name: 'Blow Out Candles', icon: 'candle', desc: 'Visualize blowing out candles.', color: '#F6AD55', locked: false },
        { id: 'grounding', routeName: 'Grounding', name: '5-4-3-2-1 Grounding', icon: 'hand-back-left', desc: 'Connect with your senses.', color: '#9F7AEA', locked: false },
        { id: 'muscle', routeName: 'Muscle', name: 'Muscle Relaxation', icon: 'human-handsup', desc: 'Progressive muscle tense & release.', color: '#FC8181', locked: !settings.isPremium },
        { id: 'timer', routeName: 'Timer', name: 'Visual Timer', icon: 'timer-sand', desc: 'Calming countdown & visual themes.', color: '#63B3ED', locked: false },
        { id: 'guided-imagery', routeName: 'GuidedImagery', name: 'Guided Imagery', icon: 'cloud-outline', desc: 'Peaceful cloud & beach imagery.', color: '#8B5CF6', locked: !settings.isPremium },
    ];

    const handlePress = (tool: ToolDef) => {
        if (tool.locked) {
            setPaywallFeature(tool.name);
            setPaywallVisible(true);
            return;
        }
        navigation.navigate(tool.routeName);
    };

    // Calculate smart, personalized recommendation based on incident patterns
    const recommendation: SmartRecommendation = useMemo(() => {
        if (!incidents || incidents.length === 0) {
            return {
                title: 'Proactive Calming Practice',
                message: 'Practice Deep Breathing (4-4-4 rhythm) during quiet moments so your child builds confidence before intense emotions arise.',
                targetRoute: 'Breathing',
                toolName: 'Deep Breathing',
                icon: 'weather-windy',
            };
        }

        // Count triggers
        const triggerCounts: Record<string, number> = {};
        const resolutionCounts: Record<string, number> = {};
        let highIntensityCount = 0;

        incidents.forEach((inc) => {
            if (inc.intensity >= 4) highIntensityCount++;
            (inc.triggers || []).forEach((t) => {
                if (t && t.trim()) triggerCounts[t] = (triggerCounts[t] || 0) + 1;
            });
            (inc.resolutions || []).forEach((r) => {
                if (r && r.trim()) resolutionCounts[r] = (resolutionCounts[r] || 0) + 1;
            });
        });

        const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const topResolution = Object.entries(resolutionCounts).sort((a, b) => b[1] - a[1])[0];

        // Specific recommendations based on top trigger
        if (topTrigger === 'Change in Routine' || topTrigger === 'Transition Difficulty') {
            return {
                title: 'Transition Support Strategy',
                message: 'Routine shifts are a frequent trigger. Give a 5-minute Visual Timer warning before changes to create safe predictability.',
                targetRoute: 'Timer',
                toolName: 'Visual Timer',
                icon: 'timer-sand',
            };
        }

        if (topTrigger === 'Sensory Input' || topTrigger === 'Overstimulation') {
            return {
                title: 'Sensory Reset Strategy',
                message: 'Overstimulation is common in recent logs. Guide your child through 5-4-3-2-1 Grounding in a dim, low-noise space.',
                targetRoute: 'Grounding',
                toolName: '5-4-3-2-1 Grounding',
                icon: 'hand-back-left',
            };
        }

        if (topTrigger === 'Tiredness') {
            return {
                title: 'Rest & Gentle Co-Regulation',
                message: 'Tiredness is currently a primary trigger. Guided Imagery or slow rhythmic breathing helps down-regulate without demanding cognitive effort.',
                targetRoute: settings.isPremium ? 'GuidedImagery' : 'Breathing',
                toolName: settings.isPremium ? 'Guided Imagery' : 'Deep Breathing',
                icon: 'cloud-outline',
            };
        }

        if (topTrigger === 'Hunger') {
            return {
                title: 'Post-Snack Calming Reset',
                message: 'Hunger frequently precedes incidents. Offer a small protein snack paired with 2 minutes of Deep Breathing to restore balance.',
                targetRoute: 'Breathing',
                toolName: 'Deep Breathing',
                icon: 'weather-windy',
            };
        }

        // If high intensity meltdowns are frequent
        if (highIntensityCount >= 2) {
            return {
                title: 'High-Intensity De-escalation',
                message: 'During intense meltdowns, keep verbal words minimal. Model Blow Out Candles or Deep Breathing together to guide co-regulation.',
                targetRoute: 'Candles',
                toolName: 'Blow Out Candles',
                icon: 'candle',
            };
        }

        // If a specific tool has been logged as helpful
        if (topResolution && topResolution[1] >= 2) {
            const toolMap: Record<string, { route: string; name: string; icon: any }> = {
                'Deep Breathing': { route: 'Breathing', name: 'Deep Breathing', icon: 'weather-windy' },
                'Timer': { route: 'Timer', name: 'Visual Timer', icon: 'timer-sand' },
                'Quiet Space': { route: 'Grounding', name: '5-4-3-2-1 Grounding', icon: 'hand-back-left' },
                'Sensory Tool': { route: 'Grounding', name: 'Grounding', icon: 'hand-back-left' },
            };
            const match = toolMap[topResolution[0]];
            if (match) {
                return {
                    title: `Proven Tool: ${match.name}`,
                    message: `${topResolution[0]} has helped your child most (${topResolution[1]}×). Keep practicing it during calm moments so it stays second nature.`,
                    targetRoute: match.route,
                    toolName: match.name,
                    icon: match.icon,
                };
            }
        }

        return {
            title: 'Recommended Strategy',
            message: 'Visual Timer paired with Deep Breathing helps prevent meltdowns by creating structured, predictable calm intervals.',
            targetRoute: 'Timer',
            toolName: 'Visual Timer',
            icon: 'timer-sand',
        };
    }, [incidents, settings.isPremium]);

    const favoriteTools = tools.filter(t => favorites.includes(t.id));

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={[styles.title, { color: textP }]}>Calm Tools</Text>
                        <Text style={[styles.subtitle, { color: textS }]}>Quick activities to regulate & soothe.</Text>
                    </View>
                    <ChildDropdown compact />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Favorites Section */}
                {favoriteTools.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textS }]}>⭐ Favorite Tools</Text>
                        <View style={{ gap: SPACING.s }}>
                            {favoriteTools.map(tool => (
                                <TouchableOpacity
                                    key={`fav-${tool.id}`}
                                    style={[styles.card, { backgroundColor: cardBg }]}
                                    onPress={() => handlePress(tool)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: tool.color + '20' }]}>
                                        <MaterialCommunityIcons name={tool.icon} size={28} color={tool.color} />
                                    </View>
                                    <View style={styles.textContainer}>
                                        <Text style={[styles.toolName, { color: textP }]}>{tool.name}</Text>
                                        <Text style={[styles.toolDesc, { color: textS }]}>{tool.desc}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => toggleFavoriteTool(tool.id)} style={{ padding: 4 }}>
                                        <MaterialCommunityIcons name="star" size={22} color="#F59E0B" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Smart data-driven recommendation card */}
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate(recommendation.targetRoute)}
                    style={[
                        styles.suggestedCard,
                        {
                            backgroundColor: isDark ? '#1a2744' : '#EFF6FF',
                            borderColor: isDark ? '#2563EB40' : '#BFDBFE',
                            borderWidth: 1,
                        }
                    ]}
                >
                    <View style={[styles.recIconBadge, { backgroundColor: isDark ? '#2563EB30' : '#DBEAFE' }]}>
                        <MaterialCommunityIcons name={recommendation.icon} size={24} color={isDark ? '#93C5FD' : COLORS.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.recTitle, { color: isDark ? '#93C5FD' : COLORS.primary }]}>
                            {recommendation.title}
                        </Text>
                        <Text style={[styles.recDesc, { color: textP }]}>
                            {recommendation.message}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                            <Text style={[styles.recActionText, { color: isDark ? '#60A5FA' : COLORS.primary }]}>
                                Open {recommendation.toolName}
                            </Text>
                            <MaterialCommunityIcons name="arrow-right" size={14} color={isDark ? '#60A5FA' : COLORS.primary} />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* All Tools Grid */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: textS, marginTop: SPACING.s }]}>All Calm Tools</Text>
                    <View style={{ gap: SPACING.m }}>
                        {tools.map((tool) => {
                            const isFav = favorites.includes(tool.id);
                            return (
                                <TouchableOpacity
                                    key={tool.id}
                                    style={[styles.card, { backgroundColor: cardBg }]}
                                    onPress={() => handlePress(tool)}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: tool.color + '20' }]}>
                                        <MaterialCommunityIcons name={tool.icon} size={28} color={tool.color} />
                                    </View>
                                    <View style={styles.textContainer}>
                                        <Text style={[styles.toolName, { color: textP }]}>
                                            {tool.name} {tool.locked ? '🔒' : ''}
                                        </Text>
                                        <Text style={[styles.toolDesc, { color: textS }]}>{tool.desc}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => toggleFavoriteTool(tool.id)} style={{ padding: 6 }}>
                                        <MaterialCommunityIcons
                                            name={isFav ? 'star' : 'star-outline'}
                                            size={22}
                                            color={isFav ? '#F59E0B' : textS}
                                        />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                triggeredFeatureName={paywallFeature}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: SPACING.m },
    title: { fontSize: 24, fontWeight: 'bold' },
    subtitle: { fontSize: 14, marginTop: 4 },
    content: { padding: SPACING.m, gap: SPACING.m },
    section: { marginBottom: SPACING.s },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: SPACING.s },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        elevation: 2,
    },
    iconContainer: {
        width: 46, height: 46, borderRadius: 23,
        justifyContent: 'center', alignItems: 'center',
        marginRight: SPACING.m,
    },
    textContainer: { flex: 1 },
    toolName: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    toolDesc: { fontSize: 12 },
    suggestedCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        marginBottom: SPACING.s,
    },
    recIconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    recTitle: {
        fontWeight: '800',
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    recDesc: {
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
    recActionText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
