import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  useColorScheme,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { useUser } from '../context/UserContext';

interface ReflectionModalProps {
  visible: boolean;
  onSave: (answers: { preventNextTime?: string; childResponse?: string }) => void;
  onSkip: () => void;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  visible,
  onSave,
  onSkip,
}) => {
  const { settings } = useUser();
  const systemColorScheme = useColorScheme();
  const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

  const [preventText, setPreventText] = useState('');
  const [responseText, setResponseText] = useState('');

  const bg = getColor('background', isDark);
  const cardBg = getColor('cardBackground', isDark);
  const textP = getColor('textPrimary', isDark);
  const textS = getColor('textSecondary', isDark);
  const borderC = getColor('border', isDark);

  const handleDone = () => {
    Keyboard.dismiss();
    onSave({
      preventNextTime: preventText.trim() || undefined,
      childResponse: responseText.trim() || undefined,
    });
    setPreventText('');
    setResponseText('');
  };

  const handleSkip = () => {
    Keyboard.dismiss();
    setPreventText('');
    setResponseText('');
    onSkip();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleSkip}>
      {/* Tapping the dark overlay dismisses the keyboard */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Card */}
        <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
          {/* Drag handle */}
          <View style={[styles.dragHandle, { backgroundColor: borderC }]} />

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.header}>
              <MaterialCommunityIcons name="head-lightbulb-outline" size={28} color={COLORS.primary} />
              <Text style={[styles.title, { color: textP }]}>Post-Incident Reflection</Text>
            </View>

            <Text style={[styles.sub, { color: textS }]}>
              Take 30 seconds to capture brief insights while fresh in your mind.
            </Text>

            {/* Question 1 */}
            <Text style={[styles.label, { color: textP }]}>
              What might help prevent this next time?
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: bg, color: textP, borderColor: borderC }]}
              placeholder="e.g. 5-min warning before turning off TV, earlier snack..."
              placeholderTextColor={textS}
              multiline
              numberOfLines={3}
              value={preventText}
              onChangeText={setPreventText}
              returnKeyType="next"
              blurOnSubmit={false}
            />

            {/* Question 2 */}
            <Text style={[styles.label, { color: textP, marginTop: SPACING.m }]}>
              How did your child respond to the calm strategy?
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: bg, color: textP, borderColor: borderC }]}
              placeholder="e.g. Visual timer helped them focus, breathing took ~3 mins..."
              placeholderTextColor={textS}
              multiline
              numberOfLines={3}
              value={responseText}
              onChangeText={setResponseText}
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
                <Text style={[styles.skipText, { color: textS }]}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDone}
                style={[styles.saveBtn, { backgroundColor: COLORS.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.saveText}>Save Reflection</Text>
              </TouchableOpacity>
            </View>

            {/* Extra bottom padding so content doesn't sit right at edge */}
            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill as any,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  keyboardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalCard: {
    borderTopLeftRadius: LAYOUT.borderRadiusLarge,
    borderTopRightRadius: LAYOUT.borderRadiusLarge,
    maxHeight: '90%',
    paddingTop: SPACING.s,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.s,
    opacity: 0.4,
  },
  scrollContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.xs,
  },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 13, marginBottom: SPACING.m, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadiusSmall,
    padding: 10,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: SPACING.l,
  },
  skipBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  skipText: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: LAYOUT.borderRadiusSmall,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
