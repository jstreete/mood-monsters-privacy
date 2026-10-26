import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, LAYOUT, getColor } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import Animated, { useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated';

export const MuscleRelaxationTool = ({ navigation }: any) => {
    const { settings } = useUser();
    const isDark = settings.theme === 'dark';
    const bg = getColor('background', isDark);
    const textP = getColor('textPrimary', isDark);
    const textS = getColor('textSecondary', isDark);
    const cardBg = getColor('cardBackground', isDark);

    const [step, setStep] = useState(0);
    const steps = [
        "Find a comfortable position.",
        "Squeeze your hands into fists...",
        "Hold tight for 5 seconds...",
        "Release and feel the tension leave.",
        "Raise your shoulders to your ears...",
        "Hold... then drop them down.",
        "Great job! You are relaxed."
    ];

    const nextStep = () => {
        if (step < steps.length - 1) setStep(step + 1);
        else navigation.goBack();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={32} color={textP} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: textP }]}>Muscle Relaxation</Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.card, { backgroundColor: cardBg }]}>
                    <Text style={[styles.stepText, { color: textP }]}>{steps[step]}</Text>
                </View>

                <TouchableOpacity onPress={nextStep} style={[styles.button, { backgroundColor: COLORS.primary }]}>
                    <Text style={styles.buttonText}>{step === steps.length - 1 ? 'Finish' : 'Next'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: SPACING.m, flexDirection: 'row', alignItems: 'center' },
    closeButton: { marginRight: SPACING.m },
    title: { fontSize: 24, fontWeight: 'bold' },
    content: { flex: 1, padding: SPACING.xl, justifyContent: 'center', alignItems: 'center' },
    card: {
        padding: SPACING.xl, borderRadius: LAYOUT.borderRadius,
        alignItems: 'center', justifyContent: 'center',
        width: '100%', minHeight: 200, marginBottom: 40
    },
    stepText: { fontSize: 24, textAlign: 'center', fontWeight: 'bold' },
    button: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
