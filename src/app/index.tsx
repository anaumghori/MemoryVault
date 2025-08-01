import React from "react";
import { View, StyleSheet, ActivityIndicator, StatusBar } from "react-native";
import { ThemeProvider } from '../app/contexts/ThemeContext';
import { MemoryVaultProvider, useMemoryVault } from '../app/contexts/MemoryVaultContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ReminiscenceScreen } from '../screens/ReminiscenceScreen';
import { NotesScreen } from '../screens/NotesScreen';
import { GamesScreen } from '../screens/GamesScreen';

const AppContent: React.FC = () => {
  const { currentScreen, isLoading, setUser, setCurrentScreen } = useMemoryVault();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A0522D" />
      </View>
    );
  }

  const handleOnboardingComplete = (userName: string) => {
    setUser({ id: 1, name: userName, createdAt: Date.now() });
    setCurrentScreen('home');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return <OnboardingScreen onComplete={handleOnboardingComplete} />;
      case 'home':
        return <HomeScreen />;
      case 'chat':
        return <ChatScreen />;
      case 'reminiscence':
        return <ReminiscenceScreen />;
      case 'notes':
        return <NotesScreen />;
      case 'games':
        return <GamesScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {renderScreen()}
    </View>
  );
};

export default function Page() {
  return (
    <ThemeProvider>
      <MemoryVaultProvider>
        <AppContent />
      </MemoryVaultProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});