import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export const GroundingTool = ({ navigation }: any) => {
    const steps = [
        { count: 5, text: "Things you see", icon: "eye" },
        { count: 4, text: "Things you can touch", icon: "hand-left" },
        { count: 3, text: "Things you hear", icon: "ear-hearing" },
        { count: 2, text: "Things you can smell", icon: "scent" },
        { count: 1, text: "Thing you can taste", icon: "food-apple" },
    ];

    const [currentStep, setCurrentStep] = useState(0);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={32} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.progressContainer}>
                {steps.map((_, i) => (
                    <View key={i} style={[styles.dot, i === currentStep && styles.activeDot, i < currentStep && styles.completedDot]} />
                ))}
            </View>

            <View style={styles.content}>
                <Text style={styles.number}>{steps[currentStep].count}</Text>
                <MaterialCommunityIcons name={steps[currentStep].icon as any} size={60} color={COLORS.primary} style={styles.icon} />
                <Text style={styles.title}>{steps[currentStep].text}</Text>
                <Text style={styles.instruction}>Look around and name them out loud.</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
                <Text style={styles.buttonText}>{currentStep === steps.length - 1 ? "Done" : "Next"}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        alignItems: 'center',
        paddingTop: 80,
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 40,
    },
    dot: {
        width: 10, height: 10, borderRadius: 5, backgroundColor: '#E2E8F0',
    },
    activeDot: {
        backgroundColor: COLORS.primary, width: 20,
    },
    completedDot: {
        backgroundColor: COLORS.success,
    },
    content: {
        alignItems: 'center',
        marginBottom: 60,
    },
    number: {
        fontSize: 120,
        fontWeight: 'bold',
        color: COLORS.secondary,
        opacity: 0.2,
        position: 'absolute',
        top: -40,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text, // Fixed
        marginBottom: 10,
    },
    instruction: {
        fontSize: 16,
        color: COLORS.subtext, // Fixed
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
