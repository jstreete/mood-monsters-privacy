import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, useColorScheme } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useProfile } from '../context/ProfileContext';
import { useUser } from '../context/UserContext';
import { COLORS, SPACING, LAYOUT, getColor } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

interface ChildDropdownProps {
    compact?: boolean;
}

export const ChildDropdown: React.FC<ChildDropdownProps> = ({ compact = false }) => {
    const { profiles, currentProfile, switchProfile } = useProfile();
    const { settings } = useUser();
    const navigation = useNavigation<any>();
    const systemColorScheme = useColorScheme();
    const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

    const [modalVisible, setModalVisible] = useState(false);

    const cardBg = getColor('cardBackground', isDark);
    const textP = getColor('textPrimary', isDark);
    const textS = getColor('textSecondary', isDark);
    const border = getColor('border', isDark);

    const activeName = currentProfile?.name || 'Child';

    return (
        <>
            {/* Header Dropdown Button */}
            <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setModalVisible(true)}
                style={[
                    styles.dropdownButton,
                    compact ? styles.compactButton : null,
                    {
                        backgroundColor: isDark ? '#1e293b' : '#EFF6FF',
                        borderColor: isDark ? '#334155' : '#DBEAFE',
                    }
                ]}
            >
                <MaterialCommunityIcons
                    name="account-child-circle"
                    size={compact ? 16 : 18}
                    color={isDark ? '#93C5FD' : COLORS.primary}
                />
                <Text
                    numberOfLines={1}
                    style={[
                        styles.dropdownText,
                        compact ? styles.compactText : null,
                        { color: isDark ? '#93C5FD' : COLORS.primary }
                    ]}
                >
                    {activeName}
                </Text>
                <MaterialCommunityIcons
                    name="chevron-down"
                    size={compact ? 14 : 16}
                    color={isDark ? '#93C5FD' : COLORS.primary}
                />
            </TouchableOpacity>

            {/* Profile Switcher Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View
                        style={[
                            styles.modalCard,
                            { backgroundColor: cardBg, borderColor: border, borderWidth: 1 }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: textP }]}>Select Child</Text>
                                <Text style={[styles.modalSubtitle, { color: textS }]}>Switch active tracking profile</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <MaterialCommunityIcons name="close" size={20} color={textS} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={profiles}
                            keyExtractor={(item) => item.id}
                            style={{ maxHeight: 260 }}
                            renderItem={({ item }) => {
                                const isActive = currentProfile?.id === item.id;
                                return (
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        style={[
                                            styles.profileRow,
                                            {
                                                backgroundColor: isActive ? (isDark ? '#2563EB25' : '#EFF6FF') : 'transparent',
                                                borderColor: isActive ? COLORS.primary : 'transparent',
                                                borderWidth: 1.5,
                                            }
                                        ]}
                                        onPress={() => {
                                            switchProfile(item.id);
                                            setModalVisible(false);
                                        }}
                                    >
                                        <View
                                            style={[
                                                styles.avatarCircle,
                                                { backgroundColor: isActive ? COLORS.primary : isDark ? '#334155' : '#E2E8F0' }
                                            ]}
                                        >
                                            <Text
                                                style={{
                                                    color: isActive ? '#FFF' : isDark ? '#CBD5E1' : '#475569',
                                                    fontWeight: 'bold',
                                                    fontSize: 14,
                                                }}
                                            >
                                                {item.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <Text style={[styles.profileName, { color: textP, flex: 1 }]}>
                                            {item.name}
                                        </Text>
                                        {isActive && (
                                            <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        {/* Manage Profiles link */}
                        <TouchableOpacity
                            style={[styles.manageButton, { borderTopColor: isDark ? '#334155' : '#F1F5F9' }]}
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('ProfileSelection');
                            }}
                        >
                            <MaterialCommunityIcons name="account-plus-outline" size={18} color={COLORS.primary} />
                            <Text style={[styles.manageText, { color: COLORS.primary }]}>
                                Manage & Add Children
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
        borderWidth: 1,
        gap: 5,
    },
    compactButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 3,
    },
    dropdownText: {
        fontSize: 13,
        fontWeight: '700',
        maxWidth: 110,
    },
    compactText: {
        fontSize: 12,
        maxWidth: 90,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    modalCard: {
        borderRadius: LAYOUT.borderRadiusLarge,
        padding: SPACING.m,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.m,
        paddingBottom: SPACING.xs,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: LAYOUT.borderRadius,
        marginBottom: 8,
    },
    avatarCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    profileName: {
        fontSize: 15,
        fontWeight: '600',
    },
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: SPACING.m,
        marginTop: SPACING.xs,
        borderTopWidth: 1,
        gap: 6,
    },
    manageText: {
        fontSize: 13,
        fontWeight: '700',
    },
});
