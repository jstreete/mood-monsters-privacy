import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useIncidents } from '../context/IncidentContext';
import { useUser } from '../context/UserContext';
import { useProfile } from '../context/ProfileContext';
import { Incident, BehaviorType, Trigger, Resolution } from '../types';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { PaywallModal } from './PaywallModal';
import { ReflectionModal } from './ReflectionModal';
import { format, subHours, subDays, setHours, setMinutes } from 'date-fns';

export const LogIncidentScreen = ({ navigation, route }: any) => {
    const { addIncident, updateIncident } = useIncidents();
    const { settings } = useUser();
    const { profiles, currentProfile } = useProfile();
    const isDark = settings.theme === 'dark';

    const editingIncident: Incident | undefined = route?.params?.incidentToEdit;
    const isEditing = !!editingIncident;

    const bg = getColor('background', isDark);
    const cardBg = getColor('cardBackground', isDark);
    const textP = getColor('textPrimary', isDark);
    const textS = getColor('textSecondary', isDark);
    const border = getColor('border', isDark);

    // Profile selection for logging
    const [selectedProfileId, setSelectedProfileId] = useState<string>(
        editingIncident?.profileId || currentProfile?.id || profiles[0]?.id || 'default'
    );

    // Date & Time state
    const [incidentTimestamp, setIncidentTimestamp] = useState<number>(
        editingIncident?.timestamp || Date.now()
    );
    const [showTimeModal, setShowTimeModal] = useState(false);

    const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>(
        editingIncident?.behaviors || []
    );
    const [otherBehaviorText, setOtherBehaviorText] = useState('');
    const [intensity, setIntensity] = useState(editingIncident?.intensity || 3);
    const [selectedTriggers, setSelectedTriggers] = useState<string[]>(
        editingIncident?.triggers || []
    );
    const [selectedResolutions, setSelectedResolutions] = useState<string[]>(
        editingIncident?.resolutions || []
    );
    const [note, setNote] = useState(editingIncident?.note || '');

    const [duration, setDuration] = useState<string>(
        editingIncident?.duration ? editingIncident.duration.toString() : ''
    );
    const [location, setLocation] = useState<string>(editingIncident?.location || '');
    const [screenTime, setScreenTime] = useState<string>(editingIncident?.screenTimeBefore || '');
    const [sleepQuality, setSleepQuality] = useState<number | undefined>(editingIncident?.sleepQuality);
    const [photoUri, setPhotoUri] = useState<string | undefined>(editingIncident?.photoUri);

    const [paywallVisible, setPaywallVisible] = useState(false);
    const [paywallFeature, setPaywallFeature] = useState('');
    const [reflectionVisible, setReflectionVisible] = useState(false);
    const [voiceModalVisible, setVoiceModalVisible] = useState(false);
    const [speechTarget, setSpeechTarget] = useState<'note' | 'otherBehavior'>('note');
    const [pendingIncident, setPendingIncident] = useState<Incident | null>(null);

    // Spoken note / dictation draft
    const [spokenNote, setSpokenNote] = useState('');
    const [dictationDraft, setDictationDraft] = useState('');
    const spokenNoteInputRef = useRef<TextInput>(null);

    // Synchronize if editing incident changes
    useEffect(() => {
        if (editingIncident) {
            setSelectedProfileId(editingIncident.profileId);
            setIncidentTimestamp(editingIncident.timestamp);
            setSelectedBehaviors(editingIncident.behaviors || []);
            setSelectedTriggers(editingIncident.triggers || []);
            setIntensity(editingIncident.intensity || 3);
            setDuration(editingIncident.duration ? editingIncident.duration.toString() : '');
            setSelectedResolutions(editingIncident.resolutions || []);
            setNote(editingIncident.note || '');
            setLocation(editingIncident.location || '');
            setScreenTime(editingIncident.screenTimeBefore || '');
            setSleepQuality(editingIncident.sleepQuality);
            setPhotoUri(editingIncident.photoUri);
        } else if (currentProfile?.id) {
            setSelectedProfileId(currentProfile.id);
        }
    }, [editingIncident, currentProfile?.id]);

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void, categoryName: string) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            if (!settings.isPremium && list.length >= 10) {
                setPaywallFeature(`More than 10 ${categoryName} Tags`);
                setPaywallVisible(true);
                return;
            }
            setList([...list, item]);
        }
    };

    const handlePickPhoto = async () => {
        if (!settings.isPremium) {
            setPaywallFeature('Photo Attachments on Incidents');
            setPaywallVisible(true);
            return;
        }

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Permission Needed', 'Photo library access is required to attach trigger photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (selectedBehaviors.length === 0) {
            Alert.alert('Missing Info', 'Please select at least one behavior type under "What happened?".');
            return;
        }

        // Incorporate custom 'Other' behavior text if provided
        let finalBehaviors = [...selectedBehaviors];
        if (finalBehaviors.includes(BehaviorType.Other) && otherBehaviorText.trim()) {
            finalBehaviors = finalBehaviors.map(b =>
                b === BehaviorType.Other ? `Other: ${otherBehaviorText.trim()}` : b
            );
        }

        const incidentData: Incident = {
            id: editingIncident ? editingIncident.id : Date.now().toString(),
            profileId: selectedProfileId,
            timestamp: incidentTimestamp,
            behaviors: finalBehaviors,
            triggers: selectedTriggers,
            intensity,
            resolutions: selectedResolutions,
            note: [note.trim(), spokenNote.trim()].filter(Boolean).join(' | ') || undefined,
            duration: duration ? parseInt(duration) : undefined,
            location: location.trim() || undefined,
            screenTimeBefore: screenTime || undefined,
            sleepQuality,
            photoUri,
            reflectionAnswers: editingIncident?.reflectionAnswers,
        };

        if (isEditing) {
            await updateIncident(incidentData);
            Alert.alert('Log Updated', 'Incident log updated successfully.');
            navigation.goBack();
            return;
        }

        setPendingIncident(incidentData);

        // Open post-incident reflection prompt if Premium
        if (settings.isPremium) {
            setReflectionVisible(true);
        } else {
            await finalizeIncident(incidentData);
        }
    };

    const finalizeIncident = async (inc: Incident) => {
        await addIncident(inc);
        navigation.goBack();

        setSelectedBehaviors([]);
        setOtherBehaviorText('');
        setIntensity(3);
        setSelectedTriggers([]);
        setSelectedResolutions([]);
        setNote('');
        setDuration('');
        setLocation('');
        setScreenTime('');
        setSleepQuality(undefined);
        setPhotoUri(undefined);
        setSpokenNote('');
        setDictationDraft('');
        setPendingIncident(null);
    };

    const handleSaveReflection = async (reflection: { preventNextTime?: string; childResponse?: string }) => {
        setReflectionVisible(false);
        if (pendingIncident) {
            const updated = {
                ...pendingIncident,
                reflectionAnswers: reflection,
            };
            await finalizeIncident(updated);
        }
    };

    // ── Voice / Speech Dictation ─────────────────────────────────
    const handleOpenSpeechModal = (target: 'note' | 'otherBehavior') => {
        if (!settings.isPremium) {
            setPaywallFeature('Quick Voice Notes & Dictation');
            setPaywallVisible(true);
            return;
        }
        setSpeechTarget(target);
        setDictationDraft(target === 'note' ? spokenNote : otherBehaviorText);
        setVoiceModalVisible(true);
    };

    const handleSaveDictation = () => {
        Keyboard.dismiss();
        if (speechTarget === 'note') {
            setSpokenNote(dictationDraft.trim());
        } else {
            setOtherBehaviorText(dictationDraft.trim());
        }
        setVoiceModalVisible(false);
    };

    const handleCancelDictation = () => {
        Keyboard.dismiss();
        setDictationDraft('');
        setVoiceModalVisible(false);
    };

    const renderChip = (label: string, selected: boolean, onPress: () => void) => (
        <TouchableOpacity
            key={label}
            style={[
                styles.chip,
                { borderColor: selected ? COLORS.primary : border, backgroundColor: selected ? COLORS.primary + '20' : 'transparent' }
            ]}
            onPress={onPress}
        >
            <Text style={[styles.chipText, { color: selected ? COLORS.primary : textS }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="close" size={24} color={textP} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: textP }]}>
                    {isEditing ? 'Edit Incident Log' : 'Log Incident'}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Calm', { screen: 'Timer' })} style={{ padding: 4 }}>
                    <MaterialCommunityIcons name="timer-sand" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Child Switcher Pill Row */}
                {profiles.length > 0 && (
                    <View style={[styles.childSelectorBar, { backgroundColor: cardBg, borderColor: border }]}>
                        <Text style={[styles.childSelectorLabel, { color: textS }]}>LOGGING FOR:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 4 }}>
                            {profiles.map(p => {
                                const isSelected = selectedProfileId === p.id;
                                return (
                                    <TouchableOpacity
                                        key={p.id}
                                        onPress={() => setSelectedProfileId(p.id)}
                                        style={[
                                            styles.childSelectorChip,
                                            {
                                                backgroundColor: isSelected ? COLORS.primary : (isDark ? '#0F172A' : '#F1F5F9'),
                                                borderColor: isSelected ? COLORS.primary : border,
                                            }
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name="account"
                                            size={14}
                                            color={isSelected ? '#FFF' : textS}
                                        />
                                        <Text
                                            style={[
                                                styles.childSelectorChipText,
                                                { color: isSelected ? '#FFF' : textP }
                                            ]}
                                        >
                                            {p.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* Date & Time Selector (Crucial for evening/delayed logging) */}
                <View style={[styles.timeCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.timeCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialCommunityIcons name="clock-time-four-outline" size={18} color={COLORS.primary} />
                            <Text style={[styles.timeCardTitle, { color: textP }]}>When did this happen?</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowTimeModal(true)}
                            style={[styles.changeTimeBtn, { backgroundColor: isDark ? '#1e293b' : '#EFF6FF' }]}
                        >
                            <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '700' }}>Adjust Time</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Current Selected Timestamp Display */}
                    <Text style={[styles.selectedTimeDisplay, { color: isDark ? '#93C5FD' : COLORS.primary }]}>
                        📅 {format(new Date(incidentTimestamp), 'EEEE, MMM d • h:mm a')}
                    </Text>

                    {/* Quick presets for parents logging after bedtime */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 10 }}>
                        <TouchableOpacity
                            onPress={() => setIncidentTimestamp(Date.now())}
                            style={[styles.quickTimeChip, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: border }]}
                        >
                            <Text style={[styles.quickTimeText, { color: textS }]}>Just Now</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIncidentTimestamp(subHours(new Date(), 2).getTime())}
                            style={[styles.quickTimeChip, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: border }]}
                        >
                            <Text style={[styles.quickTimeText, { color: textS }]}>2 Hours Ago</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                const d = setMinutes(setHours(new Date(), 14), 0);
                                setIncidentTimestamp(d.getTime());
                            }}
                            style={[styles.quickTimeChip, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: border }]}
                        >
                            <Text style={[styles.quickTimeText, { color: textS }]}>Afternoon (2:00 PM)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                const d = setMinutes(setHours(new Date(), 9), 0);
                                setIncidentTimestamp(d.getTime());
                            }}
                            style={[styles.quickTimeChip, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: border }]}
                        >
                            <Text style={[styles.quickTimeText, { color: textS }]}>Morning (9:00 AM)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIncidentTimestamp(subDays(new Date(), 1).getTime())}
                            style={[styles.quickTimeChip, { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: border }]}
                        >
                            <Text style={[styles.quickTimeText, { color: textS }]}>Yesterday</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {!settings.isPremium && (
                    <TouchableOpacity
                        onPress={() => {
                            setPaywallFeature('Unlimited Custom Tags');
                            setPaywallVisible(true);
                        }}
                        style={styles.freeBadgeCard}
                    >
                        <MaterialCommunityIcons name="star-outline" size={16} color={COLORS.primary} />
                        <Text style={styles.freeBadgeText}>
                            Free Tier: Max 10 tags per category • <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>Unlock Unlimited</Text>
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Behavior Section */}
                <Text style={[styles.sectionTitle, { color: textP }]}>What happened?</Text>
                <View style={styles.chipContainer}>
                    {Object.values(BehaviorType).map(b => (
                        renderChip(b, selectedBehaviors.includes(b), () => toggleSelection(b, selectedBehaviors, setSelectedBehaviors, 'Behavior'))
                    ))}
                </View>

                {/* Other Behavior Text / Speech Input */}
                {selectedBehaviors.includes(BehaviorType.Other) && (
                    <View style={[styles.otherBehaviorCard, { backgroundColor: cardBg, borderColor: border }]}>
                        <Text style={[styles.otherBehaviorLabel, { color: textS }]}>
                            Describe what happened (type or dictate):
                        </Text>
                        <View style={styles.otherInputRow}>
                            <TextInput
                                style={[
                                    styles.otherTextInput,
                                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', color: textP, borderColor: border }
                                ]}
                                placeholder="e.g. Throwing toys, refusing to put shoes on..."
                                placeholderTextColor={textS}
                                value={otherBehaviorText}
                                onChangeText={setOtherBehaviorText}
                            />
                            <TouchableOpacity
                                onPress={() => handleOpenSpeechModal('otherBehavior')}
                                style={[
                                    styles.otherMicBtn,
                                    { backgroundColor: otherBehaviorText ? COLORS.success + '20' : '#EFF6FF' }
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={otherBehaviorText ? 'check-circle' : 'microphone'}
                                    size={18}
                                    color={otherBehaviorText ? COLORS.success : COLORS.primary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Intensity Section */}
                <Text style={[styles.sectionTitle, { color: textP, marginTop: SPACING.l }]}>Intensity (1-5)</Text>
                <View style={[styles.intensityContainer, { backgroundColor: cardBg }]}>
                    {[1, 2, 3, 4, 5].map(v => (
                        <TouchableOpacity
                            key={v}
                            style={[
                                styles.intensityButton,
                                { backgroundColor: intensity === v ? COLORS.error : 'transparent' }
                            ]}
                            onPress={() => setIntensity(v)}
                        >
                            <Text style={[styles.intensityText, { color: intensity === v ? '#FFF' : textS }]}>{v}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Text style={[styles.intensityLabel, { color: textS }]}>
                    {intensity === 1 ? 'Mild' : intensity === 5 ? 'Severe' : 'Moderate'}
                </Text>

                {/* Duration Section */}
                <Text style={[styles.sectionTitle, { color: textP, marginTop: SPACING.l }]}>Duration (Minutes)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: cardBg, color: textP, borderColor: border, height: 50 }]}
                    placeholder="e.g. 15"
                    placeholderTextColor={textS}
                    keyboardType="numeric"
                    value={duration}
                    onChangeText={setDuration}
                />

                {/* Triggers Section */}
                <Text style={[styles.sectionTitle, { color: textP, marginTop: SPACING.l }]}>Triggers</Text>
                <View style={styles.chipContainer}>
                    {Object.values(Trigger).map(t => (
                        renderChip(t, selectedTriggers.includes(t), () => toggleSelection(t, selectedTriggers, setSelectedTriggers, 'Trigger'))
                    ))}
                </View>

                {/* Context Section */}
                <Text style={[styles.sectionTitle, { color: textP, marginTop: SPACING.l }]}>Context</Text>
                <View style={[styles.contextCard, { backgroundColor: cardBg, padding: SPACING.m, borderRadius: LAYOUT.borderRadius }]}>
                    <Text style={[styles.subLabel, { color: textS }]}>Location</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: bg, color: textP, borderColor: border, height: 44, marginBottom: SPACING.m }]}
                        placeholder="e.g. Kitchen, Car, Grocery Store"
                        placeholderTextColor={textS}
                        value={location}
                        onChangeText={setLocation}
                    />

                    <Text style={[styles.subLabel, { color: textS }]}>Screen Time Prior to Incident</Text>
                    <View style={styles.chipContainer}>
                        {['None', '<30 mins', '30-60 mins', '1hr+'].map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[
                                    styles.chip,
                                    {
                                        borderColor: screenTime === opt ? COLORS.primary : border,
                                        backgroundColor: screenTime === opt ? COLORS.primary + '20' : 'transparent',
                                        marginBottom: SPACING.m
                                    }
                                ]}
                                onPress={() => setScreenTime(screenTime === opt ? '' : opt)}
                            >
                                <Text style={[styles.chipText, { color: screenTime === opt ? COLORS.primary : textS }]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.subLabel, { color: textS }]}>Prior Night Sleep Quality (1-5)</Text>
                    <View style={[styles.intensityContainer, { backgroundColor: bg, marginBottom: 0 }]}>
                        {[1, 2, 3, 4, 5].map(v => (
                            <TouchableOpacity
                                key={v}
                                style={[
                                    styles.intensityButton,
                                    { backgroundColor: sleepQuality === v ? COLORS.secondary : 'transparent' }
                                ]}
                                onPress={() => setSleepQuality(sleepQuality === v ? undefined : v)}
                            >
                                <Text style={[styles.intensityText, { color: sleepQuality === v ? '#FFF' : textS }]}>{v}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Resolutions Section */}
                <Text style={[styles.sectionTitle, { color: textP, marginTop: SPACING.l }]}>What helped them calm down?</Text>
                <View style={styles.chipContainer}>
                    {Object.values(Resolution).map(r => (
                        renderChip(r, selectedResolutions.includes(r), () => toggleSelection(r, selectedResolutions, setSelectedResolutions, 'Resolution'))
                    ))}
                </View>

                {/* Notes Section with Voice Note Toggle */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.l, marginBottom: SPACING.s }}>
                    <Text style={[styles.sectionTitle, { color: textP, marginBottom: 0 }]}>Notes</Text>
                    <TouchableOpacity
                        onPress={() => handleOpenSpeechModal('note')}
                        style={[
                            styles.dictateBtn,
                            { backgroundColor: spokenNote ? COLORS.success + '20' : '#EFF6FF' }
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={spokenNote ? 'check-circle' : 'microphone'}
                            size={16}
                            color={spokenNote ? COLORS.success : COLORS.primary}
                        />
                        <Text style={[styles.dictateBtnText, { color: spokenNote ? COLORS.success : COLORS.primary }]}>
                            {spokenNote ? 'Voice Note ✓' : `Voice Note ${!settings.isPremium ? '🔒' : ''}`}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TextInput
                    style={[styles.input, { backgroundColor: cardBg, color: textP, borderColor: border }]}
                    placeholder="Describe what helped or how your child responded..."
                    placeholderTextColor={textS}
                    multiline
                    numberOfLines={4}
                    value={note}
                    onChangeText={setNote}
                />

                {/* Optional Photo Attachment */}
                <TouchableOpacity
                    style={[styles.photoCard, { backgroundColor: cardBg, borderColor: border }]}
                    onPress={handlePickPhoto}
                >
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                    ) : (
                        <View style={{ alignItems: 'center', padding: 8 }}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={24} color={COLORS.primary} />
                            <Text style={{ color: textP, fontWeight: '600', marginTop: 4, fontSize: 13 }}>
                                Attach Photo {!settings.isPremium ? '🔒' : ''}
                            </Text>
                            <Text style={{ color: textS, fontSize: 11, marginTop: 2 }}>Document environment, mess, or sensory triggers</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Save / Update Action */}
                <TouchableOpacity style={[styles.calmButton, { backgroundColor: COLORS.primary }]} onPress={handleSave}>
                    <Text style={[styles.calmButtonText, { color: '#FFF' }]}>
                        {isEditing ? 'Update Incident Log' : 'Save Incident Log'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Custom Time Selection Modal */}
            <Modal visible={showTimeModal} transparent animationType="fade" onRequestClose={() => setShowTimeModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.timeModalCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.modalTitle, { color: textP }]}>Select Incident Time</Text>
                        <Text style={[styles.modalSub, { color: textS }]}>
                            Easily backdate logs when recording in the evening:
                        </Text>

                        <View style={{ gap: 8, marginVertical: SPACING.m }}>
                            {[
                                { label: 'Right Now', getTs: () => Date.now() },
                                { label: '1 Hour Ago', getTs: () => subHours(new Date(), 1).getTime() },
                                { label: '3 Hours Ago (Dinner/Evening)', getTs: () => subHours(new Date(), 3).getTime() },
                                { label: 'After School (3:30 PM)', getTs: () => setMinutes(setHours(new Date(), 15), 30).getTime() },
                                { label: 'Bedtime Transition (8:00 PM)', getTs: () => setMinutes(setHours(new Date(), 20), 0).getTime() },
                                { label: 'Yesterday Afternoon', getTs: () => subDays(setMinutes(setHours(new Date(), 14), 0), 1).getTime() },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.label}
                                    style={[styles.timeOptionBtn, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: border }]}
                                    onPress={() => {
                                        setIncidentTimestamp(option.getTs());
                                        setShowTimeModal(false);
                                    }}
                                >
                                    <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.primary} />
                                    <Text style={[styles.timeOptionText, { color: textP }]}>{option.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity onPress={() => setShowTimeModal(false)} style={styles.closeBtn}>
                            <Text style={{ color: textS, fontWeight: '700' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <PaywallModal
                visible={paywallVisible}
                onClose={() => setPaywallVisible(false)}
                triggeredFeatureName={paywallFeature}
            />

            <ReflectionModal
                visible={reflectionVisible}
                onSave={handleSaveReflection}
                onSkip={() => {
                    setReflectionVisible(false);
                    if (pendingIncident) finalizeIncident(pendingIncident);
                }}
            />

            {/* Dictation / Speech Modal for Notes or Other Behavior */}
            <Modal visible={voiceModalVisible} transparent animationType="slide" onRequestClose={handleCancelDictation}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.voiceNoteCard, { backgroundColor: cardBg }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <MaterialCommunityIcons name="microphone-outline" size={22} color={COLORS.primary} />
                            <Text style={[styles.dictationTitle, { color: textP }]}>
                                {speechTarget === 'otherBehavior' ? 'Describe What Happened' : 'Quick Voice Note'}
                            </Text>
                        </View>
                        <Text style={[styles.dictationSub, { color: textS }]}>
                            Type or tap the 🎤 mic on your keyboard to speak.
                        </Text>
                        <TextInput
                            ref={spokenNoteInputRef}
                            style={[
                                styles.voiceNoteInput,
                                { backgroundColor: bg, color: textP, borderColor: COLORS.primary }
                            ]}
                            placeholder={
                                speechTarget === 'otherBehavior'
                                    ? 'e.g. Throwing toys, refusing to put shoes on...'
                                    : 'e.g. Transition from school was rough today, didn’t want to leave…'
                            }
                            placeholderTextColor={textS}
                            multiline
                            autoFocus
                            value={dictationDraft}
                            onChangeText={setDictationDraft}
                            textAlignVertical="top"
                        />
                        <View style={styles.voiceNoteBtnRow}>
                            <TouchableOpacity onPress={handleCancelDictation} style={styles.closeDictationBtn}>
                                <Text style={{ color: textS, fontWeight: '700', fontSize: 15 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveDictation}
                                style={[styles.saveVoiceBtn, { backgroundColor: COLORS.primary }]}
                            >
                                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.m, paddingVertical: SPACING.s,
        borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: SPACING.m },
    childSelectorBar: {
        padding: 10,
        borderRadius: LAYOUT.borderRadius,
        borderWidth: 1,
        marginBottom: SPACING.m,
    },
    childSelectorLabel: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    childSelectorChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    childSelectorChipText: {
        fontSize: 13,
        fontWeight: '700',
    },
    timeCard: {
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        borderWidth: 1,
        marginBottom: SPACING.m,
    },
    timeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeCardTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    changeTimeBtn: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    selectedTimeDisplay: {
        fontSize: 13,
        fontWeight: '700',
        marginTop: 6,
    },
    quickTimeChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
    },
    quickTimeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    freeBadgeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        padding: 10,
        borderRadius: 8,
        marginBottom: SPACING.m,
    },
    freeBadgeText: { fontSize: 13, color: COLORS.primary, marginLeft: 6 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: SPACING.s },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    chipText: { fontSize: 14 },
    otherBehaviorCard: {
        marginTop: SPACING.s,
        padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius,
        borderWidth: 1,
    },
    otherBehaviorLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    otherInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    otherTextInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        minHeight: 42,
    },
    otherMicBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    intensityContainer: {
        flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.s, borderRadius: LAYOUT.borderRadius,
    },
    intensityButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    intensityText: { fontSize: 18, fontWeight: 'bold' },
    intensityLabel: { textAlign: 'center', marginTop: 4, fontSize: 12 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16, height: 80, textAlignVertical: 'top' },
    calmButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: 16, borderRadius: 12, marginTop: SPACING.xl,
    },
    calmButtonText: { fontWeight: 'bold', fontSize: 16 },
    subLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    contextCard: { overflow: 'hidden' },
    dictateBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    dictateBtnText: { fontSize: 12, fontWeight: '700' },
    photoCard: { padding: SPACING.m, borderRadius: LAYOUT.borderRadiusSmall, borderWidth: 1, marginTop: SPACING.m, alignItems: 'center' },
    photoPreview: { width: '100%', height: 160, borderRadius: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: SPACING.m },
    timeModalCard: {
        borderRadius: LAYOUT.borderRadiusLarge,
        padding: SPACING.l,
    },
    modalTitle: { fontSize: 18, fontWeight: '800' },
    modalSub: { fontSize: 12, marginTop: 4 },
    timeOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 10,
    },
    timeOptionText: { fontSize: 14, fontWeight: '600' },
    closeBtn: { alignItems: 'center', paddingVertical: 10, marginTop: 6 },
    voiceNoteCard: {
        borderRadius: LAYOUT.borderRadiusLarge,
        padding: SPACING.l,
        width: '100%',
    },
    voiceNoteInput: {
        borderWidth: 1.5,
        borderRadius: LAYOUT.borderRadiusSmall,
        padding: 12,
        fontSize: 15,
        minHeight: 100,
        marginTop: SPACING.s,
        marginBottom: SPACING.m,
        textAlignVertical: 'top',
    },
    voiceNoteBtnRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
    },
    saveVoiceBtn: {
        paddingVertical: 11,
        paddingHorizontal: 20,
        borderRadius: LAYOUT.borderRadiusSmall,
    },
    dictationTitle: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
    dictationSub: { fontSize: 13, lineHeight: 18, marginBottom: SPACING.s },
    closeDictationBtn: { paddingVertical: 10, paddingHorizontal: 16 },
});
