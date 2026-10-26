import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  useColorScheme,
  Alert,
  Switch,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { subscriptionService, SUBSCRIPTION_PLANS, SubscriptionPackage } from '../services/subscriptionService';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  triggeredFeatureName?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  triggeredFeatureName,
}) => {
  const { settings, updateSettings, togglePremium } = useUser();
  const systemColorScheme = useColorScheme();
  const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPackage>(SUBSCRIPTION_PLANS[1]); // Default Annual
  const [loading, setLoading] = useState(false);

  const bg = getColor('background', isDark);
  const cardBg = getColor('cardBackground', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);
  const borderC = getColor('border', isDark);

  const handlePurchase = async () => {
    setLoading(true);
    const success = await subscriptionService.purchasePackage(selectedPlan);
    setLoading(false);
    if (success) {
      await updateSettings({ isPremium: true });
      Alert.alert(
        'Welcome to Premium! 🎉',
        'Your 7-day free trial is now active. All premium features, custom tags, and PDF reports are unlocked.',
        [{ text: 'Awesome!', onPress: onClose }]
      );
    } else {
      Alert.alert('Subscription Failed', 'Unable to complete transaction. Please try again.');
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    const restored = await subscriptionService.restorePurchases();
    setLoading(false);
    if (restored) {
      await updateSettings({ isPremium: true });
      Alert.alert('Purchases Restored', 'Your premium entitlement has been successfully restored.');
    } else {
      Alert.alert('No Subscription Found', 'We could not find an active subscription associated with your account.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textP }]}>Mood Monsters Pro</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={24} color={textS} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Trigger Banner (if opened via feature lock) */}
          {triggeredFeatureName ? (
            <View style={styles.triggerBanner}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.primary} />
              <Text style={styles.triggerText}>
                Unlock <Text style={{ fontWeight: '700' }}>{triggeredFeatureName}</Text> with Premium
              </Text>
            </View>
          ) : null}

          {/* Value Prop Banner */}
          <View style={[styles.heroCard, { backgroundColor: COLORS.primary }]}>
            <MaterialCommunityIcons name="crown" size={42} color="#FBBF24" />
            <Text style={styles.heroTitle}>Support Your Child's Journey</Text>
            <Text style={styles.heroSubtitle}>
              Unlock comprehensive analytics, unlimited tags, therapist PDF reports, and automated export reminders.
            </Text>
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>✨ 7-Day Free Trial Included</Text>
            </View>
          </View>

          {/* Feature Comparison Matrix */}
          <Text style={[styles.sectionTitle, { color: textP }]}>What's Included</Text>

          <View style={[styles.featureList, { backgroundColor: cardBg, borderColor: borderC }]}>
            <FeatureRow
              icon="tag-multiple"
              title="Custom Behaviors & Tags"
              freeText="Max 10 per category"
              proText="Unlimited"
              isDark={isDark}
            />
            <FeatureRow
              icon="chart-timeline-variant"
              title="Chart Timeframes"
              freeText="Weekly view only"
              proText="Monthly, Yearly & Trends"
              isDark={isDark}
            />
            <FeatureRow
              icon="file-pdf-box"
              title="Therapist Reports"
              freeText="Basic Text/CSV"
              proText="Full PDF Reports & Insights"
              isDark={isDark}
            />
            <FeatureRow
              icon="calendar-sync"
              title="Export Reminders"
              freeText="Manual only"
              proText="Automated Reminders"
              isDark={isDark}
            />
          </View>

          {/* Plan Picker */}
          <Text style={[styles.sectionTitle, { color: textP }]}>Choose Your Plan</Text>

          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlan.id === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelectedPlan(plan)}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: isSelected ? COLORS.primary : borderC,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                activeOpacity={0.8}
              >
                {plan.period === 'annual' && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>SAVE 28%</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planTitle, { color: textP }]}>{plan.title}</Text>
                    <Text style={[styles.planDescription, { color: textS }]}>{plan.description}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24}
                    color={isSelected ? COLORS.primary : textS}
                  />
                </View>
                <Text style={[styles.planPrice, { color: COLORS.primary }]}>{plan.priceString}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Developer Sandbox Toggle */}
          <View style={[styles.devToggleCard, { backgroundColor: cardBg, borderColor: borderC }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.devToggleTitle, { color: textP }]}>Developer Test Mode</Text>
              <Text style={[styles.devToggleSub, { color: textS }]}>
                Toggle Premium state instantly for phone testing
              </Text>
            </View>
            <Switch
              value={settings.isPremium}
              onValueChange={async () => {
                await togglePremium();
                Alert.alert('Status Updated', `Premium is now ${!settings.isPremium ? 'ENABLED' : 'DISABLED'}`);
              }}
            />
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: borderC }]}>
          <TouchableOpacity
            onPress={handlePurchase}
            disabled={loading}
            style={[styles.subscribeButton, { backgroundColor: COLORS.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.subscribeButtonText}>
              {loading ? 'Processing...' : 'Start 7-Day Free Trial'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
            <Text style={[styles.restoreText, { color: textS }]}>Restore Purchases</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const FeatureRow: React.FC<{
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  freeText: string;
  proText: string;
  isDark: boolean;
}> = ({ icon, title, freeText, proText, isDark }) => {
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);

  return (
    <View style={styles.featureRow}>
      <MaterialCommunityIcons name={icon} size={22} color={COLORS.primary} style={styles.featureIcon} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.featureTitle, { color: textP }]}>{title}</Text>
        <View style={styles.badgeRow}>
          <Text style={[styles.freeBadge, { color: textS }]}>Free: {freeText}</Text>
          <Text style={[styles.proBadge, { color: COLORS.accent }]}>Pro: {proText}</Text>
        </View>
      </View>
    </View>
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
    paddingVertical: SPACING.m,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  scrollContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  triggerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadiusSmall,
    marginBottom: SPACING.m,
  },
  triggerText: {
    marginLeft: SPACING.s,
    color: COLORS.primary,
    fontSize: 14,
  },
  heroCard: {
    borderRadius: LAYOUT.borderRadiusLarge,
    padding: SPACING.l,
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: SPACING.s,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: '#E0F2FE',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.m,
  },
  trialBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
  },
  trialBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: SPACING.m,
    marginTop: SPACING.s,
  },
  featureList: {
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    padding: SPACING.m,
    marginBottom: SPACING.l,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.m,
  },
  featureIcon: {
    marginRight: SPACING.m,
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  freeBadge: {
    fontSize: 12,
    marginRight: SPACING.m,
  },
  proBadge: {
    fontSize: 12,
    fontWeight: '700',
  },
  planCard: {
    borderRadius: LAYOUT.borderRadius,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    position: 'relative',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  planDescription: {
    fontSize: 13,
    marginBottom: SPACING.s,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: SPACING.xs,
  },
  devToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius,
    borderWidth: 1,
    marginTop: SPACING.s,
  },
  devToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  devToggleSub: {
    fontSize: 12,
  },
  footer: {
    padding: SPACING.l,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  subscribeButton: {
    width: '100%',
    height: 52,
    borderRadius: LAYOUT.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.s,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  restoreButton: {
    paddingVertical: SPACING.xs,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
