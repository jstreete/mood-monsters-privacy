import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { Incident } from '../types';
import { generateAndSharePDFReport, generateAndShareCSVReport } from '../utils/pdfReportGenerator';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  incidents: Incident[];
  childName?: string;
  isPremium?: boolean;
  onUpgradePress?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  visible,
  onClose,
  incidents,
  childName = 'Child',
  isPremium = false,
  onUpgradePress,
}) => {
  const systemColorScheme = useColorScheme();
  const isDark = systemColorScheme === 'dark';

  const [timeframe, setTimeframe] = useState<7 | 30 | 90 | 0>(30);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [loading, setLoading] = useState(false);

  const bg = getColor('background', isDark);
  const cardBg = getColor('cardBackground', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);

  const handleExport = async () => {
    if (!isPremium) {
      onClose();
      onUpgradePress?.();
      return;
    }

    if (incidents.length === 0) {
      Alert.alert('No Incidents', 'There are no incident logs recorded yet to export.');
      return;
    }

    setLoading(true);
    try {
      if (exportFormat === 'pdf') {
        await generateAndSharePDFReport(incidents, {
          timeframeDays: timeframe,
          childName,
        });
      } else {
        await generateAndShareCSVReport(incidents, {
          timeframeDays: timeframe,
          childName,
        });
      }
      onClose();
    } catch (err: any) {
      Alert.alert('Export Error', err?.message || 'Unable to generate report at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconWrap, { backgroundColor: COLORS.primary + '18' }]}>
                <MaterialCommunityIcons name="file-document-edit-outline" size={24} color={COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.title, { color: textP }]}>Export Clinical Report</Text>
                <Text style={[styles.subtitle, { color: textS }]}>For {childName} • IEP & Doctor Ready</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={textS} />
            </TouchableOpacity>
          </View>

          {/* Timeframe Selector */}
          <Text style={[styles.sectionLabel, { color: textP }]}>Select Timeframe</Text>
          <View style={styles.optionRow}>
            {[
              { label: '7 Days', val: 7 },
              { label: '30 Days', val: 30 },
              { label: '90 Days', val: 90 },
              { label: 'All Time', val: 0 },
            ].map((opt) => {
              const active = timeframe === opt.val;
              return (
                <TouchableOpacity
                  key={opt.val}
                  onPress={() => setTimeframe(opt.val as any)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? COLORS.primary : isDark ? '#2D3748' : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? '#FFFFFF' : textS, fontWeight: active ? '700' : '500' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Format Selector */}
          <Text style={[styles.sectionLabel, { color: textP, marginTop: 18 }]}>Export Format</Text>
          <View style={styles.formatRow}>
            <TouchableOpacity
              onPress={() => setExportFormat('pdf')}
              style={[
                styles.formatCard,
                {
                  borderColor: exportFormat === 'pdf' ? COLORS.primary : isDark ? '#334155' : '#E2E8F0',
                  backgroundColor: exportFormat === 'pdf' ? COLORS.primary + '10' : cardBg,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={32}
                color={exportFormat === 'pdf' ? COLORS.primary : textS}
              />
              <Text style={[styles.formatTitle, { color: textP }]}>PDF Summary</Text>
              <Text style={[styles.formatDesc, { color: textS }]}>
                Visual charts, trigger stats, and doctor signature block
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setExportFormat('csv')}
              style={[
                styles.formatCard,
                {
                  borderColor: exportFormat === 'csv' ? COLORS.primary : isDark ? '#334155' : '#E2E8F0',
                  backgroundColor: exportFormat === 'csv' ? COLORS.primary + '10' : cardBg,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="file-delimited"
                size={32}
                color={exportFormat === 'csv' ? COLORS.primary : textS}
              />
              <Text style={[styles.formatTitle, { color: textP }]}>CSV Spreadsheet</Text>
              <Text style={[styles.formatDesc, { color: textS }]}>
                Detailed raw data table for therapists & spreadsheets
              </Text>
            </TouchableOpacity>
          </View>

          {/* Premium Value Highlight */}
          <View style={[styles.valueBanner, { backgroundColor: isDark ? '#1E1B4B' : '#FAF5FF' }]}>
            <MaterialCommunityIcons name="star-circle" size={18} color="#8B5CF6" />
            <Text style={[styles.valueText, { color: isDark ? '#DDD6FE' : '#6B21A8' }]}>
              Includes severity breakdown, antecedent triggers, and what works.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.actionBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleExport}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={isPremium ? 'share-variant' : 'lock-outline'}
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.actionBtnText}>
                  {isPremium ? `Export ${exportFormat.toUpperCase()} Report` : 'Unlock Clinical Reports'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.m,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: SPACING.l,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 12,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formatCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    textAlign: 'center',
  },
  formatTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
  },
  formatDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  valueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 18,
    marginBottom: 18,
  },
  valueText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
