import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LogIncidentScreen } from '../screens/LogIncidentScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ResourceLibraryScreen } from '../screens/ResourceLibraryScreen';
import { CalmNavigator } from './CalmNavigator';
import { COLORS, getColor } from '../constants/theme';
import { useUser } from '../context/UserContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileSelectionScreen } from '../screens/ProfileSelectionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Prominent Media-Player-Style Center Log Button
const CustomLogButton = ({ onPress, style, cardBg, textS }: any) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={[
                style,
                styles.customLogWrapper,
            ]}
        >
            <View
                style={[
                    styles.customLogCircle,
                    {
                        backgroundColor: COLORS.primary,
                        borderColor: cardBg,
                    }
                ]}
            >
                <MaterialCommunityIcons name="plus" size={34} color="#FFFFFF" />
            </View>
            <Text style={[styles.customLogLabel, { color: textS }]}>Log</Text>
        </TouchableOpacity>
    );
};

const TabNavigator = () => {
    const { settings } = useUser();
    const systemColorScheme = useColorScheme();
    const isDark = settings.theme === 'system' ? systemColorScheme === 'dark' : settings.theme === 'dark';

    const cardBg = getColor('cardBackground', isDark);
    const textS = getColor('textSecondary', isDark);

    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: textS,
                tabBarStyle: {
                    backgroundColor: cardBg,
                    borderTopWidth: 0,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: isDark ? 0.35 : 0.08,
                    shadowRadius: 6,
                    paddingTop: 8,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                },
            }}
        >
            {/* Tab 1: Home Dashboard (Insights Screen) */}
            <Tab.Screen
                name="Home"
                component={InsightsScreen}
                options={{
                    tabBarLabel: 'Insights',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="home-analytics" size={size + 2} color={color} />
                    ),
                }}
            />

            {/* Tab 2: Calm Tools & Exercises */}
            <Tab.Screen
                name="Calm"
                component={CalmNavigator}
                options={{
                    tabBarLabel: 'Calm',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="spa-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* Tab 3: Prominent Media-Player Style Centered Log Action */}
            <Tab.Screen
                name="Log"
                component={LogIncidentScreen}
                options={{
                    tabBarButton: (props) => (
                        <CustomLogButton {...props} cardBg={cardBg} textS={textS} />
                    ),
                }}
            />

            {/* Tab 4: History & Export Reports */}
            <Tab.Screen
                name="History"
                component={HistoryScreen}
                options={{
                    tabBarLabel: 'History',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="calendar-month-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* Tab 5: Settings */}
            <Tab.Screen
                name="SettingsTab"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    customLogWrapper: {
        top: -18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customLogCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 8,
    },
    customLogLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
});

export const AppNavigator = () => {
    const { settings } = useUser();

    if (!settings.onboardingCompleted) {
        return <OnboardingScreen />;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="ProfileSelection" component={ProfileSelectionScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="ResourceLibrary" component={ResourceLibraryScreen} />
        </Stack.Navigator>
    );
};
