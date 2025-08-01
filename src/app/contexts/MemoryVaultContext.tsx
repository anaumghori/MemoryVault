import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DatabaseManager, User } from '../../database/DatabaseManager';

interface MemoryVaultContextType {
  user: User | null;
  isInitialized: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  currentScreen: 'onboarding' | 'home' | 'chat' | 'reminiscence' | 'notes' | 'games';
  setCurrentScreen: (screen: 'onboarding' | 'home' | 'chat' | 'reminiscence' | 'notes' | 'games') => void;
  refreshUser: () => Promise<void>;
}

const MemoryVaultContext = createContext<MemoryVaultContextType>({
  user: null,
  isInitialized: false,
  isLoading: true,
  setUser: () => {},
  currentScreen: 'onboarding',
  setCurrentScreen: () => {},
  refreshUser: async () => {},
});

export const MemoryVaultProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'onboarding' | 'home' | 'chat' | 'reminiscence' | 'notes' | 'games'>('onboarding');

  // Initialize the app and check for existing user
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const dbManager = DatabaseManager.getInstance();
        await dbManager.initialize();
        
        const existingUser = await dbManager.getUser();
        if (existingUser) {
          setUser(existingUser);
          setCurrentScreen('home');
        } else {
          setCurrentScreen('onboarding');
        }
        
        setIsInitialized(true);
      } catch (error) {
        
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const refreshUser = async () => {
    try {
      const dbManager = DatabaseManager.getInstance();
      const updatedUser = await dbManager.getUser();
      setUser(updatedUser);
    } catch (error) {
      
    }
  };

  const contextValue: MemoryVaultContextType = {
    user,
    isInitialized,
    isLoading,
    setUser,
    currentScreen,
    setCurrentScreen,
    refreshUser,
  };

  return (
    <MemoryVaultContext.Provider value={contextValue}>
      {children}
    </MemoryVaultContext.Provider>
  );
};

export const useMemoryVault = () => {
  const context = useContext(MemoryVaultContext);
  if (!context) {
    throw new Error('useMemoryVault must be used within a MemoryVaultProvider');
  }
  return context;
};

export default MemoryVaultProvider; 