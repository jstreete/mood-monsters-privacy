import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { Incident } from '../types';

interface MatrixProps {
  incidents: Incident[];
}

export const TriggerResolutionMatrix: React.FC<MatrixProps> = ({ incidents }) => {
  const { settings } = useUser();
  const systemColorScheme = useColorScheme();
  const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

  const cardBg = getColor('cardBackground', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);
  const borderC = getColor('border', isDark);

  // Compute trigger to resolution mappings
  const matrix: Record<string, Record<string, number>> = {};

  incidents.forEach((inc) => {
    (inc.triggers || []).filter((t): t is string => typeof t === 'string' && t.trim().length > 0).forEach((trig) => {
      if (!matrix[trig]) matrix[trig] = {};
      (inc.resolutions || []).filter((r): r is string => typeof r === 'string' && r.trim().length > 0).forEach((res) => {
        matrix[trig][res] = (matrix[trig][res] || 0) + 1;
      });
    });
  });

  const triggerEntries = Object.entries(matrix).slice(0, 4);

  if (triggerEntries.length === 0) {
    return (
      <View style={[styles.card, { backgroundColor: cardBg }]}>
        <Text style={[styles.title, { color: textP }]}>What Works Best by Trigger</Text>
        <Text style={{ color: textS, fontSize: 13, marginTop: 4 }}>
          Log incidents with triggers and resolutions to discover which calming strategies help your child most.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: cardBg }]}>
      <Text style={[styles.title, { color: textP }]}>What Works Best by Trigger</Text>
      <Text style={[styles.sub, { color: textS }]}>
        See which calming strategies helped most for each specific trigger.
      </Text>

      <View style={styles.table}>
        {triggerEntries.map(([trigger, resolutions]) => {
          const topRes = Object.entries(resolutions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2);

          return (
            <View key={trigger} style={[styles.row, { borderBottomColor: borderC }]}>
              <View style={styles.triggerCol}>
                <Text style={[styles.triggerText, { color: textP }]}>{trigger}</Text>
              </View>
              <View style={styles.resolutionCol}>
                {topRes.length > 0 ? (
                  topRes.map(([res, count]) => (
                    <View
                      key={res}
                      style={[
                        styles.resBadge,
                        { backgroundColor: isDark ? '#1e293b' : '#EFF6FF', borderColor: isDark ? '#334155' : '#DBEAFE', borderWidth: 1 }
                      ]}
                    >
                      <Text style={[styles.resBadgeText, { color: isDark ? '#93C5FD' : COLORS.primary }]}>
                        {res} ({count}×)
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: textS, fontSize: 12 }}>No resolution logged</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.m,
    borderRadius: LAYOUT.borderRadius,
    marginBottom: SPACING.m,
  },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  sub: { fontSize: 12, marginBottom: SPACING.m },
  table: { width: '100%' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  triggerCol: { width: '40%', paddingRight: 8 },
  triggerText: { fontSize: 13, fontWeight: '700' },
  resolutionCol: { width: '60%', flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  resBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  resBadgeText: { fontSize: 11, fontWeight: '700' },
});
