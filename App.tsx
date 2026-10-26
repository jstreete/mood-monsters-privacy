import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IncidentProvider } from './src/context/IncidentContext';
import { UserProvider } from './src/context/UserContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useFonts } from 'expo-font';

export default function App() {
  // Preload fonts for charts
  const [fontsLoaded, error] = useFonts({
    'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
  });

  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    if (fontsLoaded || error) {
      if (error) {
        console.warn('Font load error:', error);
      }
      setIsReady(true);
    }
  }, [fontsLoaded, error]);

  // Safety timeout - force load after 4 seconds if font hangs
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReady) {
        console.warn('Font load timed out, forcing app load');
        setIsReady(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <IncidentProvider>
          <UserProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AppNavigator />
            </NavigationContainer>
          </UserProvider>
        </IncidentProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
