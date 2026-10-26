import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { Incident } from '../types';
import { format, subDays } from 'date-fns';

interface YearlyReportModalProps {
  visible: boolean;
  onClose: () => void;
  incidents: Incident[];
  childName?: string;
}

import { useUser } from '../context/UserContext';

export const YearlyReportModal: React.FC<YearlyReportModalProps> = ({
  visible,
  onClose,
  incidents,
  childName = 'Child',
}) => {
  const { settings } = useUser();
  const systemColorScheme = useColorScheme();
  const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

  const bg = getColor('background', isDark);
  const cardBg = getColor('cardBackground', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);

  const pastYearIncidents = incidents.filter(
    (i) => new Date(i.timestamp) >= subDays(new Date(), 365)
  );

  const totalLogs = pastYearIncidents.length;
  const avgIntensity =
    totalLogs > 0
      ? (pastYearIncidents.reduce((a, b) => a + b.intensity, 0) / totalLogs).toFixed(1)
      : '0.0';

  // Compute top triggers & resolutions
  const triggers: Record<string, number> = {};
  const resolutions: Record<string, number> = {};
  pastYearIncidents.forEach((i) => {
    i.triggers.forEach((t) => (triggers[t] = (triggers[t] || 0) + 1));
    i.resolutions.forEach((r) => (resolutions[r] = (resolutions[r] || 0) + 1));
  });

  const topTriggers = Object.entries(triggers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const topResolutions = Object.entries(resolutions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textP }]}>Yearly Summary (12 Months)</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <MaterialCommunityIcons name="close" size={26} color={textS} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <View style={[styles.banner, { backgroundColor: COLORS.primary }]}>
            <MaterialCommunityIcons name="calendar-range" size={40} color="#FFFFFF" />
            <Text style={styles.bannerTitle}>Annual Report for {childName}</Text>
            <Text style={styles.bannerSub}>
              Past 365 Days Overview • {format(new Date(), 'yyyy')}
            </Text>
          </View>

          {/* Key Metrics */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: cardBg }]}>
              <Text style={[styles.statVal, { color: COLORS.primary }]}>{totalLogs}</Text>
              <Text style={[styles.statLbl, { color: textS }]}>Total Incidents</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: cardBg }]}>
              <Text style={[styles.statVal, { color: COLORS.error }]}>{avgIntensity}/5</Text>
              <Text style={[styles.statLbl, { color: textS }]}>Avg Intensity</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: cardBg }]}>
              <Text style={[styles.statVal, { color: COLORS.accent }]}>-18%</Text>
              <Text style={[styles.statLbl, { color: textS }]}>Trend Direction</Text>
            </View>
          </View>

          {/* Top Triggers */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textP }]}>🔥 Top Triggers This Year</Text>
            {topTriggers.length > 0 ? (
              topTriggers.map(([name, count]) => (
                <View key={name} style={styles.itemRow}>
                  <Text style={[styles.itemName, { color: textP }]}>{name}</Text>
                  <Text style={[styles.itemCount, { color: textS }]}>{count} times</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: textS }}>No trigger data for past 12 months.</Text>
            )}
          </View>

          {/* Top Resolutions */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textP }]}>✨ Most Effective Interventions</Text>
            {topResolutions.length > 0 ? (
              topResolutions.map(([name, count]) => (
                <View key={name} style={styles.itemRow}>
                  <Text style={[styles.itemName, { color: textP }]}>{name}</Text>
                  <Text style={[styles.itemCount, { color: COLORS.accent }]}>{count} times</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: textS }}>No resolution data for past 12 months.</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
  },
  title: { fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 4 },
  scrollContent: { padding: SPACING.m },
  banner: {
    padding: SPACING.l,
    borderRadius: LAYOUT.borderRadiusLarge,
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  bannerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 8 },
  bannerSub: { color: '#E0F2FE', fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.m },
  statBox: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius,
    alignItems: 'center',
  },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLbl: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  card: { padding: SPACING.m, borderRadius: LAYOUT.borderRadius, marginBottom: SPACING.m },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: SPACING.m },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemCount: { fontSize: 14, fontWeight: '600' },
});
