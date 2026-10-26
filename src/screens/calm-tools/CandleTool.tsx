import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/theme';

export const CandleTool = ({ navigation }: any) => {
    const [candles, setCandles] = useState([true, true, true, true, true]);

    const blowCandle = (index: number) => {
        if (!candles[index]) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const newCandles = [...candles];
        newCandles[index] = false;
        setCandles(newCandles);

        if (newCandles.every(c => !c)) {
            // All out
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
                // Reset optional?
            }, 1000);
        }
    };

    const resetCandles = () => {
        setCandles([true, true, true, true, true]);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={32} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.title}>Blow Out The Candles</Text>
            <Text style={styles.subtitle}>Take a deep breath and tap a candle to blow it out.</Text>

            <View style={styles.candleContainer}>
                {candles.map((isLit, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.candleWrapper}
                        onPress={() => blowCandle(index)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.flameContainer}>
                            {isLit && <MaterialCommunityIcons name="fire" size={40} color="#FFD700" />}
                        </View>
                        <View style={styles.candleStick} />
                    </TouchableOpacity>
                ))}
            </View>

            {!candles.some(c => c) && (
                <TouchableOpacity style={styles.resetButton} onPress={resetCandles}>
                    <Text style={styles.resetText}>Light Again</Text>
                    <MaterialCommunityIcons name="refresh" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2D3748', // Dark background for contrast
        alignItems: 'center',
        paddingTop: 100,
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 60,
    },
    candleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 20,
    },
    candleWrapper: {
        alignItems: 'center',
    },
    flameContainer: {
        height: 50,
        justifyContent: 'center',
    },
    candleStick: {
        width: 20,
        height: 100,
        backgroundColor: '#FFF',
        borderRadius: 4,
    },
    resetButton: {
        marginTop: 60,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    resetText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
