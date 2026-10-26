import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Share,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { useIncidents } from '../context/IncidentContext';
import { format } from 'date-fns';

interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BackupImportModal: React.FC<BackupModalProps> = ({ visible, onClose }) => {
  const { settings, recordBackupTimestamp, loadSettings } = useUser();
  const { incidents } = useIncidents();
  const systemColorScheme = useColorScheme();
  const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

  const [importJson, setImportJson] = useState('');
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  const bg = getColor('background', isDark);
  const cardBg = getColor('cardBackground', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);

  const handleExportBackup = async () => {
    try {
      const backupData = {
        version: 1,
        timestamp: Date.now(),
        settings,
        incidents,
      };
      const jsonString = JSON.stringify(backupData, null, 2);

      await Share.share({
        message: jsonString,
        title: `Pattern_Tracker_Backup_${format(new Date(), 'yyyy-MM-dd')}.json`,
      });

      await recordBackupTimestamp();
    } catch (e) {
      Alert.alert('Backup Error', 'Failed to generate backup package.');
    }
  };

  const handleRestoreImport = async () => {
    if (!importJson.trim()) {
      Alert.alert('Invalid Data', 'Please paste valid JSON backup content.');
      return;
    }
    try {
      const parsed = JSON.parse(importJson.trim());
      if (parsed.settings) {
        await AsyncStorage.setItem('@mood_monsters_settings', JSON.stringify(parsed.settings));
      }
      if (parsed.incidents) {
        await AsyncStorage.setItem('@mood_monsters_incidents', JSON.stringify(parsed.incidents));
      }
      await loadSettings();
      Alert.alert('Success!', 'Your data has been restored from the backup file.');
      setImportJson('');
      onClose();
    } catch (e) {
      Alert.alert('Import Failed', 'Selected JSON format is invalid or corrupted.');
    }
  };

  const lastBackupText = settings.lastBackupTimestamp
    ? format(new Date(settings.lastBackupTimestamp), 'MMM d, yyyy')
    : 'Never';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textP }]}>Backup & Restore Wizard</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={26} color={textS} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('export')}
            style={[styles.tab, activeTab === 'export' && { borderBottomColor: COLORS.primary, borderBottomWidth: 3 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'export' ? COLORS.primary : textS }]}>
              Export Backup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('import')}
            style={[styles.tab, activeTab === 'import' && { borderBottomColor: COLORS.primary, borderBottomWidth: 3 }]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'import' ? COLORS.primary : textS }]}>
              Import Backup
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === 'export' ? (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={48} color={COLORS.primary} />
              <Text style={[styles.cardTitle, { color: textP }]}>Create Local Backup</Text>
              <Text style={[styles.cardSub, { color: textS }]}>
                Export all child profiles, incident history, and calm tool preferences into a secure JSON file.
              </Text>
              <Text style={[styles.lastBackup, { color: textS }]}>
                Last Backup Date: <Text style={{ fontWeight: '700', color: textP }}>{lastBackupText}</Text>
              </Text>

              <TouchableOpacity
                onPress={handleExportBackup}
                style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="export-variant" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Export Backup File</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <MaterialCommunityIcons name="cloud-download-outline" size={48} color={COLORS.accent} />
              <Text style={[styles.cardTitle, { color: textP }]}>Restore From Backup</Text>
              <Text style={[styles.cardSub, { color: textS }]}>
                Paste your exported backup JSON string below to restore all profiles and logs.
              </Text>

              <TextInput
                style={[styles.input, { backgroundColor: bg, color: textP, borderColor: getColor('border', isDark) }]}
                placeholder="Paste JSON content here..."
                placeholderTextColor={textS}
                multiline
                numberOfLines={6}
                value={importJson}
                onChangeText={setImportJson}
              />

              <TouchableOpacity
                onPress={handleRestoreImport}
                style={[styles.actionBtn, { backgroundColor: COLORS.accent }]}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="import" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionBtnText}>Restore Data Now</Text>
              </TouchableOpacity>
            </View>
          )}
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
    padding: SPACING.m,
  },
  title: { fontSize: 18, fontWeight: '800' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '700' },
  content: { padding: SPACING.m },
  card: { padding: SPACING.l, borderRadius: LAYOUT.borderRadiusLarge, alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800', marginTop: SPACING.s },
  cardSub: { fontSize: 13, textAlign: 'center', marginTop: 4, lineHeight: 18, marginBottom: SPACING.m },
  lastBackup: { fontSize: 12, marginBottom: SPACING.l },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadiusSmall,
    padding: 10,
    fontSize: 12,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: SPACING.l,
  },
  actionBtn: {
    width: '100%',
    height: 50,
    borderRadius: LAYOUT.borderRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
