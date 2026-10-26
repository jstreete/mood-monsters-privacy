import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfile } from '../context/ProfileContext';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { useNavigation } from '@react-navigation/native';

export const ProfileSelectionScreen = () => {
    const { profiles, currentProfile, switchProfile, addProfile, updateProfileName } = useProfile();
    const { settings } = useUser();
    const navigation = useNavigation();
    const isDark = settings.theme === 'dark';

    const [isAdding, setIsAdding] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');

    // Rename state
    const [renameId, setRenameId] = useState<string | null>(null);
    const [renameName, setRenameName] = useState('');

    const bg = getColor('background', isDark);
    const cardBg = getColor('cardBackground', isDark);
    const textP = getColor('textPrimary', isDark);
    const textS = getColor('textSecondary', isDark);
    const primary = COLORS.primary;

    const handleAddProfile = async () => {
        if (!newProfileName.trim()) return;
        await addProfile(newProfileName.trim());
        setNewProfileName('');
        setIsAdding(false);
    };

    const handleRename = async () => {
        if (!renameName.trim() || !renameId) return;
        await updateProfileName(renameId, renameName.trim());
        setRenameId(null);
        setRenameName('');
    };

    const startRename = (profile: any) => {
        setRenameId(profile.id);
        setRenameName(profile.name);
    };

    const renderItem = ({ item }: { item: any }) => {
        const isActive = currentProfile?.id === item.id;
        return (
            <View
                style={[
                    styles.profileCard,
                    { backgroundColor: cardBg, borderColor: isActive ? primary : 'transparent', borderWidth: 2 }
                ]}
            >
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => {
                        switchProfile(item.id);
                        navigation.goBack();
                    }}
                >
                    <View style={[styles.avatar, { backgroundColor: isActive ? primary : isDark ? '#334155' : '#E2E8F0' }]}>
                        <Text style={[styles.avatarText, { color: isActive ? '#FFF' : isDark ? '#CBD5E1' : '#475569' }]}>
                            {item.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.info}>
                        <Text style={[styles.name, { color: textP }]}>{item.name}</Text>
                        {isActive && <Text style={{ color: primary, fontSize: 12, fontWeight: '700' }}>Active</Text>}
                    </View>
                </TouchableOpacity>

                {/* Rename Button */}
                <TouchableOpacity onPress={() => startRename(item)} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name="pencil-outline" size={20} color={textS} />
                </TouchableOpacity>

                {isActive && <MaterialCommunityIcons name="check-circle" size={24} color={primary} style={{ marginLeft: 4 }} />}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={textP} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: textP }]}>Select Child Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={profiles}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListFooterComponent={
                    <TouchableOpacity
                        style={[styles.createButton, { backgroundColor: primary, marginTop: SPACING.m }]}
                        onPress={() => {
                            setNewProfileName('');
                            setIsAdding(true);
                        }}
                    >
                        <MaterialCommunityIcons name="account-plus" size={24} color="#FFF" />
                        <Text style={styles.createText}>Add New Profile</Text>
                    </TouchableOpacity>
                }
            />

            {/* Add Profile Modal - Prevents keyboard dismiss on keystroke */}
            <Modal visible={isAdding} transparent animationType="fade" onRequestClose={() => setIsAdding(false)}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                            <Text style={[styles.modalTitle, { color: textP }]}>New Child Profile</Text>
                            <TextInput
                                style={[styles.input, { color: textP, borderColor: primary, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
                                placeholder="Child's name (e.g. Alex)"
                                placeholderTextColor={textS}
                                value={newProfileName}
                                onChangeText={setNewProfileName}
                                autoFocus
                                autoCapitalize="words"
                                returnKeyType="done"
                                onSubmitEditing={handleAddProfile}
                            />
                            <View style={styles.addActions}>
                                <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.cancelBtn}>
                                    <Text style={{ color: textS, fontSize: 15, fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleAddProfile} style={[styles.addBtn, { backgroundColor: primary }]}>
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Create</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Rename Modal */}
            <Modal visible={!!renameId} transparent animationType="fade" onRequestClose={() => setRenameId(null)}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                        <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                            <Text style={[styles.modalTitle, { color: textP }]}>Rename Profile</Text>
                            <TextInput
                                style={[styles.input, { color: textP, borderColor: primary, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
                                value={renameName}
                                onChangeText={setRenameName}
                                autoFocus
                                autoCapitalize="words"
                                returnKeyType="done"
                                onSubmitEditing={handleRename}
                            />
                            <View style={styles.addActions}>
                                <TouchableOpacity onPress={() => setRenameId(null)} style={styles.cancelBtn}>
                                    <Text style={{ color: textS, fontSize: 15, fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleRename} style={[styles.addBtn, { backgroundColor: primary }]}>
                                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 15 }}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: SPACING.m, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'
    },
    backButton: { padding: 8 },
    title: { fontSize: 20, fontWeight: 'bold' },
    list: { padding: SPACING.m, paddingBottom: 100 },
    profileCard: {
        flexDirection: 'row', alignItems: 'center', padding: SPACING.m,
        borderRadius: LAYOUT.borderRadius, marginBottom: SPACING.m,
        elevation: 2,
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25,
        alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m
    },
    avatarText: { fontSize: 20, fontWeight: 'bold' },
    info: { flex: 1 },
    name: { fontSize: 18, fontWeight: 'bold' },
    createButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        padding: 16, borderRadius: LAYOUT.borderRadius, gap: 8, marginBottom: 40
    },
    createText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    input: {
        borderWidth: 1.5, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: SPACING.m
    },
    addActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, alignItems: 'center' },
    cancelBtn: { padding: 8 },
    addBtn: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: SPACING.l },
    modalContent: { padding: SPACING.xl, borderRadius: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
});
