import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const BreathingTool = ({ navigation }: any) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(0.3);
    const textOpacity = useSharedValue(1);
    const [phase, setPhase] = React.useState('Inhale');

    useEffect(() => {
        const breathe = async () => {
            // Inhale (4s)
            setPhase('Inhale');
            scale.value = withTiming(2, { duration: 4000, easing: Easing.inOut(Easing.ease) });
            opacity.value = withTiming(0.8, { duration: 4000 });
            await new Promise(r => setTimeout(r, 4000));
            Haptics.selectionAsync();

            // Hold (4s)
            setPhase('Hold');
            await new Promise(r => setTimeout(r, 4000));
            Haptics.selectionAsync();

            // Exhale (4s)
            setPhase('Exhale');
            scale.value = withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) });
            opacity.value = withTiming(0.3, { duration: 4000 });
            await new Promise(r => setTimeout(r, 4000));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Loop if component still mounted (useEffect cleanup handles this implicitly via unmount check usually, 
            // but for simple recursion we rely on state updates or just looping animation)
            // Reanimated handles loops better, but for text synchronization, JS interval or recursion is decent.
            breathe();
        };
        breathe();

        return () => {
            // Cleanup
        };
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={32} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.centerContent}>
                <Animated.View style={[styles.circle, animatedStyle]} />
                <Text style={styles.phaseText}>{phase}</Text>
            </View>

            <Text style={styles.instruction}>Follow the circle. Breathe in as it expands, out as it shrinks.</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F9FF', // Very light blue
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 300,
        height: 300,
    },
    circle: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: COLORS.primary, // Fixed
        position: 'absolute',
    },
    phaseText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text, // Fixed
        zIndex: 2,
    },
    instruction: {
        marginTop: 60,
        fontSize: 16,
        color: COLORS.subtext, // Fixed
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
