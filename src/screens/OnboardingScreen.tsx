import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  useColorScheme,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Track & Spot Patterns',
    subtitle: 'Quickly log incidents in seconds',
    description:
      'Log behaviors, triggers, and intensity quickly during or after tough moments. Gain clarity on what drives your child’s emotional swings.',
    iconName: 'clipboard-text-clock-outline',
    iconColor: '#3B82F6',
  },
  {
    id: '2',
    title: 'Calm-Down Tools',
    subtitle: 'Access interactive coping exercises',
    description:
      'Guide your child through deep breathing, visual timers, candle blowing, and muscle relaxation designed specifically for young minds.',
    iconName: 'spa-outline',
    iconColor: '#10B981',
  },
  {
    id: '3',
    title: 'Discover What Works',
    subtitle: 'Uncover actionable triggers & solutions',
    description:
      'Identify recurring triggers like sensory overload or routine changes and see which resolution strategies prove most effective over time.',
    iconName: 'lightbulb-on-outline',
    iconColor: '#F59E0B',
  },
  {
    id: '4',
    title: 'Export for Care Providers',
    subtitle: 'Share clear reports with therapists & doctors',
    description:
      'Export comprehensive PDF and CSV reports summarizing incidents, patterns, and progress to bring straight to your next appointments.',
    iconName: 'file-document-outline',
    iconColor: '#8B5CF6',
  },
];

export const OnboardingScreen: React.FC = () => {
  const { updateSettings } = useUser();
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const bg = getColor('background', isDark);
  const cardBg = getColor('cardBackground', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);

  const handleComplete = async () => {
    await updateSettings({ onboardingCompleted: true });
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconContainer, { backgroundColor: item.iconColor + '15' }]}>
        <MaterialCommunityIcons name={item.iconName} size={84} color={item.iconColor} />
      </View>
      <Text style={[styles.title, { color: textP }]}>{item.title}</Text>
      <Text style={[styles.subtitle, { color: item.iconColor }]}>{item.subtitle}</Text>
      <Text style={[styles.description, { color: textS }]}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header Skip button */}
      <View style={styles.header}>
        <Text style={styles.logoBadge}>Mood Monsters</Text>
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: textS }]}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? COLORS.primary : isDark ? '#334155' : '#CBD5E1',
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <MaterialCommunityIcons
            name={currentIndex === SLIDES.length - 1 ? 'check' : 'arrow-right'}
            size={20}
            color="#FFFFFF"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  logoBadge: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.s,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.m,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: SPACING.m,
  },
  footer: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButton: {
    width: '100%',
    height: 52,
    borderRadius: LAYOUT.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
