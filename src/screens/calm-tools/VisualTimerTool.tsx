import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, LAYOUT, getColor } from '../../constants/theme';
import { useUser } from '../../context/UserContext';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { PaywallModal } from '../PaywallModal';

const SIZE = 240;
const STROKE_WIDTH = 18;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;

const THEMES = {
  blue: { name: 'Calm Blue', color: '#3B82F6', bg: '#EFF6FF' },
  sunset: { name: 'Sunset Glow', color: '#F59E0B', bg: '#FEF3C7' },
  forest: { name: 'Forest Breeze', color: '#10B981', bg: '#ECFDF5' },
};

export const VisualTimerTool = ({ navigation }: any) => {
  const { settings, saveTimerLengths, setTimerTheme } = useUser();
  const isDark = settings.theme === 'dark';
  const bg = getColor('background', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);
  const cardBg = getColor('cardBackground', isDark);

  const [durationMins, setDurationMins] = useState(5);
  const [timeLeftSecs, setTimeLeftSecs] = useState(5 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('');

  const currentTheme = THEMES[settings.timerTheme || 'blue'];
  const favLengths = settings.favoriteTimerLengths || [3, 5, 10];

  // Reanimated values for pulse animation
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    let timer: any = null;
    if (isActive && timeLeftSecs > 0) {
      timer = setInterval(() => {
        setTimeLeftSecs((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      pulseScale.value = withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.ease }),
        withTiming(1.0, { duration: 1000, easing: Easing.ease })
      );
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeftSecs]);

  const handleFinish = async () => {
    setIsActive(false);
    setIsCompleted(true);

    if (settings.hapticsEnabled !== false) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        // Fallback if haptics unavailable
      }
    }
  };

  const handleSelectDuration = (mins: number) => {
    if (!settings.isPremium && mins > 5) {
      setPaywallFeature('Custom Timer Lengths up to 30 mins');
      setPaywallVisible(true);
      return;
    }
    setDurationMins(mins);
    setTimeLeftSecs(mins * 60);
    setIsActive(false);
    setIsCompleted(false);
  };

  const handleSelectTheme = (themeKey: 'blue' | 'sunset' | 'forest') => {
    if (!settings.isPremium && themeKey !== 'blue') {
      setPaywallFeature('Extra Timer Themes');
      setPaywallVisible(true);
      return;
    }
    setTimerTheme(themeKey);
  };

  const toggleTimer = () => {
    if (isCompleted) {
      setTimeLeftSecs(durationMins * 60);
      setIsCompleted(false);
      setIsActive(true);
    } else {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsCompleted(false);
    setTimeLeftSecs(durationMins * 60);
  };

  const handleSaveFavoritePreset = () => {
    if (!settings.isPremium) {
      setPaywallFeature('Saved Timer Presets');
      setPaywallVisible(true);
      return;
    }
    if (!favLengths.includes(durationMins)) {
      const updated = [...favLengths, durationMins].sort((a, b) => a - b);
      saveTimerLengths(updated);
      Alert.alert('Saved!', `Added ${durationMins} min preset to your favorites.`);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = durationMins > 0 ? timeLeftSecs / (durationMins * 60) : 0;

  const path = Skia.Path.Make();
  path.addCircle(CENTER, CENTER, RADIUS);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={28} color={textP} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textP }]}>Visual Timer</Text>
        <TouchableOpacity onPress={handleSaveFavoritePreset} style={styles.starBtn}>
          <MaterialCommunityIcons
            name={favLengths.includes(durationMins) ? 'star' : 'star-outline'}
            size={24}
            color={favLengths.includes(durationMins) ? '#F59E0B' : textS}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Preset Selector */}
        <Text style={[styles.sectionTitle, { color: textS }]}>Quick Presets (Minutes)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
          {[1, 3, 5, 10, 15, 20, 30].map((mins) => {
            const isLocked = !settings.isPremium && mins > 5;
            const isSelected = durationMins === mins;
            return (
              <TouchableOpacity
                key={mins}
                onPress={() => handleSelectDuration(mins)}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: isSelected ? currentTheme.color : cardBg,
                    borderColor: isSelected ? currentTheme.color : getColor('border', isDark),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    { color: isSelected ? '#FFFFFF' : textP },
                  ]}
                >
                  {mins}m {isLocked ? '🔒' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Circular Countdown Display */}
        <View style={styles.timerContainer}>
          <Animated.View style={[{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }, animatedStyle]}>
            <Canvas style={{ width: SIZE, height: SIZE, position: 'absolute' }}>
              {/* Ring Background */}
              <Path
                path={path}
                color={isDark ? '#334155' : '#E2E8F0'}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
              />
              {/* Active Ring */}
              <Path
                path={path}
                color={currentTheme.color}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
                start={0}
                end={progress}
                strokeCap="round"
              />
            </Canvas>

            <View style={styles.innerClock}>
              <Text style={[styles.timerNumber, { color: textP }]}>
                {formatTime(timeLeftSecs)}
              </Text>
              <Text style={[styles.timerStatus, { color: textS }]}>
                {isActive ? 'Breathing & Staying Calm' : isCompleted ? 'Complete!' : 'Ready'}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Subtle Completion Celebration Message */}
        {isCompleted && (
          <View style={[styles.celebrationCard, { backgroundColor: currentTheme.bg }]}>
            <MaterialCommunityIcons name="star-face" size={48} color={currentTheme.color} />
            <Text style={[styles.celebrationTitle, { color: currentTheme.color }]}>Great Job!</Text>
            <Text style={[styles.celebrationSub, { color: textP }]}>
              You stayed focused and completed your calm time. 🌟
            </Text>
          </View>
        )}

        {/* Theme Picker */}
        <Text style={[styles.sectionTitle, { color: textS, marginTop: SPACING.l }]}>Visual Themes</Text>
        <View style={styles.themeRow}>
          {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((tKey) => {
            const themeObj = THEMES[tKey];
            const isSelected = settings.timerTheme === tKey || (!settings.timerTheme && tKey === 'blue');
            const isLocked = !settings.isPremium && tKey !== 'blue';
            return (
              <TouchableOpacity
                key={tKey}
                onPress={() => handleSelectTheme(tKey)}
                style={[
                  styles.themeChip,
                  {
                    backgroundColor: themeObj.bg,
                    borderColor: isSelected ? themeObj.color : 'transparent',
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.themeDot, { backgroundColor: themeObj.color }]} />
                <Text style={[styles.themeText, { color: COLORS.text }]}>
                  {themeObj.name} {isLocked ? '🔒' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={toggleTimer}
            style={[styles.primaryBtn, { backgroundColor: currentTheme.color }]}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isActive ? 'pause' : isCompleted ? 'replay' : 'play'}
              size={24}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryBtnText}>
              {isActive ? 'Pause' : isCompleted ? 'Restart' : 'Start Timer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={resetTimer} style={[styles.secondaryBtn, { backgroundColor: cardBg }]}>
            <Text style={[styles.secondaryBtnText, { color: textS }]}>Reset</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  closeButton: { padding: 4 },
  title: { fontSize: 20, fontWeight: '800' },
  starBtn: { padding: 4 },
  scrollContent: { padding: SPACING.m, alignItems: 'center' },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: SPACING.s,
    textTransform: 'uppercase',
  },
  presetRow: { flexDirection: 'row', width: '100%', marginBottom: SPACING.l },
  presetChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  presetChipText: { fontSize: 14, fontWeight: '700' },
  timerContainer: {
    marginVertical: SPACING.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerClock: { alignItems: 'center' },
  timerNumber: { fontSize: 44, fontWeight: '900', letterSpacing: 1 },
  timerStatus: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  celebrationCard: {
    width: '100%',
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius,
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  celebrationTitle: { fontSize: 20, fontWeight: '900', marginTop: 4 },
  celebrationSub: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: SPACING.xl },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  themeDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  themeText: { fontSize: 13, fontWeight: '700' },
  controlsRow: { width: '100%', gap: 10 },
  primaryBtn: {
    height: 52,
    borderRadius: LAYOUT.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  secondaryBtn: {
    height: 48,
    borderRadius: LAYOUT.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700' },
});
