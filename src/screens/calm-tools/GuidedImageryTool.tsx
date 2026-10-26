import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, LAYOUT, getColor } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import { PaywallModal } from '../PaywallModal';

interface GuidedStep {
  title: string;
  instruction: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const CLOUD_JOURNEY: GuidedStep[] = [
  {
    title: 'Find Your Soft Cloud',
    instruction: 'Close your eyes gently. Imagine resting on a warm, fluffy white cloud high in the sky.',
    icon: 'cloud-outline',
  },
  {
    title: 'Breathe In Peace',
    instruction: 'Take a slow deep breath in. Feel the soft breeze around your cloud relaxing your shoulders.',
    icon: 'weather-windy',
  },
  {
    title: 'Floating High Above',
    instruction: 'Watch any noisy or stressful thoughts drift away like tiny autumn leaves below.',
    icon: 'image-filter-hdr',
  },
  {
    title: 'Resting Safe & Calm',
    instruction: 'Feel quiet, safe, and peaceful. You can return to your cloud whenever you need quiet time.',
    icon: 'heart-outline',
  },
];

import { useColorScheme } from 'react-native';

export const GuidedImageryTool = ({ navigation }: any) => {
  const { settings } = useUser();
  const systemColorScheme = useColorScheme();
  const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';
  const bg = getColor('background', isDark);
  const cardBg = getColor('cardBackground', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);

  const [currentStep, setCurrentStep] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const step = CLOUD_JOURNEY[currentStep];

  const handleNext = () => {
    if (!settings.isPremium) {
      setPaywallVisible(true);
      return;
    }
    if (currentStep < CLOUD_JOURNEY.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={28} color={textP} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textP }]}>Guided Imagery</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Step Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Step {currentStep + 1} of {CLOUD_JOURNEY.length}</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name={step.icon} size={64} color={COLORS.primary} />
          </View>

          <Text style={[styles.stepTitle, { color: textP }]}>{step.title}</Text>
          <Text style={[styles.instruction, { color: textS }]}>{step.instruction}</Text>
        </View>

        {/* Progress Dots */}
        <View style={styles.dotsRow}>
          {CLOUD_JOURNEY.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor: idx === currentStep ? COLORS.primary : isDark ? '#334155' : '#CBD5E1',
                  width: idx === currentStep ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.nextBtn, { backgroundColor: COLORS.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {currentStep === CLOUD_JOURNEY.length - 1 ? 'Finish Exercise' : 'Next Step'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        triggeredFeatureName="Guided Imagery Exercises"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  closeButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  content: { padding: SPACING.l, alignItems: 'center' },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: SPACING.l,
  },
  badgeText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  card: {
    width: '100%',
    padding: SPACING.xl,
    borderRadius: LAYOUT.borderRadiusLarge,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    elevation: 3,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
  },
  stepTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: SPACING.m },
  instruction: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', marginBottom: SPACING.xl },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  nextBtn: {
    width: '100%',
    height: 52,
    borderRadius: LAYOUT.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
