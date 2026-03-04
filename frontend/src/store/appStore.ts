import { create } from 'zustand';
import { colors, ThemeColors } from '../theme/colors';
import { APODData, UserPreferences } from '../services/api';

interface AppState {
  // Theme
  isDarkMode: boolean;
  isDeepBlackMode: boolean;
  theme: ThemeColors;
  setDarkMode: (value: boolean) => void;
  setDeepBlackMode: (value: boolean) => void;
  
  // Current APOD
  currentAPOD: APODData | null;
  setCurrentAPOD: (apod: APODData | null) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  
  // Preferences
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Theme defaults
  isDarkMode: true,
  isDeepBlackMode: false,
  theme: colors.dark,
  
  setDarkMode: (value: boolean) => {
    set({ 
      isDarkMode: value,
      theme: value ? (get().isDeepBlackMode ? colors.deepBlack : colors.dark) : colors.dark 
    });
  },
  
  setDeepBlackMode: (value: boolean) => {
    set({ 
      isDeepBlackMode: value,
      theme: value ? colors.deepBlack : colors.dark 
    });
  },
  
  // Current APOD
  currentAPOD: null,
  setCurrentAPOD: (apod: APODData | null) => set({ currentAPOD: apod }),
  
  // Loading
  isLoading: false,
  setIsLoading: (value: boolean) => set({ isLoading: value }),
  
  // Notifications
  notificationsEnabled: true,
  setNotificationsEnabled: (value: boolean) => set({ notificationsEnabled: value }),
}));
