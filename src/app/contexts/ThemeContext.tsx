import React, { 
  createContext, 
  useState, 
  useContext, 
  ReactNode, 
  useEffect 
} from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  accentColor: string;
  setAccentColor: (color: string) => void;
  BROWN_COLORS: Record<string, string>;
  addCustomColor: (color: string) => void;
  customColors: string[];
  primaryBrown: string;
  lightBrown: string;
  darkBrown: string;
}

// Memory Vault brown color palette
export const BROWN_COLORS = {
  LIGHT_BROWN: '#D2B48C',
  MEDIUM_BROWN: '#A0522D',
  DARK_BROWN: '#8B4513',
  CHOCOLATE: '#D2691E',
  SADDLE_BROWN: '#654321'
};

const ThemeContext = createContext<ThemeContextType>({
  accentColor: BROWN_COLORS.MEDIUM_BROWN,
  setAccentColor: () => {},
  BROWN_COLORS: BROWN_COLORS,
  addCustomColor: () => {},
  customColors: [],
  primaryBrown: BROWN_COLORS.MEDIUM_BROWN,
  lightBrown: BROWN_COLORS.LIGHT_BROWN,
  darkBrown: BROWN_COLORS.DARK_BROWN,
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accentColor, setAccentColor] = useState<string>(BROWN_COLORS.MEDIUM_BROWN);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Memory Vault brown theme colors
  const primaryBrown = BROWN_COLORS.MEDIUM_BROWN;
  const lightBrown = BROWN_COLORS.LIGHT_BROWN;
  const darkBrown = BROWN_COLORS.DARK_BROWN;

  // Combine predefined and custom brown colors
  const combinedBrownColors = {
    ...BROWN_COLORS,
    ...customColors.reduce((acc, color, index) => {
      acc[`CUSTOM_${index + 1}`] = color;
      return acc;
    }, {} as Record<string, string>)
  };

  const addCustomColor = (color: string) => {  
    if (!customColors.includes(color)) {
      setCustomColors(prev => [...prev, color]);
    }
  };

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedAccentColor = await AsyncStorage.getItem('app_accent_color');
        const storedCustomColors = await AsyncStorage.getItem('app_custom_colors');

        if (storedAccentColor) {
          setAccentColor(storedAccentColor);
        }

        if (storedCustomColors) {
          setCustomColors(JSON.parse(storedCustomColors));
        }
      } catch (error) {
        
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const saveThemePreference = async () => {
        try {
          await AsyncStorage.setItem('app_accent_color', accentColor);
          await AsyncStorage.setItem('app_custom_colors', JSON.stringify(customColors));
        } catch (error) {
          Alert.alert('Error', 'Failed to save theme preference');
        }
      };

      saveThemePreference();
    }
  }, [accentColor, customColors, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ 
      accentColor, 
      setAccentColor,
      BROWN_COLORS: combinedBrownColors,
      addCustomColor,
      customColors,
      primaryBrown,
      lightBrown,
      darkBrown,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 

export default ThemeProvider;